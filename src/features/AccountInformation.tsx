import { useRef, useState } from "react";
import data from "../data/dailies.json";
import { useStore, updateStore } from "../persistence/store";
import { Panel, Button, Link, Feedback, useAction } from "../components/shared";
export function AccountInformation() {
  const store = useStore();
  const editButton = useRef<HTMLButtonElement>(null);
  const closeEditor = () => {
    setDraft(null);
    setTimeout(() => editButton.current?.focus(), 0);
  };
  const saved: string = JSON.parse(store.legacy.nd_account_notes ?? '""');
  const reminders = JSON.parse(store.legacy.nd_reminders ?? "{}");
  const [draft, setDraft] = useState<{ text: string; original: string } | null>(
    null,
  );
  const { run, busy, message } = useAction();
  return (
    <div className="feature-stack">
      <Panel title="Account information">
        <div className="daily-grid">
          {data
            .filter((d) => d.group === "Other")
            .map((d) => (
              <article className="daily-card" key={d.name}>
                <strong>{d.name}</strong>
                <p>
                  {d.name === "Magma Pool" && reminders.magmaObservation
                    ? `Guard seen asleep: ${reminders.magmaObservation.replace("T", " ")} NST. This observation does not establish the start of the ten-minute window.`
                    : d.note}
                </p>
                {d.links.map((l) => (
                  <Link key={l.url} href={l.url}>
                    {d.name}
                  </Link>
                ))}
              </article>
            ))}
        </div>
      </Panel>
      <Panel title="Account notes">
        <div className="panel-body">
          <p className="muted text-small">
            Keep dated Magma Pool observations and other account information
            here.
          </p>
          {draft === null ? (
            <>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {saved || "No account notes yet."}
              </p>
              <Button
                ref={editButton}
                onClick={() => setDraft({ text: saved, original: saved })}
              >
                {saved ? "Edit notes" : "Add notes"}
              </Button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await updateStore((s) => {
                    if (
                      JSON.parse(s.legacy.nd_account_notes ?? '""') !==
                      draft.original
                    )
                      throw Error(
                        "Notes changed since you started editing. Copy your draft, then cancel and reopen the latest notes.",
                      );
                    return {
                      ...s,
                      legacy: {
                        ...s.legacy,
                        nd_account_notes: JSON.stringify(draft.text),
                      },
                    };
                  });
                  closeEditor();
                }, "Account notes saved.");
              }}
            >
              <label className="field">
                <span>Account notes</span>
                <textarea
                  autoFocus
                  rows={8}
                  maxLength={20000}
                  value={draft.text}
                  disabled={busy}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                />
              </label>
              <div className="actions">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save notes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={closeEditor}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
          <Feedback message={message} />
        </div>
      </Panel>
    </div>
  );
}
