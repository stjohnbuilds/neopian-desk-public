import { mergeBrowserEvents } from "../core/browser-events";
import { syncTraining, emptyTraining } from "../core/training";
import { defaultReminders } from "../core/timers";
import { emptyProfile, validateProfile, type Profile } from "../core/profile";
import {
  validateAccountColors,
  type AccountColors,
} from "../core/account-colors";
import {
  validateTraining,
  validateTrainingSnapshot,
  type TrainingState,
  type TrainingSnapshot,
} from "../core/training";
import { validateNameReview, type NameReview } from "../core/name-review";
import { validateNavigation, type Navigation } from "../core/navigation";
import { validateLegacy } from "./validate-legacy";
import {
  validateCollections,
  mergeCollections,
  mergeAlbums,
  type Collections,
} from "../core/collections";
import { validateTradingLinks, mergeSaleBackups } from "../core/trading-sales";
import { accounting, type Purchase } from "../core/accounting";
import { useSyncExternalStore } from "react";
import {
  mergeObservations,
  mergeNameNotes,
  parseNameNotes,
  parseObservations,
  type NameState,
} from "../core/names";
import { isNative, request } from "../core/bridge";

export interface Album {
  account: string;
  page: number;
  observedAt: number;
  items: { name: string; image: string; position: number; owned: boolean }[];
}
export interface BrowserEvent {
  event: string;
  timestamp: number;
  type: string;
  account: string;
}
export interface NativeData {
  purchases: Purchase[];
  browser: {
    version: number;
    albums: Record<string, Album>;
    events: BrowserEvent[];
    training?: Record<string, TrainingSnapshot>;
  };
}
export interface Store {
  format: "neopian-desk-public";
  version: 1;
  revision: number;
  legacy: Record<string, string>;
  names: NameState;
  native: NativeData;
  nameReview?: NameReview;
  navigation?: Navigation;
  training?: TrainingState;
  pageCodes?: Record<string, string>;
  profile: Profile;
  accountColors?: AccountColors;
  collections?: Collections;
}
export function createInitialState(): Store {
  return {
    format: "neopian-desk-public",
    version: 1,
    revision: 0,
    profile: emptyProfile(),
    legacy: {},
    names: { records: {}, history: [], exclusions: [] },
    native: {
      purchases: [],
      browser: { version: 1, albums: {}, events: [], training: {} },
    },
  };
}

