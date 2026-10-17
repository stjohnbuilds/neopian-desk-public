import {
  avatarEntries,
  findAvatar,
  isCollected,
  type AvatarEntry,
} from "./avatars";
import { concertEvents, isDailyAvatar } from "./dailies";
import { workbookRows } from "./avatar-workbook";
import { birthdayReminders } from "./notices";
import { defaultReminders, petpetTargetDate, type Reminders } from "./timers";
import annual from "../data/avatar-dates.json";
import dates from "../data/dates.json";
import birthdays from "../data/birthdays.json";
import timeLocked from "../data/time-locked.json";
import petpetTypes from "../data/petpets.json";

export type AvatarCalendarEvent = {
  id: string;
  avatarID: string;
  date: string;
  title: string;
  body: string;
  url: string;
  notify: boolean;
};
const entryByID = (id: string) =>
  avatarEntries.find((entry) => entry.id === id);
const pending = (legacy: Record<string, string>, entry?: AvatarEntry) =>
  !!entry && !entry.retired && !isCollected(legacy, entry);

/** Calendar dates describe opportunities, never a claim of current eligibility. */
export function avatarCalendarEvents(
  legacy: Record<string, string>,
  date: string,
) {
  const events: AvatarCalendarEvent[] = [];
  const month = Number(date.slice(5, 7)),
    day = Number(date.slice(8));
  const reminders: Reminders = JSON.parse(
    legacy.nd_reminders || JSON.stringify(defaultReminders),
  );
  const add = (
    entry: AvatarEntry | undefined,
    id: string,
    body: string,
    notify = true,
    title?: string,
    url?: string,
  ) => {
    if (!pending(legacy, entry)) return;
    events.push({
      id,
      avatarID: entry!.id,
      date,
      title: title || entry!.name,
      body,
      url: url || entry!.url,
      notify,
    });
  };
  for (const record of annual) {
    // A first-of-month placeholder is not an event's actual date.
    if (record.window || record.month !== month || !record.days.includes(day))
      continue;
    const entry = findAvatar("nd_avatar_dates", record.id);
    add(
      entry,
      record.id,
      record.body,
      !(record.id === "jhudora-feb" && reminders.preferences.jhudora),
    );
  }
  if (month === 3 && day === 17)
    add(
      entryByID("illusen-day"),
      "illusen-day",
      "Complete an Illusen quest today. Check the shared 12-hour cooldown first.",
      !reminders.preferences.illusen,
    );
  if (month === 11 && day === 15)
    add(
      findAvatar("nd_avatar_catalogue", "birthday"),
      "birthday-avatar",
      "Visit New Features for the Happy Birthday! avatar.",
    );
  for (const record of dates.filter((record) =>
    ["borovan", "christmas"].includes(record.id),
  ))
    if (record.month === month && record.day === day)
      add(findAvatar("nd_avatar_dates", record.id), record.id, record.body);
  if (month === 12)
    add(
      entryByID("attack-pea"),
      "attack-pea",
      "December opportunity: collect today's Advent Calendar gift. The avatar award day is not known in advance; this is a daily check, not a confirmed award date.",
    );
  for (const event of concertEvents(legacy, date))
    add(
      entryByID(event.id),
      event.id,
      event.body,
      true,
      event.title,
      event.url,
    );
  const bank = entryByID("bank-birthday");
  if (pending(legacy, bank)) {
    const births = JSON.parse(
      legacy.nd_pet_birthdays || JSON.stringify(birthdays),
    );
    for (const event of birthdayReminders(births, {}, date.slice(0, 4)))
      if (event.date === date)
        add(bank, event.id, event.body, true, event.title, event.url);
  }
  for (const target of reminders.petpets) {
    if (target.done || petpetTargetDate(target) !== date) continue;
    const entry = findAvatar("nd_reminders", target.avatar);
    add(
      entry,
      `petpet-${target.id}`,
      `${target.estimated ? "Estimated" : "Recorded"} attachment date. Check on the morning after the age threshold, matching the petpet reminder. Keep the petpet attached and check all requirements.`,
      false,
      `${entry?.name || target.avatar} · petpet age check`,
      target.pet === "unassigned"
        ? "neopian-desk://calendar"
        : `https://www.neopets.com/petlookup.phtml?pet=${encodeURIComponent(target.pet)}`,
    );
  }
  // Known daily windows are visible without enabling additional Mac notifications.
  if (month !== 12)
    add(
      entryByID("snowager"),
      "snowager-window",
      "6–7am, 2–3pm and 10–11pm Pacific. A blast may award the avatar; regular December hibernation visits cannot.",
      false,
    );
  add(
    entryByID("von-roo"),
    "von-roo-window",
    month === 10 && day === 31
      ? "Available all day for Halloween. Check the pet-level and game requirements."
      : "Midnight–1am Pacific. Check the pet-level and game requirements.",
    false,
  );
  add(
    entryByID("make-a-wish"),
    "make-a-wish-window",
    "12:00–12:01am Pacific. Requires the lookup of a Starry pet with a Starry petpet; the time alone does not establish eligibility.",
    false,
  );
  return [...new Map(events.map((event) => [event.id, event])).values()];
}

