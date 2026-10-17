import workbook from "../data/avatar-workbook.json";
import { avatarEntries, isCollected, type AvatarEntry } from "./avatars";

export const avatarWorkbook = workbook;
export type WorkbookRow = (typeof workbook.entries)[number];
const nameKey = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\s+-\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s|$|-).*/i,
      "",
    )
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const names = new Map<string, Set<AvatarEntry>>();
for (const entry of avatarEntries) {
  for (const value of [entry.name, entry.referenceName].filter(
    Boolean,
  ) as string[]) {
    const key = nameKey(value);
    if (!names.has(key)) names.set(key, new Set());
    names.get(key)!.add(entry);
  }
}
export const workbookMappings = workbook.entries.map((row) => {
  const candidates = [...(names.get(nameKey(row.name)) || [])];
  return {
    row,
    entry: candidates.length === 1 ? candidates[0] : undefined,
    reason:
      candidates.length > 1
        ? "More than one avatar matches this name"
        : "No unique catalogue match",
  };
});
export function workbookRows(entry: AvatarEntry): WorkbookRow[] {
  return workbookMappings
    .filter((m) => m.entry?.id === entry.id)
    .map((m) => m.row);
}
export function workbookDifficulty(entry: AvatarEntry): number | null {
  const rows = workbookRows(entry);
  if (!rows.length || rows.some((row) => row.difficulty === null)) return null;
  const values = new Set(rows.map((row) => row.difficulty));
  return values.size === 1 ? rows[0].difficulty : null;
}
export function byWorkbookDifficulty(entries: readonly AvatarEntry[]) {
  return [...entries].sort(
    (a, b) =>
      (workbookDifficulty(a) ?? Infinity) - (workbookDifficulty(b) ?? Infinity),
  );
}
export function remainingWorkbookAvatars(legacy: Record<string, string>) {
  return byWorkbookDifficulty(
    avatarEntries.filter(
      (entry) =>
        !entry.retired &&
        !isCollected(legacy, entry) &&
        workbookRows(entry).length > 0,
    ),
  );
}

export type WorkbookFilter = "all" | "free" | "anytime" | "daily";
export function matchesWorkbookFilter(
  entry: AvatarEntry,
  filter: WorkbookFilter,
) {
  if (filter === "all") return true;
  const rows = workbookRows(entry);
  return (
    rows.length > 0 &&
    rows.every((row) =>
      filter === "free"
        ? row.cost === 0
        : filter === "anytime"
          ? row.timing === "Anytime"
          : row.daily === "Yes",
    )
  );
}
export function workbookField(entry: AvatarEntry, field: keyof WorkbookRow) {
  const values = [
    ...new Set(
      workbookRows(entry).map((row) => String(row[field] ?? "").trim()),
    ),
  ];
  if (values.length !== 1) return "Unclear in sheet";
  const value = values[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "Unclear in sheet";
  if (field === "cost" && value === "0") return "Free";
  return value || "Not recorded";
}
export function byActivityDifficulty<T extends { entries: AvatarEntry[] }>(
  groups: readonly T[],
) {
  const score = (group: T) => {
    const scores = group.entries.map(workbookDifficulty);
    return scores.some((score) => score === null)
      ? Infinity
      : Math.min(...(scores as number[]));
  };
  return [...groups].sort((a, b) => score(a) - score(b));
}
