import { useState } from "react";
import { SectionTabs } from "../components/SectionTabs";
import type { PurchaseRow, Sale } from "../core/accounting";
import { np } from "../core/utils";
import {
  historyPage,
  purchaseHistory,
  type PurchaseSource,
} from "../core/history-view";
import { HistoryPagination } from "../components/HistoryPagination";
import { TradingSalesReceipts } from "./TradingSalesReceipts";
import { Disclosure } from "../components/shared";
import { useStore } from "../persistence/store";
import { readTradingSales, receiptSaleIds } from "../core/trading-sales";

export function SalesHistory({
  rows,
  unmatched,
  inside,
  valid,
}: {
  rows: PurchaseRow[];
  unmatched: Sale[];
  inside: (date: string) => boolean;
  valid: boolean;
}) {
  const store = useStore();
  const trading = readTradingSales(store.legacy);
  const receiptBySale = new Map(
    trading.receipts.flatMap(r => receiptSaleIds(trading, r.id).map(id => [id, r] as const)),
  );
  const [view, setView] = useState("sales");
  const [saleSource, setSaleSource] = useState("all");
  const [source, setSource] = useState<PurchaseSource>("all");
  const [requestedPage, setPage] = useState(0);
  const purchases = purchaseHistory(
    valid ? rows.filter((p) => inside(p.day)) : [],
    source,
  );
  const sales = valid
    ? [
        ...rows
          .filter((p) => p.sale)
          .map((p) => ({ sale: p.sale!, cost: p.cost, profit: p.profit })),
        ...unmatched.map((sale) => ({ sale, cost: null, profit: null })),
      ]
        .filter((p) => inside(p.sale.date))
        .sort(
          (a, b) =>
            b.sale.date.localeCompare(a.sale.date) ||
            b.sale.importedAt - a.sale.importedAt ||
            b.sale.id.localeCompare(a.sale.id),
        )
    : [];
  const visibleSales = (
    view === "missing" ? sales.filter((p) => p.cost === null) : sales
  ).filter(
    (p) =>
      saleSource === "all" ||
      p.sale.source === saleSource ||
      (receiptBySale.has(p.sale.id) && (receiptBySale.get(p.sale.id)?.source ?? "trading-post") === saleSource),
  );
  const purchasePage = historyPage(purchases, requestedPage);
  const salePage = historyPage(visibleSales, requestedPage);
  return (
    <Disclosure title="Purchase & sales history">
      <div className="history-toolbar">
        <div className="actions">
          <SectionTabs
            label="Purchase and sales history views"
            value={view}
            onChange={(next) => {
              setView(next);
              setPage(0);
            }}
            options={[
              ["sales", `Sales (${sales.length})`],
              ["purchases", `Purchases (${purchases.length})`],
              [
                "missing",
                `Missing costs (${sales.filter((p) => p.cost === null).length})`,
              ],
              ["receipts", "Sale receipts"],
            ]}
          />
          {view === "purchases" && (
            <label>
              From{" "}
              <select
                aria-label="Purchase source"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value as PurchaseSource);
                  setPage(0);
                }}
              >
                <option value="all">All purchases</option>
                <option value="player-shop">Other users’ shops</option>
                <option value="neopian">Neopian stores</option>
                <option value="manual">Manual / Trading Post</option>
              </select>
            </label>
          )}
          {(view === "sales" || view === "missing") && (
            <label>
              From{" "}
              <select
                aria-label="Sale source"
                value={saleSource}
                onChange={(e) => {
                  setSaleSource(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">All sales</option>
                <option value="trading-post">Trading Post</option>
                <option value="auction">Auctions</option>
                <option value="history">Your shop</option>
                <option value="manual">Manual entries</option>
              </select>
            </label>
          )}
          <span className="muted text-small">Newest first · 10 per page</span>
        </div>
        <p className="muted text-small">
          {view === "purchases"
            ? "Bought in the selected period. Sold items show the sale price and profit in the same row."
            : view === "receipts"
              ? "Auction-success Neomail and Instant Buy sale receipts are captured when opened with Purchase Tracker 1.3 or later. Trading Post purchases and ordinary accepted offers need manual entries."
              : view === "missing"
                ? "These sales are saved, but Desk has no matching purchase cost. Profit stays blank."
                : "Sold in the selected period. A blank cost means the purchase has not been recorded."}
        </p>
      </div>
      {view === "receipts" ? (
        <TradingSalesReceipts embedded />
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>{view === "purchases" ? "Bought" : "Sold"}</th>
                  <th>Paid</th>
                  <th>Sale price</th>
                  <th>Profit</th>
                  {view === "purchases" && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {view === "purchases"
                  ? purchasePage.rows.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.name}
                          <small className="history-source muted">
                            {p.source === "player-shop"
                              ? `Player shop${p.seller ? ` · ${p.seller}` : ""}`
                              : p.shopId > 0
                                ? "Neopian store"
                                : "Manual · shop not recorded"}
                          </small>
                        </td>
                        <td>{p.day}</td>
                        <td>{np(p.cost)}</td>
                        <td>{p.sale ? np(p.sale.price) : "—"}</td>
                        <td>{p.profit === null ? "—" : np(p.profit)}</td>
                        <td>{p.sale ? "Sold" : "No sale recorded"}</td>
                      </tr>
                    ))
                  : salePage.rows.map((p) => (
                      <tr key={p.sale.id}>
                        <td>{p.sale.name}
                          {receiptBySale.has(p.sale.id) && (
                            <small className="history-source muted">
                              {receiptBySale.get(p.sale.id)?.source === "auction" ? "Auction" : "Trading Post"} · Lot {receiptBySale.get(p.sale.id)?.lotId}
                            </small>
                          )}
                        </td>
                        <td>
                          {p.sale.date}
                          {p.sale.source === "trading-post" && (
                            <small className="muted"> · First seen</small>
                          )}
                        </td>
                        <td>{p.cost === null ? "—" : np(p.cost)}</td>
                        <td>{np(p.sale.price)}</td>
                        <td>{p.profit === null ? "—" : np(p.profit)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!(view === "purchases" ? purchases : visibleSales).length && (
              <p className="empty">
                No {view === "missing" ? "sales with missing costs" : view} in
                this period.
              </p>
            )}
          </div>
          <HistoryPagination
            {...(view === "purchases" ? purchasePage : salePage)}
            onChange={setPage}
          />
        </>
      )}
    </Disclosure>
  );
}
