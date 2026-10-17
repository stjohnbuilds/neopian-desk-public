import { useEffect, useRef, useState } from "react";
import { type Sale } from "../core/accounting";
import {
  importSales,
  mergeSalesImport,
  prepareSalesImport,
  salesLedger,
  undoSalesImport,
} from "../core/sales-import";
import { useStore } from "../persistence/store";
import { navigateAndWait } from "../app/useNavigation";
import { np } from "../core/utils";
import { Button, Link } from "./shared";
import { Modal } from "./Modal";

export function SalesImport({ onClose }: { onClose?: () => void }) {
  const store = useStore();
  const [source, setSource] = useState("");
  const [order, setOrder] = useState("DMY");
  const [preview, setPreview] = useState<Sale[] | null>(null);
  const [added, setAdded] = useState<Sale[]>([]);
  const [status, setStatus] = useState({ error: false, text: "" });
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const running = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (onClose) input.current?.focus();
  }, []);
  const savedIDs = new Set(salesLedger(store).sales.map((sale) => sale.id));
  const newRows = preview?.filter((sale) => !savedIDs.has(sale.id)) ?? [];
  const summary = preview
    ? { added: newRows, skipped: preview.length - newRows.length }
    : null;
  function invalidate() {
    setPreview(null);
    setStatus({ error: false, text: "" });
    setDiscard(false);
  }
  async function run(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setStatus({
        error: true,
        text: error instanceof Error ? error.message : String(error),
      });
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  function close() {
    if (running.current) return;
    if (source.trim()) setDiscard(true);
    else onClose?.();
  }
  const form = (
    <div className="feature-stack sales-import" aria-busy={busy}>
      <p className="muted text-small">
        Paste from your shop’s{" "}
        <Link href="https://www.neopets.com/market.phtml?type=sales">
          Sales History
        </Link>
        . Saves to Profit → My Sales. Previously imported rows are skipped.
      </p>
      <label>
        Sales history text
        <textarea
          ref={input}
          aria-label="Sales history text"
          autoFocus={!!onClose}
          rows={6}
          placeholder="Paste Date, Item, Buyer and Price rows…"
          value={source}
          disabled={busy}
          onChange={(e) => {
            setSource(e.target.value);
            invalidate();
          }}
        />
      </label>
      <div className="actions">
        <label>
          Date format
          <select
            aria-label="Sales date format"
            value={order}
            disabled={busy}
            onChange={(e) => {
              setOrder(e.target.value);
              invalidate();
            }}
          >
            <option value="DMY">Day / month / year</option>
            <option value="MDY">Month / day / year</option>
          </select>
        </label>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              setPreview(null);
              const rows = prepareSalesImport(source, order);
              mergeSalesImport(salesLedger(store), rows);
              setPreview(rows);
              setStatus({ error: false, text: "" });
            })
          }
        >
          Preview
        </Button>
        <Button
          disabled={busy || (!onClose && !preview)}
          onClick={() =>
            void run(async () => {
              const result = await importSales(
                prepareSalesImport(source, order),
              );
              setAdded(result.added);
              setPreview(null);
              setSource("");
              setDiscard(false);
              setStatus({
                error: false,
                text: `${result.added.length} ${result.added.length === 1 ? "sale" : "sales"} imported · ${result.skipped} already saved. My Sales is up to date.`,
              });
            })
          }
        >
          {busy ? "Working…" : "Import sales"}
        </Button>
        {onClose && (
          <Button variant="ghost" disabled={busy} onClick={close}>
            Cancel
          </Button>
        )}
      </div>
      <div>
        {status.text && (
          <div
            role={status.error ? "alert" : "status"}
            className={status.error ? "feedback error" : "feedback"}
          >
            {status.text}
          </div>
        )}
        {summary && (
          <section aria-label="Sales preview">
            <p role="status">
              <strong>
                {preview!.length} {preview!.length === 1 ? "sale" : "sales"}{" "}
                read
              </strong>{" "}
              · {summary.added.length} new · {summary.skipped} already saved
            </p>
            <div
              className="sales-preview-scroll"
              tabIndex={0}
              aria-label="Preview rows"
            >
              <table className="sales-preview-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Buyer</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview!.slice(0, 50).map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.date}</td>
                      <td>{sale.name}</td>
                      <td>{sale.buyer}</td>
                      <td>{np(sale.price)}</td>
                      <td>
                        {summary.added.some((row) => row.id === sale.id)
                          ? "New"
                          : "Already saved"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview!.length > 50 && (
              <p className="muted text-small">
                Showing the first 50 of {preview!.length} rows. Import processes
                all rows.
              </p>
            )}
          </section>
        )}
      </div>
      {added.length > 0 && (
        <div className="actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await undoSalesImport(added);
                setAdded([]);
                setStatus({
                  error: false,
                  text: "This import was undone. Other sales are unchanged.",
                });
              })
            }
          >
            Undo this import
          </Button>
        </div>
      )}
      {onClose && status.text && !status.error && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await navigateAndWait({ page: "profit", profit: "sales" });
              onClose();
            })
          }
        >
          View My Sales
        </Button>
      )}
      {discard && (
        <div className="feedback" role="alert">
          <p>Discard the pasted sales? They haven’t been imported.</p>
          <div className="actions">
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Keep editing
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Discard and close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  return onClose ? (
    <Modal title="Import sales" onClose={close}>
      {form}
    </Modal>
  ) : (
    form
  );
}
