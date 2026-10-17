import { day } from "./utils";
import type { Timer } from "./timers";
export type AvatarProgress = Record<string, { done: boolean; tried: string }>;
export function birthdayReminders(
  births: Record<string, string>,
  progress: AvatarProgress,
  year: string,
) {
  return progress["bank-birthday"]?.done
    ? []
    : Object.entries(births).map(([pet, date]) => ({
        id: "pet-birthday-" + pet,
        date: year + date.slice(4),
        title: pet + "’s birthday",
        body: `Make ${pet} your active pet, then deposit NP in your bank. Wait for Neopets to confirm Good Day at the Bank before marking it collected.`,
        url: "https://www.neopets.com/bank.phtml",
      }));
}
export function activeNotices(timers: Timer[], now: number) {
  const result = timers
    .filter((t) => t.dueAt <= now && t.dueAt > now - 600_000)
    .map((t) => ({
      id: t.id,
      title: t.title + " is ready",
      body: "Your countdown finished.",
      url: t.url,
    }));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hourCycle: "h23",
    hour: "2-digit",
    month: "2-digit",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value),
    month = Number(parts.find((p) => p.type === "month")?.value);
  if (month === 12 || [6, 14, 22].includes(hour))
    result.push({
      id:
        "snowager-" +
        day(new Date(now)) +
        "-" +
        (month === 12 ? "winter" : hour),
      title: "Snowager · scheduled sleep window",
      body:
        month === 12
          ? "December hibernation: normally available all day. Check the page before collecting."
          : "Normally asleep during this hour (Neopets time). Check the page for the current state.",
      url: "https://www.neopets.com/winter/snowager.phtml",
    });
  return result;
}
