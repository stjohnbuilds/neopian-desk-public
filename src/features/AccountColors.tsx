import { useState } from "react";
import { useStore, updateStore } from "../persistence/store";
import {
  colorRoles,
  colorPairings,
  pairedColors,
  defaultColors,
  validateAccountColors,
} from "../core/account-colors";
import { Panel, Button, Feedback, useAction } from "../components/shared";
export function AccountColors() {
  const store = useStore(),
    [draft, setDraft] = useState(store.accountColors ?? defaultColors),
    { run, busy, message } = useAction();
  return (
    <Panel title="Page colour palette" collapsible>
      <div className="panel-note feature-stack">
        <p>
          Save a palette to use in your page editors. Applying it to a page is a
          separate action.
        </p>
        <label>
          Preset
          <select
            aria-label="Colour preset"
            value=""
            onChange={(e) =>
              setDraft(
                pairedColors(e.target.value as keyof typeof colorPairings),
              )
            }
          >
            <option value="" disabled>
              Choose a preset
            </option>
            {Object.keys(colorPairings).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          {colorRoles.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="color"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div
          style={{
            background: draft.background,
            color: draft.text,
            padding: 16,
            border: `1px solid ${draft.border}`,
          }}
        >
          <strong style={{ color: draft.heading }}>Palette preview</strong>
          <p>
            Body text with{" "}
            <span style={{ color: draft.link }}>link colour</span>.
          </p>
        </div>
        <div className="actions">
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                validateAccountColors(draft);
                await updateStore((s) => ({ ...s, accountColors: draft }));
              }, "Palette saved.")
            }
          >
            Save palette
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setDraft(store.accountColors ?? defaultColors)}
          >
            Cancel changes
          </Button>
        </div>
        <Feedback message={message} />
      </div>
    </Panel>
  );
}
