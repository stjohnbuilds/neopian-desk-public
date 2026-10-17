import petpetTypes from "../data/petpets.json";
import { isAvatarCollected, isPetpetAvatarCollected } from "./avatars";
export interface Timer {
  id: string;
  title: string;
  dueAt: number;
  url: string;
}
export interface Petpet {
  id: string;
  pet: string;
  avatar: string;
  attachedOn: string;
  estimated: boolean;
  done: boolean;
}
export interface Reminders {
  version: number;
  preferences: Record<string, boolean>;
  magmaTime: string;
  magmaKind: string;
  timers: Timer[];
  petpets: Petpet[];
  collectedPetpets?: string[];
  magmaObservation?: string;
}
export const defaultReminders: Reminders = {
  version: 1,
  preferences: {
    snowager: false,
    magma: false,
    illusen: false,
    jhudora: false,
  },
  magmaTime: "00:00",
  magmaKind: "estimate",
  timers: [],
  petpets: [],
};
export const timerPresets = [
  {
    title: "Healing Springs",
    minutes: 30,
    url: "https://www.neopets.com/faerieland/springs.phtml",
  },
  {
    title: "Wheel of Mediocrity",
    minutes: 40,
    url: "https://www.neopets.com/prehistoric/mediocrity.phtml",
  },
  {
    title: "Wheel of Excitement",
    minutes: 120,
    url: "https://www.neopets.com/faerieland/wheel.phtml",
  },
  {
    title: "Swashbuckling Academy",
    minutes: 240,
    url: "https://www.neopets.com/pirates/academy.phtml",
  },
  {
    title: "Grave Danger",
    minutes: 480,
    url: "https://www.neopets.com/halloween/gravedanger/index.phtml",
  },
  {
    title: "Kadoatery",
    minutes: 7,
    url: "https://www.neopets.com/games/kadoatery/index.phtml",
  },
];
export function timerSchedule(timers: Timer[]) {
  return timers.map((t) => ({
    ...t,
    kind: "once",
    body: "Your timer is ready.",
    windowMinutes: 10,
  }));
}
export function countdown(t: Timer, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((t.dueAt - now) / 1000));
  return seconds
    ? `${Math.floor(seconds / 3600) ? Math.floor(seconds / 3600) + "h " : ""}${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`
    : "Ready";
}

/** Starting an activity again explicitly restarts it; expired alerts do not pile up. */
export function startTimer(
  timers: Timer[],
  next: Timer,
  now = Date.now(),
): Timer[] {
  const retained = timers.filter(
    (t) => t.url !== next.url && t.dueAt > now - 600_000,
  );
  if (retained.length >= 30)
    throw Error("Up to 30 active timers. Remove one first.");
  return [...retained, next];
}

/** Use the existing native daily scheduler for opted-in Snowager windows. */
export function reminderSchedule(
  reminders: Reminders,
  legacy: Record<string, string> = {},
) {
  const collected = (id: string) =>
    isAvatarCollected(legacy, "nd_avatar_tasks", id);
  return [
    ...timerSchedule(
      reminders.timers.filter(
        (t) => !t.id.startsWith("avatar-") || !collected(t.id.slice(7)),
      ),
    ),
    ...(reminders.preferences.snowager && !collected("snowager")
      ? [6, 14, 22].map((hour) => ({
          id: `snowager-${hour}`,
          title: "Snowager · scheduled sleep window",
          body: "Normally asleep during this hour. Check the page before collecting.",
          url: "https://www.neopets.com/winter/snowager.phtml",
          kind: "daily",
          hour,
          minute: 0,
          windowMinutes: 60,
          skipHibernation: true,
        }))
      : []),
    ...(reminders.preferences.magma
      ? [
          {
            id: "magma",
            title:
              reminders.magmaKind === "estimate"
                ? "Magma Pool · estimated search window"
                : "Magma Pool · saved ten-minute window",
            body: "Check the pool against your saved time.",
            url: "https://www.neopets.com/magma/pool.phtml",
            kind: "daily",
            hour: Number(reminders.magmaTime.slice(0, 2)),
            minute: Number(reminders.magmaTime.slice(3)),
            windowMinutes: reminders.magmaKind === "estimate" ? 60 : 10,
          },
        ]
      : []),
    ...[
      {
        key: "illusen",
        id: "illusen-day",
        title: "Illusen Doll avatar",
        month: 3,
        day: 17,
        url: "https://www.neopets.com/medieval/earthfaerie.phtml",
      },
      {
        key: "jhudora",
        id: "jhudora-day",
        title: "Evil Jhudora avatar",
        month: 2,
        day: 4,
        url: "https://www.neopets.com/faerieland/darkfaerie.phtml",
      },
    ]
      .filter((r) => reminders.preferences[r.key] && !collected(r.id))
      .map(({ key, ...r }) => ({
        ...r,
        kind: "annual",
        hour: 9,
        minute: 0,
        windowMinutes: 900,
        body: "Complete a quest today. Check your shared 12-hour cooldown first.",
      })),
    ...reminders.petpets
      .filter((p) => !p.done && !isPetpetAvatarCollected(legacy, p.avatar))
      .map((p) => ({
        id: `petpet-${p.id}`,
        title: `${p.pet === "unassigned" ? "Pet to confirm" : p.pet} · ${petpetTypes.find((t) => t.id === p.avatar)?.name ?? p.avatar}`,
        body: `Your ${p.estimated ? "estimated " : ""}petpet age target has passed. Keep it attached and check the avatar requirements.`,
        url:
          p.pet === "unassigned"
            ? "neopian-desk://calendar"
            : `https://www.neopets.com/petlookup.phtml?pet=${encodeURIComponent(p.pet)}`,
        kind: "once",
        dueAt: pacificTime(petpetTargetDate(p)),
        windowMinutes: 525600,
      })),
    ...(Object.keys(legacy).length > 0 &&
    JSON.parse(legacy.nd_wish_alarm ?? "true") &&
    !isAvatarCollected(legacy, "nd_time_locked", "make-a-wish")
      ? [
          {
            id: "make-a-wish",
            title: "Make A Wish · midnight window",
            body: "Open your Starry pet’s lookup between 12:00 and 12:01am. It needs a Starry petpet attached.",
            url: "https://www.neopets.com/quickref.phtml",
            kind: "daily",
            hour: 23,
            minute: 58,
            windowMinutes: 3,
          },
        ]
      : []),
  ];
}

/** Original reminder rule: notify the morning after the age threshold, in Pacific time. */
export function petpetTargetDate(p: Petpet) {
  const date = new Date(p.attachedOn + "T12:00:00Z");
  date.setUTCDate(
    date.getUTCDate() +
      (petpetTypes.find((t) => t.id === p.avatar)?.days ?? 0) +
      1,
  );
  return date.toISOString().slice(0, 10);
}
export function pacificTime(date: string, time = "09:00") {
  const target = Date.parse(`${date}T${time}:00Z`);
  let guess = target;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      fmt.formatToParts(guess).map((v) => [v.type, v.value]),
    );
    guess +=
      target -
      Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  }
  return guess;
}
