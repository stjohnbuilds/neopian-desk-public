import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { parseStampUpdate } from "../src/core/stamps";
const album = {
  account: "test_account",
  page: 1,
  observedAt: 1,
  items: Array.from({ length: 25 }, (_, i) => ({
    position: i + 1,
    name: "Stamp " + i,
    image: "stamp_" + i,
    owned: i === 0,
  })),
};
const source = (owned: number[]) =>
  "<div>" +
  Array.from({ length: 25 }, (_, i) =>
    owned.includes(i)
      ? `<img src="https://images.neopets.com/items/stamp_${i}.gif" alt="Stamp">`
      : '<img src="/blank.gif" alt="No Stamp">',
  ).join("") +
  "</div>";
test("album import adds ownership without downgrading earlier observations or mutating input", () => {
  Object.assign(globalThis, {
    document: parseHTML("<html><body></body></html>").document,
  });
  const result = parseStampUpdate(source([1]), album);
  assert.equal(result.items.filter((i) => i.owned).length, 2);
  assert.equal(album.items.filter((i) => i.owned).length, 1);
  assert.equal(parseStampUpdate(source([]), album).items[0].owned, true);
});
test("wrong album and ambiguous sources fail before saving; pasted scripts stay inert", () => {
  Object.assign(globalThis, {
    document: parseHTML("<html><body></body></html>").document,
  });
  for (const invalid of [
    "<div>Not an album</div>",
    source([1]).replace("stamp_1.gif", "wrong.gif"),
    source([]) + source([1]),
  ])
    assert.throws(() => parseStampUpdate(invalid, album));
  parseStampUpdate(
    source([1]) +
      '<script>throw Error("executed")</script><img src="x" onerror="throw Error()">',
    album,
  );
  assert.equal(document.querySelector("[onerror]"), null);
});
