/** One in-flight shop opening across every control; native replies identify the request. */
export function createShopLauncher(send: (ids: number[]) => Promise<unknown>) {
  let state = { opening: false, message: "", batchRunning: false, batchMessage: "" };
  const listeners = new Set<() => void>();
  const publish = (next: typeof state) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  return {
    nativeBatch(value: {batchRunning?: unknown; batchMessage?: unknown}) {
      const batchRunning = value.batchRunning === true;
      const batchMessage = typeof value.batchMessage === "string" ? value.batchMessage : "";
      if (batchRunning !== state.batchRunning || batchMessage !== state.batchMessage)
        publish({...state, batchRunning, batchMessage});
    },
    getSnapshot: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    async open(ids: number[]) {
      if (state.opening || !ids.length) return;
      publish({
        ...state,
        opening: true,
        message: `Opening ${ids.length} shops in your browser…`,
      });
      try {
        await send([...ids]);
        publish({
          ...state,
          opening: false,
          message: `Opened ${ids.length} shops in your browser.`,
        });
      } catch (error) {
        publish({
          ...state,
          opening: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
