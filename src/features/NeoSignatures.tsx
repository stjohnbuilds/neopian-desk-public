import { signatureDefaults, applyCodeColors } from "../core/account-colors";
import { useState } from "react";
import { Modal } from "../components/Modal";
import { SectionTabs } from "../components/SectionTabs";
import {
  Button,
  CopyButton,
  Feedback,
  Link,
  useAction,
} from "../components/shared";
import { updateStore, useStore } from "../persistence/store";

const variants = [
  ["default", "Default"],
  ["art", "Art"],
] as const;
type Variant = (typeof variants)[number][0];
const fields = [
  ["html", "NeoHTML — above your post"],
  ["signature", "NeoSignature — below your post"],
] as const;
const initial = signatureDefaults;

export function NeoSignatures({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const saved = Object.fromEntries(
    Object.entries(initial).map(([key, value]) => [
      key,
      store.pageCodes?.[key] ??
        applyCodeColors(key, value, store.accountColors),
    ]),
  );
  const [draft, setDraft] = useState(saved);
  const [variant, setVariant] = useState<Variant>("default");
  const [discard, setDiscard] = useState(false);
  const { run, busy, message, setMessage } = useAction();
  const dirtyKeys = Object.keys(initial).filter(
    (key) => draft[key] !== saved[key],
  );
  const close = () => {
    if (busy) return;
    if (dirtyKeys.length) setDiscard(true);
    else onClose();
  };
  return (
    <Modal title="NeoSignatures" onClose={close}>
      <div className="feature-stack">
        <SectionTabs
          label="Signature versions"
          value={variant}
          onChange={setVariant}
          options={variants}
        />
        <p className="muted text-small">
          Save your own NeoHTML and signature. Publishing is a separate step on Neopets.
        </p>
        {fields.map(([field, label]) => {
          const key = `neo-signature:${variant}:${field}`;
          return (
            <div className="feature-stack" key={key}>
              <label htmlFor={`neo-${field}`}>{label}</label>
              <textarea
                id={`neo-${field}`}
                spellCheck={false}
                rows={field === "html" ? 2 : 4}
                value={draft[key]}
                disabled={busy}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, [key]: e.target.value }));
                  setMessage("");
                  setDiscard(false);
                }}
              />
              <div className="actions">
                <CopyButton
                  text={draft[key]}
                  label={`Copy ${field === "html" ? "NeoHTML" : "NeoSignature"}`}
                  visibleLabel={`Copy ${field === "html" ? "NeoHTML" : "NeoSignature"}`}
                />
                <span className="muted text-small">
                  {draft[key].length} characters
                </span>
              </div>
            </div>
          );
        })}
        <div className="actions">
          <Button
            disabled={busy || !dirtyKeys.length}
            onClick={() =>
              void run(
                () =>
                  updateStore((s) => ({
                    ...s,
                    pageCodes: {
                      ...s.pageCodes,
                      ...Object.fromEntries(
                        dirtyKeys.map((key) => [key, draft[key]]),
                      ),
                    },
                  })),
                "Saved in Desk.",
              )
            }
          >
            Save in Desk
          </Button>
          <Button variant="outline" disabled={busy} onClick={close}>
            {dirtyKeys.length ? "Cancel" : "Done"}
          </Button>
          <Link href="https://www.neopets.com/neoboards/preferences.phtml">
            NeoBoard preferences
          </Link>
        </div>
        <Feedback message={message} />
        {discard && dirtyKeys.length > 0 && (
          <div role="alert" className="feature-stack">
            <p>Discard your unsaved signature changes?</p>
            <div className="actions">
              <Button variant="outline" onClick={() => setDiscard(false)}>
                Keep editing
              </Button>
              <Button onClick={onClose}>Discard changes</Button>
            </div>
          </div>
        )}
        <p className="muted text-small">
          Copy each box into its matching field in NeoBoard preferences, then
          preview and save there. Keep neoHTML in the top field: it stands for
          your message. Clearing a box and saving keeps it empty.
        </p>
      </div>
    </Modal>
  );
}
