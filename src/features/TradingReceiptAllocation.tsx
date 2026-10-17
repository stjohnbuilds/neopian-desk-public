import { useEffect, useRef, useState } from "react";
import { Modal } from "../components/Modal";
import { Button, useAction } from "../components/shared";
import { useStore, updateStore } from "../persistence/store";
import { salesLedger } from "../core/sales-import";
import { np } from "../core/utils";
import {
  allocateTradingReceipt,
  readTradingSales,
  type TradingReceipt,
} from "../core/trading-sales";

export function TradingReceiptAllocation({
  receipt,
  onClose,
}: {
  receipt: TradingReceipt;
  onClose: () => void;
}) {
  const store = useStore(),
    ledger = salesLedger(store);
  const { run, busy, message } = useAction();
  const firstRecord = useRef<HTMLSelectElement>(null);
  useEffect(() => { firstRecord.current?.focus(); }, []);
  const [draft, setDraft] = useState(() =>
    receipt.items.map(() => ({ amount: "", saleId: "" })),
  );
  const linked = new Set(
    Object.values(readTradingSales(store.legacy).links).flat(),
  );
  const amounts = draft.map((row) =>
    /^\d+$/.test(row.amount) ? Number(row.amount) : NaN,
  );
  const total = amounts.reduce(
    (sum, amount) => sum + (Number.isFinite(amount) ? amount : 0),
    0,
  );
  const remaining = receipt.received - total;
  function change(index: number, values: Partial<(typeof draft)[number]>) {
    setDraft((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...values } : row)),
    );
  }
  return (
    <Modal
      title={`Record items from lot ${receipt.lotId}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="feature-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await updateStore((current) => ({
              ...current,
              legacy: allocateTradingReceipt(
                current.legacy,
                receipt.id,
                draft.map((row, index) => ({
                  amount: amounts[index],
                  ...(row.saleId ? { saleId: row.saleId } : {}),
                })),
              ),
            }));
            onClose();
          });
        }}
      >
        <p>
          Received <strong>{np(receipt.received)}</strong> for{" "}
          {receipt.items.length} items. Enter the sale amount for each item, or
          match a sale you already recorded.
        </p>
        <p className="muted text-small">
          These are sale amounts. Purchase costs stay unchanged. All items save
          together; existing matches are counted once.
        </p>
        {receipt.items.map((name, index) => {
          const candidates = ledger.sales.filter(
            (sale) =>
              sale.source === "manual" &&
              !linked.has(sale.id) &&
              sale.name.trim().toLowerCase() === name.toLowerCase() &&
              !draft.some((row, i) => i !== index && row.saleId === sale.id),
          );
          return (
            <fieldset key={index} className="feature-stack" disabled={busy}>
              <legend>
                <strong>
                  {index + 1}. {name}
                </strong>
              </legend>
              <div className="form-grid">
                <label>
                  Record
                  <select
                    aria-label={`Record for ${name} (item ${index + 1})`}
                    ref={index === 0 ? firstRecord : undefined}
                    value={draft[index].saleId}
                    onChange={(event) => {
                      const sale = candidates.find(
                        (s) => s.id === event.target.value,
                      );
                      change(index, {
                        saleId: event.target.value,
                        amount: sale ? String(sale.price) : "",
                      });
                    }}
                  >
                    <option value="">New sale</option>
                    {draft[index].saleId &&
                      !candidates.some(
                        (sale) => sale.id === draft[index].saleId,
                      ) && (
                        <option value={draft[index].saleId}>
                          Previous match unavailable — choose again
                        </option>
                      )}
                    {candidates.map((sale) => (
                      <option key={sale.id} value={sale.id}>
                        Match {sale.date} · {np(sale.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sale amount (NP)
                  <input
                    aria-label={`Sale amount for ${name} (item ${index + 1})`}
                    inputMode="numeric"
                    value={draft[index].amount}
                    readOnly={!!draft[index].saleId}
                    placeholder="NP received"
                    onChange={(event) =>
                      change(index, { amount: event.target.value })
                    }
                  />
                </label>
              </div>
            </fieldset>
          );
        })}
        <p role="status">
          {np(total)} allocated ·{" "}
          {remaining < 0
            ? `${np(-remaining)} over the total`
            : `${np(remaining)} remaining`}
        </p>
        {message && (
          <p role="alert" className="feedback error">
            {message}
          </p>
        )}
        <div className="actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save all items"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
