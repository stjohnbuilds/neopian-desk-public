import test from "node:test";
import assert from "node:assert/strict";
import {
  accounting as C,
  type Purchase,
  type Sale,
} from "../src/core/accounting";
import { readProfitView, validProfitView } from "../src/core/profit-view";
import {
  overviewRange,
  shiftPeriod,
  salesOverview,
  rankSales,
  validRange,
} from "../src/core/sales-overview";

const view = { ...readProfitView({}, "2026-10-04"), period: "month" as const };
test("default rolling range includes today and 29 earlier calendar days across boundaries", () => {
  const rolling = readProfitView({}, "2026-10-05");
  for (const [today, start] of [
    ["2026-10-05", "2026-09-06"],
    ["2026-10-06", "2026-09-07"],
    ["2026-01-01", "2025-12-03"],
    ["2024-03-01", "2024-02-01"],
    ["2026-03-01", "2026-01-31"],
    ["2026-03-09", "2026-02-08"],
    ["2026-11-02", "2026-10-04"],
  ]) {
    assert.deepEqual(
      overviewRange({ ...rolling, anchor: "2026-01-01" }, today),
      {
        start,
        end: today,
      },
    );
  }
});
test("calendar navigation selects whole historical periods and caps this period at today", () => {
  assert.deepEqual(overviewRange(view, "2026-10-04"), {
    start: "2026-10-01",
    end: "2026-10-04",
  });
  assert.deepEqual(
    overviewRange({ ...view, anchor: "2026-09-30" }, "2026-10-04"),
    { start: "2026-09-01", end: "2026-09-30" },
  );
  assert.equal(shiftPeriod("month", "2026-03-31", -1), "2026-02-01");
  assert.deepEqual(
    overviewRange({ ...view, anchor: "2024-02-29" }, "2026-10-04"),
    { start: "2024-02-01", end: "2024-02-29" },
  );
  assert.deepEqual(
    overviewRange(
      { ...view, period: "week", anchor: "2026-01-01" },
      "2026-10-04",
    ),
    { start: "2025-12-29", end: "2026-01-04" },
  );
  assert.equal(shiftPeriod("week", "2026-03-09", -1), "2026-03-02");
  assert.equal(shiftPeriod("year", "2024-02-29", 1), "2025-01-01");
  assert.deepEqual(
    overviewRange(
      { ...view, period: "year", anchor: "2025-12-31" },
      "2026-10-04",
    ),
    { start: "2025-01-01", end: "2025-12-31" },
  );
  assert.deepEqual(overviewRange({ ...view, period: "all" }, "2026-10-04"), {
    start: "",
    end: "2026-10-04",
  });
  assert.equal(
    validRange(overviewRange({ ...view, anchor: "2026-11-01" }, "2026-10-04")),
    false,
  );
  assert.equal(validRange({ start: "", end: "2026-10-04" }, true), false);
  assert.equal(
    validRange({ start: "2026-10-04", end: "2026-10-01" }, true),
    false,
  );
});

test("existing view preferences remain valid; selected historical month round-trips without changing current defaults", () => {
  assert.equal(validProfitView(view), true);
  const historical = { ...view, anchor: "2026-09-01" };
  assert.deepEqual(
    readProfitView(
      { nd_profit_view: JSON.stringify(historical) },
      "2026-11-01",
    ),
    historical,
  );
  assert.equal(validProfitView({ ...view, anchor: "2026-02-30" }), false);
  assert.equal(validProfitView({ ...view, anchor: 4 }), false);
  assert.equal(validProfitView({ ...view, anchor: "" }), true);
});

const purchase = (
  id: string,
  name: string,
  cost: number,
  date: string,
): Purchase => ({
  id,
  name,
  cost,
  shopId: 1,
  account: "test_account",
  boughtAt: Date.parse(`${date}T18:00:00Z`),
});
const sale = (id: string, name: string, price: number, date: string): Sale => ({
  id,
  name,
  price,
  date,
  buyer: "buyer",
  source: "history",
  importedAt: Date.parse("2026-10-04T22:00:00Z"),
});
test("recent sales include older purchases, keep missing costs unknown, and reconcile chart, ranking and income", () => {
  const purchases = [
    purchase("a", "Gum", 1000, "2026-09-01"),
    purchase("b", "gum", 500, "2026-09-02"),
    purchase("c", "Loss item", 3000, "2026-10-01"),
    purchase("d", "Kept item", 700, "2026-08-01"),
  ];
  const sales = [
    sale("s1", "Gum", 1500, "2026-10-01"),
    sale("s2", "gum", 1200, "2026-10-02"),
    sale("s3", "Unknown cost", 9000, "2026-10-03"),
    sale("s4", "Loss item", 1000, "2026-10-03"),
    sale("s5", "Earlier sale", 4000, "2026-09-01"),
  ];
  const before = JSON.stringify({ purchases, sales });
  const result = C.account(purchases, sales);
  const summary = salesOverview(result.rows, sales, {
    start: "2026-10-01",
    end: "2026-10-04",
  });
  assert.equal(summary.sales.length, 4);
  assert.equal(summary.income, 12700);
  assert.equal(summary.profit, -800);
  assert.equal(summary.missingCosts, 1);
  assert.equal(summary.awaiting.length, 0);
  assert.equal(
    salesOverview(result.rows, sales, { start: "", end: "2026-10-04" }).awaiting
      .length,
    1,
  );
  assert.equal(
    summary.series("profit").points.reduce((n, p) => n + p.value, 0),
    -800,
  );
  assert.equal(
    summary.series("income").points.reduce((n, p) => n + p.value, 0),
    12700,
  );
  assert.equal(
    summary.series("count").points.reduce((n, p) => n + p.value, 0),
    4,
  );
  assert.equal(rankSales(summary.items, "income")[0].name, "Unknown cost");
  assert.equal(rankSales(summary.items, "count")[0].count, 2);
  assert.equal(rankSales(summary.items, "profit")[0].knownProfit, 1200);
  assert.equal(rankSales(summary.items, "profit").at(-1)?.knownCount, 0);
  const known = salesOverview(
    result.rows,
    sales,
    { start: "2026-10-01", end: "2026-10-04" },
    false,
  );
  assert.equal(known.income, 3700);
  assert.equal(known.excludedCount, 1);
  assert.equal(known.sales.length, 3);
  assert.equal(JSON.stringify({ purchases, sales }), before);
  assert.equal(result.rows.find((p) => p.id === "a")!.day, "2026-09-01");
});

