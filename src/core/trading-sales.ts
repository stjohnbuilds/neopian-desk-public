import { validAccount } from "./profile";
import { accounting as C, type Ledger, type Sale } from "./accounting";
import { day } from "./utils";
import { auctionMailDate } from "../capture/auction-receipts.js";

export const tradingSalesKey = "nd_trading_sales_v1";
export interface TradingReceipt {
  id: string;
  account: string;
  lotId: string;
  buyer: string;
  received: number;
  items: string[];
  observedAt: number;
  source?: "auction";
  date?: string;
  sentAt?: string;
}
export interface TradingSales {
  version: 1;
  receipts: TradingReceipt[];
  // Single-item links retain their original representation in existing backups.
  // Multi-item links follow the receipt's item order, including repeated names.
  links: Record<string, string | string[]>;
}
export function validTradingReceipt(value: unknown): value is TradingReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const r = value as TradingReceipt;
  return (
    validAccount(r.account) &&
    typeof r.lotId === "string" &&
    /^\d{1,12}$/.test(r.lotId) &&
    r.id === `${r.source === "auction" ? "auction" : "tp"}:${r.account}:${r.lotId}` &&
    (r.source === "auction"
      ? Number.isFinite(r.observedAt) && r.items?.length === 1 && typeof r.date === "string" && auctionMailDate(r.sentAt) === r.date && r.date <= day(new Date(r.observedAt))
      : r.source === undefined && r.date === undefined && r.sentAt === undefined) &&
    typeof r.buyer === "string" &&
    /^[a-zA-Z0-9_]{1,50}$/.test(r.buyer) &&
    r.buyer.toLowerCase() !== r.account &&
    Number.isSafeInteger(r.received) &&
    r.received > 0 &&
    r.received <= 2_000_000_000 &&
    Array.isArray(r.items) &&
    r.items.length > 0 &&
    r.items.length <= 10 &&
    r.items.every(
      (n) =>
        typeof n === "string" &&
        n.trim() === n &&
        n.length > 0 &&
        n.length <= 200,
    ) &&
    Number.isFinite(r.observedAt) &&
    r.observedAt > 0 &&
    r.observedAt <= Date.now() + 300_000
  );
}
export function validTradingSales(value: unknown): value is TradingSales {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const t = value as TradingSales;
  if (
    !Array.isArray(t.receipts) ||
    t.receipts.length > 100_000 ||
    !t.receipts.every(validTradingReceipt)
  )
    return false;
  const ids = new Set(t.receipts.map((r) => r.id));
  const byId = new Map(t.receipts.map((r) => [r.id, r]));
  return (
    t.version === 1 &&
    ids.size === t.receipts.length &&
    !!t.links &&
    typeof t.links === "object" &&
    !Array.isArray(t.links) &&
    Object.entries(t.links).every(([id, value]) => {
      const receipt = byId.get(id);
      const links = typeof value === "string" ? [value] : value;
      return (
        ids.has(id) &&
        Array.isArray(links) &&
        links.length === receipt?.items.length &&
        links.every(
          (sale) =>
            typeof sale === "string" && sale.length > 0 && sale.length <= 1000,
        )
      );
    }) &&
    new Set(Object.values(t.links).flat()).size ===
      Object.values(t.links).flat().length
  );
}
export function readTradingSales(legacy: Record<string, string>): TradingSales {
  return legacy[tradingSalesKey]
    ? JSON.parse(legacy[tradingSalesKey])
    : { version: 1, receipts: [], links: {} };
}
const readLedger = (legacy: Record<string, string>): Ledger =>
  legacy.nd_shop_profit_v1
    ? JSON.parse(legacy.nd_shop_profit_v1)
    : { version: 1, sales: [], restoredPurchases: [] };
const sameFacts = (a: TradingReceipt, b: TradingReceipt) =>
  a.id === b.id &&
  a.source === b.source && a.date === b.date && a.sentAt === b.sentAt &&
  a.buyer === b.buyer &&
  a.received === b.received &&
  JSON.stringify(a.items) === JSON.stringify(b.items);
