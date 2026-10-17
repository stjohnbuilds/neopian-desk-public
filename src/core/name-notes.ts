import { nameDefinitions } from "./name-catalogue";
import type { NameState } from "./names";

export function nameNote(state: NameState, name: string): string {
  const saved = state.notes?.[name];
  if (saved) return saved.text;
  const record = state.records[name];
  // Older imported details describe how a check happened; they remain in its history.
  if (
    record?.source === "Manual" &&
    record.action === "check" &&
    record.detail !== undefined
  )
    return record.detail;
  return nameDefinitions[name]?.text || "";
}
