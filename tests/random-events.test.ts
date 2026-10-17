import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parseHTML } from "linkedom";
const source = readFileSync(
  new URL("../userscripts/sources/random-events.js", import.meta.url),
  "utf8",
);
const core = source.slice(
  source.indexOf("  async function getEvents()"),
  source.indexOf("  function scheduleScan()"),
);
function harness(html: string, saved = new Map<string, unknown>()) {
  const { document, window } = parseHTML(
    "<html><body>" + html + "</body></html>",
  );
  Object.defineProperty(window.HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      return this.textContent;
    },
  });
  let syncs = 0;
  const scan = runInNewContext(
    `const STORAGE_KEY='randomevents',DUPLICATE_WINDOW=15000,seenThisPage=new Set();let scanning=false;${core};scanForEvents`,
    {
      document,
      location: {
        origin: "https://www.neopets.com",
        pathname: "/neoboards/topic.phtml",
      },
      Date,
      GM: {
        getValue: async (k: string, f: unknown) => saved.get(k) ?? f,
        setValue: async (k: string, v: unknown) => saved.set(k, v),
      },
      navigator: {},
      desk: { account: () => "test_account" },
      console: {
        log() {},
        error(e: unknown) {
          throw e;
        },
      },
      syncToDesk() {
        syncs++;
      },
      showCapturedToast() {},
      updateButtonCount() {},
      renderPanel() {},
    },
  );
  return {
    scan,
    saved,
    document,
    syncs: () => syncs,
    events: () => JSON.parse(String(saved.get("randomevents") || "[]")),
  };
}
test("quoted award text, forum posts, signatures and avatar images never become regular events", async () => {
  const message =
    "Something has happened! You are now eligible to use 'Fixture Avatar' as an avatar on the NeoBoards!";
  const h = harness(
    `<article><div>${message}</div><blockquote>${message}</blockquote><q>${message}</q><aside class="signature"><img src="//images.neopets.com/neoboards/avatars/kadoatery.gif">${message}</aside></article>`,
  );
  await h.scan();
  assert.deepEqual(h.events(), []);
  assert.equal(h.syncs(), 0);
  for (const wrapper of [
    "blockquote",
    "q",
    ".boardPost",
    ".signature",
    "[data-user-content]",
  ]) {
    const outer =
      wrapper[0] === "."
        ? `<div class="${wrapper.slice(1)}">`
        : wrapper[0] === "["
          ? "<div data-user-content>"
          : `<${wrapper}>`;
    const h = harness(
      `${outer}<div class="randomEvent"><div class="copy">${message}</div></div></${wrapper[0] === "." || wrapper[0] === "[" ? "div" : wrapper}>`,
    );
    await h.scan();
    assert.deepEqual(h.events(), []);
  }
});
test("official regular, premium and faerie notifications still log once, without changing collection data", async () => {
  const saved = new Map<string, unknown>([
    ["nd_avatar_catalogue", '["pet_rock"]'],
    ["pairing", "kept"],
  ]);
  const h = harness(
    '<div class="randomEvent"><div class="copy">Something has happened! You are now eligible to use a new avatar on the NeoBoards!</div></div><div id="shh_prem_bg">Something has happened! You found a codestone.</div><div class="pushdown"><div class="inner_wrapper2">The Fire Faerie has a quest for you.</div></div>',
    saved,
  );
  await h.scan();
  await h.scan();
  assert.equal(h.events().length, 3);
  assert.deepEqual(
    h
      .events()
      .map((e: any) => e.type)
      .sort(),
    ["faerieQuest", "premium", "regular"],
  );
  assert.ok(h.events().every((e: any) => e.account === "test_account"));
  assert.equal(saved.get("nd_avatar_catalogue"), '["pet_rock"]');
  assert.equal(saved.get("pairing"), "kept");
  const reopened = harness(h.document.body.innerHTML, saved);
  await reopened.scan();
  assert.equal(reopened.events().length, 3);
});
test("existing history is retained; unrelated randomEvent-like class names do not qualify", async () => {
  const history = JSON.stringify([
    {
      event: "Retained older observation",
      timestamp: 1,
      type: "regular",
      account: "test_account",
    },
  ]);
  const h = harness(
    '<div class="not-randomEvent">Something has happened! Someone says they won.</div>',
    new Map([["randomevents", history]]),
  );
  await h.scan();
  assert.equal(h.saved.get("randomevents"), history);
  assert.doesNotMatch(
    source,
    /detectModernBanner|querySelectorAll\("div, td, section, article"\)/,
  );
});
