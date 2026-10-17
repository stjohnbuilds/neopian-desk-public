import {
  avatarCalendarEvents,
  generalCalendarDates,
  avatarCalendarCoverage,
} from "../core/avatar-calendar";
import type { AvatarProgress } from "../core/notices";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { accounting, type Ledger } from "../core/accounting";
import { np } from "../core/utils";
import { useStore, readLegacy, setLegacy } from "../persistence/store";
import { day } from "../core/utils";
import { defaultReminders, type Reminders } from "../core/timers";
import {
  Button,
  Link,
  Feedback,
  Empty,
  Disclosure,
  useAction,
} from "../components/shared";
interface PersonalDate {
  id: string;
  title: string;
  body: string;
  date: string;
  annual: boolean;
}
/** Written out by hand so every browser engine shows the same wording. */
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const noon = (date: string) => new Date(date + "T12:00:00");
const monthName = (month: string) =>
  `${monthNames[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`;
const longDay = (date: string) =>
  `${weekdays[noon(date).getDay()]} ${Number(date.slice(8))} ${monthName(date.slice(0, 7))}`;
const shortDay = (date: string) =>
  `${Number(date.slice(8))} ${monthNames[Number(date.slice(5, 7)) - 1].slice(0, 3)} ${date.slice(0, 4)}`;
