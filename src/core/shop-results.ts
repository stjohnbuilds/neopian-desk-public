import type { PurchaseRow } from "./accounting";

export interface ShopResult {
  shopId: number;
  purchased: number;
  sold: number;
  unsold: number;
  income: number;
  soldCost: number;
  unsoldCost: number;
  profit: number;
}

/** Rows have already been matched across the full ledger and filtered by purchase day. */
export function shopResults(rows: readonly PurchaseRow[]): ShopResult[] {
  const shops = new Map<number, ShopResult>();
  for (const row of rows) {
    const shop = shops.get(row.shopId) ?? {
      shopId: row.shopId,
      purchased: 0,
      sold: 0,
      unsold: 0,
      income: 0,
      soldCost: 0,
      unsoldCost: 0,
      profit: 0,
    };
    shop.purchased++;
    if (row.sale) {
      shop.sold++;
      shop.income += row.sale.price;
      shop.soldCost += row.cost;
      shop.profit += row.sale.price - row.cost;
    } else {
      shop.unsold++;
      shop.unsoldCost += row.cost;
    }
    shops.set(row.shopId, shop);
  }
  return [...shops.values()].sort(
    (a, b) => b.profit - a.profit || b.sold - a.sold || a.shopId - b.shopId,
  );
}