export function validateStore(value: unknown): asserts value is Store {
  const s = value as Store;
  if (
    !s ||
    s.format !== "neopian-desk-public" ||
    s.version !== 1 ||
    !Number.isSafeInteger(s.revision) ||
    !s.legacy ||
    Array.isArray(s.legacy) ||
    !Object.values(s.legacy).every((v) => typeof v === "string") ||
    !s.names ||
    !Array.isArray(s.names.history) ||
    !Array.isArray(s.names.exclusions) ||
    !s.names.exclusions.every((n) => typeof n === "string") ||
    !s.native ||
    !Array.isArray(s.native.purchases) ||
    !s.native.browser
  )
    throw Error("This is not a valid Neopian Desk backup.");
  validateProfile(s.profile);
  const ledger = s.legacy.nd_shop_profit_v1
    ? JSON.parse(s.legacy.nd_shop_profit_v1)
    : {};
  const receipts = s.legacy.nd_trading_sales_v1
    ? JSON.parse(s.legacy.nd_trading_sales_v1)
    : {};
  const ownedRecords = [
    ...s.native.purchases,
    ...Object.values(s.native.browser.albums),
    ...s.native.browser.events,
    ...Object.values(s.native.browser.training ?? {}),
    ...(ledger.restoredPurchases ?? []),
    ...(receipts.receipts ?? []),
  ];
  if (
    ownedRecords.some(
      (r: { account?: string }) =>
        !s.profile.account || r.account !== s.profile.account,
    )
  )
    throw Error(
      "These records belong to a different account. Nothing was imported.",
    );
  if (s.training !== undefined) validateTraining(s.training);
  if (s.native.browser.training !== undefined) {
    const snapshots = s.native.browser.training;
    if (!snapshots || typeof snapshots !== "object" || Array.isArray(snapshots))
      throw Error("Invalid saved training observations.");
    for (const [school, snapshot] of Object.entries(snapshots)) {
      validateTrainingSnapshot(snapshot);
      if (snapshot.school !== school) throw Error("Invalid training school.");
    }
  }
  if (s.accountColors !== undefined) validateAccountColors(s.accountColors);
  if (s.collections !== undefined) validateCollections(s.collections);
  if (s.nameReview !== undefined) validateNameReview(s.nameReview);
  if (s.navigation !== undefined) validateNavigation(s.navigation);
  if (
    s.pageCodes !== undefined &&
    (!s.pageCodes ||
      typeof s.pageCodes !== "object" ||
      Array.isArray(s.pageCodes) ||
      !Object.entries(s.pageCodes).every(
        ([key, code]) =>
          /^(user-lookup(?:-alt)?|pet(?:-lookup)?:[a-z0-9_]{3,20}|neo-signature:(default|art):(html|signature))$/.test(
            key,
          ) &&
          typeof code === "string" &&
          code.length <= 1_000_000,
      ))
  )
    throw Error("Invalid saved page code. Nothing imported.");
  parseObservations(s.names);
  parseObservations(s.names.history);
  parseNameNotes(s.names.notes);
  for (const [key, raw] of Object.entries(s.legacy))
    validateLegacy(key, JSON.parse(raw));
  validateTradingLinks(s.legacy);
  const browser = s.native.browser;
  if (
    !browser.albums ||
    typeof browser.albums !== "object" ||
    Array.isArray(browser.albums) ||
    !Array.isArray(browser.events)
  )
    throw Error("Invalid collection data. Nothing imported.");
  for (const album of Object.values(browser.albums)) {
    if (
      !album ||
      !Number.isInteger(album.page) ||
      !Number.isFinite(album.observedAt) ||
      !Array.isArray(album.items) ||
      !album.items.every(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.owned === "boolean" &&
          Number.isInteger(item.position),
      )
    )
      throw Error("Invalid album. Nothing imported.");
  }
  if (
    s.native.purchases.length > 100_000 ||
    !s.native.purchases.every(accounting.validPurchase) ||
    new Set(s.native.purchases.map((p) => p.id)).size !==
      s.native.purchases.length
  )
    throw Error("Invalid purchases. Nothing imported.");
  if (
    !browser.events.every(
      (e) =>
        e &&
        typeof e.event === "string" &&
        typeof e.account === "string" &&
        ["regular", "premium", "faerieQuest"].includes(e.type) &&
        Number.isFinite(e.timestamp) &&
        e.timestamp > 0,
    )
  )
    throw Error("Invalid event history. Nothing imported.");
}
const key = "neopian-desk-public-state";
let initialError = "";
let state = createInitialState();
try {
  const saved =
    typeof window === "undefined"
      ? null
      : (window.deskInitialState ??
        JSON.parse(localStorage.getItem(key) || "null"));
  if (saved) {
    validateStore(saved);
    state = saved;
  }
} catch (error) {
  initialError = String(error);
}
let failure = initialError;
let busy = false;
const listeners = new Set<() => void>();
const restoreListeners = new Set<(restored: Store) => void>();
/** Reset temporary UI views only after a full restore has been durably saved. */
export function onStoreRestore(listener: (restored: Store) => void) {
  restoreListeners.add(listener);
  return () => {
    restoreListeners.delete(listener);
  };
}
const notify = () => listeners.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getState = () => state;
export const getFailure = () => failure;
export function useStore() {
  return useSyncExternalStore(subscribe, getState);
}
export function useStorageStatus() {
  return useSyncExternalStore(
    subscribe,
    () => failure || (busy ? "Saving…" : ""),
  );
}
let queue = Promise.resolve();
function persist(
  change: (previous: Store) => Store,
  recovering = false,
  restoredSource?: string,
): Promise<void> {
  const run = queue.then(async () => {
    if (initialError && !recovering)
      throw Error(
        "Saved data could not be read. Restore a verified backup before editing.",
      );
    busy = true;
    notify();
    try {
      const next = { ...change(state), revision: state.revision + 1 };
      validateStore(next);
      if (
        state.profile.account &&
        state.profile.account !== next.profile.account
      )
        throw Error(
          "This desk belongs to another account. Export a backup before creating a separate desk.",
        );
      if (isNative())
        await request("save", {
          text: JSON.stringify(next),
          ...(restoredSource === undefined ? {} : { restoredSource }),
        });
      else localStorage.setItem(key, JSON.stringify(next));
      state = next;
      failure = "";
      initialError = "";
      if (recovering) restoreListeners.forEach((listener) => listener(next));
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      busy = false;
      notify();
    }
  });
  queue = run.catch(() => {});
  return run;
}
if (typeof window !== "undefined")
  window.addEventListener("desk-state", ((event: CustomEvent<Store>) => {
    const incoming = event.detail;
    queue = queue
      .then(() => {
        validateStore(incoming);
        if (incoming.revision > state.revision) {
          state = incoming;
          failure = "";
          notify();
        }
      })
      .catch((error) => {
        failure = String(error);
        notify();
      });
  }) as EventListener);
