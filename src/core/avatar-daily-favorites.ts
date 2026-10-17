import activities from "../data/avatar-daily-activities.json";
import concerts from "../data/concerts.json";

export const avatarFavoritesKey = "nd_avatar_daily_favorites";
type Favorites = { version: 1; ids: string[] };
const knownIds = new Set([
  ...Object.values(activities)
    .filter((a) => a.daily)
    .map((a) => a.activityId),
  ...concerts.map((c) => `concert:${c.id}`),
]);

// Keep well-formed future IDs portable without interpreting them in this build.
export function validAvatarFavorites(value: unknown): value is Favorites {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<Favorites>;
  return (
    v.version === 1 &&
    Array.isArray(v.ids) &&
    v.ids.length <= 512 &&
    v.ids.every(
      (id) =>
        typeof id === "string" && /^(daily|concert):[a-z0-9-]{1,100}$/.test(id),
    ) &&
    new Set(v.ids).size === v.ids.length
  );
}

export function avatarFavorites(legacy: Record<string, string>): string[] {
  return (
    JSON.parse(
      legacy[avatarFavoritesKey] || '{"version":1,"ids":[]}',
    ) as Favorites
  ).ids;
}

export function withAvatarFavorite(
  legacy: Record<string, string>,
  id: string,
  checked: boolean,
): Record<string, string> {
  if (!knownIds.has(id)) throw Error("Unknown avatar activity.");
  const ids = avatarFavorites(legacy);
  return {
    ...legacy,
    [avatarFavoritesKey]: JSON.stringify({
      version: 1,
      ids: checked
        ? [...new Set([...ids, id])]
        : ids.filter((saved) => saved !== id),
    }),
  };
}
