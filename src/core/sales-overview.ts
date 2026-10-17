import {
  accounting,
  reporting,
  type PurchaseRow,
  type Sale,
} from "./accounting";
import type { ProfitView } from "./profit-view";

export type DateRange = { start: string; end: string };
export type CalendarPeriod = "week" | "month" | "year";
const iso = (date: Date) => date.toISOString().slice(0, 10);
const utc = (date: string) => new Date(`${date}T12:00:00Z`);
export function periodStart(period: CalendarPeriod, date: string) {
  const d = utc(date);
  if (period === "week")
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (period === "month") d.setUTCDate(1);
  if (period === "year") d.setUTCMonth(0, 1);
  return iso(d);
}
export function shiftPeriod(
  period: CalendarPeriod,
  date: string,
  direction: number,
) {
  const d = utc(periodStart(period, date));
  if (period === "week") d.setUTCDate(d.getUTCDate() + direction * 7);
  if (period === "month") d.setUTCMonth(d.getUTCMonth() + direction);
  if (period === "year") d.setUTCFullYear(d.getUTCFullYear() + direction);
  return iso(d);
}
export function overviewRange(view: ProfitView, today: string): DateRange {
  if (view.period === "last30") {
    const start = utc(today);
    start.setUTCDate(start.getUTCDate() - 29);
    return { start: iso(start), end: today };
  }
  if (view.period === "all") return { start: "", end: today };
  if (view.period === "custom") return { start: view.from, end: view.to };
  const anchor = view.anchor || today;
  const start = periodStart(view.period, anchor);
  const next = utc(shiftPeriod(view.period, anchor, 1));
  next.setUTCDate(next.getUTCDate() - 1);
  return { start, end: iso(next) < today ? iso(next) : today };
}
export function validRange(range: DateRange, custom = false) {
  return (
    ((!range.start && !custom) || accounting.validDate(range.start)) &&
    accounting.validDate(range.end) &&
    (!range.start || range.start <= range.end)
  );
}
export function inRange(date: string, range: DateRange) {
  return (!range.start || date >= range.start) && date <= range.end;
}
export function displayDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return utc(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
    timeZone: "UTC",
  });
}
export function rangeLabel(range: DateRange) {
  return range.start
    ? `${displayDate(range.start)} – ${displayDate(range.end)}`
    : `All saved dates through ${displayDate(range.end)}`;
}
export interface RankedItem {
  name: string;
  count: number;
  income: number;
  knownCost: number;
  knownProfit: number;
  knownCount: number;
  missingCosts: number;
  highestSale: number;
}
export function salesOverview(
  rows: PurchaseRow[],
  sales: Sale[],
  range: DateRange,
  includeMissingCosts = true,
) {
  const bySale = new Map(
    rows.filter((p) => p.sale).map((p) => [p.sale!.id, p]),
  );
  const periodSales = sales.filter((s) => inRange(s.date, range));
  const visibleSales = periodSales.filter(
    (s) => includeMissingCosts || bySale.has(s.id),
  );
  const matched = visibleSales.flatMap((s) =>
    bySale.has(s.id) ? [bySale.get(s.id)!] : [],
  );
  const items = new Map<string, RankedItem>();
  for (const sale of visibleSales) {
    const key = sale.name.trim().toLowerCase();
    const item = items.get(key) || {
      name: sale.name,
      count: 0,
      income: 0,
      knownCost: 0,
      knownProfit: 0,
      knownCount: 0,
      missingCosts: 0,
      highestSale: 0,
    };
    item.count++;
    item.income += sale.price;
    item.highestSale = Math.max(item.highestSale, sale.price);
    const purchase = bySale.get(sale.id);
    if (purchase) {
      item.knownCost += purchase.cost;
      item.knownProfit += purchase.profit!;
      item.knownCount++;
    } else item.missingCosts++;
    items.set(key, item);
  }
  return {
    sales: visibleSales,
    income: visibleSales.reduce((n, s) => n + s.price, 0),
    profit: matched.reduce((n, p) => n + p.profit!, 0),
    matchedCount: matched.length,
    missingCosts: visibleSales.length - matched.length,
    excludedCount: periodSales.length - visibleSales.length,
    awaiting: rows.filter((p) => inRange(p.day, range) && !p.sale),
    items: [...items.values()],
    // The ledger keeps purchase attribution; this view explicitly follows sale dates.
    series: (metric: ProfitView["metric"]) =>
      reporting.series(
        matched.map((p) => ({ ...p, day: p.sale!.date })),
        visibleSales,
        range,
        metric,
      ),
  };
}
export type TopSalesSort = "income" | "count" | "profit";
export function rankSales(items: RankedItem[], sort: TopSalesSort) {
  return [...items].sort((a, b) => {
    if (sort === "profit" && (!a.knownCount || !b.knownCount))
      return (
        Number(!!b.knownCount) - Number(!!a.knownCount) ||
        b.income - a.income ||
        a.name.localeCompare(b.name)
      );
    return (
      (sort === "profit" ? b.knownProfit - a.knownProfit : b[sort] - a[sort]) ||
      b.income - a.income ||
      a.name.localeCompare(b.name)
    );
  });
}
