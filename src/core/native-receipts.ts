import { accounting, type Purchase } from "./accounting";
import {
  mergeTradingReceipts,
  validTradingReceipt,
  type TradingReceipt,
} from "./trading-sales";
import type { Store } from "../persistence/store";

export type CapturedReceipt =
  | { kind: "purchase"; receipt: Purchase }
  | { kind: "trade"; receipt: TradingReceipt };
export const receiptKey = (row: CapturedReceipt) =>
  row.kind + ":" + row.receipt.id;
export function mergeNativeReceipt(store: Store, row: CapturedReceipt): Store {
  if (!store.profile.account || row?.receipt?.account !== store.profile.account) throw Error("This receipt belongs to another account.");
  if (row?.kind === "trade" && validTradingReceipt(row.receipt))
    return {
      ...store,
      legacy: mergeTradingReceipts(store.legacy, [row.receipt]),
    };
  if (row?.kind !== "purchase")
    throw Error(
      "This receipt could not be validated. Its saved copy is retained.",
    );
  // Validate the incoming row before reconciling an observation timestamp.
  accounting.mergePurchases([], [row.receipt]);
  const old = store.native.purchases.find((p) => p.id === row.receipt.id);
  let receipt = row.receipt;
  if (old) {
    if (
      old.account !== receipt.account ||
      old.name !== receipt.name ||
      old.shopId !== receipt.shopId ||
      old.source !== receipt.source ||
      old.seller !== receipt.seller ||
      old.cost !== receipt.cost
    )
      throw Error(
        "This purchase conflicts with a saved receipt. Nothing was overwritten.",
      );
    receipt = old;
  }
  return {
    ...store,
    native: {
      ...store.native,
      purchases: accounting.mergePurchases(store.native.purchases, [receipt]),
    },
  };
}
