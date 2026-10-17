import { mergeBrowserEvents } from "../src/core/browser-events";
import {
  createInitialState,
  validateStore,
  type Store,
} from "../src/persistence/store";
import { accounting } from "../src/core/accounting";
import { mergeAlbums } from "../src/core/collections";
import { mergeTradingReceipts } from "../src/core/trading-sales";
import { mergeCapturedSales } from "../src/core/native-sales-history";
import {
  syncTraining,
  emptyTraining,
  validateTrainingSnapshot,
} from "../src/core/training";
import { defaultReminders } from "../src/core/timers";
export { createInitialState, validateStore };

// Save an entire observation envelope once. A failed batch leaves both the
// previous save and the browser outbox available for a safe retry.
export function observe(previous: Store, kind: string, envelope: any): Store {
  if (!previous.profile.account)
    throw Error("Save your Neopets username in Settings first.");
  const key = (
    {
      purchases: "purchases",
      "trading-sales": "receipts",
      events: "events",
    } as Record<string, string>
  )[kind];
  const records: any[] = key ? envelope?.[key] : [envelope];
  if (!Array.isArray(records) || records.length > 500)
    throw Error("Invalid observation batch.");
  if (
    records.some((data) => !data || data.account !== previous.profile.account)
  )
    throw Error("The observation belongs to a different account.");
  let state = structuredClone(previous);
  if (kind === "purchases")
    state.native.purchases = accounting.mergePurchases(
      state.native.purchases,
      records,
    );
  else if (kind === "trading-sales")
    state.legacy = mergeTradingReceipts(state.legacy, records);
  else if (kind === "sales-history")
    state = mergeCapturedSales(state, envelope).store;
  else if (kind === "stamps") {
    const data = records[0];
    if (
      !Number.isInteger(data.page) ||
      data.page < 1 ||
      data.page > 100 ||
      !validTime(data.observedAt) ||
      !Array.isArray(data.items) ||
      data.items.length > 25 ||
      !data.items.length ||
      new Set(data.items.map((i: any) => i?.position)).size !==
        data.items.length ||
      !data.items.every(
        (i: any) =>
          i &&
          typeof i.name === "string" &&
          i.name.length > 0 &&
          i.name.length <= 200 &&
          typeof i.image === "string" &&
          /^[a-zA-Z0-9_-]+$/.test(i.image) &&
          Number.isInteger(i.position) &&
          i.position >= 1 &&
          i.position <= 25 &&
          typeof i.owned === "boolean",
      )
    )
      throw Error("Invalid album observation.");
    state.native.browser.albums = mergeAlbums(state.native.browser.albums, {
      [String(data.page)]: data,
    });
  } else if (kind === "training") {
    const data = records[0];
    validateTrainingSnapshot(data);
    const old = state.native.browser.training ?? {};
    if (!old[data.school] || old[data.school]!.observedAt < data.observedAt)
      old[data.school] = data;
    state.native.browser.training = old;
    const reminders = JSON.parse(
      state.legacy.nd_reminders ?? JSON.stringify(defaultReminders),
    );
    const sync = syncTraining(
      state.training ?? emptyTraining(),
      reminders.timers,
      Object.values(old),
    );
    state.training = sync.state;
    state.legacy.nd_reminders = JSON.stringify({
      ...reminders,
      timers: sync.timers,
    });
  } else if (kind === "events") {
    state.native.browser.events = mergeBrowserEvents(
      state.native.browser.events,
      records,
    );
  } else throw Error("Unknown observation type.");
  if (JSON.stringify(state) === JSON.stringify(previous)) return previous;
  state.revision++;
  validateStore(state);
  return state;
}
function validTime(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= Date.now() + 300000
  );
}

export {
  readEstimates,
  mergeEstimates,
  estimateKey,
} from "../src/core/trade-estimates";
