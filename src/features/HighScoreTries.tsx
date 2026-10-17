import { useEffect, useRef, useState } from "react";
import {
  avatarEntries,
  isCollected,
  withAvatarCollected,
} from "../core/avatars";
import {
  avatarForGameURL,
  readScoreTries,
  scorePresets,
  scoreTryKey,
  scoreBoardURL,
  withScoreTries,
  withScoreAttempt,
  type ScoreTry,
} from "../core/high-score-tries";
import { usePacificDay } from "../core/usePacificDay";
import { updateStore, useStore } from "../persistence/store";
import { Button, Panel, Feedback, Link, useAction } from "../components/shared";
import { Modal } from "../components/Modal";
const blank = (): ScoreTry => ({
  id: crypto.randomUUID(),
  name: "",
  url: "",
  avatarId: "",
  goal: "Earn a trophy",
  tried: "",
});
export function HighScoreTries() {
  const store = useStore(),
    today = usePacificDay(),
    list = readScoreTries(store.legacy);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeEditor = () => {
    setEditing(null);
    setTimeout(() => {
      const target = opener.current;
      if (target?.isConnected) target.focus();
      else if (target?.id) document.getElementById(target.id)?.focus();
    }, 0);
  };
  const [editing, setEditing] = useState<{
    game: ScoreTry;
    original?: ScoreTry;
  } | null>(null);
  const [removed, setRemoved] = useState<{
    game: ScoreTry;
    index: number;
  } | null>(null);
  const { run, message, busy } = useAction();
  return (
    <Panel title={`Your trophy games · ${list.games.length}`}>
      <div className="panel-body">
        <p className="muted text-small">
          Your chosen trophy games. Tried today resets at midnight Pacific; the
          game stays until you remove it. Send your score in Neopets to submit
          it to the board. Trophy positions change—an avatar target is not a
          trophy cutoff.
        </p>
        <Button
          id="add-trophy-game"
          variant="outline"
          onClick={(event) => {
            opener.current = event.currentTarget;
            setEditing({ game: blank() });
          }}
        >
          Add game
        </Button>
        {!list.games.length && (
          <p>No games yet. Add a game you want to practise for a trophy.</p>
        )}
        <div className="checklist">
          {list.games.map((game) => {
            const avatar = avatarEntries.find((e) => e.id === game.avatarId),
              board = scoreBoardURL(game.url);
            return (
              <section
                key={game.id}
                className="avatar-daily-activity"
                aria-label={`${game.name} trophy goal`}
              >
                <div className="actions avatar-daily-heading">
                  <strong>{game.name}</strong>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      aria-label={`Tried ${game.name} for a trophy today`}
                      checked={game.tried === today}
                      disabled={busy}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        void run(
                          () =>
                            updateStore((s) => ({
                              ...s,
                              legacy: withScoreAttempt(
                                s.legacy,
                                game.id,
                                today,
                                checked,
                              ),
                            })),
                          checked
                            ? "Trophy attempt saved"
                            : "Trophy attempt cleared",
                        );
                      }}
                    />
                    Tried today
                  </label>
                </div>
                {game.goal && <p>{game.goal}</p>}
                {avatar ? (
                  <div className="avatar-daily-target">
                    <p>
                      <strong>Avatar: {avatar.name}</strong> · {avatar.detail}
                    </p>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        aria-label={`Collected ${avatar.name} from trophy list`}
                        checked={isCollected(store.legacy, avatar)}
                        disabled={busy}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          void run(
                            () =>
                              updateStore((s) => ({
                                ...s,
                                legacy: withAvatarCollected(
                                  s.legacy,
                                  avatar,
                                  checked,
                                ),
                              })),
                            "Avatar collection updated",
                          );
                        }}
                      />
                      Avatar collected
                    </label>
                  </div>
                ) : (
                  <p className="muted text-small">
                    No avatar linked. Use Edit to link an avatar and show its
                    requirement.
                  </p>
                )}
                <div className="actions">
                  <Link href={game.url}>Open game</Link>
                  {board && <Link href={board}>High-score board</Link>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setEditing({ game: { ...game }, original: game });
                    }}
                    id={`edit-trophy-${game.id}`}
                    aria-label={`Edit ${game.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    aria-label={`Remove ${game.name}`}
                    onClick={() =>
                      void run(async () => {
                        let removedRow: typeof removed = null;
                        await updateStore((s) => {
                          const current = readScoreTries(s.legacy),
                            index = current.games.findIndex(
                              (g) => g.id === game.id,
                            );
                          if (index >= 0)
                            removedRow = { game: current.games[index], index };
                          return {
                            ...s,
                            legacy: withScoreTries(s.legacy, {
                              ...current,
                              games: current.games.filter(
                                (g) => g.id !== game.id,
                              ),
                            }),
                          };
                        });
                        setRemoved(removedRow);
                      }, `${game.name} removed from trophy tries`)
                    }
                  >
                    Remove
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
        {removed && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await updateStore((s) => {
                  const current = readScoreTries(s.legacy);
                  if (current.games.some((g) => g.id === removed.game.id))
                    throw Error("This game is already in the list.");
                  const games = [...current.games];
                  games.splice(removed.index, 0, removed.game);
                  return {
                    ...s,
                    legacy: withScoreTries(s.legacy, { ...current, games }),
                  };
                });
                setRemoved(null);
              }, "Game restored")
            }
          >
            Undo removal
          </Button>
        )}
        <Feedback message={message} />
        {editing && (
          <ScoreEditor
            game={editing.game}
            original={editing.original}
            onClose={closeEditor}
          />
        )}
      </div>
    </Panel>
  );
}
function ScoreEditor({
  game,
  original,
  onClose,
}: {
  game: ScoreTry;
  original?: ScoreTry;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(game),
    { run, message, busy } = useAction(),
    field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => field.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <Modal
      title={original ? "Edit trophy game" : "Add trophy game"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="feature-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await updateStore((s) => {
              const current = readScoreTries(s.legacy);
              if (
                original &&
                JSON.stringify(
                  current.games.find((g) => g.id === original.id),
                ) !== JSON.stringify(original)
              )
                throw Error(
                  "This game changed while editing. Cancel and reopen it to keep the newer changes.",
                );
              const row = {
                ...draft,
                name: draft.name.trim(),
                url: draft.url.trim(),
                goal: draft.goal.trim(),
              };
              return {
                ...s,
                legacy: withScoreTries(s.legacy, {
                  ...current,
                  games: original
                    ? current.games.map((g) => (g.id === row.id ? row : g))
                    : [...current.games, row],
                }),
              };
            });
            onClose();
          });
        }}
      >
        {!original && (
          <label className="field">
            <span>Start from a game</span>
            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                const preset = scorePresets.find(
                  (g) => g.name === e.target.value,
                );
                if (preset) setDraft({ ...draft, ...preset });
              }}
            >
              <option value="">Custom game</option>
              {scorePresets.map((g) => (
                <option key={g.name}>{g.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Game name</span>
          <input
            ref={field}
            required
            maxLength={100}
            disabled={busy}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Game link</span>
          <input
            type="url"
            required
            maxLength={2000}
            disabled={busy}
            value={draft.url}
            onChange={(e) =>
              setDraft({
                ...draft,
                url: e.target.value,
                avatarId: avatarForGameURL(e.target.value)?.id || "",
              })
            }
          />
        </label>
        <label className="field">
          <span>Trophy goal or notes</span>
          <input
            maxLength={300}
            disabled={busy}
            value={draft.goal}
            onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Associated avatar</span>
          <select
            disabled={busy}
            value={draft.avatarId}
            onChange={(e) => setDraft({ ...draft, avatarId: e.target.value })}
          >
            <option value="">No avatar linked</option>
            {avatarEntries
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </label>
        {draft.avatarId && (
          <p>{avatarEntries.find((e) => e.id === draft.avatarId)?.detail}</p>
        )}
        <Feedback message={message} />
        <div className="actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save game"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
