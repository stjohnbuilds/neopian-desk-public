import type { NameState, CheckBatch } from "../core/names";
import {
  recentCheckBatches,
  unchangedBatchRows,
  statuses,
} from "../core/names";
import { Button, CopyButton, Disclosure } from "../components/shared";
const title = (name: string) => name[0].toUpperCase() + name.slice(1);
export function NameBatches({
  names,
  busy,
  undo,
}: {
  names: NameState;
  busy: boolean;
  undo: (batch: CheckBatch) => void;
}) {
  return (
    <Disclosure title="Recent batches · newest first">
      <div className="recent-name-batches">
        {recentCheckBatches(names)
          .slice(0, 30)
          .map((batch) => {
            const eligible = unchangedBatchRows(names, batch).length;
            return (
              <article key={batch.at}>
                <div className="actions">
                  <strong>
                    {batch.rows.length}{" "}
                    {batch.rows.length === 1 ? "name" : "names"}
                  </strong>
                  <span className="muted text-small">
                    {new Date(batch.at).toLocaleString()}
                  </span>
                  <CopyButton
                    text={batch.rows.map((r) => title(r.name)).join("\n")}
                    label="Copy batch names"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="push"
                    disabled={busy || !eligible}
                    onClick={() => undo(batch)}
                  >
                    {eligible
                      ? eligible === batch.rows.length
                        ? "Undo batch"
                        : `Undo ${eligible} unchanged`
                      : "Already changed"}
                  </Button>
                </div>
                <p>{batch.rows.map((r) => title(r.name)).join(", ")}</p>
                <small className="muted">
                  {[...new Set(batch.rows.map((r) => statuses[r.status]))].join(
                    " · ",
                  )}
                </small>
              </article>
            );
          })}
      </div>
    </Disclosure>
  );
}
