import type { Store, Album } from "../persistence/store";
import { accounting, type Ledger } from "./accounting";
import type { MarketSearch } from "./priority-market";

export type CollectionKind = "stamps" | "cards";
export interface CollectionItem {
  id: string;
  kind: CollectionKind;
  group: string;
  name: string;
  image: string;
  album: string;
  page?: number;
  position?: number;
  price: number | null;
  priceDate: string | null;
  priceSource: string;
  sourceUrl: string;
}
export interface CollectionMark {
  done: boolean | null;
  updatedAt: number;
}
export interface CollectionView {
  group: string;
  onlyMissing: boolean;
  album?: string;
  useSsw?: boolean;
  batch?: string[];
}
export interface Collections {
  version: 1;
  marks: Record<string, CollectionMark>;
  views: Partial<Record<CollectionKind, CollectionView>>;
}
export const emptyCollections = (): Collections => ({
  version: 1,
  marks: {},
  views: {},
});
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateCollections(v: unknown): asserts v is Collections {
  if (
    !object(v) ||
    v.version !== 1 ||
    !object(v.marks) ||
    !object(v.views) ||
    Object.keys(v.marks).length > 10000 ||
    !Object.entries(v.marks).every(
      ([id, mark]) =>
        /^(stamp:\d{1,3}:[A-Za-z0-9_-]+|card:[A-Za-z0-9_-]+)$/.test(id) &&
        object(mark) &&
        (typeof mark.done === "boolean" || mark.done === null) &&
        typeof mark.updatedAt === "number" &&
        Number.isSafeInteger(mark.updatedAt) &&
        mark.updatedAt > 0,
    ) ||
    !Object.entries(v.views).every(
      ([key, view]) =>
        ["stamps", "cards"].includes(key) &&
        object(view) &&
        typeof view.group === "string" &&
        view.group.length <= 80 &&
        typeof view.onlyMissing === "boolean" &&
        (view.useSsw === undefined || typeof view.useSsw === "boolean") &&
        (view.album === undefined ||
          (typeof view.album === "string" &&
            view.album.trim().length > 0 &&
            view.album.length <= 120)) &&
        (view.batch === undefined ||
          (Array.isArray(view.batch) &&
            view.batch.length > 0 &&
            view.batch.length <= 10 &&
            new Set(view.batch).size === view.batch.length &&
            view.batch.every(
              (id) =>
                typeof id === "string" &&
                (key === "stamps"
                  ? /^stamp:\d{1,3}:[A-Za-z0-9_-]+$/
                  : /^card:[A-Za-z0-9_-]+$/
                ).test(id),
            ))),
    )
  )
    throw Error("Invalid collection checklist. Existing progress kept.");
}
export function mergeCollections(
  current?: Collections,
  incoming?: Collections,
): Collections | undefined {
  if (!current && !incoming) return undefined;
  const marks = { ...current?.marks };
  for (const [id, mark] of Object.entries(incoming?.marks ?? {}))
    if (!marks[id] || mark.updatedAt > marks[id].updatedAt) marks[id] = mark;
  return {
    version: 1,
    marks,
    views: { ...current?.views, ...incoming?.views },
  };
}
/** A later observation cannot erase an exact, previously confirmed album slot. */
export function mergeAlbums(
  current: Record<string, Album>,
  incoming: Record<string, Album>,
): Record<string, Album> {
  const result = { ...current };
  for (const [key, next] of Object.entries(incoming)) {
    const old = result[key];
    if (!old) {
      result[key] = next;
      continue;
    }
    if (old.account !== next.account || old.page !== next.page) continue;
    if (
      next.items.some((item) =>
        old.items.some(
          (previous) =>
            previous.position === item.position &&
            (previous.image !== item.image || previous.name !== item.name),
        ),
      )
    )
      continue;
    const newest = next.observedAt >= old.observedAt ? next : old;
    const older = newest === next ? old : next;
    const items = newest.items.map((item) => ({
      ...item,
      owned:
        item.owned ||
        older.items.some(
          (previous) =>
            previous.position === item.position &&
            previous.image === item.image &&
            previous.name === item.name &&
            previous.owned,
        ),
    }));
    for (const item of older.items)
      if (!items.some((i) => i.position === item.position)) items.push(item);
    result[key] = { ...newest, items };
  }
  return result;
}
export const collectionName = (name: string) =>
  name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
