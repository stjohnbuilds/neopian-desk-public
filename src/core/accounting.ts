import module from "./profit-core.cjs";
import report from "./profit-report.cjs";
export interface Sale {
  id: string;
  date: string;
  name: string;
  buyer: string;
  price: number;
  source: "history" | "manual" | "trading-post" | "auction";
  importedAt: number;
}
export interface Purchase {
  /** Explicitly entered purchases use shopId 0; captured NPC receipts omit source. */
  source?: "manual" | "player-shop";
  seller?: string;
  id: string;
  account: string;
  name: string;
  shopId: number;
  cost: number;
  boughtAt: number;
}
export interface Ledger {
  version: 1;
  sales: Sale[];
  restoredPurchases: Purchase[];
}
export interface PurchaseRow extends Purchase {
  day: string;
  sale: Sale | null;
  profit: number | null;
}
type Accounting = {
  validPurchase: (input: unknown) => boolean;
  validLedger: (input: unknown) => boolean;
  validSale: (input: unknown) => boolean;
  validDate: (value: string) => boolean;
  parseSales: (text: string, order: string) => Sale[];
  mergeSales: (a: Sale[], b: Sale[]) => Sale[];
  mergePurchases: (a: Purchase[], b: Purchase[]) => Purchase[];
  account: (
    p: Purchase[],
    s: Sale[],
  ) => {
    rows: PurchaseRow[];
    unmatched: Sale[];
    byDay: Record<string, number>;
  };
};
export const accounting = (module as unknown as { ProfitCore: Accounting })
  .ProfitCore;
export const reporting = (report as unknown as { ProfitReport: unknown })
  .ProfitReport as {
  range: (
    period: string,
    today: string,
    from: string,
    to: string,
  ) => { start: string; end: string };
  series: (
    rows: PurchaseRow[],
    sales: Sale[],
    range: { start: string; end: string },
    metric: string,
  ) => {
    unit: "day" | "month" | "year";
    records: number;
    points: { date: string; value: number }[];
  };
};
export function salesText(input: string) {
  if (!/<(?:html|table|tr|td|body)\b/i.test(input)) return input;
  const template = document.createElement("template");
  template.innerHTML = input;
  template.content
    .querySelectorAll("script,style,.search-helper,.search-helper-price")
    .forEach((n) => n.remove());
  for (const table of template.content.querySelectorAll("table")) {
    const rows = [...table.querySelectorAll("tr")].map((tr) =>
      [...tr.children]
        .filter((c) => ["TD", "TH"].includes(c.tagName))
        .map((c) => (c.textContent || "").trim()),
    );
    const header = rows.findIndex(
      (c) =>
        c.map((x) => x.toLowerCase()).join("|") === "date|item|buyer|price",
    );
    if (header >= 0)
      return rows
        .slice(header + 1)
        .filter((c) => c.length === 4 && /^\d{1,2}\//.test(c[0]))
        .map((c) => c.join("\t"))
        .join("\n");
  }
  throw Error(
    "No four-column sales table found. Paste the visible sales rows.",
  );
}
