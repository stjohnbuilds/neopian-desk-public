import { isAvatarCollected } from "../core/avatars";
import { mergeAlbums } from "../core/collections";
import {
  emptyTraining,
  syncTraining,
  type TrainingSnapshot,
} from "../core/training";
import { calendarReminders } from "../core/calendar-reminders";
import { DeskSearch } from "../components/DeskSearch";
import { QuickLinks } from "../components/QuickLinks";
import { CountdownPills } from "../components/CountdownPills";
import birthdays from "../data/birthdays.json";
import { day } from "../core/utils";
import {
  activeNotices,
  birthdayReminders,
  type AvatarProgress,
} from "../core/notices";
import type { NotificationState } from "../features/NotificationPreferences";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Trophy,
  Sparkles,
  Wrench,
  CalendarDays,
  Bell,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  useStore,
  useStorageStatus,
  updateStore,
  readLegacy,
  setLegacy,
} from "../persistence/store";
import { isNative, nativeMessage } from "../core/bridge";
import { accounting } from "../core/accounting";
import {
  countdown,
  defaultReminders,
  timerPresets,
  reminderSchedule,
  startTimer,
  type Reminders,
} from "../core/timers";
import {
  Button,
  PageTitle,
  Feedback,
  Link,
  useAction,
} from "../components/shared";
import { Modal } from "../components/Modal";
import { Dailies } from "../features/Dailies";
import { Items } from "../features/Items";
import { Profit } from "../features/Profit";
import { Achievements } from "../features/Achievements";
import { Personalization } from "../features/Personalization";
import type { HelperState } from "../core/shop-helper";
import { Tools } from "../features/Tools";
import { Calendar } from "../features/Calendar";
import { Settings } from "../features/Settings";
import { navigate, useNavigation } from "./useNavigation";
const destinations = [
  { id: "dailies", label: "Dailies", icon: LayoutDashboard },
  { id: "profit", label: "Profits", icon: TrendingUp },
  { id: "achievements", label: "Trophy", icon: Trophy },
  { id: "items", label: "Items", icon: Package },
  { id: "personalization", label: "Personalization", icon: Sparkles },
  { id: "tools", label: "Tools", icon: Wrench },
] as const;
export function App() {
  const store = useStore(),
    storageStatus = useStorageStatus();
  const { page: view } = useNavigation();
  const [collapsed, setCollapsed] = useState(false),
    [modal, setModal] = useState("");
  const [helper, setHelper] = useState<HelperState>({ enabled: false }),
    [notifications, setNotifications] = useState<NotificationState>({
      enabled: false,
      permission: "notAsked",
    });
  const [now, setNow] = useState(Date.now());
  const [preset, setPreset] = useState(0),
    [minutes, setMinutes] = useState(30);
  const { run, message, busy, setMessage } = useAction();
  useEffect(() => {
    setMessage("");
  }, [modal]);
  const reminders = readLegacy<Reminders>(
    store,
    "nd_reminders",
    defaultReminders,
  );
  const active = reminders.timers.filter((t) => t.dueAt > now);
  const today = day(new Date(now));
  const notices = [
    ...activeNotices(reminders.timers, now),
    ...birthdayReminders(
      readLegacy<Record<string, string>>(store, "nd_pet_birthdays", birthdays),
      readLegacy<AvatarProgress>(store, "nd_avatar_tasks", {}),
      today.slice(0, 4),
    )
      .filter(
        (b) =>
          b.date === today &&
          !isAvatarCollected(store.legacy, "nd_avatar_tasks", "bank-birthday"),
      )
      .map((b) => ({ ...b, id: "birthday-" + b.title })),
  ];
  const due = reminders.timers.filter(
    (t) => t.dueAt <= now && t.dueAt > now - 600_000,
  );
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (isNative() && !window.deskInitialState)
      void updateStore((s) => s).catch(() => {});
    const helperEvent = (e: Event) => setHelper((e as CustomEvent).detail);
    const notificationEvent = (e: Event) =>
      setNotifications((e as CustomEvent).detail);
    const calendar = () => setModal("calendar");
    const openHelper = () => {
      navigate({ page: "tools", tools: "app" });
    };
    const actionReport = (e: Event) =>
      setMessage(String((e as CustomEvent).detail.message));
    const bindings: [string, EventListener][] = [
      ["desk-shops-opened", actionReport],
      ["desk-open-shop-helper", openHelper],
      ["desk-shop-helper-state", helperEvent],
      ["desk-notification-state", notificationEvent],
      ["desk-open-calendar", calendar],
      ["desk-open-timers", () => setModal("timers")],
      ["desk-open-settings", () => setModal("settings")],
    ];
    bindings.forEach(([name, fn]) => window.addEventListener(name, fn));
    // Native startup can publish before React mounts; request fresh status
    // only after the listener exists so script controls reflect the running helper.
    if (isNative()) {
      nativeMessage("deskShopHelper", { action: "status" });
      nativeMessage("deskReminders", { action: "status" });
    }
    return () =>
      bindings.forEach(([name, fn]) => window.removeEventListener(name, fn));
  }, []);
  useEffect(() => {
    if (isNative())
      nativeMessage("deskReminders", {
        action: "sync",
        reminders: [
          ...reminderSchedule(reminders, store.legacy),
          ...calendarReminders(store.legacy, today),
        ],
      });
  }, [store.legacy, today]);
  const removeTimer = (id: string) =>
    setLegacy("nd_reminders", {
      ...reminders,
      timers: reminders.timers.filter((t) => t.id !== id),
    });
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div className="brand-text">
            <strong>Neopian Desk</strong>
            <span>Windows edition</span>
          </div>
        </div>
        <span className="nav-label">YOUR DESK</span>
        <nav aria-label="Main navigation">
          {destinations.map((d) => (
            <button
              key={d.id}
              aria-current={view === d.id ? "page" : undefined}
              title={d.label}
              onClick={() => navigate({ page: d.id })}
            >
              <d.icon size={18} />
              <span>{d.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button aria-label="Settings & backups" title="Settings & backups" onClick={() => setModal("settings")}>
            <SettingsIcon size={17} />
            <span>Settings & backups</span>
          </button>
          <div className="profile">
            <span className="avatar">{(store.profile.account || "N").slice(0,1).toUpperCase()}</span>
            <div>
              <strong>{store.profile.account || "Your desk"}</strong>
              <small>Personal workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <span className="breadcrumb">
            Your desk <span>/</span>{" "}
            <strong>{destinations.find((d) => d.id === view)?.label}</strong>
          </span>
          <div className="header-actions">
            <DeskSearch />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Timers"
              title="Set or manage timers"
              onClick={() => setModal("timers")}
            >
              <TimerIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open calendar"
              onClick={() => setModal("calendar")}
            >
              <CalendarDays />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
              className={notices.length ? "notice-active" : undefined}
              title={
                notices.length
                  ? `${notices.length} active notices`
                  : "No active notices"
              }
              onClick={() => setModal("notifications")}
            >
              <Bell />
            </Button>
            <div className="header-tools">
              <QuickLinks />
            </div>
          </div>
        </header>
        <CountdownPills timers={active} now={now} />
        <main>
          {view !== "personalization" && (
            <PageTitle title={destinations.find((d) => d.id === view)!.label} />
          )}
          {storageStatus && (
            <div
              role="status"
              className={
                storageStatus === "Saving…" ? "save-progress" : "error-banner"
              }
            >
              {storageStatus}
            </div>
          )}
          {due.map((t) => (
            <div className="due-banner" key={t.id}>
              <strong>{t.title} is ready</strong>
              <Link href={t.url}>Open</Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => run(() => removeTimer(t.id))}
              >
                Dismiss
              </Button>
            </div>
          ))}
          {view === "dailies" ? (
            <Dailies />
          ) : view === "items" ? (
            <Items />
          ) : view === "profit" ? (
            <Profit />
          ) : view === "achievements" ? (
            <Achievements />
          ) : view === "tools" ? (
            <Tools helper={helper} />
          ) : (
            <Personalization />
          )}
          {!modal && <Feedback message={message} />}
        </main>
      </div>
      {modal && (
        <Modal
          title={
            {
              calendar: "Calendar",
              timers: "Your timers",
              settings: "Settings & backups",
              notifications: "Notifications",
            }[modal] || modal
          }
          onClose={() => setModal("")}
        >
          {modal === "calendar" ? (
            <Calendar />
          ) : modal === "settings" ? (
            <Settings notifications={notifications} />
          ) : modal === "notifications" ? (
            <div className="feature-stack">
              {notices.length ? (
                notices.map((notice) => (
                  <div className="agenda-item" key={notice.id}>
                    <strong>{notice.title}</strong>
                    <p>{notice.body}</p>
                    <Link href={notice.url}>Open</Link>
                  </div>
                ))
              ) : (
                <p className="muted">No active notices right now.</p>
              )}
            </div>
          ) : (
            <div className="feature-stack">
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    if (
                      !Number.isFinite(minutes) ||
                      minutes < 1 ||
                      minutes > 10080
                    )
                      throw Error("Choose 1–10,080 minutes.");
                    await updateStore((s) => {
                      const old = readLegacy<Reminders>(
                        s,
                        "nd_reminders",
                        defaultReminders,
                      );
                      const timers = startTimer(old.timers, {
                        id: crypto.randomUUID(),
                        title: timerPresets[preset].title,
                        url: timerPresets[preset].url,
                        dueAt: Date.now() + minutes * 60000,
                      });
                      return {
                        ...s,
                        legacy: {
                          ...s.legacy,
                          nd_reminders: JSON.stringify({ ...old, timers }),
                        },
                      };
                    });
                  }, "Timer saved");
                }}
              >
                <label>
                  Activity
                  <select
                    value={preset}
                    onChange={(e) => {
                      setPreset(Number(e.target.value));
                      setMinutes(timerPresets[Number(e.target.value)].minutes);
                    }}
                  >
                    {timerPresets.map((p, i) => (
                      <option value={i} key={i}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Minutes
                  <input
                    required
                    type="number"
                    min="1"
                    max="10080"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  {active.some((t) => t.url === timerPresets[preset].url)
                    ? "Restart timer"
                    : "Start timer"}
                </Button>
              </form>
              {reminders.timers
                .filter((t) => t.dueAt > now - 600_000)
                .map((t) => (
                  <div className="actions" key={t.id}>
                    <span>{t.title}</span>
                    <strong>{countdown(t, now)}</strong>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => run(() => removeTimer(t.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
            </div>
          )}
          <Feedback message={message} />
        </Modal>
      )}
    </div>
  );
}
import { mergeTradingReceipts } from "../core/trading-sales";
