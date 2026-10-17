import { useSyncExternalStore } from "react";
import { request } from "./bridge";
import {
  estimateTargets,
  estimateKey,
  mergeEstimates,
  readEstimates,
} from "./trade-estimates";
import { updateStore, onStoreRestore, getState } from "../persistence/store";
let state = { busy: false, message: "" };
let generation = 0;
const listeners = new Set<() => void>();
const emit = (next: typeof state) => {
  state = next;
  listeners.forEach((l) => l());
};
export function useTradeRefresh() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
  );
}
export async function cancelTradeRefresh() {
  if (!state.busy) return;
  generation++;
  await request("cancelTradeEstimates").catch(() => {});
  emit({ busy: false, message: "Refresh cancelled. Previous estimates kept." });
}
onStoreRestore(() => {
  if (state.busy) void cancelTradeRefresh();
});
export async function refreshTradeEstimates() {
  if (state.busy) return;
  const targets = estimateTargets(getState().legacy);
  const current = ++generation;
  emit({
    busy: true,
    message: `Checking all ${targets.length} items. If the ItemDB connection window opens, finish connecting there and choose Refresh now.`,
  });
  try {
    const response = await request("refreshTradeEstimates", {
      names: targets.map((i) => i.name),
    });
    if (generation !== current) return;
    let summary = "";
    await updateStore((s) => {
      if (generation !== current) throw Error("Refresh cancelled.");
      const result = mergeEstimates(
        readEstimates(s.legacy),
        response,
        new Date().toISOString(),
        targets,
      );
      summary = `${result.updated} updated, ${result.unchanged} unchanged, ${result.failed} unavailable. Previous prices kept for unavailable items.`;
      return {
        ...s,
        legacy: {
          ...s.legacy,
          [estimateKey]: JSON.stringify(result.estimates),
        },
      };
    });
    if (generation === current) emit({ busy: false, message: summary });
  } catch (e) {
    if (generation === current)
      emit({
        busy: false,
        message: `${e instanceof Error ? e.message : "Refresh failed."} Previous estimates kept.`,
      });
  }
}