export function manualCandidates(
  receipt: TradingReceipt,
  ledger: Ledger,
  trading: TradingSales,
) {
  const linked = new Set(Object.values(trading.links).flat());
  return receipt.items.length === 1
    ? ledger.sales.filter(
        (s) =>
          s.source === "manual" &&
          !linked.has(s.id) &&
          s.name.trim().toLowerCase() === receipt.items[0].toLowerCase() &&
          s.price === receipt.received,
      )
    : [];
}
function saleFromReceipt(r: TradingReceipt): Sale {
  if (r.items.length !== 1)
    throw Error(
      "Allocate the lot's NP across its items before recording sales.",
    );
  return {
    id: r.id,
    date: r.date ?? day(new Date(r.observedAt)),
    name: r.items[0],
    buyer: r.buyer,
    price: r.received,
    source: r.source ?? "trading-post",
    importedAt: r.observedAt,
  };
}
function write(
  legacy: Record<string, string>,
  trading: TradingSales,
  ledger: Ledger,
) {
  if (!validTradingSales(trading) || !C.validLedger(ledger))
    throw Error("Invalid sale records; nothing saved.");
  return {
    ...legacy,
    [tradingSalesKey]: JSON.stringify(trading),
    nd_shop_profit_v1: JSON.stringify(ledger),
  };
}
export function mergeTradingReceipts(
  legacy: Record<string, string>,
  incoming: unknown,
) {
  if (
    !Array.isArray(incoming) ||
    incoming.length > 100_000 ||
    !incoming.every(validTradingReceipt)
  )
    throw Error("Invalid sale receipts.");
  const trading = readTradingSales(legacy),
    ledger = readLedger(legacy);
  const known = new Map(trading.receipts.map((r) => [r.id, r]));
  const saleIDs = new Set(ledger.sales.map((s) => s.id));
  for (const receipt of incoming) {
    const old = known.get(receipt.id);
    if (old && !sameFacts(old, receipt))
      throw Error(
        `Conflicting receipt for lot ${receipt.lotId}; existing sales kept.`,
      );
    if (!old) {
      trading.receipts.push(receipt);
      known.set(receipt.id, receipt);
    }
  }
  for (const receipt of trading.receipts) {
    if (trading.links[receipt.id]) {
      if (!receiptSaleIds(trading, receipt.id).every((id) => saleIDs.has(id)))
        throw Error(
          `The linked sale for lot ${receipt.lotId} is missing. Review the backup.`,
        );
      continue;
    }
    if (
      receipt.items.length !== 1 ||
      manualCandidates(receipt, ledger, trading).length
    )
      continue;
    ledger.sales = C.mergeSales(ledger.sales, [saleFromReceipt(receipt)]);
    saleIDs.add(receipt.id);
    trading.links[receipt.id] = receipt.id;
  }
  return write(legacy, trading, ledger);
}

export function receiptSaleIds(trading: TradingSales, id: string): string[] {
  const value = trading.links[id];
  return value === undefined ? [] : typeof value === "string" ? [value] : value;
}

/** An older backup must not erase sales or the identities that prevent replays. */
export function mergeSaleBackups(current: Record<string, string>, incoming: Record<string, string>) {
  if (![current, incoming].some(s => s.nd_shop_profit_v1 || s[tradingSalesKey])) return incoming;
  const ledger = readLedger(current), otherLedger = readLedger(incoming);
  ledger.sales = C.mergeSales(ledger.sales, otherLedger.sales);
  ledger.restoredPurchases = C.mergePurchases(ledger.restoredPurchases, otherLedger.restoredPurchases);
  const trading = readTradingSales(current), other = readTradingSales(incoming);
  const known = new Map(trading.receipts.map(r => [r.id, r]));
  for (const receipt of other.receipts) {
    const old = known.get(receipt.id);
    if (old && !sameFacts(old, receipt)) throw Error(`Conflicting receipt for lot ${receipt.lotId}; existing sales kept.`);
    if (!old) { trading.receipts.push(receipt); known.set(receipt.id, receipt); }
    const links = receiptSaleIds(other, receipt.id), previous = receiptSaleIds(trading, receipt.id);
    if (previous.length && links.length && JSON.stringify(previous) !== JSON.stringify(links))
      throw Error(`Conflicting sale links for lot ${receipt.lotId}; existing sales kept.`);
    if (!previous.length && links.length) trading.links[receipt.id] = other.links[receipt.id];
  }
  const merged = mergeTradingReceipts(write(incoming, trading, ledger), []);
  validateTradingLinks(merged);
  return merged;
}

