import {
  accounting as C,
  salesText,
  type Ledger,
  type Sale,
} from "./accounting";
import { readLegacy, updateStore, type Store } from "../persistence/store";

export const ledgerKey = "nd_shop_profit_v1";
export function salesLedger(store: Store): Ledger {
  return readLegacy(store, ledgerKey, {
    version: 1,
    sales: [],
    restoredPurchases: [],
  });
}
export function prepareSalesImport(source: string, order: string): Sale[] {
  if (!source.trim())
    throw Error("Paste your shop’s Sales History rows first.");
  if (source.length > 2_000_000)
    throw Error("Paste at most 2 MB of sales history.");
  return C.parseSales(salesText(source), order);
}
export function mergeSalesImport(ledger: Ledger, incoming: Sale[]) {
  const sales = C.mergeSales(ledger.sales, incoming);
  const ids = new Set(ledger.sales.map((sale) => sale.id));
  const added = incoming.filter((sale) => !ids.has(sale.id));
  const next = { ...ledger, sales };
  if (!C.validLedger(next))
    throw Error("Invalid sales history; nothing saved.");
  return { ledger: next, added, skipped: incoming.length - added.length };
}
export async function importSales(incoming: Sale[]) {
  let result!: ReturnType<typeof mergeSalesImport>;
  await updateStore((current) => {
    result = mergeSalesImport(salesLedger(current), incoming);
    return {
      ...current,
      legacy: { ...current.legacy, [ledgerKey]: JSON.stringify(result.ledger) },
    };
  });
  return result;
}
export function removeImportedSales(ledger: Ledger, added: Sale[]): Ledger {
  const expected = new Map(
    added.map((sale) => [sale.id, JSON.stringify(sale)]),
  );
  for (const sale of ledger.sales) {
    const original = expected.get(sale.id);
    if (original && original !== JSON.stringify(sale))
      throw Error(
        "An imported sale has since changed. Review it in My Sales before removing it.",
      );
  }
  return {
    ...ledger,
    sales: ledger.sales.filter((sale) => !expected.has(sale.id)),
  };
}
export async function undoSalesImport(added: Sale[]) {
  await updateStore((current) => ({
    ...current,
    legacy: {
      ...current.legacy,
      [ledgerKey]: JSON.stringify(
        removeImportedSales(salesLedger(current), added),
      ),
    },
  }));
}
