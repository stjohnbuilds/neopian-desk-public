import { avatarCalendarEvents, generalCalendarDates } from "./avatar-calendar";
import { pacificTime } from "./timers";

/** Schedule today's calendar entries; App refreshes this on each Pacific date change. */
export function calendarReminders(
  legacy: Record<string, string>,
  today: string,
) {
  const calendar = JSON.parse(
    legacy.nd_calendar ?? '{"events":[],"done":[]}',
  ) as {
    events: {
      id: string;
      title: string;
      body?: string;
      date: string;
      annual: boolean;
    }[];
    done?: string[];
  };
  const entries = [
    ...generalCalendarDates(legacy, today),
    ...avatarCalendarEvents(legacy, today).filter((event) => event.notify),
    ...calendar.events.filter(
      (d) =>
        d.date === today ||
        (d.annual && today >= d.date && d.date.slice(5) === today.slice(5)),
    ),
  ];
  const reminders = entries
    .filter((e) => !calendar.done?.includes(`${e.id}:${today}`))
    .map((e) => ({
      id: `calendar-${e.id}:${today}`,
      title: e.title,
      body: e.body || "Open your Neopian calendar for today’s date.",
      url: "neopian-desk://calendar",
      kind: "once",
      dueAt: pacificTime(today),
      windowMinutes: 900,
    }));
  if (
    today.slice(5) === "10-31" &&
    !calendar.done?.includes(`halloween:${today}`)
  )
    reminders.push({
      id: `calendar-halloween-minute-${today.slice(0, 4)}`,
      title: "Haunted Woods site theme · check now",
      body: "The 11:59pm Pacific window lasts one minute. Open the calendar for the Neopets link.",
      url: "neopian-desk://calendar",
      kind: "once",
      dueAt: pacificTime(today, "23:59"),
      windowMinutes: 1,
    });
  return reminders;
}
