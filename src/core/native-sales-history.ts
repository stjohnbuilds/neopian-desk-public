import { validAccount } from "./profile";
import {
  prepareSalesImport,
  mergeSalesImport,
  salesLedger,
  ledgerKey,
} from "./sales-import";
import type { Store } from "../persistence/store";

export interface SalesHistoryCapture {
  id: string;
  account: string;
  observedAt: number;
  rows: string[][];
}
export function validateSalesHistoryCapture(
  value: unknown,
): asserts value is SalesHistoryCapture {
  const s = value as SalesHistoryCapture;
  if (
    !s ||
    !validAccount(s.account) ||
    typeof s.id !== "string" ||
    !/^[a-f0-9]{64}$/.test(s.id) ||
    !Number.isFinite(s.observedAt) ||
    s.observedAt <= 0 ||
    s.observedAt > Date.now() + 300000 ||
    !Array.isArray(s.rows) ||
    !s.rows.length ||
    s.rows.length > 5000 ||
    !s.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 4 &&
        row.every(
          (cell) =>
            typeof cell === "string" &&
            cell.trim() === cell &&
            cell.length > 0 &&
            cell.length <= 400 &&
            !/[\t\r\n]/.test(cell),
        ) &&
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(row[0]) &&
        /^[a-zA-Z0-9_]{1,50}$/.test(row[2]) &&
        /^[\d,]+ NP$/.test(row[3]),
    )
  )
    throw Error(
      "The captured Sales History is incomplete. Nothing imported; keep the page open and retry.",
    );
}
export function mergeCapturedSales(store: Store, capture: unknown) {
  validateSalesHistoryCapture(capture);
  if (!store.profile.account || capture.account !== store.profile.account) throw Error("This Sales History belongs to another account.");
  const incoming = prepareSalesImport(
    capture.rows.map((row) => row.join("\t")).join("\n"),
    "DMY",
  );
  const result = mergeSalesImport(salesLedger(store), incoming);
  return {
    store: {
      ...store,
      legacy: { ...store.legacy, [ledgerKey]: JSON.stringify(result.ledger) },
    },
    added: result.added.length,
  };
}