export function updateStore(change: (previous: Store) => Store): Promise<void> {
  return persist(change);
}
export function readLegacy<T>(s: Store, key: string, fallback: T): T {
  if (!Object.hasOwn(s.legacy, key)) return fallback;
  return JSON.parse(s.legacy[key]) as T;
}
export async function setLegacy<T>(key: string, value: T) {
  await updateStore((s) => ({
    ...s,
    legacy: { ...s.legacy, [key]: JSON.stringify(value) },
  }));
}
export async function restoreBackup(
  value: unknown,
  sourceText = JSON.stringify(value),
) {
  validateStore(value);
  // Restore merges names, preserves the raw original keys, and is one atomic write.
  await persist(
    (current) => {
      const trainingSnapshots = { ...current.native.browser.training };
      for (const [school, snapshot] of Object.entries(
        value.native.browser.training ?? {},
      ))
        if (
          !trainingSnapshots[school] ||
          trainingSnapshots[school].observedAt < snapshot.observedAt
        )
          trainingSnapshots[school] = snapshot;
      const restoredReminders = JSON.parse(
        value.legacy.nd_reminders ?? JSON.stringify(defaultReminders),
      );
      const training = syncTraining(
        {
          ...(value.training ?? emptyTraining()),
          enabled: current.training?.enabled === true,
        },
        restoredReminders.timers,
        Object.values(trainingSnapshots),
      );
      return {
        ...value,
        training: training.state,
        legacy: {
          ...mergeSaleBackups(current.legacy, value.legacy),
          nd_reminders: JSON.stringify({
            ...restoredReminders,
            timers: training.timers,
          }),
        },
        collections: mergeCollections(current.collections, value.collections),
        native: {
          ...value.native,
          purchases: accounting.mergePurchases(
            current.native.purchases,
            value.native.purchases,
          ),
          browser: {
            ...value.native.browser,
            events: mergeBrowserEvents(
              current.native.browser.events,
              value.native.browser.events,
            ),
            training: trainingSnapshots,
            albums: mergeAlbums(
              current.native.browser.albums,
              value.native.browser.albums,
            ),
          },
        },
        names: {
          ...mergeNameNotes(
            mergeObservations(current.names, [
              ...parseObservations(value.names),
              ...value.names.history,
            ]),
            value.names.notes,
          ),
          exclusions: [
            ...new Set([
              ...current.names.exclusions,
              ...value.names.exclusions,
            ]),
          ],
        },
      };
    },
    true,
    sourceText,
  );
}
