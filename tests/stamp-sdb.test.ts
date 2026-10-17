import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parseHTML } from "linkedom";

const source = readFileSync(
  new URL("../userscripts/sources/stamp-sdb.js", import.meta.url),
  "utf8",
);
const pendingKey = "deskStampSdbPendingPublicV1";
const identities = [
  { page: 1, position: 1, name: "First Stamp", image: "stamp_first" },
  { page: 1, position: 2, name: "Second Stamp", image: "stamp_second" },
  { page: 2, position: 1, name: "Third Shell", image: "shell_third" },
];
const clone = <T>(value: T): T => structuredClone(value);
async function settle() {
  for (let i = 0; i < 12; i++)
    await new Promise((resolve) => setTimeout(resolve, 0));
}
function albumHTML(all: typeof identities, page: number, owned: string[]) {
  return (
    '<div class="album">' +
    Array.from({ length: 25 }, (_, i) => {
      const item = all.find(
        (item) => item.page === page && item.position === i + 1,
      );
      return item && owned.includes(item.image)
        ? `<img src="//images.neopets.com/items/${item.image}.gif" alt="${item.name}">`
        : '<img src="/blank.gif" alt="No Stamp">';
    }).join("") +
    "</div>"
  );
}
async function harness(
  options: {
    all?: typeof identities;
    storage?: Map<string, any>;
    account?: string;
    pathname?: string;
  } = {},
) {
  const all = options.all || identities,
    saved = options.storage || new Map<string, any>();
  const { document, window } = parseHTML(
    '<html><body><table><tbody id="rows"></tbody></table><select id="bulk"><option value="stamp_album" selected>Put in Stamp Album</option></select><button id="confirm">Confirm</button><p id="result"></p><aside id="nd-stamp-status" hidden></aside></body></html>',
  );
  Object.defineProperty(window.HTMLElement.prototype, "getClientRects", {
    configurable: true,
    value: function () {
      return this.closest("[hidden]") ? [] : [{}];
    },
  });
  document.getElementById("rows")!.innerHTML = all
    .map(
      (item, i) =>
        `<tr><td><img src="https://images.neopets.com/items/${item.image}.gif">${item.name}</td><td><input type="checkbox" id="sdb-chk-mobile-${i + 100}"><input type="checkbox" id="sdb-chk-${i + 100}"></td></tr>`,
    )
    .join("");
  const imageID = (raw: string) => {
    try {
      const u = new URL(raw, "https://www.neopets.com/safetydeposit.phtml");
      return u.hostname === "images.neopets.com"
        ? u.pathname.match(/^\/items\/([\w-]+)\.(?:gif|png|webp)$/i)?.[1] ||
            null
        : null;
    } catch {
      return null;
    }
  };
  const api = runInNewContext(
    source + ";({createStampSdbTools,startStampSdbCheck})",
    {
      DESK_ACCOUNT: "test_account",
      URL,
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      queueMicrotask,
      Date,
    },
  );
  const calls: any[] = [],
    observations: any[] = [];
  let currentAccount = options.account || "test_account",
    offline = false,
    malformed = false,
    pendingFetch = false,
    lateFetch = false,
    storageFailure = false;
  let releaseLateFetch: (() => void) | undefined;
  let owned = all.map((item) => item.image),
    syncs = 0;
  const monitor = await api.startStampSdbCheck({
    document,
    location: { pathname: options.pathname || "/safetydeposit.phtml" },
    identities: all,
    imageID,
    account: () => currentAccount,
    storage: {
      get: async (key: string, fallback: any) =>
        clone(saved.has(key) ? saved.get(key) : fallback),
      set: async (key: string, value: any) => {
        if (storageFailure) throw Error("Storage unavailable");
        saved.set(key, clone(value));
      },
    },
    lock: async (_name: string, work: () => Promise<void>) => work(),
    fetchPage: async (url: string, request: any) => {
      calls.push({
        url,
        method: request.method,
        credentials: request.credentials,
      });
      if (offline) throw Error("Offline");
      if (lateFetch)
        await new Promise<void>((resolve) => {
          releaseLateFetch = resolve;
        });
      if (pendingFetch)
        await new Promise((_resolve, reject) =>
          request.signal.addEventListener("abort", () =>
            reject(Error("Aborted")),
          ),
        );
      const page = Number(new URL(url).searchParams.get("page_id"));
      return {
        ok: true,
        url,
        text: async () =>
          malformed ? "<p>Login required</p>" : albumHTML(all, page, owned),
      };
    },
    saveAlbum: async (album: any) => observations.push(clone(album)),
    sync: async () => {
      syncs++;
    },
    parent: document.getElementById("nd-stamp-status"),
  });
  function event(type: string, target: any, trusted = true) {
    const e = new window.Event(type, { bubbles: true });
    Object.defineProperty(e, "isTrusted", { value: trusted });
    target.dispatchEvent(e);
  }
  return {
    document,
    monitor,
    saved,
    calls,
    observations,
    api,
    imageID,
    select(indices: number[]) {
      all.forEach((_item, i) => {
        for (const prefix of ["sdb-chk-", "sdb-chk-mobile-"])
          (document.getElementById(prefix + (i + 100)) as any).checked =
            indices.includes(i);
      });
      event("change", document.getElementById("sdb-chk-100"));
    },
    confirm(trusted = true) {
      event("click", document.getElementById("confirm"), trusted);
    },
    result(text: string) {
      document.getElementById("result")!.textContent = text;
      monitor?.observe();
    },
    retry() {
      (document.querySelector("#nd-stamp-status button") as any).click();
    },
    setOwned(images: string[]) {
      owned = images;
    },
    setOffline(value: boolean) {
      offline = value;
    },
    setMalformed(value: boolean) {
      malformed = value;
    },
    setPendingFetch(value: boolean) {
      pendingFetch = value;
    },
    delayIgnoringAbort() {
      lateFetch = true;
    },
    releaseResponse() {
      releaseLateFetch?.();
    },
    setStorageFailure(value: boolean) {
      storageFailure = value;
    },
    setAccount(value: string) {
      currentAccount = value;
    },
    pending: () => saved.get(pendingKey) || [],
    syncs: () => syncs,
  };
}