test("partial item costs stay labelled and empty periods contain no ranked items", () => {
  const sales = [
    sale("1", "Gum", 1000, "2026-10-01"),
    sale("2", "Gum", 1400, "2026-10-02"),
  ];
  const result = C.account([purchase("a", "Gum", 700, "2026-09-01")], sales);
  const summary = salesOverview(result.rows, sales, {
    start: "2026-10-01",
    end: "2026-10-04",
  });
  assert.equal(summary.items[0].knownCount, 1);
  assert.equal(summary.items[0].missingCosts, 1);
  assert.equal(summary.items[0].knownCost, 700);
  assert.equal(summary.items[0].knownProfit, 300);
  assert.equal(summary.items[0].highestSale, 1400);
  assert.equal(
    salesOverview(result.rows, sales, {
      start: "2026-08-01",
      end: "2026-08-31",
    }).items.length,
    0,
  );
});

test("rolling dates exclude outside sales and reconcile totals, daily graph and rankings", () => {
  const sales = [
    sale("before", "Outside", 9000, "2026-09-05"),
    sale("first", "First day", 1000, "2026-09-06"),
    sale("last", "Today", 2000, "2026-10-05"),
    sale("future", "Future", 7000, "2026-10-06"),
  ];
  const range = overviewRange(readProfitView({}, "2026-10-05"), "2026-10-05");
  const summary = salesOverview([], sales, range);
  assert.equal(summary.income, 3000);
  assert.deepEqual(
    summary.items.map((item) => item.name),
    ["First day", "Today"],
  );
  const series = summary.series("income");
  assert.equal(series.unit, "day");
  assert.equal(series.points.length, 30);
  assert.deepEqual(series.points[0], { date: "2026-09-06", value: 1000 });
  assert.deepEqual(series.points.at(-1), { date: "2026-10-05", value: 2000 });
  assert.equal(
    series.points.reduce((sum, point) => sum + point.value, 0),
    3000,
  );
});

test("paid amount totals only matched sold units inside the selected sale dates", () => {
  const purchases = [
    purchase("first", "Gum", 100, "2026-08-01"),
    purchase("second", "Gum", 200, "2026-08-02"),
    purchase("third", "Gum", 300, "2026-08-03"),
    purchase("unsold", "Gum", 900, "2026-08-04"),
    purchase("partial", "Partial", 700, "2026-09-01"),
  ];
  const sales = [
    sale("earlier", "Gum", 1000, "2026-09-30"),
    sale("one", "Gum", 1200, "2026-10-01"),
    sale("two", "gum", 1500, "2026-10-02"),
    sale("partial-one", "Partial", 900, "2026-10-01"),
    sale("partial-two", "Partial", 800, "2026-10-02"),
    sale("unknown", "Unknown", 2000, "2026-10-03"),
  ];
  const before = JSON.stringify({ purchases, sales });
  const rows = C.account(purchases, sales).rows;
  const range = { start: "2026-10-01", end: "2026-10-04" };
  const summary = salesOverview(rows, sales, range);
  const gum = summary.items.find((item) => item.name === "Gum")!;
  assert.equal(gum.count, 2);
  assert.equal(gum.knownCost, 500);
  assert.equal(gum.income - gum.knownCost, gum.knownProfit);
  const partial = summary.items.find((item) => item.name === "Partial")!;
  assert.equal(partial.knownCost, 700);
  assert.equal(partial.knownCount, 1);
  assert.equal(partial.missingCosts, 1);
  const unknown = summary.items.find((item) => item.name === "Unknown")!;
  assert.equal(unknown.knownCount, 0);
  assert.equal(unknown.missingCosts, 1);
  const known = salesOverview(rows, sales, range, false);
  assert.deepEqual(
    known.items.map((item) => [item.name, item.knownCost, item.count]),
    [
      ["Gum", 500, 2],
      ["Partial", 700, 1],
    ],
  );
  assert.equal(JSON.stringify({ purchases, sales }), before);
});
