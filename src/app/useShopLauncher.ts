import { useEffect, useSyncExternalStore } from "react";
import { request } from "../core/bridge";
import { createShopLauncher } from "../core/shop-launcher";
const launcher = createShopLauncher((shopIDs) =>
  request("openShops", { shopIDs }),
);
export function useShopLauncher() {
  const state = useSyncExternalStore(launcher.subscribe, launcher.getSnapshot);
  useEffect(() => {
    const receive = (event: Event) => launcher.nativeBatch((event as CustomEvent).detail || {});
    window.addEventListener("desk-shop-helper-state", receive);
    return () => window.removeEventListener("desk-shop-helper-state", receive);
  }, []);
  return { ...state, open: launcher.open, stop: () => request("stopShopBatch") };
}
