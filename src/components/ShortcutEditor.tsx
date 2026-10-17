import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import {
  shortcutChoices,
  sameShortcutTarget,
  shopGroupIDs,
  type Shortcut,
} from "../core/shortcuts";
import { saveShortcuts } from "../persistence/shortcuts";
import { Button, Feedback, useAction } from "./shared";
import { Modal } from "./Modal";
import { IconPicker, shortcutGlyphs } from "./ShortcutIcons";

export function ShortcutEditor({
  links,
  baseline,
  onClose,
}: {
  links: Shortcut[];
  baseline: string | undefined;
  onClose: () => void;
}) {
  const [original] = useState(baseline);
  const [draft, setDraft] = useState(() => links.map((s) => ({ ...s })));
  const [selected, setSelected] = useState<string | null>(null);
  const { run, busy, message, setMessage } = useAction();
  const active = draft.find((s) => s.id === selected);
  const index = draft.findIndex((s) => s.id === selected);
  const update = (next: Shortcut) =>
    setDraft((items) => items.map((s) => (s.id === next.id ? next : s)));
  const move = (step: number) => {
    const next = [...draft];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    setDraft(next);
  };
  const add = () => {
    const preset = shortcutChoices.find(
      (s) => !draft.some((d) => sameShortcutTarget(s, d)),
    );
    const next: Shortcut = preset
      ? { ...preset, id: crypto.randomUUID() }
      : {
          id: crypto.randomUUID(),
          label: "",
          kind: "url",
          url: "",
          icon: "link",
        };
    setDraft([...draft, next]);
    setSelected(next.id);
    setMessage("");
  };
  return (
    <Modal
      className="shortcut-modal"
      title="Quick links"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="shortcut-editor">
        <div className="shortcut-editor-body">
          <div className="shortcut-sidebar">
            <div className="shortcut-list">
              {draft.map((s) => {
                const Icon = shortcutGlyphs[s.icon];
                return (
                  <div
                    className={`shortcut-row ${selected === s.id ? "is-selected" : ""}`}
                    key={s.id}
                  >
                    <button
                      className="shortcut-select"
                      aria-label={`Edit ${s.label || "new shortcut"}`}
                      aria-expanded={selected === s.id}
                      onClick={() =>
                        setSelected(selected === s.id ? null : s.id)
                      }
                      disabled={busy}
                    >
                      <Icon size={17} />
                      <span>{s.label || "New shortcut"}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${s.label || "new shortcut"}`}
                      disabled={busy}
                      onClick={() => {
                        setDraft(draft.filter((d) => d.id !== s.id));
                        if (selected === s.id) setSelected(null);
                      }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                );
              })}
              {!draft.length && (
                <p className="search-empty">
                  Your bar is empty. Add a shortcut below.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              disabled={busy || draft.length >= 8}
              onClick={add}
            >
              <Plus size={14} />
              Add shortcut
            </Button>
            <span className="muted text-small">
              {draft.length} of 8 shortcuts
            </span>
          </div>
          {active ? (
            <fieldset className="shortcut-fields" disabled={busy}>
              <legend>{active.label || "New shortcut"}</legend>
              <label>
                Destination
                <select
                  aria-label="Shortcut destination"
                  value={
                    shortcutChoices.find((s) => sameShortcutTarget(s, active))
                      ?.id ?? "custom"
                  }
                  onChange={(e) => {
                    const preset = shortcutChoices.find(
                      (s) => s.id === e.target.value,
                    );
                    update(
                      preset
                        ? { ...preset, id: active.id }
                        : {
                            id: active.id,
                            kind: "url",
                            url: "",
                            label: active.label,
                            icon: active.icon,
                          },
                    );
                  }}
                >
                  {shortcutChoices.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.label}
                    </option>
                  ))}
                  <option value="custom">Custom link…</option>
                </select>
              </label>
              <label>
                Name
                <input
                  aria-label="Shortcut name"
                  maxLength={100}
                  value={active.label}
                  onChange={(e) => update({ ...active, label: e.target.value })}
                />
              </label>
              {active.kind === "url" ? (
                <label>
                  Link
                  <input
                    aria-label="Shortcut link"
                    type="url"
                    maxLength={2000}
                    placeholder="https://…"
                    value={active.url}
                    onChange={(e) => update({ ...active, url: e.target.value })}
                  />
                </label>
              ) : (
                <p className="muted text-small">
                  {active.group === "collectibles"
                    ? "Opens Stamps, Coins, Sea Shells, Toys and Collectable Cards together. The existing Shop Helper checks this batch once for expensive finds. The card shop stocks Neodeck cards."
                    : `Opens the original set of ${shopGroupIDs(active.group).length} shops together.`}
                </p>
              )}
              <span className="text-small">Icon</span>
              <IconPicker
                value={active.icon}
                onChange={(icon) => update({ ...active, icon })}
              />
              <div className="shortcut-position">
                <span>
                  Position {index + 1} of {draft.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move shortcut earlier"
                  disabled={index === 0}
                  onClick={() => move(-1)}
                >
                  <ArrowUp size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move shortcut later"
                  disabled={index === draft.length - 1}
                  onClick={() => move(1)}
                >
                  <ArrowDown size={15} />
                </Button>
              </div>
            </fieldset>
          ) : (
            <p className="shortcut-editor-hint">
              Select a shortcut to edit its name, destination and icon, or add a
              new one.
            </p>
          )}
        </div>
        <Feedback message={message} />
        <div className="shortcut-editor-footer">
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await saveShortcuts(draft, original);
                onClose();
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
