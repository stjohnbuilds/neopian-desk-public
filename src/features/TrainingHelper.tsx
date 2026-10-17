import { useStore, readLegacy, updateStore } from "../persistence/store";
import {
  emptyTraining,
  syncTraining,
  trainingSchools,
  type School,
} from "../core/training";
import { defaultReminders, type Reminders } from "../core/timers";
import { isNative, nativeMessage } from "../core/bridge";
import { Panel, Button, Feedback, useAction, Link } from "../components/shared";
import { InfoHelp } from "../components/InfoHelp";
import { ScriptSwitch } from "../components/ScriptSwitch";
export function TrainingHelper() {
  const store = useStore();
  const state = store.training ?? emptyTraining();
  const { run, busy, message } = useAction();
  const observed = Object.entries(state.processed) as [School, number][];
  const reminders = readLegacy<Reminders>(
    store,
    "nd_reminders",
    defaultReminders,
  );
  const timers = reminders.timers.filter(
    (t) => t.id.startsWith("training-") && t.dueAt > Date.now() - 600000,
  );
  return (
    <Panel
      title="Training Helper"
      actions={
        <InfoHelp title="Training timers">
          <p>
            Install Training Helper from Tampermonkey scripts by replacing V5,
            then use its Connect menu once. Your existing stats and inventory
            observations stay in the browser.
          </p>
          <p>
            Opening a school’s Status page sends its current courses to Desk.
            Each group spans at most 45 minutes; its timer finishes when the
            last pet is ready. Crossed-out times are ignored.
          </p>
          <p>
            Removing a timer keeps those courses dismissed on later syncs.
            Timers persist when Desk closes; keep Desk open for alerts.
            Inventory quantities are last observed, not guaranteed current
            stock.
          </p>
        </InfoHelp>
      }
    >
      <div className="tool-row">
        <div>
          <strong>Automatic training timers</strong>
          <p className="muted text-small">
            Create and update timers from received courses. Turning this off
            keeps existing timers.
          </p>
        </div>
        <ScriptSwitch
          label="Automatic training timers"
          checked={state.enabled}
          disabled={busy}
          onChange={(enabled) => {
            void run(() =>
              updateStore((s) => {
                const old = readLegacy<Reminders>(
                  s,
                  "nd_reminders",
                  defaultReminders,
                );
                const synced = syncTraining(
                  { ...(s.training ?? emptyTraining()), enabled },
                  old.timers,
                  Object.values(s.native.browser.training ?? {}),
                );
                return {
                  ...s,
                  training: synced.state,
                  legacy: {
                    ...s.legacy,
                    nd_reminders: JSON.stringify({
                      ...old,
                      timers: synced.timers,
                    }),
                  },
                };
              }),
            );
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!isNative() || busy}
          onClick={() =>
            void run(async () =>
              nativeMessage("deskBrowser", { action: "status" }),
            )
          }
        >
          Retry sync
        </Button>
      </div>
      {!observed.length ? (
        <p className="panel-note muted">
          No courses received yet. Connect the browser script, then open your
          school’s Status page.
        </p>
      ) : (
        <div className="panel-note">
          {observed.map(([school, seen]) => (
            <p className="muted text-small" key={school}>
              {trainingSchools[school].name} · last read{" "}
              {new Date(seen).toLocaleString()}
            </p>
          ))}
        </div>
      )}
      {timers.map((t) => (
        <div className="tool-row" key={t.id}>
          <div>
            <strong>{t.title}</strong>
            <p className="muted text-small">
              {new Date(t.dueAt).toLocaleString()}
            </p>
          </div>
          <Link href={t.url}>Status</Link>
        </div>
      ))}
      {observed.length > 0 && !timers.length && (
        <p className="panel-note muted">
          {state.enabled
            ? "No pending training timers. Completed or dismissed courses stay quiet."
            : "Automatic timers are off."}
        </p>
      )}
      <div className="panel-note actions">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("desk-open-timers"))
          }
        >
          Manage timers
        </Button>
      </div>
      <Feedback message={message} />
    </Panel>
  );
}