export function generalCalendarDates(
  legacy: Record<string, string>,
  date: string,
) {
  const month = Number(date.slice(5, 7)),
    day = Number(date.slice(8));
  return dates
    .filter(
      (record) =>
        (!record.month || record.month === month) &&
        record.day === day &&
        !["borovan", "christmas"].includes(record.id),
    )
    .map((record) =>
      record.id === "birthday"
        ? {
            ...record,
            body: "Neopets birthday celebrations. Check New Features for this year's announcements.",
          }
        : record,
    )
    .filter(
      (record) =>
        record.id !== "birthday" ||
        !pending(legacy, findAvatar("nd_avatar_catalogue", "birthday")),
    );
}

export type AvatarCalendarStatus =
  | "scheduled"
  | "variable"
  | "attachment"
  | "routine"
  | "anytime"
  | "retired";
export function avatarCalendarCoverage(
  legacy: Record<string, string>,
  from: string,
) {
  const scheduled = new Map<string, string>();
  const end = new Date(from + "T12:00:00Z");
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  for (
    const current = new Date(from + "T12:00:00Z");
    current <= end;
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    const date = current.toISOString().slice(0, 10);
    for (const event of avatarCalendarEvents(legacy, date))
      if (!scheduled.has(event.avatarID)) scheduled.set(event.avatarID, date);
  }
  const reminders: Reminders = JSON.parse(
    legacy.nd_reminders || JSON.stringify(defaultReminders),
  );
  return avatarEntries
    .filter((entry) => !isCollected(legacy, entry))
    .map((entry) => {
      let status: AvatarCalendarStatus = "anytime",
        reason =
          "No fixed date. Keep this goal in Avatars; no calendar date is invented.";
      let next = scheduled.get(entry.id);
      const petpet = entry.refs.find(
        (ref) =>
          ref.key === "nd_reminders" &&
          (petpetTypes.find((type) => type.id === ref.id)?.days || 0) > 0,
      );
      if (entry.retired) {
        status = "retired";
        reason = "Listed as retired; no repeating reminder.";
      } else if (next) {
        status = "scheduled";
        reason =
          "Next known opportunity or recorded age check. Requirements still apply.";
      } else if (petpet) {
        const target = reminders.petpets.find(
          (target) => target.avatar === petpet.id && !target.done,
        );
        status = "attachment";
        reason = target
          ? "The recorded age target has passed. Check the petpet requirements; no new date is invented."
          : "Record an attachment date in Petpet timers to calculate the age check.";
        next = target ? petpetTargetDate(target) : undefined;
      } else if (
        timeLocked.some((record) =>
          entry.refs.some(
            (ref) => ref.key === "nd_time_locked" && ref.id === record.id,
          ),
        ) ||
        workbookRows(entry).some((row) => row.timing !== "Anytime") ||
        /Seasonal|Date-locked/.test(entry.group) ||
        /during .+20\d{2}|Historical sources:|festival|Match Madness event|rare appearances/i.test(
          entry.detail,
        )
      ) {
        status = "variable";
        reason =
          "The date or eligibility depends on the event, activity or contest. Check the existing guide; the sheet does not supply a verified upcoming date.";
      } else if (isDailyAvatar(entry)) {
        status = "routine";
        reason =
          "A repeatable activity in Avatar dailies; use its cadence or timer, not an invented one-off date.";
      }
      return { entry, status, next, reason };
    });
}
