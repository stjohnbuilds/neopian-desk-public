import test from "node:test";
import assert from "node:assert/strict";
import {
  accounting as C,
  type Purchase,
  type Sale,
} from "../src/core/accounting";
import { shopResults } from "../src/core/shop-results";

test("shop results match before purchase-date filtering, retain losses and unsold costs", () => {
  const purchases: Purchase[] = [
    {
      id: "old",
      account: "test",
      name: "Apple",
      shopId: 1,
      cost: 50,
      boughtAt: Date.parse("2026-09-01T12:00:00Z"),
    },
    {
      id: "next",
      account: "test",
      name: "Apple",
      shopId: 1,
      cost: 70,
      boughtAt: Date.parse("2026-09-02T12:00:00Z"),
    },
    {
      id: "loss",
      account: "test",
      name: "Pear",
      shopId: 2,
      cost: 100,
      boughtAt: Date.parse("2026-09-02T12:00:00Z"),
    },
    {
      id: "waiting",
      account: "test",
      name: "Berry",
      shopId: 3,
      cost: 30,
      boughtAt: Date.parse("2026-09-02T12:00:00Z"),
    },
  ];
  const sales: Sale[] = [
    {
      id: "apple",
      name: "Apple",
      date: "2026-09-03",
      buyer: "test",
      price: 200,
      source: "manual",
      importedAt: Date.parse("2026-09-04T12:00:00Z"),
    },
    {
      id: "pear",
      name: "Pear",
      date: "2026-09-03",
      buyer: "test",
      price: 80,
      source: "manual",
      importedAt: Date.parse("2026-09-04T12:00:00Z"),
    },
    {
      id: "unknown",
      name: "Unknown",
      date: "2026-09-03",
      buyer: "test",
      price: 999,
      source: "manual",
      importedAt: Date.parse("2026-09-04T12:00:00Z"),
    },
  ];
  const before = JSON.stringify({ purchases, sales });
  const result = C.account(purchases, sales);
  const shops = shopResults(result.rows);
  assert.deepEqual(
    shops.find((s) => s.shopId === 1),
    {
      shopId: 1,
      purchased: 2,
      sold: 1,
      unsold: 1,
      income: 200,
      soldCost: 50,
      unsoldCost: 70,
      profit: 150,
    },
  );
  assert.equal(shops.find((s) => s.shopId === 2)?.profit, -20);
  assert.equal(shops.find((s) => s.shopId === 3)?.sold, 0);
  assert.equal(
    shops.reduce((n, s) => n + s.income, 0),
    280,
  );
  assert.equal(
    shopResults(result.rows.filter((r) => r.day === "2026-09-02")).find(
      (s) => s.shopId === 1,
    )?.sold,
    0,
  );
  assert.equal(JSON.stringify({ purchases, sales }), before);
  assert.deepEqual(shopResults([]), []);
});
