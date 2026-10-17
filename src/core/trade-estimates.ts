import catalogues from "../data/catalogues.json";
import turnover from "../data/trade-turnover.json";
// Saved buy/sell targets are choices, never market quotes.
export interface PriorityItem {
  name: string;
  slug: string;
  buyAt: string;
  buyDetail?: string;
  buyCeiling: number;
  sellAt?: string;
  sellDetail?: string;
  quantity: string;
  note: string;
  reference?: { label: string; url: string };
}
export const priorityKey = "nd_priority_items";
export function readPriorityItems(
  legacy: Record<string, string>,
): PriorityItem[] {
  return legacy[priorityKey] ? JSON.parse(legacy[priorityKey]) : [];
}
export function validPriorityItems(value: unknown): value is PriorityItem[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    new Set(value.map((i) => i?.name?.toLowerCase())).size === value.length &&
    value.every(
      (i) =>
        i &&
        typeof i.name === "string" &&
        i.name.trim() === i.name &&
        i.name.length > 0 &&
        i.name.length <= 200 &&
        typeof i.slug === "string" &&
        /^[a-z0-9-]*$/.test(i.slug) &&
        i.slug.length <= 200 &&
        Number.isSafeInteger(i.buyCeiling) &&
        i.buyCeiling >= 0 &&
        i.buyCeiling <= 2000000000 &&
        ["buyAt", "quantity", "note"].every(
          (k) => typeof i[k] === "string" && i[k].length <= 2000,
        ) &&
        ["buyDetail", "sellAt", "sellDetail"].every(
          (k) =>
            i[k] === undefined ||
            (typeof i[k] === "string" && i[k].length <= 2000),
        ),
    )
  );
}

export const tradeCandidates = [
  ...turnover.items,
  ...catalogues.DESK_TRADE_WATCHLIST.items.filter(
    (i) => !turnover.items.some((t) => t.name === i.name),
  ),
].filter(
  (i) => i.value >= 1_000_000 && i.value <= 15_000_000 && i.rating !== "hts",
);
export const estimateTargets = (legacy: Record<string, string> = {}) =>
  [...readPriorityItems(legacy), ...tradeCandidates].filter(
    (item, index, all) => all.findIndex((i) => i.name === item.name) === index,
  );
export const estimateKey = "nd_trade_estimates";
export interface Estimate {
  value?: number;
  priceDate?: string;
  checkedAt?: string;
  attemptedAt: string;
  error?: string;
}
export interface Estimates {
  version: 1;
  items: Record<string, Estimate>;
}
export const emptyEstimates: Estimates = { version: 1, items: {} };
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const stamp = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 40 && Number.isFinite(Date.parse(v));
const price = (v: unknown): v is number =>
  Number.isSafeInteger(v) &&
  (v as number) > 0 &&
  (v as number) <= 2_000_000_000;
export function validEstimates(value: unknown): value is Estimates {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.items) ||
    Object.keys(value.items).length > 50000
  )
    return false;
  return Object.entries(value.items).every(
    ([name, e]) =>
      name.length > 0 &&
      name.length <= 200 &&
      object(e) &&
      stamp(e.attemptedAt) &&
      (e.error === undefined ||
        (typeof e.error === "string" && e.error.length <= 300)) &&
      (e.value === undefined
        ? e.priceDate === undefined && e.checkedAt === undefined
        : price(e.value) && stamp(e.priceDate) && stamp(e.checkedAt)),
  );
}
export function readEstimates(legacy: Record<string, string>): Estimates {
  return legacy[estimateKey] ? JSON.parse(legacy[estimateKey]) : emptyEstimates;
}
export function effectiveEstimate(
  name: string,
  estimates: Estimates,
  seed?: { value: number; priceDate: string },
): Estimate | undefined {
  const saved = estimates.items[name];
  return saved?.value !== undefined
    ? saved
    : seed
      ? { ...seed, ...saved, attemptedAt: saved?.attemptedAt ?? "" }
      : saved;
}
/** API replies are untrusted. Match exact item names and never replace a newer or valid quote with missing/flagged data. */
export function mergeEstimates(
  previous: Estimates,
  raw: unknown,
  now: string,
  targets: { name: string }[] = estimateTargets(),
): {
  estimates: Estimates;
  updated: number;
  unchanged: number;
  failed: number;
} {
  if (!object(raw) || !stamp(now) || JSON.stringify(raw).length > 2_000_000)
    throw Error(
      "ItemDB returned an unreadable price response. Previous estimates kept.",
    );
  const items = { ...previous.items };
  let updated = 0,
    unchanged = 0,
    failed = 0;
  for (const target of targets) {
    const seed = tradeCandidates.find((i) => i.name === target.name);
    const old = effectiveEstimate(target.name, previous, seed);
    const entry = raw[target.name];
    let error = "No matching ItemDB estimate returned.";
    if (
      object(entry) &&
      entry.name === target.name &&
      entry.type === "np" &&
      object(entry.price)
    ) {
      const p = entry.price;
      if (
        price(p.value) &&
        typeof p.addedAt === "string" &&
        p.addedAt.length <= 120 &&
        Number.isFinite(Date.parse(p.addedAt))
      ) {
        const sourceDate = new Date(p.addedAt).toISOString();
        if (
          p.inflated === true ||
          (Array.isArray(p.flags) &&
            p.flags.some((f) => ["inflation", "outdated"].includes(String(f))))
        )
          error = "ItemDB flagged this estimate. Previous estimate kept.";
        else if (Date.parse(sourceDate) > Date.parse(now) + 86400000)
          error =
            "ItemDB returned a future price date. Previous estimate kept.";
        else if (
          old?.priceDate &&
          Date.parse(sourceDate) < Date.parse(old.priceDate)
        )
          error = "ItemDB returned an older estimate. Previous estimate kept.";
        else {
          items[target.name] = {
            value: p.value,
            priceDate: sourceDate,
            checkedAt: now,
            attemptedAt: now,
          };
          if (
            p.value === old?.value &&
            Date.parse(sourceDate) === Date.parse(old.priceDate ?? "")
          )
            unchanged++;
          else updated++;
          continue;
        }
      } else error = "ItemDB has no usable NP price. Previous estimate kept.";
    }
    items[target.name] = {
      ...previous.items[target.name],
      attemptedAt: now,
      error,
    };
    failed++;
  }
  return { estimates: { version: 1, items }, updated, unchanged, failed };
}