test("selection and untrusted confirmation never establish ownership or fetch an album", async () => {
  const h = await harness();
  h.select([0, 1]);
  h.result("Two items added to your stamp album.");
  await settle();
  assert.equal(h.calls.length, 0);
  assert.equal(h.observations.length, 0);
  assert.equal(h.pending().length, 0);
  h.confirm(false);
  h.result("Moved 1 of 2 items. One failed.");
  await settle();
  assert.equal(h.calls.length, 0);
  assert.equal(h.pending().length, 0);
});

test("full success retains all selected identities when rows disappear; duplicate desktop/mobile controls deduplicate", async () => {
  const h = await harness();
  h.select([0, 1, 2]);
  h.confirm();
  h.document.getElementById("rows")!.replaceChildren();
  h.result("Three items added to your stamp album.");
  await settle();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(
    h.observations.flatMap((o) => o.items.map((i: any) => i.name)),
    identities.map((i) => i.name),
  );
  assert.ok(h.observations.flatMap((o) => o.items).every((i) => i.owned));
  assert.equal(h.pending().length, 0);
  assert.ok(
    h.calls.every(
      (c) => c.method === "GET" && new URL(c.url).pathname === "/stamps.phtml",
    ),
  );
  h.result("Three items added to your stamp album.");
  await settle();
  assert.equal(h.calls.length, 2);
});

test("partial success count does not select winners; only actual owned slots are confirmed", async () => {
  const h = await harness();
  h.setOwned(["stamp_second"]);
  h.select([0, 1]);
  h.confirm();
  h.document.getElementById("rows")!.replaceChildren();
  h.result("Moved 1 of 2 items. An item could not be added.");
  await settle();
  assert.deepEqual(
    h.observations[0].items.map((i: any) => [i.name, i.owned]),
    [
      ["First Stamp", false],
      ["Second Stamp", true],
    ],
  );
  assert.deepEqual(
    h.pending().map((i: any) => i.name),
    ["First Stamp"],
  );
  assert.equal(h.calls.length, 1);
});

test("whole-batch failure does not infer ownership; explicit retry can reconcile a later confirmed result", async () => {
  const h = await harness();
  h.select([0, 1]);
  h.confirm();
  h.result("Failed to move items.");
  await settle();
  assert.equal(h.calls.length, 0);
  assert.equal(h.observations.length, 0);
  assert.equal(h.pending().length, 2);
  h.setOwned(["stamp_first"]);
  h.retry();
  await settle();
  assert.equal(h.observations[0].items.filter((i: any) => i.owned).length, 1);
  assert.equal(h.pending()[0].name, "Second Stamp");
});

test("offline and refresh retain pending identities; reopening does not fetch until explicit retry", async () => {
  const h = await harness();
  h.setOffline(true);
  h.select([0, 2]);
  h.confirm();
  h.result("Two items added to your stamp album.");
  await settle();
  assert.equal(h.observations.length, 0);
  assert.equal(h.pending().length, 2);
  const reopened = await harness({ storage: h.saved });
  await settle();
  assert.equal(reopened.calls.length, 0);
  reopened.retry();
  await settle();
  assert.equal(
    reopened.observations.flatMap((o) => o.items).filter((i) => i.owned).length,
    2,
  );
  assert.equal(reopened.pending().length, 0);
});

