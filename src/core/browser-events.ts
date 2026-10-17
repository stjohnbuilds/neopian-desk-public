import type { BrowserEvent } from "../persistence/store";
export function mergeBrowserEvents(
  previous: BrowserEvent[],
  incoming: BrowserEvent[],
): BrowserEvent[] {
  const events = [...previous];
  for (const data of incoming) {
    if (
      !data ||
      typeof data.event !== "string" ||
      !data.event.trim() ||
      data.event.length > 20000 ||
      !Number.isFinite(data.timestamp) ||
      data.timestamp <= 0 ||
      data.timestamp > Date.now() + 300000 ||
      !["regular", "premium", "faerieQuest"].includes(data.type)
    )
      throw Error("Invalid event observation.");
    if (
      !events.some(
        (e) =>
          e.account === data.account &&
          e.event === data.event &&
          e.type === data.type &&
          Math.abs(e.timestamp - data.timestamp) < 15000,
      )
    )
      events.push({
        account: data.account,
        event: data.event,
        type: data.type,
        timestamp: data.timestamp,
      });
  }
  if (events.length > 50000)
    throw Error("The event log is full. Export older events before retrying.");
  return events.sort((a, b) => b.timestamp - a.timestamp);
}
