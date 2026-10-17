import { useEffect } from "react";
import { useStore, readLegacy, updateStore } from "../persistence/store";
import { defaultReminders, type Reminders } from "../core/timers";
import { nativeMessage, isNative } from "../core/bridge";
import { Button, Panel, Feedback, useAction } from "../components/shared";
export interface NotificationState {
  enabled: boolean;
  permission: string;
  error?: string;
  scheduledCount?: number;
}
export function NotificationPreferences({
  state,
}: {
  state: NotificationState;
}) {
  const { run, message, busy, setMessage } = useAction();
  useEffect(() => {
    const delivered = (e: Event) =>
      setMessage(String((e as CustomEvent).detail.title));
    window.addEventListener("desk-reminder-fired", delivered);
    return () => window.removeEventListener("desk-reminder-fired", delivered);
  }, []);
  const store = useStore();
  const reminders = readLegacy<Reminders>(
    store,
    "nd_reminders",
    defaultReminders,
  );
  return (
    <Panel title="Desktop notifications">
      <div className="panel-note feature-stack">
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={!isNative()}
            checked={state.enabled}
            onChange={(e) =>
              void run(async () =>
                nativeMessage("deskReminders", {
                  action: "enable",
                  enabled: e.target.checked,
                }),
              )
            }
          />
          Desktop banners and sounds
        </label>
        <p className="muted text-small">
          {state.permission === "allowed"
            ? "Notification permission is allowed."
            : state.permission === "denied"
              ? "Notification permission is denied. Enable Neopian Desk in Windows Settings → System → Notifications."
              : "Turn this on to request Notification permission."}{" "}
          Keep Desk open for alerts.{" "}
          {state.scheduledCount !== undefined &&
            `${state.scheduledCount} reminders are registered with the desktop scheduler.`}
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!!reminders.preferences.snowager}
            disabled={busy}
            onChange={(e) => {
              const enabled = e.target.checked;
              void run(
                () =>
                  updateStore((s) => {
                    const current = readLegacy<Reminders>(
                      s,
                      "nd_reminders",
                      defaultReminders,
                    );
                    return {
                      ...s,
                      legacy: {
                        ...s.legacy,
                        nd_reminders: JSON.stringify({
                          ...current,
                          preferences: {
                            ...current.preferences,
                            snowager: enabled,
                          },
                        }),
                      },
                    };
                  }),
                "Snowager preference saved",
              );
            }}
          />
          Snowager sleep windows
        </label>
        <p className="muted text-small">
          6am, 2pm and 10pm Neopets time. One alert per window while Desk is
          open; regular alerts pause during winter hibernation.
          {!state.enabled && " Turn on Desktop banners above to receive them."}
        </p>
        <p className="muted text-small">
          Saved timers, petpet targets, calendar dates and enabled avatar
          reminders are included automatically. These use saved times, not live
          checks of Neopets.
        </p>
        <Button
          variant="outline"
          disabled={
            !isNative() || !state.enabled || state.permission !== "allowed"
          }
          onClick={() =>
            void run(
              async () => nativeMessage("deskReminders", { action: "test" }),
              "Test notification requested.",
            )
          }
        >
          Test notification
        </Button>
        <Feedback message={state.error || message} />
      </div>
    </Panel>
  );
}
