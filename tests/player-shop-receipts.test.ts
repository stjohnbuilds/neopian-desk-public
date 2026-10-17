import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { randomUUID } from "node:crypto";
import {
  playerShopConfirmation as confirm,
  playerShopObserver as observe,
} from "../src/capture/player-shop-receipts.js";
import { accounting as C } from "../src/core/accounting";
import { mergeNativeReceipt } from "../src/core/native-receipts";
import {
  createInitialState as emptyState,
  validateStore,
} from "../src/persistence/store";
const playerShopConfirmation = (doc: any, href: string) =>
  confirm(doc, href, "test_account");
const playerShopObserver = (win: any, retain: any) =>
  observe(win, retain, () => "test_account");
const createInitialState = () => ({
  ...emptyState(),
  profile: { account: "test_account", pets: [], closetURL: "" },
});
function fixture() {
  const { document } = parseHTML(
    '<html><body><div class="bsp-item"><button>Buy</button></div><div id="bsp-buy-success-popup" role="dialog" style="display:none"><img id="bsp-buy-success-img" alt="10th Birthday Illusen Birthday Book"><h4 id="bsp-buy-success-title">You bought 10th Birthday Illusen Birthday Book!</h4><p id="bsp-buy-success-msg">It has been added to your inventory. You spent 60,000 NP.</p><button>Keep shopping</button></div></body></html>',
  );
  const data = new Map(),
    receipts = new Map();
  const win: any = {
    document,
    location: new URL(
      "https://www.neopets.com/browseshop.phtml?owner=shop_owner&buy_cost_neopoints=1",
    ),
    crypto: { randomUUID },
    sessionStorage: {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => data.set(k, v),
    },
  };
  const retain = (kind: string, r: any) => {
    if (receipts.has(r.id)) assert.deepEqual(receipts.get(r.id), r);
    receipts.set(r.id, r);
  };
  const tracker = playerShopObserver(win, retain),
    popup = document.querySelector("#bsp-buy-success-popup") as any;
  const click = (t = tracker) =>
    t.prepare({
      type: "click",
      isTrusted: true,
      target: document.querySelector(".bsp-item button"),
    });
  return { document, win, receipts, retain, tracker, popup, click };
}
test("uses success dialog, not URL prices, descriptions or failure text", () => {
  const f = fixture();
  assert.equal(playerShopConfirmation(f.document, f.win.location.href), null);
  f.popup.style.display = "block";
  assert.equal(
    playerShopConfirmation(f.document, f.win.location.href)?.cost,
    60000,
  );
  f.document.querySelector("#bsp-buy-success-msg")!.textContent =
    "This item has already been sold.";
  assert.equal(playerShopConfirmation(f.document, f.win.location.href), null);
});
test("identical copies remain separate; reloads deduplicate; saved costs match sales months later", () => {
  const f = fixture();
  f.tracker.scan();
  f.click();
  f.popup.style.display = "block";
  assert.equal(f.tracker.scan(), "");
  f.tracker.scan();
  assert.equal(f.receipts.size, 1);
  const reload = playerShopObserver(f.win, f.retain);
  f.popup.style.display = "none";
  reload.scan();
  f.popup.style.display = "block";
  reload.scan();
  assert.equal(f.receipts.size, 1);
  f.popup.style.display = "none";
  f.tracker.scan();
  f.click();
  f.popup.style.display = "block";
  f.tracker.scan();
  assert.equal(f.receipts.size, 2);
  let state = createInitialState();
  for (const receipt of f.receipts.values())
    state = mergeNativeReceipt(state, { kind: "purchase", receipt });
  validateStore(JSON.parse(JSON.stringify(state)));
  const sale = {
    id: "future-sale",
    name: "10th Birthday Illusen Birthday Book",
    price: 150000,
    date: "2027-01-01",
    buyer: "buyer",
    source: "manual" as const,
    importedAt: Date.parse("2027-01-01T12:00:00Z"),
  };
  const result = C.account(state.native.purchases, [sale]);
  assert.equal(result.rows.find((r) => r.sale)?.profit, 90000);
  assert.equal(
    result.rows.filter((r) => !r.sale && r.name === sale.name).length,
    1,
  );
});
test("unobserved or synthetic actions never invent historical purchases", () => {
  const f = fixture();
  f.popup.style.display = "block";
  assert.match(f.tracker.scan(), /needs review/);
  assert.equal(f.receipts.size, 0);
  f.popup.style.display = "none";
  f.tracker.prepare({
    type: "click",
    isTrusted: false,
    target: f.document.querySelector(".bsp-item button"),
  });
  f.popup.style.display = "block";
  f.tracker.scan();
  assert.equal(f.receipts.size, 0);
  f.tracker.prepare({
    type: "click",
    isTrusted: true,
    target: f.popup.querySelector("button"),
  });
  f.tracker.scan();
  assert.equal(f.receipts.size, 0);
});
test("storage failures retry once and conflicting sellers are rejected", () => {
  const f = fixture();
  let fail = true;
  const tracker = playerShopObserver(f.win, (kind: string, r: any) => {
    if (fail) throw Error("Disk full");
    f.retain(kind, r);
  });
  f.click(tracker);
  f.popup.style.display = "block";
  assert.throws(() => tracker.scan(), /Disk full/);
  fail = false;
  tracker.scan();
  tracker.scan();
  assert.equal(f.receipts.size, 1);
  const receipt = [...f.receipts.values()][0];
  assert.equal(C.validPurchase(receipt), true);
  assert.equal(C.validPurchase({ ...receipt, seller: "test_account" }), false);
  const state = mergeNativeReceipt(createInitialState(), {
    kind: "purchase",
    receipt,
  });
  assert.throws(
    () =>
      mergeNativeReceipt(state, {
        kind: "purchase",
        receipt: { ...receipt, seller: "different" },
      }),
    /conflict/,
  );
});