test("storage failure keeps the in-memory attempt available for a safe retry", async () => {
  const h = await harness();
  h.setStorageFailure(true);
  h.select([0]);
  h.confirm();
  await settle();
  assert.equal(h.observations.length, 0);
  assert.equal(h.calls.length, 0);
  assert.equal(
    (h.document.querySelector("#nd-stamp-status button") as any).hidden,
    false,
  );
  h.setStorageFailure(false);
  h.retry();
  await settle();
  assert.equal(h.observations[0].items[0].owned, true);
});

test("malformed or unexpected album content preserves pending checks instead of guessing", async () => {
  const h = await harness();
  h.setMalformed(true);
  h.select([1]);
  h.confirm();
  h.result("Second Stamp added to your stamp album.");
  await settle();
  assert.equal(h.observations.length, 0);
  assert.equal(h.pending().length, 1);
  const tools = h.api.createStampSdbTools(identities, h.document, h.imageID);
  assert.throws(
    () =>
      tools.parseAlbum(
        albumHTML(identities, 1, ["stamp_first"]).replace(
          "stamp_first.gif",
          "wrong.gif",
        ),
        1,
      ),
    /differ/,
  );
  assert.throws(
    () =>
      tools.parseAlbum(
        albumHTML(identities, 1, ["stamp_first"]) +
          albumHTML(identities, 1, []),
        1,
      ),
    /unambiguous/,
  );
});

test("an account change stops saving and Stop checking cancels the pending read", async () => {
  const h = await harness();
  h.select([0]);
  h.confirm();
  await settle();
  h.setAccount("someoneelse");
  h.retry();
  await settle();
  assert.equal(h.calls.length, 0);
  assert.equal(h.observations.length, 0);
  h.setAccount("test_account");
  h.setPendingFetch(true);
  h.retry();
  await settle();
  h.retry();
  await settle();
  assert.equal(h.observations.length, 0);
  assert.equal(h.pending().length, 1);
  assert.match(
    h.document.getElementById("nd-stamp-status")!.textContent!,
    /stopped/i,
  );
});

test("Stop rejects late responses even when the fetch ignores cancellation", async () => {
  const h = await harness();
  h.delayIgnoringAbort();
  h.select([0, 2]);
  h.confirm();
  h.result("Two items added to your stamp album.");
  await settle();
  assert.equal(h.calls.length, 1);
  h.retry(); // While checking, the same button is Stop checking.
  h.releaseResponse();
  await settle();
  assert.equal(h.calls.length, 1);
  assert.equal(h.observations.length, 0);
  assert.equal(h.syncs(), 0);
  assert.equal(h.pending().length, 2);
  assert.match(
    h.document.getElementById("nd-stamp-status")!.textContent!,
    /stopped/i,
  );
});

test("a batch checks every relevant known page once without leaving a silent ten-page remainder", async () => {
  const all = Array.from({ length: 11 }, (_, i) => ({
    page: i + 1,
    position: 1,
    name: `Stamp ${i}`,
    image: `stamp_${i}`,
  }));
  const h = await harness({ all });
  h.select(all.map((_v, i) => i));
  h.confirm();
  h.result("Eleven items added to your stamp album.");
  await settle();
  assert.equal(h.calls.length, 11);
  assert.equal(h.pending().length, 0);
  h.monitor.observe();
  await settle();
  assert.equal(h.calls.length, 11);
  h.retry();
  await settle();
  assert.equal(h.calls.length, 11);
  assert.equal(h.pending().length, 0);
});

test("other pages and other accounts do not install an SDB observer or change progress", async () => {
  for (const options of [
    { pathname: "/inventory.phtml" },
    { account: "someoneelse" },
  ]) {
    const h = await harness(options);
    assert.equal(h.monitor, null);
    assert.equal(h.calls.length, 0);
    assert.equal(h.saved.size, 0);
  }
});

test("current generic SDB success starts exact album verification and supports consecutive batches", async () => {
  const h = await harness();
  h.select([0, 1]);
  h.confirm();
  h.result("2 item(s) added to your album.");
  await settle();
  assert.equal(h.calls.length, 1);
  assert.equal(h.pending().length, 0);
  assert.equal(h.observations[0].items.length, 2);
  h.result("");
  h.select([2]);
  h.confirm();
  h.result("Third Shell added to your sea shell album.");
  await settle();
  assert.equal(h.calls.length, 2);
  assert.equal(h.pending().length, 0);
});

test("generic success without an identified album confirmation does not fetch or mark anything", async () => {
  const h = await harness();
  h.result("2 item(s) added to your album.");
  await settle();
  assert.equal(h.calls.length, 0);
  assert.equal(h.observations.length, 0);
});
