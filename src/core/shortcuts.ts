import dailies from "../data/dailies.json";
import catalogues from "../data/catalogues.json";
const priority = {shopIDs:[...catalogues.DESK_SHOP_LAUNCH_DATA].sort((a,b)=>a.name.localeCompare(b.name)).slice(0,20).map(s=>s.id)};
import { safeURL } from "./utils";

export const shortcutIcons = [
  "sword",
  "coins",
  "cat",
  "star",
  "heart",
  "book",
  "link",
  "gift",
  "trophy",
  "shop",
  "clock",
  "bell",
  "calendar",
  "gem",
  "flower",
  "sparkles",
  "shield",
  "map",
  "music",
  "coffee",
  "flame",
  "snowflake",
  "fish",
  "paw",
] as const;
export type ShortcutIcon = (typeof shortcutIcons)[number];
export type ShopGroup = 1 | 2 | "collectibles";
export type Shortcut = { id: string; label: string; icon: ShortcutIcon } & (
  | { kind: "url"; url: string }
  | { kind: "shops"; group: ShopGroup }
);
export const defaultShortcuts: Shortcut[] = [
  {
    id: "training",
    label: "Mystery Island Training School · codestones",
    icon: "sword",
    kind: "url",
    url: "https://www.neopets.com/island/training.phtml",
  },
  {
    id: "shops-1",
    label: "Shop set 1 · 10 shops",
    icon: "coins",
    kind: "shops",
    group: 1,
  },
  {
    id: "shops-2",
    label: "Shop set 2 · 10 shops",
    icon: "coins",
    kind: "shops",
    group: 2,
  },
  {
    id: "shops-collectibles",
    label: "Collectible shops · 5 shops",
    icon: "book",
    kind: "shops",
    group: "collectibles",
  },
  {
    id: "kadoatery",
    label: "Kadoatery",
    icon: "cat",
    kind: "url",
    url: "https://www.neopets.com/games/kadoatery/index.phtml",
  },
];
export const shortcutChoices: Shortcut[] = [
  ...defaultShortcuts,
  ...dailies
    .flatMap((d) =>
      d.links.map(
        (link, i): Shortcut => ({
          id: `daily-${d.name}-${i}`,
          label: d.name + (d.links.length > 1 ? ` · ${link.label}` : ""),
          icon:
            d.name === "Snowager"
              ? "snowflake"
              : d.name === "Magma Pool"
                ? "flame"
                : d.name === "Battledome"
                  ? "shield"
                  : d.group === "Training"
                    ? "sword"
                    : d.group === "Money-making"
                      ? "coins"
                      : d.group === "Freebies"
                        ? "gift"
                        : d.group === "More wheels"
                          ? "clock"
                          : "star",
          kind: "url",
          url: link.url,
        }),
      ),
    )
    .filter(
      (d) =>
        d.kind === "url" &&
        !defaultShortcuts.some((s) => s.kind === "url" && s.url === d.url),
    ),
];
export const shopGroupIDs = (group: ShopGroup) =>
  group === "collectibles"
    ? [58, 68, 86, 3, 8]
    : group === 1
      ? priority.shopIDs.slice(0, 10)
      : priority.shopIDs.slice(10);
export function validShortcuts(value: unknown): value is Shortcut[] {
  return (
    Array.isArray(value) &&
    value.length <= 8 &&
    new Set(value.map((s) => s?.id)).size === value.length &&
    value.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        s.id.length > 0 &&
        s.id.length <= 160 &&
        typeof s.label === "string" &&
        s.label.trim().length > 0 &&
        s.label.length <= 100 &&
        shortcutIcons.includes(s.icon) &&
        (s.kind === "shops"
          ? s.group === 1 || s.group === 2 || s.group === "collectibles"
          : s.kind === "url" &&
            typeof s.url === "string" &&
            s.url.length <= 2000 &&
            !!safeURL(s.url)),
    )
  );
}

/** Validate the whole draft once before committing, including all entry paths. */
export function prepareShortcuts(draft: Shortcut[]): Shortcut[] {
  const result = draft.map((s) =>
    s.kind === "url"
      ? {
          ...s,
          label: s.label.trim(),
          url: safeURL(s.url.trim()) ?? s.url.trim(),
        }
      : { ...s, label: s.label.trim() },
  );
  if (!validShortcuts(result))
    throw Error(
      "Give every shortcut a name, icon and valid http or https link.",
    );
  const targets = result.map((s) =>
    s.kind === "shops" ? `shops:${s.group}` : s.url,
  );
  if (new Set(targets).size !== targets.length)
    throw Error(
      "That destination is already in your bar. Edit its existing shortcut instead.",
    );
  return result;
}
export function sameShortcutTarget(a: Shortcut, b: Shortcut): boolean {
  return a.kind === "url" && b.kind === "url"
    ? a.url === b.url
    : a.kind === "shops" && b.kind === "shops" && a.group === b.group;
}
