import { useState } from "react";
import { Modal } from "../components/Modal";
import { Button, Feedback, useAction } from "../components/shared";
import { updateStore } from "../persistence/store";
import {
  readWardrobe,
  wardrobeKey,
  validWardrobe,
  type WardrobeItem,
} from "../core/wardrobe";
export function WardrobeEditor({
  item,
  onClose,
}: {
  item?: WardrobeItem;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<WardrobeItem>(
    item ?? { n: "", l: "F", q: 1 },
  );
  const [remove, setRemove] = useState(false),
    [discard, setDiscard] = useState(false);
  const { run, busy, message } = useAction();
  const close = () => {
    if (!busy) {
      if (
        JSON.stringify(draft) !==
        JSON.stringify(item ?? { n: "", l: "F", q: 1 })
      )
        setDiscard(true);
      else onClose();
    }
  };
  async function save(deleting = false) {
    await updateStore((s) => {
      const current = readWardrobe(s.legacy);
      const old = item && current.find((i) => i.n === item.n && i.l === item.l);
      if (item && JSON.stringify(old) !== JSON.stringify(item))
        throw Error(
          "This item changed elsewhere. Reopen its editor before saving.",
        );
      const next = current.filter(
        (i) => !(item && i.n === item.n && i.l === item.l),
      );
      if (!deleting) next.push({ ...draft, n: draft.n.trim() });
      if (!validWardrobe(next))
        throw Error(
          "Use a unique item and list, a whole quantity above zero, and a valid estimate.",
        );
      return {
        ...s,
        legacy: { ...s.legacy, [wardrobeKey]: JSON.stringify(next) },
      };
    });
    onClose();
  }
  return (
    <Modal
      title={item ? "Edit collection item" : "Add collection item"}
      onClose={close}
    >
      <form
        className="feature-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => save());
        }}
      >
        <label>
          Item name
          <input
            required
            maxLength={200}
            value={draft.n}
            onChange={(e) => setDraft({ ...draft, n: e.target.value })}
          />
        </label>
        <label>
          List
          <select
            value={draft.l}
            onChange={(e) =>
              setDraft({ ...draft, l: e.target.value as "F" | "U" })
            }
          >
            <option value="F">For me</option>
            <option value="U">Up for trade</option>
          </select>
        </label>
        <label>
          Quantity
          <input
            required
            type="number"
            min={1}
            max={1000000}
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.valueAsNumber })}
          />
        </label>
        <label>
          Saved NP estimate (optional)
          <input
            type="number"
            min={0}
            max={2000000000}
            value={draft.np ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                np: e.target.value === "" ? undefined : e.target.valueAsNumber,
              })
            }
          />
        </label>
        <label>
          Saved NC estimate in caps (optional)
          <input
            maxLength={80}
            value={draft.caps ?? ""}
            onChange={(e) => setDraft({ ...draft, caps: e.target.value })}
            placeholder="For example, 2–3"
          />
        </label>
        <label>
          Estimate date (optional)
          <input
            type="date"
            value={draft.pricedOn ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, pricedOn: e.target.value || undefined })
            }
          />
        </label>
        <div className="actions">
          <Button type="submit" disabled={busy}>
            Save item
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </Button>
          {item && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setRemove(true)}
            >
              Remove item
            </Button>
          )}
        </div>
        {remove && (
          <div role="alert">
            <p>Remove this entry from your list?</p>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void run(() => save(true))}
            >
              Confirm removal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRemove(false)}
            >
              Keep item
            </Button>
          </div>
        )}
        {discard && (
          <div role="alert">
            <p>Discard your unsaved changes?</p>
            <Button type="button" onClick={onClose}>
              Discard changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscard(false)}
            >
              Keep editing
            </Button>
          </div>
        )}
        <Feedback message={message} />
      </form>
    </Modal>
  );
}
