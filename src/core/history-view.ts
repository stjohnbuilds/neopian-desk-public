import type { PurchaseRow } from "./accounting";

export type PurchaseSource = "all" | "player-shop" | "neopian" | "manual";

export function purchaseHistory(rows: PurchaseRow[], source: PurchaseSource) {
  return rows
    .filter(
      (p) =>
        source === "all" ||
        (source === "player-shop"
          ? p.source === "player-shop"
          : source === "neopian"
            ? p.shopId > 0
            : p.shopId === 0),
    )
    .sort((a, b) => b.boughtAt - a.boughtAt || b.id.localeCompare(a.id));
}

export function historyPage<T>(rows: T[], requested: number) {
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const page = Math.max(0, Math.min(requested, pages - 1));
  return {
    page,
    pages,
    total: rows.length,
    start: rows.length ? page * 10 + 1 : 0,
    end: Math.min((page + 1) * 10, rows.length),
    rows: rows.slice(page * 10, (page + 1) * 10),
  };
}