test("purchase action survives navigation or observer restart before confirmation", () => {
  const f = fixture();
  f.click();
  const restarted = playerShopObserver(f.win, f.retain);
  f.popup.style.display = "block";
  assert.equal(restarted.scan(), "");
  assert.equal(f.receipts.size, 1);
  const again = playerShopObserver(f.win, f.retain);
  again.scan();
  assert.equal(f.receipts.size, 1);
  f.popup.style.display = "none";
  f.click(again);
  const second = playerShopObserver(f.win, f.retain);
  f.popup.style.display = "block";
  second.scan();
  assert.equal(f.receipts.size, 2);
});
test("expired, future, wrong-account and wrong-seller actions cannot authorize a receipt", () => {
  for (const change of [
    { startedAt: Date.now() - 31 * 60 * 1000 },
    { startedAt: Date.now() + 60000 },
    { account: "another_account" },
    { seller: "another_shop" },
  ]) {
    const f = fixture();
    f.click();
    const key = "nd_player_shop_attempt_v1";
    f.win.sessionStorage.setItem(
      key,
      JSON.stringify({
        ...JSON.parse(f.win.sessionStorage.getItem(key)),
        ...change,
      }),
    );
    f.popup.style.display = "block";
    assert.match(playerShopObserver(f.win, f.retain).scan(), /needs review/);
    assert.equal(f.receipts.size, 0);
  }
});

test("existing userscript sends player purchases through its paired bridge with offline retry and reload deduplication", async () => {
  const vm = await import("node:vm"),
    fs = await import("node:fs"),
    f = fixture();
  f.document.body.insertAdjacentHTML(
    "afterbegin",
    '<div id="navprofiledropdown__2020"><a href="https://www.neopets.com/userlookup.phtml?user=test_account">test_account</a></div>',
  );
  const saved = new Map<string, any>([
      ["neopianDeskPairingKey", "a".repeat(64)],
      ["neopianDeskAccount", "test_account"],
    ]),
    menus = new Map<string, any>(),
    events = new Map<string, any>(),
    requests: any[] = [];
  let offline = true,
    observe: any;
  f.document.addEventListener = ((name: string, fn: any) =>
    events.set(name, fn)) as any;
  const code = fs.readFileSync(
    new URL("../userscripts/neopets-purchase-tracker.user.js", import.meta.url),
    "utf8",
  );
  const load = () =>
    vm.runInNewContext(code, {
      document: f.document,
      location: f.win.location,
      crypto: { randomUUID },
      sessionStorage: f.win.sessionStorage,
      URL,
      window: { addEventListener() {} },
      alert() {},
      prompt() {
        return null;
      },
      setTimeout() {
        return 1;
      },
      clearTimeout() {},
      MutationObserver: class {
        constructor(fn: any) {
          observe = fn;
        }
        observe() {}
      },
      GM: {
        async getValue(k: string, d: any) {
          return saved.get(k) ?? d;
        },
        async setValue(k: string, v: any) {
          saved.set(k, v);
        },
        async listValues() {
          return [...saved.keys()];
        },
        registerMenuCommand(k: string, fn: any) {
          menus.set(k, fn);
        },
        async xmlHttpRequest(r: any) {
          requests.push(r);
          if (offline) throw Error("offline");
          return { status: 200, responseText: '{"ok":true}' };
        },
      },
    });
  const flush = async () => {
    for (let i = 0; i < 12; i++)
      await new Promise((resolve) => setImmediate(resolve));
  };
  const buy = () => {
    f.popup.style.display = "none";
    events.get("click")({
      type: "click",
      isTrusted: true,
      target: f.document.querySelector(".bsp-item button"),
    });
    f.popup.style.display = "block";
    observe([{ target: f.popup }]);
  };
  const receipts = () =>
    [...saved.entries()]
      .filter(([k]) => k.startsWith("receipt:"))
      .map(([, r]) => r);
  await load();
  await flush();
  buy();
  await flush();
  assert.equal(receipts().length, 1);
  assert.equal(receipts()[0].cost, 60000);
  assert.equal(receipts()[0].source, "player-shop");
  assert.equal(saved.get("neopianDeskPairingKey"), "a".repeat(64));
  offline = false;
  await menus.get("Sync saved receipts / retry purchase or sale")();
  await load();
  await flush();
  assert.equal(receipts().length, 1);
  buy();
  await flush();
  assert.equal(receipts().length, 2);
  assert.ok(
    requests.every(
      (r) => r.url === "http://127.0.0.1:47831/v1/purchases" && r.anonymous,
    ),
  );
  assert.ok(requests.some((r) => JSON.parse(r.data).purchases.length === 2));
  assert.match(code, /@match\s+https:\/\/www.neopets.com\/browseshop.phtml/);
});
