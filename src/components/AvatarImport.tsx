import { useEffect, useRef, useState } from "react";
import {
  parseAvatarPicker,
  reviewAvatarImport,
  mergeAvatarImport,
  undoAvatarImport,
  type PickerAvatar,
  type ImportUndo,
  type AvatarImport as SavedImport,
} from "../core/avatar-import";
import { useStore, readLegacy, updateStore } from "../persistence/store";
import { Modal } from "./Modal";
import { Button, Link, Disclosure, Feedback, useAction } from "./shared";
export function AvatarImport() {
  const store = useStore();
  const [open, setOpen] = useState(false),
    [source, setSource] = useState("");
  const [parsed, setParsed] = useState<PickerAvatar[] | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [undo, setUndo] = useState<ImportUndo | null>(null);
  const { run, message, busy, setMessage } = useAction();
  const trigger = useRef<HTMLButtonElement>(null);
  const sourceField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => sourceField.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const review = parsed
    ? reviewAvatarImport(
        store.legacy,
        parsed.filter((r) => !excluded.includes(r.code)),
      )
    : null;
  const saved = readLegacy<SavedImport>(store, "nd_avatar_import", {
    version: 1,
    entries: [],
  });
  const unmatched = reviewAvatarImport(store.legacy, saved.entries).unmatched;
  const close = () => {
    if (busy) return;
    setOpen(false);
    setSource("");
    setParsed(null);
    setExcluded([]);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <div className="actions">
        <Button
          ref={trigger}
          variant="outline"
          onClick={() => {
            setMessage("");
            setOpen(true);
          }}
        >
          Paste avatar source
        </Button>
        {undo && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await updateStore((s) => ({
                  ...s,
                  legacy: undoAvatarImport(s.legacy, undo),
                }));
                setUndo(null);
              }, "Avatar import undone")
            }
          >
            Undo last avatar import
          </Button>
        )}
      </div>
      {!open && <Feedback message={message} />}
      {unmatched.length > 0 && (
        <Disclosure
          title={`Imported avatars awaiting a catalogue match · ${unmatched.length}`}
        >
          <p>
            These exact codes are saved without assigning them to another
            avatar.
          </p>
          {unmatched.map((r) => (
            <p key={r.code}>
              {r.name} · <code>{r.code}</code>
            </p>
          ))}
        </Disclosure>
      )}
      {open && (
        <Modal title="Import collected avatars" onClose={close}>
          <div className="feature-stack">
            <p>
              Open{" "}
              <Link href="https://www.neopets.com/settings/neoboards">
                Neoboard Settings
              </Link>
              , view the page source, copy it all, then paste below. Include
              Your Avatars and Secret Avatars.
            </p>
            <label>
              Neoboard Settings HTML
              <textarea
                ref={sourceField}
                rows={7}
                value={source}
                disabled={busy}
                spellCheck={false}
                onChange={(e) => {
                  setSource(e.target.value);
                  setParsed(null);
                  setExcluded([]);
                  setMessage("");
                }}
              />
            </label>
            <div className="actions">
              <label className="file-button">
                Choose source file
                <input
                  type="file"
                  accept=".html,.htm,.txt"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void run(async () => {
                      if (file.size > 2_000_000)
                        throw Error(
                          "The source is too large. Choose a file under 2 MB.",
                        );
                      const text = await file.text();
                      setSource(text);
                      setParsed(null);
                      setExcluded([]);
                      setMessage("");
                    });
                  }}
                />
              </label>
              <Button
                disabled={busy || !source.trim()}
                onClick={() =>
                  void run(async () => {
                    setParsed(parseAvatarPicker(source));
                    setExcluded([]);
                  })
                }
              >
                Review avatars
              </Button>
              <Button variant="ghost" disabled={busy} onClick={close}>
                Cancel
              </Button>
            </div>
            {review && (
              <section
                aria-label="Avatar import preview"
                className="feature-stack"
              >
                <strong>
                  {review.added.length} to add · {review.existing.length}{" "}
                  already collected
                </strong>
                <p>
                  {review.standard.length} standard/default avatars and{" "}
                  {review.nonCounting.length} non-counting avatars excluded from
                  collectible tracking. {review.unmatched.length} unmatched
                  secret avatars will be saved for review.
                </p>
                <p>
                  Existing collected marks, attempt dates and tickets are kept.
                  Missing avatars are not removed. Your account total stays as
                  entered.
                </p>
                <Disclosure
                  title={`Review secret avatars · ${parsed!.filter((r) => r.kind === "secret").length}`}
                >
                  {parsed!
                    .filter((r) => r.kind === "secret")
                    .map((r) => (
                      <label className="checkbox-label" key={r.code}>
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={!excluded.includes(r.code)}
                          onChange={(e) =>
                            setExcluded((old) =>
                              e.target.checked
                                ? old.filter((c) => c !== r.code)
                                : [...old, r.code],
                            )
                          }
                        />
                        {r.name} ·{" "}
                        {excluded.includes(r.code)
                          ? "Excluded"
                          : r.code === "ncmall"
                            ? "Not counted"
                            : review.matches.some((m) => m.row.code === r.code)
                              ? "Matched"
                              : "Unmatched"}
                      </label>
                    ))}
                </Disclosure>
                <Button
                  disabled={busy || !review.secret.length}
                  onClick={() =>
                    void run(async () => {
                      let snapshot!: ImportUndo;
                      let added = 0;
                      await updateStore((s) => {
                        const result = mergeAvatarImport(
                          s.legacy,
                          parsed!.filter((r) => !excluded.includes(r.code)),
                        );
                        snapshot = { before: s.legacy, after: result.legacy };
                        added = result.review.added.length;
                        return { ...s, legacy: result.legacy };
                      });
                      if (
                        Object.keys(snapshot.after).some(
                          (key) => snapshot.before[key] !== snapshot.after[key],
                        )
                      )
                        setUndo(snapshot);
                      setParsed(null);
                      setSource("");
                      setOpen(false);
                      setMessage(
                        `Import saved · ${added} newly collected avatars.`,
                      );
                      requestAnimationFrame(() => trigger.current?.focus());
                    })
                  }
                >
                  {busy ? "Saving…" : "Import collected avatars"}
                </Button>
              </section>
            )}
            <Feedback message={message} />
          </div>
        </Modal>
      )}
    </>
  );
}
