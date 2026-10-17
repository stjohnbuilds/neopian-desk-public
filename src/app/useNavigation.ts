import { resolveNavigation, type Navigation } from "../core/navigation";
import { updateStore, useStore } from "../persistence/store";

/** Navigation uses the same serialized, acknowledged saves as the user's data. */
export function navigateAndWait(change: Partial<Navigation>) {
  return updateStore((store) => ({
    ...store,
    navigation: { ...resolveNavigation(store.navigation), ...change },
  }));
}

export function navigate(change: Partial<Navigation>) {
  void navigateAndWait(change).catch(() => {
    // The shared storage status displays the error; the current page stays open.
  });
}

export function useNavigation() {
  return resolveNavigation(useStore().navigation);
}
