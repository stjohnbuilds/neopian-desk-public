import { historyPage } from "../core/history-view";
import { HistoryPagination } from "../components/HistoryPagination";
import {
  readTradingSales,
  manualCandidates,
  resolveTradingReceipt,
  receiptSaleIds,
  type TradingReceipt,
} from "../core/trading-sales";
import { useState } from "react";
import { TradingReceiptAllocation } from "./TradingReceiptAllocation";
import { salesLedger } from "../core/sales-import";
import { day, np } from "../core/utils";
import { useStore, updateStore } from "../persistence/store";
import { Button, Disclosure, Feedback, useAction } from "../components/shared";

export function TradingSalesReceipts({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const store = useStore(),
    trading = readTradingSales(store.legacy),
    ledger = salesLedger(store);
  const { run, message, busy } = useAction();
  const [allocating, setAllocating] = useState<TradingReceipt | null>(null);
  const pending = trading.receipts.filter((r) => !trading.links[r.id]);
  const [requestedPage, setPage] = useState(0);
  const page = historyPage(
    [...trading.receipts].sort((a, b) => b.observedAt - a.observedAt),
    requestedPage,
  );
  const content = (
    <>
      <div className="feature-stack">
        <p className="muted text-small">
          Open Auction Successful! Neomail or the completed Trading Post Instant
          Buy notification with Purchase Tracker 1.3 or later enabled. Receipts stay
          in your browser if Desk is closed and sync when you return. Possible
          manual duplicates need review. Auction dates come from the mail
          (day/month/year); Trading Post dates mean first seen.
        </p>
        {!trading.receipts.length && (
          <p className="empty">No sale receipts captured yet.</p>
        )}
        <p className="muted text-small">
          {pending.length} receipts need review · All dates
        </p>
        {page.rows.map((receipt) => {
          const candidates = manualCandidates(receipt, ledger, trading);
          const linked = receiptSaleIds(trading, receipt.id)
            .map((id) => ledger.sales.find((s) => s.id === id))
            .filter((s) => !!s);
          return (
            <div key={receipt.id} className="feature-stack">
              <strong id={`trading-receipt-${receipt.id}`} tabIndex={-1}>
                {receipt.source === "auction" ? "Auction" : "Trading Post"} · Lot {receipt.lotId} · {np(receipt.received)}
              </strong>
              <p>{receipt.items.join(" · ")}</p>
              <p className="muted text-small">
                Buyer: {receipt.buyer} · {receipt.source === "auction" ? `Mail sent ${receipt.sentAt}` : `First seen ${day(new Date(receipt.observedAt))}`}
              </p>
              {linked.length ? (
                <div className="muted text-small">
                  Saved in My Sales
                  {linked.some((s) => s.source === "manual")
                    ? " · matched to your existing manual sale"
                    : ""}
                  .
                  {linked.length > 1 && (
                    <ul>
                      {linked.map((sale) => (
                        <li key={sale.id}>
                          {sale.name} · {np(sale.price)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : receipt.items.length !== 1 ? (
                <>
                  <p>
                    {receipt.items.length} items share these proceeds. Review
                    each item's amount to finish recording the sale.
                  </p>
                  <div className="actions">
                    <Button
                      variant="outline"
                      onClick={() => setAllocating(receipt)}
                    >
                      Review item amounts
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    A manual sale may already record this receipt. Match it
                    below to avoid counting it twice, or record a separate sale
                    if these were different transactions.
                  </p>
                  <div className="actions">
                    {candidates.map((sale) => (
                      <Button
                        key={sale.id}
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () =>
                              updateStore((s) => ({
                                ...s,
                                legacy: resolveTradingReceipt(
                                  s.legacy,
                                  receipt.id,
                                  sale.id,
                                ),
                              })),
                            "Receipt matched. Existing sale kept; income was not counted twice.",
                          )
                        }
                      >
                        Match {sale.name} · {sale.date} · {np(sale.price)}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            updateStore((s) => ({
                              ...s,
                              legacy: resolveTradingReceipt(
                                s.legacy,
                                receipt.id,
                              ),
                            })),
                          "Separate sale recorded",
                        )
                      }
                    >
                      Record as a separate sale
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        <Feedback message={message} />
        {allocating && (
          <TradingReceiptAllocation
            receipt={allocating}
            onClose={() => {
              const id = `trading-receipt-${allocating.id}`;
              setAllocating(null);
              requestAnimationFrame(() => document.getElementById(id)?.focus());
            }}
          />
        )}
      </div>
      <HistoryPagination {...page} onChange={setPage} />
    </>
  );
  return embedded ? (
    content
  ) : (
    <Disclosure title={`Sale receipts (${trading.receipts.length})`}>
      {content}
    </Disclosure>
  );
}
