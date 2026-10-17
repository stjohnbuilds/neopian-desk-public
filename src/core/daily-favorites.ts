import data from "../data/dailies.json";

export const dailyFavoritesKey = "nd_daily_favorites_v1";
export const dailyId = (entry: { name: string }) =>
  entry.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
// The event remains in the source catalogue and historical visits.
export const activeDailies = data.filter(
  (entry) => entry.name !== "Faerie Festival",
);
type Favorites = { version: 1; ids: string[] };
export function validDailyFavorites(value: unknown): value is Favorites {
  const saved = value as Favorites;
  return (
    !!saved &&
    saved.version === 1 &&
    Array.isArray(saved.ids) &&
    saved.ids.length <= 512 &&
    saved.ids.every(
      (id) => typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,100}$/.test(id),
    ) &&
    new Set(saved.ids).size === saved.ids.length
  );
}
export function dailyFavorites(legacy: Record<string, string>): string[] {
  // A short starter list; every catalogue entry can be starred or unstarred.
  return legacy[dailyFavoritesKey] === undefined
    ? activeDailies
        .filter((entry) => ["Quest Log", "Bank Interest", "Trudy's Surprise"].includes(entry.name))
        .map(dailyId)
    : (JSON.parse(legacy[dailyFavoritesKey]) as Favorites).ids;
}
export function withDailyFavorite(
  legacy: Record<string, string>,
  id: string,
  checked: boolean,
) {
  if (!activeDailies.some((entry) => dailyId(entry) === id))
    throw Error("Unknown daily.");
  const ids = dailyFavorites(legacy);
  return {
    ...legacy,
    [dailyFavoritesKey]: JSON.stringify({
      version: 1,
      ids: checked
        ? [...new Set([...ids, id])]
        : ids.filter((saved) => saved !== id),
    }),
  };
}
export function featuredDailies(legacy: Record<string, string>) {
  const ids = dailyFavorites(legacy);
  // Stars select cards; they never change the original catalogue order.
  return activeDailies.filter((entry) => ids.includes(dailyId(entry)));
}
export function otherDailies(legacy: Record<string, string>) {
  const ids = dailyFavorites(legacy);
  return activeDailies.filter((entry) => !ids.includes(dailyId(entry)));
}
