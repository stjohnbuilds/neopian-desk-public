import { useState } from "react";
import { useStore, updateStore } from "../persistence/store";
import { applyCodeColors } from "../core/account-colors";
import {
  Button,
  Panel,
  Link,
  CopyButton,
  Feedback,
  useAction,
} from "../components/shared";
import { Modal } from "../components/Modal";
import { AccountColors } from "./AccountColors";
import { NeoSignatures } from "./NeoSignatures";
interface Page {
  key: string;
  title: string;
  edit: string;
}
export function PersonalPages() {
  const store = useStore(),
    [selected, setSelected] = useState<Page | null>(null),
    [signatures, setSignatures] = useState(false);
  const lookup = {
    key: "user-lookup",
    title: "User lookup",
    edit: "https://www.neopets.com/userinfo.phtml",
  };
  const pages = [
    lookup,
    ...store.profile.pets.flatMap((p) => [
      {
        key: `pet:${p.toLowerCase()}`,
        title: `${p} · petpage`,
        edit: `https://www.neopets.com/editpage.phtml?pet_name=${encodeURIComponent(p)}`,
      },
      {
        key: `pet-lookup:${p.toLowerCase()}`,
        title: `${p} · lookup`,
        edit: `https://www.neopets.com/neopet_desc.phtml?edit_petname=${encodeURIComponent(p)}`,
      },
    ]),
  ];
  return (
    <div className="feature-stack">
      <AccountColors />
      <Panel title="Your page editors">
        <p className="panel-note">
          Keep your own HTML here. Save and copy use the exact same code.
          Publishing happens only when you paste and save it on Neopets.
        </p>
        <div className="checklist">
          {pages.map((p) => (
            <div className="checklist-row" key={p.key}>
              <strong>{p.title}</strong>
              <Button variant="outline" onClick={() => setSelected(p)}>
                Edit code
              </Button>
              <Link href={p.edit}>Open Neopets editor</Link>
            </div>
          ))}
        </div>
        {!store.profile.pets.length && (
          <p className="panel-note">
            Add your pet names in Settings to get a page and lookup editor for
            each pet.
          </p>
        )}
        <div className="actions panel-note">
          <Button variant="outline" onClick={() => setSignatures(true)}>
            NeoSignatures
          </Button>
        </div>
      </Panel>
      {selected && (
        <PageEditor
          key={selected.key}
          page={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {signatures && <NeoSignatures onClose={() => setSignatures(false)} />}
    </div>
  );
}
function PageEditor({ page, onClose }: { page: Page; onClose: () => void }) {
  const store = useStore();
  const initial = store.pageCodes?.[page.key] ?? "";
  const [baseline, setBaseline] = useState(initial),
    [draft, setDraft] = useState(initial),
    [discard, setDiscard] = useState(false),
    [preview, setPreview] = useState(false);
  const { run, busy, message } = useAction();
  const close = () => {
    if (!busy) {
      if (draft !== baseline) setDiscard(true);
      else onClose();
    }
  };
  return (
    <Modal title={page.title} onClose={close}>
      <div className="feature-stack">
        <label>
          Page HTML
          <textarea
            aria-label="Page HTML"
            rows={16}
            value={draft}
            maxLength={1000000}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <div className="actions">
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await updateStore((s) => {
                  if ((s.pageCodes?.[page.key] ?? "") !== baseline)
                    throw Error(
                      "This page changed elsewhere. Copy your draft before reopening it.",
                    );
                  return {
                    ...s,
                    pageCodes: { ...s.pageCodes, [page.key]: draft },
                  };
                });
                setBaseline(draft);
              }, "Code saved.")
            }
          >
            Save code
          </Button>
          <CopyButton
            text={baseline}
            label="Copy saved code"
            visibleLabel="Copy saved code"
          />
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              setDraft(applyCodeColors(page.key, draft, store.accountColors))
            }
          >
            Apply saved palette
          </Button>
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            {preview ? "Hide preview" : "Preview"}
          </Button>
          <Button variant="outline" disabled={busy} onClick={close}>
            Close
          </Button>
        </div>
        {draft !== baseline && (
          <p role="status">
            Unsaved changes. Copy saved code uses your last saved version.
          </p>
        )}
        {preview && (
          <iframe
            title="Page preview"
            sandbox=""
            srcDoc={
              "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src https: data:;\">" +
              draft
            }
            style={{ width: "100%", height: 360, border: "1px solid #ccc" }}
          />
        )}
        <Link href={page.edit}>Open Neopets editor</Link>
        <Feedback message={message} />
        {discard && (
          <div role="alert">
            <p>Discard the unsaved changes?</p>
            <div className="actions">
              <Button variant="outline" onClick={() => setDiscard(false)}>
                Keep editing
              </Button>
              <Button onClick={onClose}>Discard changes</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
