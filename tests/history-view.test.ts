import test from "node:test";
import assert from "node:assert/strict";
import { historyPage, purchaseHistory } from "../src/core/history-view";
import type { PurchaseRow } from "../src/core/accounting";

const rows: PurchaseRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i),
  name: i === 22 ? "Wocky Violin" : `Item ${i}`,
  account: "test",
  boughtAt: 1790300000000 + i * 1000,
  cost: 8000,
  day: "2026-09-24",
  shopId: i % 3 === 0 ? -1 : i % 3 === 1 ? 0 : 14,
  source: i % 3 === 0 ? "player-shop" : i % 3 === 1 ? "manual" : undefined,
  sale: null,
  profit: null,
}));

test("newest purchases lead without changing FIFO accounting order", () => {
  const before = structuredClone(rows);
  const sorted = purchaseHistory(rows, "all");
  assert.equal(sorted[0].name, "Wocky Violin");
  assert.deepEqual(rows, before);
  const pages = [0, 1, 2].map((p) => historyPage(sorted, p));
  assert.deepEqual(
    pages.map((p) => p.rows.length),
    [10, 10, 3],
  );
  assert.equal(new Set(pages.flatMap((p) => p.rows.map((r) => r.id))).size, 23);
});

test("source filters preserve unknown manual origin and pagination clamps safely", () => {
  assert.ok(
    purchaseHistory(rows, "player-shop").every(
      (p) => p.source === "player-shop",
    ),
  );
  assert.ok(purchaseHistory(rows, "neopian").every((p) => p.shopId > 0));
  assert.ok(purchaseHistory(rows, "manual").every((p) => p.shopId === 0));
  const filtered = historyPage(purchaseHistory(rows, "player-shop"), 2);
  assert.equal(filtered.page, 0);
  assert.equal(filtered.rows.length, 8);
  assert.deepEqual(historyPage([], 10), {
    page: 0,
    pages: 1,
    total: 0,
    start: 0,
    end: 0,
    rows: [],
  });
  assert.equal(historyPage(rows, -1).page, 0);
});
