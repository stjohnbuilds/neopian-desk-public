import { useEffect, useState } from "react";
import { emptyProfile, validateProfile } from "../core/profile";
import { updateStore, useStore } from "../persistence/store";
import { Panel, Button, Feedback, useAction } from "../components/shared";
export function ProfileSettings() {
  const { profile } = useStore();
  const [draft, setDraft] = useState(profile ?? emptyProfile());
  const [pets, setPets] = useState(profile.pets.join("\n"));
  const { run, busy, message } = useAction();
  useEffect(() => {
    setDraft(profile);
    setPets(profile.pets.join("\n"));
  }, [profile.account, profile.closetURL, profile.pets.join("\n")]);
  return (
    <Panel title="Your account and pets">
      <form
        className="form-grid panel-note"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const next = {
              ...draft,
              account: draft.account.trim().toLowerCase(),
              pets: pets
                .split(/[\n,]/)
                .map((n) => n.trim())
                .filter(Boolean),
            };
            validateProfile(next);
            await updateStore((s) => ({ ...s, profile: next }));
            setDraft(next);
            setPets(next.pets.join("\n"));
          }, "Account settings saved.");
        }}
      >
        <label>
          Neopets username
          <input
            value={draft.account}
            disabled={busy || !!profile.account}
            maxLength={50}
            onChange={(e) => setDraft({ ...draft, account: e.target.value })}
            autoComplete="off"
          />
        </label>
        <p className="muted text-small">
          No password is needed. Browser trackers accept records only for this
          account. Dailies work without an account. Check the username before
          saving: it stays locked to prevent mixing accounts.
        </p>
        <label>
          Pet names, one per line
          <textarea
            rows={4}
            value={pets}
            disabled={busy}
            onChange={(e) => setPets(e.target.value)}
          />
        </label>
        <label>
          Dress to Impress closet address
          <input
            type="url"
            value={draft.closetURL}
            disabled={busy}
            onChange={(e) => setDraft({ ...draft, closetURL: e.target.value })}
            placeholder="https://impress.openneo.net/…"
          />
        </label>
        <div className="actions">
          <Button type="submit" disabled={busy}>
            Save settings
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setDraft(profile);
              setPets(profile.pets.join("\n"));
            }}
          >
            Cancel changes
          </Button>
        </div>
        <Feedback message={message} />
      </form>
    </Panel>
  );
}