export function validateTradingLinks(legacy: Record<string, string>) {
  if (!legacy[tradingSalesKey]) return;
  const trading = readTradingSales(legacy),
    ledger = readLedger(legacy);
  if (!validTradingSales(trading) || !C.validLedger(ledger))
    throw Error("Invalid sale records; nothing saved.");
  const sales = new Map(ledger.sales.map((sale) => [sale.id, sale]));
  for (const receipt of trading.receipts) {
    const ids = receiptSaleIds(trading, receipt.id);
    if (!ids.length) continue;
    const linked = ids.map((id) => sales.get(id));
    if (
      linked.some(
        (sale, i) =>
          !sale ||
          sale.name.trim().toLowerCase() !== receipt.items[i].toLowerCase(),
      ) ||
      linked.reduce((total, sale) => total + (sale?.price ?? 0), 0) !==
        receipt.received
    )
      throw Error(
        `The sales linked to lot ${receipt.lotId} do not match its receipt. Existing records kept.`,
      );
  }
}

export interface TradingAllocation {
  amount: number;
  saleId?: string;
}

/** Save every item and its receipt links together, or leave the ledger untouched. */
export function allocateTradingReceipt(
  legacy: Record<string, string>,
  id: string,
  allocations: TradingAllocation[],
) {
  const trading = readTradingSales(legacy),
    ledger = readLedger(legacy);
  const receipt = trading.receipts.find((r) => r.id === id);
  if (!receipt) throw Error("Receipt is no longer available.");
  if (trading.links[id]) return legacy;
  if (
    allocations.length !== receipt.items.length ||
    !allocations.every(
      (a) =>
        Number.isSafeInteger(a.amount) &&
        a.amount > 0 &&
        a.amount <= receipt.received,
    )
  )
    throw Error("Enter a whole NP amount of at least 1 for each item.");
  if (
    allocations.reduce((total, a) => total + a.amount, 0) !== receipt.received
  )
    throw Error(
      "The item amounts must add up to the NP received for this lot.",
    );
  const used = new Set(Object.values(trading.links).flat());
  const links: string[] = [];
  const additions: Sale[] = [];
  allocations.forEach((allocation, index) => {
    if (allocation.saleId) {
      const sale = ledger.sales.find((s) => s.id === allocation.saleId);
      if (
        !sale ||
        used.has(sale.id) ||
        sale.source !== "manual" ||
        sale.name.trim().toLowerCase() !== receipt.items[index].toLowerCase() ||
        sale.price !== allocation.amount
      )
        throw Error(
          "An existing sale no longer matches or has already been used. Review the items again.",
        );
      used.add(sale.id);
      links.push(sale.id);
    } else {
      const saleId = `${receipt.id}:item:${index + 1}`;
      if (ledger.sales.some((s) => s.id === saleId))
        throw Error(
          "This item already has a sale without a receipt link. Review the backup before recording it again.",
        );
      links.push(saleId);
      additions.push({
        id: saleId,
        date: day(new Date(receipt.observedAt)),
        name: receipt.items[index],
        buyer: receipt.buyer,
        price: allocation.amount,
        source: "trading-post",
        importedAt: receipt.observedAt,
      });
    }
  });
  ledger.sales = C.mergeSales(ledger.sales, additions);
  trading.links[id] = links;
  return write(legacy, trading, ledger);
}
export function resolveTradingReceipt(
  legacy: Record<string, string>,
  id: string,
  saleId?: string,
) {
  const trading = readTradingSales(legacy),
    ledger = readLedger(legacy),
    receipt = trading.receipts.find((r) => r.id === id);
  if (!receipt) throw Error("Receipt is no longer available.");
  if (trading.links[id]) return legacy;
  if (saleId) {
    if (
      !manualCandidates(receipt, ledger, trading).some((s) => s.id === saleId)
    )
      throw Error("That sale no longer matches. Review the latest records.");
    trading.links[id] = saleId;
  } else {
    ledger.sales = C.mergeSales(ledger.sales, [saleFromReceipt(receipt)]);
    trading.links[id] = id;
  }
  return write(legacy, trading, ledger);
}