function shiftMonth(month: string, by: number) {
  const d = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)) - 1 + by,
    1,
  );
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function Calendar() {
  const store = useStore(),
    calendar = readLegacy(store, "nd_calendar", {
      version: 1,
      events: [] as PersonalDate[],
    });
  const reminders = readLegacy<Reminders>(
    store,
    "nd_reminders",
    defaultReminders,
  );
  const ledger = readLegacy<Ledger>(store, "nd_shop_profit_v1", {
    version: 1,
    sales: [],
    restoredPurchases: [],
  });
  const profit = accounting.account(
    accounting.mergePurchases(store.native.purchases, ledger.restoredPurchases),
    ledger.sales,
  ).byDay;
  const avatarProgress = readLegacy<AvatarProgress>(
    store,
    "nd_avatar_tasks",
    {},
  );
  const [month, setMonth] = useState(day().slice(0, 7)),
    [selected, setSelected] = useState(day()),
    [name, setName] = useState(""),
    [repeat, setRepeat] = useState(false);
  const { run, message } = useAction();
  /** Keep the selected day inside the month on screen: today in this month, otherwise the 1st. */
  const showMonth = (next: string) => {
    setMonth(next);
    setSelected(next === day().slice(0, 7) ? day() : next + "-01");
  };
  const showDay = (date: string) => {
    setMonth(date.slice(0, 7));
    setSelected(date);
  };
  const removeDate = (id: string) =>
    run(
      () =>
        setLegacy("nd_calendar", {
          ...calendar,
          events: calendar.events.filter((d) => d.id !== id),
        }),
      "Date removed",
    );
  const coverage = useMemo(
    () => avatarCalendarCoverage(store.legacy, day()),
    [store.legacy],
  );
  const pendingAvatars = coverage.filter((row) => row.status !== "retired");
  const events: {
    date: string;
    title: string;
    body: string;
    url?: string;
    personalId?: string;
  }[] = [
    ...Array.from(
      {
        length: new Date(
          Number(month.slice(0, 4)),
          Number(month.slice(5)),
          0,
        ).getDate(),
      },
      (_, i) => {
        const date = `${month}-${String(i + 1).padStart(2, "0")}`;
        return [
          ...generalCalendarDates(store.legacy, date).map((event) => ({
            ...event,
            date,
            url: event.url || event.guide,
          })),
          ...avatarCalendarEvents(store.legacy, date),
        ];
      },
    ).flat(),
    ...calendar.events.map((d) => ({
      title: d.title,
      body:
        d.body || (d.annual ? "Your own date · every year" : "Your own date"),
      date: d.annual ? month.slice(0, 4) + d.date.slice(4) : d.date,
      personalId: d.id,
    })),
    ...reminders.timers.map((t) => ({
      date: day(new Date(t.dueAt)),
      title: t.title,
      body: new Date(t.dueAt).toLocaleTimeString("en", {
        timeZone: "America/Los_Angeles",
      }),
      url: t.url,
    })),
  ];
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)),
    0,
  ).getDate();
  const offset = new Date(month + "-01T12:00:00").getDay();
  const dayEvents = events.filter((e) => e.date === selected);
  const ownDates = [...calendar.events].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  return (
    <div className="feature-stack">
      <div className="actions calendar-nav">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Previous month"
          onClick={() => showMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft size={16} />
        </Button>
        <h3 className="calendar-month" aria-live="polite">
          {monthName(month)}
        </h3>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Next month"
          onClick={() => showMonth(shiftMonth(month, 1))}
        >
          <ChevronRight size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={() => showDay(day())}>
          Today
        </Button>
        <span className="push muted text-small">Pacific time</span>
      </div>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <small key={d}>{d}</small>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={"offset" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = month + "-" + String(i + 1).padStart(2, "0");
          return (
            <button
              key={date}
              className={selected === date ? "selected" : ""}
              onClick={() => setSelected(date)}
            >
              <span>{i + 1}</span>
              {events.some((e) => e.date === date) && <i />}
            </button>
          );
        })}
      </div>
      <h3 className="calendar-day">{longDay(selected)}</h3>
      {profit[selected] != null && (
        <p>Realised profit: {np(profit[selected])}</p>
      )}
      {!dayEvents.length && profit[selected] == null && (
        <Empty>Nothing on this day.</Empty>
      )}
      {dayEvents.map((e, i) => (
        <div className="agenda-item" key={i}>
          <strong>{e.title}</strong>
          <p>{e.body}</p>
          {e.personalId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void removeDate(e.personalId!)}
            >
              Remove
            </Button>
          )}
          {e.url && (
            <Link href={e.url}>
              {e.title.endsWith("’s birthday") ? "Open bank" : "Open"}
            </Link>
          )}
          {e.title.endsWith("’s birthday") && (
            <Link href="https://www.neopets.com/quickref.phtml">
              Choose active pet
            </Link>
          )}
          {e.title.endsWith("’s birthday") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void run(
                  () =>
                    setLegacy("nd_avatar_tasks", {
                      ...avatarProgress,
                      "bank-birthday": {
                        done: true,
                        tried: avatarProgress["bank-birthday"]?.tried || "",
                      },
                    }),
                  "Avatar collected · birthday reminders removed",
                )
              }
            >
              I received Good Day at the Bank
            </Button>
          )}
        </div>
      ))}
      <Disclosure
        title={`Avatar calendar coverage · ${pendingAvatars.length} uncollected`}
      >
        <p>
          Your app's collection marks control this list. Known dates and windows
          appear in the calendar; other requirements stay here without invented
          dates. Marking an avatar collected removes its pending entries.
        </p>
        {(
          [
            ["scheduled", "Scheduled opportunities"],
            ["attachment", "Petpet dates to confirm"],
            ["variable", "Event dates or conditions to confirm"],
            ["routine", "Repeatable avatar activities"],
            ["anytime", "No fixed calendar date"],
          ] as const
        ).map(([status, title]) => {
          const rows = pendingAvatars.filter((row) => row.status === status);
          return rows.length ? (
            <Disclosure key={status} title={`${title} · ${rows.length}`}>
              {rows.map(({ entry, next, reason }) => (
                <div className="agenda-item" key={entry.id}>
                  <strong>{entry.name}</strong>
                  <p>
                    {next ? `${next} · ` : ""}
                    {reason}
                  </p>
                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showDay(next)}
                    >
                      Show date
                    </Button>
                  )}
                  <Link href={entry.guide || entry.url}>Requirements</Link>
                </div>
              ))}
            </Disclosure>
          ) : null;
        })}
        <p className="muted text-small">
          {coverage.filter((row) => row.status === "retired").length}{" "}
          uncollected avatars are listed as retired and have no repeating
          events.
        </p>
        <p>Other avatar goals stay in Achievements → Avatars.</p>
      </Disclosure>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              setLegacy("nd_calendar", {
                ...calendar,
                events: [
                  ...calendar.events,
                  {
                    id: crypto.randomUUID(),
                    title: name.trim(),
                    body: "",
                    date: selected,
                    annual: repeat,
                  },
                ],
              }),
            "Date saved",
          );
          setName("");
        }}
      >
        <label>
          Add your own date to this day
          <input
            required
            maxLength={100}
            placeholder="What’s happening?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
          Every year
        </label>
        <Button type="submit">Add to {shortDay(selected)}</Button>
      </form>
      {ownDates.length > 0 && (
        <Disclosure title={`All your own dates (${ownDates.length})`}>
          {ownDates.map((e) => (
            <div className="own-date" key={e.id}>
              <button
                type="button"
                className="own-date-day"
                onClick={() => showDay(e.date)}
              >
                {shortDay(e.date)}
              </button>
              <span>
                {e.title}
                {e.annual && <span className="muted"> · every year</span>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void removeDate(e.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </Disclosure>
      )}
      <Feedback message={message} />
    </div>
  );
}
