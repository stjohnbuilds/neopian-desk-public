import { accounting } from "./accounting";
import games from "../data/games.json";
import { avatarEntries } from "./avatars";
import { safeURL } from "./utils";
export type ScoreTry = {
  id: string;
  name: string;
  url: string;
  avatarId: string;
  goal: string;
  tried: string;
};
export type ScoreTries = { version: 1; games: ScoreTry[] };
export const scorePresets = games.map((g) => ({
  name: g.game,
  url: g.url || g.guide || "",
  avatarId:
    avatarEntries.find((e) =>
      e.refs.some((r) => r.key === "nd_game_scores" && r.id === g.id),
    )?.id || "",
}));
export const defaultScoreTries: ScoreTries = {
  version: 1,
  games: [],
};
export const scoreTryKey = "nd_high_score_tries";
export function readScoreTries(legacy: Record<string, string>): ScoreTries {
  return legacy[scoreTryKey]
    ? JSON.parse(legacy[scoreTryKey])
    : structuredClone(defaultScoreTries);
}
export function validScoreTries(value: unknown): value is ScoreTries {
  const s = value as ScoreTries;
  return (
    !!s &&
    s.version === 1 &&
    Array.isArray(s.games) &&
    s.games.length <= 200 &&
    new Set(s.games.map((g) => g?.id)).size === s.games.length &&
    s.games.every(
      (g) =>
        !!g &&
        typeof g.id === "string" &&
        /^[a-zA-Z0-9_-]{1,100}$/.test(g.id) &&
        typeof g.name === "string" &&
        g.name.trim().length > 0 &&
        g.name.length <= 100 &&
        typeof g.url === "string" &&
        !!safeURL(g.url) &&
        g.url.length <= 2000 &&
        typeof g.avatarId === "string" &&
        g.avatarId.length <= 200 &&
        typeof g.goal === "string" &&
        g.goal.length <= 300 &&
        typeof g.tried === "string" &&
        (g.tried === "" || accounting.validDate(g.tried)),
    )
  );
}
export function withScoreTries(
  legacy: Record<string, string>,
  value: ScoreTries,
) {
  if (!validScoreTries(value))
    throw Error(
      "Enter a game name and a valid http or https link. Check the field lengths.",
    );
  const urls = value.games.map((g) => new URL(g.url).href);
  if (new Set(urls).size !== urls.length)
    throw Error("That game link is already in your tries list.");
  return { ...legacy, [scoreTryKey]: JSON.stringify(value) };
}
export function withScoreAttempt(
  legacy: Record<string, string>,
  id: string,
  today: string,
  checked: boolean,
) {
  const s = readScoreTries(legacy);
  return withScoreTries(legacy, {
    ...s,
    games: s.games.map((g) =>
      g.id === id ? { ...g, tried: checked ? today : "" } : g,
    ),
  });
}
export function scoreBoardURL(url: string) {
  const parsed = new URL(url),
    id = parsed.searchParams.get("game_id");
  return /(^|\.)neopets\.com$/.test(parsed.hostname) && id && /^\d+$/.test(id)
    ? `https://www.neopets.com/gamescores.phtml?game_id=${id}`
    : undefined;
}

export function avatarForGameURL(value: string) {
  if (!safeURL(value)) return undefined;
  const input = new URL(value);
  return avatarEntries.find((e) => {
    if (!safeURL(e.url)) return false;
    const candidate = new URL(e.url);
    const id = input.searchParams.get("game_id");
    return (
      candidate.href === input.href ||
      (!!id &&
        /(^|\.)neopets\.com$/.test(input.hostname) &&
        /(^|\.)neopets\.com$/.test(candidate.hostname) &&
        candidate.searchParams.get("game_id") === id)
    );
  });
}
