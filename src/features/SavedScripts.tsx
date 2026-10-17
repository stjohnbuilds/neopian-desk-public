import { useState } from "react";
import { useStore, readLegacy, setLegacy } from "../persistence/store";
import {
  Button,
  Panel,
  CopyButton,
  Feedback,
  useAction,
} from "../components/shared";
interface Script {
  id: string;
  name: string;
  code: string;
  notes: string;
  url: string;
  status: string;
  tested?: string;
  updated?: string;
}
export function SavedScripts() {
  const store = useStore();
  const saved = readLegacy<Script[]>(store, "nd_scripts", []);
  const [editing, setEditing] = useState<Script>({
    id: "",
    name: "",
    code: "",
    notes: "",
    url: "",
    status: "untested",
  });
  const { run, message } = useAction();
  return (
    <div className="feature-stack">
      <Panel collapsible title="Your scripts">
        {saved.map((s) => (
          <div className="checklist-row" key={s.id}>
            <div>
              <strong>{s.name}</strong>
              <p>
                {s.status} · {s.notes}
              </p>
            </div>
            <CopyButton text={s.code} />
            <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
              Edit
            </Button>
          </div>
        ))}
        <form
          className="feature-stack panel-note"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const next = {
                ...editing,
                id: editing.id || crypto.randomUUID(),
                updated: new Date().toISOString(),
              };
              await setLegacy("nd_scripts", [
                ...saved.filter((s) => s.id !== editing.id),
                next,
              ]);
              setEditing(next);
            }, "Script saved");
          }}
        >
          <div className="form-grid">
            <label>
              Name
              <input
                required
                maxLength={160}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                {["untested", "working", "tweak", "broken", "paused"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Source URL
              <input
                type="url"
                value={editing.url}
                onChange={(e) =>
                  setEditing({ ...editing, url: e.target.value })
                }
              />
            </label>
          </div>
          <textarea
            aria-label="Script notes"
            placeholder="Notes"
            value={editing.notes}
            onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
          />
          <textarea
            aria-label="Script code"
            placeholder="Saved script code"
            rows={5}
            spellCheck={false}
            value={editing.code}
            onChange={(e) => setEditing({ ...editing, code: e.target.value })}
          />
          <div className="actions">
            <Button type="submit">Save script</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setEditing({
                  id: "",
                  name: "",
                  code: "",
                  notes: "",
                  url: "",
                  status: "untested",
                })
              }
            >
              New script
            </Button>
          </div>
        </form>
      </Panel>
      <Feedback message={message} />
    </div>
  );
}
