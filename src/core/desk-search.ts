import wearableShops from "../data/wearable-shops.json";
import dailies from "../data/dailies.json";
import catalogues from "../data/catalogues.json";
import type { Shortcut } from "./shortcuts";
import type { Navigation } from "./navigation";
export type DeskSearchResult = {
  id: string;
  label: string;
  detail: string;
  keywords?: string;
} & ({ navigation: Partial<Navigation> } | { url: string });
const sections: DeskSearchResult[] = [
  {
    id: "avatar-dailies",
    label: "Avatar dailies",
    detail: "Dailies",
    navigation: { page: "dailies", dailies: "avatars" },
  },
  {
    id: "high-score-tries",
    label: "High-score tries",
    detail: "Dailies",
    navigation: { page: "dailies", dailies: "scores" },
  },
  {
    id: "account-information",
    label: "Account information",
    detail: "Personalization",
    keywords: "notes magma pool observations monthly freebies",
    navigation: { page: "personalization", personalization: "account" },
  },
  {
    id: "dailies",
    label: "Dailies",
    detail: "Your desk",
    navigation: { page: "dailies", dailies: "daily" },
  },
  {
    id: "items",
    label: "Items",
    detail: "Owned items and outfits",
    navigation: { page: "items" },
  },
  {
    id: "profit",
    label: "Profits",
    detail: "Sales and purchases",
    navigation: { page: "profit", profit: "sales" },
  },
  {
    id: "restocks",
    label: "Shop Restocks",
    detail: "Your shop groups",
    navigation: { page: "profit", profit: "restocks" },
  },
  {
    id: "trades",
    label: "Trading Post",
    detail: "Profits",
    navigation: { page: "profit", profit: "trades" },
  },
  {
    id: "names",
    label: "Pet Hunt",
    keywords: "names available graveyard created",
    detail: "Tools",
    navigation: { page: "tools", tools: "names" },
  },
  {
    id: "scripts",
    label: "App scripts",
    keywords: "helper prices tracker",
    detail: "Tools",
    navigation: { page: "tools", tools: "app" },
  },
  {
    id: "tampermonkey",
    label: "Tampermonkey scripts",
    keywords: "browser scripts logs events saved",
    detail: "Tools",
    navigation: { page: "tools", tools: "tampermonkey" },
  },
  {
    id: "pages",
    label: "My profile & pages",
    detail: "Personalization",
    navigation: { page: "personalization", personalization: "pages" },
  },
  ...(["avatars", "goals", "battledome", "stamps", "petpets"] as const).map(
    (id) => ({
      id,
      label: id === "stamps" ? "Stamp collection" : id[0].toUpperCase() + id.slice(1),
      detail: "Trophy",
      navigation: { page: "achievements" as const, achievements: id },
    }),
  ),
];
export const searchIndex: DeskSearchResult[] = [
  ...sections,
  ...dailies.flatMap((d) =>
    d.links.map((link, i) => ({
      id: `daily-${d.name}-${i}`,
      label: d.name + (d.links.length > 1 ? ` · ${link.label}` : ""),
      detail: d.group,
      keywords: d.note,
      url: link.url,
    })),
  ),
  ...catalogues.DESK_SHOP_LAUNCH_DATA.map((s) => ({
    id: `shop-${s.id}`,
    label: s.name,
    detail: "Neopian shop",
    keywords: wearableShops.find((w) => w.id === s.id)?.note,
    url: `https://www.neopets.com/objects.phtml?type=shop&obj_type=${s.id}`,
  })),
];
export function searchDesk(
  query: string,
  shortcuts: Shortcut[] = [],
): DeskSearchResult[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return sections.slice(0, 6);
  const custom: DeskSearchResult[] = shortcuts
    .filter((s) => s.kind === "url")
    .map((s) => ({
      id: `shortcut-${s.id}`,
      label: s.label,
      detail: "Quick link",
      url: s.url,
    }));
  const urls = new Set(custom.map((r) => ("url" in r ? r.url : "")));
  return [
    ...custom,
    ...searchIndex.filter((r) => !("url" in r) || !urls.has(r.url)),
  ]
    .filter((r) =>
      words.every((w) =>
        `${r.label} ${r.detail} ${r.keywords ?? ""}`.toLowerCase().includes(w),
      ),
    )
    .sort(
      (a, b) =>
        Number(b.label.toLowerCase().startsWith(query.trim().toLowerCase())) -
        Number(a.label.toLowerCase().startsWith(query.trim().toLowerCase())),
    )
    .slice(0, 12);
}
