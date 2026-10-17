import { avatarEntries, isCollected, type AvatarEntry } from "./avatars";
import activities from "../data/avatar-daily-activities.json";
import concerts from "../data/concerts.json";
import { avatarFavorites } from "./avatar-daily-favorites";
export type DailyVisits = { version: number; day: string; opened: string[] };
export function visitedToday(
  legacy: Record<string, string>,
  today: string,
): string[] {
  const saved: DailyVisits = JSON.parse(
    legacy.nd_daily_visits_v1 || '{"day":"","opened":[]}',
  );
  return saved.day === today ? saved.opened : [];
}
export function withDailyVisit(
  legacy: Record<string, string>,
  urls: string[],
  today: string,
  checked = true,
) {
  const old = visitedToday(legacy, today);
  return {
    ...legacy,
    nd_daily_visits_v1: JSON.stringify({
      version: 1,
      day: today,
      opened: checked
        ? [...new Set([...old, ...urls])]
        : old.filter((u) => !urls.includes(u)),
    }),
  };
}
export function concertIsToday(id: string, today: string) {
  const month = Number(today.slice(5, 7)),
    date = Number(today.slice(8));
  const schedules: Record<string, number[]> = {
    rock: [10, 17],
    jazzmosis: [6, 13, 20, 27],
    jubzambra: [5],
    icecream: [12, 19, 26],
    groovy: [
      8,
      15,
      29,
      ...(month === 5 ? [] : [22]),
      ...(month === 4 ? [] : [23]),
    ],
  };
  return schedules[id]?.includes(date) ?? false;
}
export type DailyActivity = {
  activityId: string;
  activity: string;
  cadence: string;
  url: string;
  daily?: boolean;
};
const dailyActivities: Record<string, Omit<DailyActivity, "url">> = activities;
export function isRepeatableAvatar(e: AvatarEntry) {
  return !!e.concertId || !!dailyActivities[e.catalogueCode || ""];
}
// Repeatable inventory, shopping and game goals stay in Achievements. A daily
// needs an explicitly reviewed daily limit, cooldown or availability window.
export function isDailyAvatar(e: AvatarEntry) {
  return (
    !!e.concertId || dailyActivities[e.catalogueCode || ""]?.daily === true
  );
}
export function avatarActivity(e: AvatarEntry): DailyActivity {
  // Every view opens the original avatar record's destination. The routine
  // catalogue supplies grouping/timing only, never a competing copy of a URL.
  return {
    ...(dailyActivities[e.catalogueCode || ""] || {
      activityId: `avatar:${e.id}`,
      activity: e.activity || e.name,
      cadence: e.cadence || "",
    }),
    url: e.url,
  };
}
export function avatarDailyGroups(
  legacy: Record<string, string>,
  today: string,
  search = "",
) {
  const favorites = new Set(avatarFavorites(legacy));
  const grouped = new Map<string, DailyActivity & { entries: AvatarEntry[] }>();
  for (const e of avatarDailies(legacy, today)) {
    if (e.concertId) continue; // Concerts have ticket/next-date controls of their own.
    const activity = avatarActivity(e);
    const key = activity.activityId;
    const row = grouped.get(key) || { ...activity, entries: [] };
    row.entries.push(e);
    grouped.set(key, row);
  }
  return [...grouped.values()]
    .filter((g) =>
      `${g.activity} ${g.entries.map((e) => `${e.name} ${e.detail}`).join(" ")}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(favorites.has(b.activityId)) -
          Number(favorites.has(a.activityId)) ||
        a.activity.localeCompare(b.activity),
    );
}
export function withActivityAttempt(
  legacy: Record<string, string>,
  entries: AvatarEntry[],
  today: string,
  checked: boolean,
) {
  return entries.reduce(
    (next, e) => withAvatarAttempt(next, e, today, checked),
    legacy,
  );
}
export function concertEvents(legacy: Record<string, string>, today: string) {
  return avatarEntries
    .filter(
      (e) =>
        e.concertId &&
        concertIsToday(e.concertId, today) &&
        !isCollected(legacy, e),
    )
    .map((e) => ({
      id: e.id,
      date: today,
      title: concerts.find((c) => c.id === e.concertId)!.band + " concert",
      body:
        e.detail +
        " Tickets are available from the booth or user shops; buying alone does not count.",
      url: e.url,
    }));
}
export function avatarDailies(legacy: Record<string, string>, today: string) {
  return avatarEntries.filter(
    (e) =>
      !e.retired &&
      !isCollected(legacy, e) &&
      (e.concertId ? concertIsToday(e.concertId, today) : isDailyAvatar(e)),
  );
}
export function avatarConcerts(
  legacy: Record<string, string>,
  today: string,
  search = "",
) {
  return avatarEntries
    .filter((e) => e.concertId && !isCollected(legacy, e))
    .map((entry) => {
      const band = concerts.find((c) => c.id === entry.concertId)!;
      const next = new Date(today + "T12:00:00Z");
      // Every known band repeats monthly; 62 days includes all month exceptions.
      for (
        let offset = 0;
        offset < 62;
        offset++, next.setUTCDate(next.getUTCDate() + 1)
      ) {
        const date = next.toISOString().slice(0, 10);
        if (concertIsToday(band.id, date))
          return { entry, band: band.band, date, today: date === today };
      }
      throw Error("Concert schedule is missing for " + band.band);
    })
    .filter((c) =>
      `${c.band} ${c.entry.name} concert tickets`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.band.localeCompare(b.band),
    );
}
export function withConcertTicket(
  legacy: Record<string, string>,
  id: string,
  checked: boolean,
) {
  if (!concerts.some((c) => c.id === id)) throw Error("Unknown concert.");
  const current = JSON.parse(
    legacy.nd_concerts || '{"tickets":[],"avatars":[]}',
  );
  return {
    ...legacy,
    nd_concerts: JSON.stringify({
      ...current,
      tickets: checked
        ? [...new Set([...current.tickets, id])]
        : current.tickets.filter((ticket: string) => ticket !== id),
    }),
  };
}
export function triedToday(
  legacy: Record<string, string>,
  entry: AvatarEntry,
  today: string,
) {
  const attempts = JSON.parse(legacy.nd_avatar_attempts || "{}");
  const tasks = JSON.parse(legacy.nd_avatar_tasks || "{}");
  return (
    attempts[entry.id] === today ||
    entry.refs.some(
      (r) => r.key === "nd_avatar_tasks" && tasks[r.id]?.tried === today,
    )
  );
}
export function withAvatarAttempt(
  legacy: Record<string, string>,
  entry: AvatarEntry,
  today: string,
  checked: boolean,
) {
  const attempts = JSON.parse(legacy.nd_avatar_attempts || "{}");
  if (checked) attempts[entry.id] = today;
  else delete attempts[entry.id];
  const next: Record<string, string> = {
    ...legacy,
    nd_avatar_attempts: JSON.stringify(attempts),
  };
  const taskRefs = entry.refs.filter((r) => r.key === "nd_avatar_tasks");
  if (taskRefs.length) {
    const tasks = JSON.parse(legacy.nd_avatar_tasks || "{}");
    for (const r of taskRefs)
      tasks[r.id] = {
        ...tasks[r.id],
        done: isCollected(legacy, entry),
        tried: checked ? today : "",
      };
    next.nd_avatar_tasks = JSON.stringify(tasks);
  }
  return next;
}