export interface CollectionRow {
  item: CollectionItem;
  collected: boolean;
  inAlbum: boolean;
  purchased: boolean;
  status: string;
}
/** Sum the complete scope; unknown prices cannot become a zero-cost completion. */
export function remainingCollectionCost(rows: readonly CollectionRow[]) {
  const missing = rows.filter((row) => !row.inAlbum && !row.purchased);
  const priced = missing.filter(
    (row) =>
      row.item.price !== null &&
      Number.isFinite(row.item.price) &&
      row.item.price >= 0,
  );
  return {
    remaining: missing.length,
    priced: priced.length,
    unpriced: missing.length - priced.length,
    subtotal:
      priced.length || !missing.length
        ? priced.reduce((sum, row) => sum + row.item.price!, 0)
        : null,
  };
}
/** Keep opened identities in place while live observations change their status. */
export function collectionBatch(
  rows: CollectionRow[],
  onlyMissing: boolean,
  ids?: readonly string[],
) {
  const eligible = (row: CollectionRow) => !onlyMissing || !row.collected;
  const positions = new Map(rows.map((row, index) => [row.item.id, index]));
  const retained = ids?.filter((id) => positions.has(id));
  const batch = retained?.length
    ? retained.map((id) => rows[positions.get(id)!])
    : rows.filter(eligible).slice(0, 10);
  const indexes = batch.map((row) => positions.get(row.item.id)!);
  const first = indexes.length ? Math.min(...indexes) : 0;
  const last = indexes.length ? Math.max(...indexes) : -1;
  return {
    batch,
    visible: batch.filter(eligible),
    previous: rows
      .slice(0, first)
      .filter(eligible)
      .slice(-10)
      .map((row) => row.item.id),
    next: rows
      .slice(last + 1)
      .filter(eligible)
      .slice(0, 10)
      .map((row) => row.item.id),
    remaining: rows.filter((row) => !row.collected).length,
  };
}
export function collectionRows(
  items: readonly CollectionItem[],
  store: Store,
): CollectionRow[] {
  const ledger: Ledger = store.legacy.nd_shop_profit_v1
    ? JSON.parse(store.legacy.nd_shop_profit_v1)
    : { version: 1, sales: [], restoredPurchases: [] };
  const held = accounting
    .account(
      accounting.mergePurchases(
        store.native.purchases,
        ledger.restoredPurchases,
      ),
      ledger.sales,
    )
    .rows.filter((p) => !p.sale && p.account === store.profile.account);
  const latestPurchase = new Map<string, number>();
  for (const receipt of held) {
    const name = collectionName(receipt.name);
    latestPurchase.set(
      name,
      Math.max(latestPurchase.get(name) ?? 0, receipt.boughtAt),
    );
  }
  const nameCounts = new Map<string, number>();
  for (const item of items)
    nameCounts.set(
      collectionName(item.name),
      (nameCounts.get(collectionName(item.name)) ?? 0) + 1,
    );
  return items
    .map((item) => {
      const album =
        item.page === undefined
          ? undefined
          : store.native.browser.albums[String(item.page)];
      const known =
        album?.account === store.profile.account
          ? album.items.find(
              (i) =>
                i.image === item.image &&
                i.position === item.position &&
                i.name === item.name,
            )
          : undefined;
      const inAlbum = known?.owned === true;
      const mark = store.collections?.marks[item.id];
      const boughtAt =
        nameCounts.get(collectionName(item.name)) === 1
          ? latestPurchase.get(collectionName(item.name))
          : undefined;
      const purchased =
        !!boughtAt && !(mark?.done === false && mark.updatedAt >= boughtAt);
      const collected = inAlbum;
      return {
        item,
        collected,
        inAlbum,
        purchased,
        status: inAlbum
          ? "In album"
          : purchased
            ? "Bought · waiting for album confirmation"
            : "Not confirmed in album",
      };
    })
    .sort(
      (a, b) =>
        (a.item.price ?? Infinity) - (b.item.price ?? Infinity) ||
        a.item.name.localeCompare(b.item.name),
    );
}
export function collectionSearch(
  item: CollectionItem,
  _legacyUseSsw = false,
): MarketSearch {
  return {
    name: item.name,
    market:
      item.price !== null && item.price >= 1_000_000 ? "trading" : "wizard",
  };
}
export function withCollectionMark(
  store: Store,
  id: string,
  done: boolean | null,
  now = Date.now(),
): Store {
  const collections = store.collections ?? emptyCollections();
  return {
    ...store,
    collections: {
      ...collections,
      marks: { ...collections.marks, [id]: { done, updatedAt: now } },
    },
  };
}
export function withCollectionView(
  store: Store,
  kind: CollectionKind,
  view: CollectionView,
): Store {
  const collections = store.collections ?? emptyCollections();
  return {
    ...store,
    collections: {
      ...collections,
      views: { ...collections.views, [kind]: view },
    },
  };
}
