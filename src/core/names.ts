export const statuses = {
  unreviewed: "To check",
  exists: "Pet exists",
  frozen: "User account frozen",
  missing: "Available",
  available: "Available",
  created: "Created",
  unavailable: "Name rejected",
  unknown: "Blocked / unsure",
} as const;
export type Status = keyof typeof statuses;
// Legacy exports used "missing". It is the same Available state in every current control.
export const canonicalStatus = (status: Status): Exclude<Status, "missing"> =>
  status === "missing" ? "available" : status;
export interface Observation {
  name: string;
  status: Status;
  action?: "check" | "undo" | "reopen";
  at: string;
  source: "Manual" | "DTI";
  detail?: string;
  httpStatus?: number;
}
export interface NameState {
  records: Record<string, Observation>;
  history: Observation[];
  exclusions: string[];
  notes?: Record<string, NameNote>;
}
export interface NameNote {
  text: string;
  at: string;
}
export const cleanName = (name: string) => name.trim().toLowerCase();
export const isName = (name: string) => /^[a-z0-9]{3,20}$/.test(name);
export function parseObservations(input: unknown): Observation[] {
  const object = input as { records?: Record<string, unknown> };
  const rows = Array.isArray(input)
    ? input
    : object?.records && typeof object.records === "object"
      ? Object.entries(object.records).map(([name, r]) => ({
          ...(r as object),
          name,
        }))
      : null;
  if (!rows || rows.length > 500_000)
    throw Error("Choose a name-check JSON export.");
  return rows.map((row) => {
    if (!row || typeof row.name !== "string")
      throw Error("A record has no name. Nothing imported.");
    const name = cleanName(row.name);
    const source = row.source ?? "Manual";
    if (
      !isName(name) ||
      !Object.hasOwn(statuses, row.status) ||
      typeof row.at !== "string" ||
      !Number.isFinite(Date.parse(row.at)) ||
      !["Manual", "DTI"].includes(source) ||
      (row.action != null &&
        !["check", "undo", "reopen"].includes(row.action)) ||
      (row.detail != null &&
        (typeof row.detail !== "string" || row.detail.length > 500))
    )
      throw Error(`Invalid record for ${name}. Nothing imported.`);
    return { ...row, name, source } as Observation;
  });
}
export function mergeObservations(
  state: NameState,
  incoming: Observation[],
): NameState {
  const records = { ...state.records };
  const history = [...state.history];
  const signature = (r: Observation) => observationKey(r);
  const seen = new Set(history.map(signature));
  for (const record of incoming) {
    if (!seen.has(signature(record))) {
      history.push(record);
      seen.add(signature(record));
    }
    const previous = records[record.name];
    const higherAuthority =
      record.source === "Manual" && previous?.source !== "Manual";
    if (
      !previous ||
      higherAuthority ||
      (record.source === previous.source &&
        Date.parse(record.at) > Date.parse(previous.at))
    )
      records[record.name] = record;
  }
  return { ...state, records, history };
}
export function parseNameNotes(input: unknown): Record<string, NameNote> {
  if (input === undefined) return {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Invalid name notes. Nothing imported.");
  const rows = Object.entries(input);
  if (rows.length > 500_000) throw Error("Too many name notes.");
  for (const [name, note] of rows) {
    if (
      !isName(name) ||
      !note ||
      typeof note.text !== "string" ||
      note.text.length > 500 ||
      typeof note.at !== "string" ||
      !Number.isFinite(Date.parse(note.at))
    )
      throw Error(`Invalid note for ${name}. Nothing imported.`);
  }
  return Object.fromEntries(rows);
}
export function mergeNameNotes(state: NameState, input: unknown): NameState {
  const incoming = parseNameNotes(input);
  if (!Object.keys(incoming).length) return state;
  const notes = { ...state.notes };
  for (const [name, note] of Object.entries(incoming))
    if (!notes[name] || Date.parse(note.at) > Date.parse(notes[name].at))
      notes[name] = note;
  return { ...state, notes };
}
/** A note is metadata, never an availability check. Empty text is an intentional clear. */
export function saveNameNote(
  state: NameState,
  name: string,
  text: string,
  at = new Date().toISOString(),
) {
  return mergeNameNotes(state, {
    [name]: {
      text,
      at: new Date(
        Math.max(
          Date.parse(at),
          Date.parse(state.notes?.[name]?.at || "1970-01-01") + 1,
        ),
      ).toISOString(),
    },
  });
}
export function recordResult(
  state: NameState,
  names: string[],
  status: Exclude<Status, "unreviewed">,
  at = new Date().toISOString(),
  detail?: string,
) {
  const changedAt = correctionTime(state, names, at);
  return mergeObservations(
    state,
    names.map((name) => ({
      name,
      status,
      at: changedAt,
      source: "Manual",
      action: "check",
      ...(detail === undefined ? {} : { detail }),
    })),
  );
}
export function combinations(length: 3 | 4): string[] {
  const result: string[] = [];
  const count = 26 ** length;
  for (let value = 0; value < count; value++) {
    let n = value,
      word = "";
    for (let i = 0; i < length; i++) {
      word = String.fromCharCode(97 + (n % 26)) + word;
      n = Math.floor(n / 26);
    }
    result.push(word);
  }
  return result;
}
export function unusualScore(name: string) {
  return (
    (name.match(/[aeiouy]/g)?.length ?? 0) * 8 -
    (name.match(/[jqxz]/g)?.length ?? 0) * 7 +
    (/(.)\1/.test(name) ? 5 : 0)
  );
}
export function statusMatches(record: Observation | undefined, filter: string) {
  return (
    filter === "all" ||
    (filter === "available" &&
      !!record &&
      canonicalStatus(record.status) === "available") ||
    (filter === "graveyard" &&
      !!record &&
      ["exists", "frozen", "unavailable"].includes(record.status)) ||
    (filter === "unreviewed"
      ? !record || record.status === "unreviewed"
      : record?.status === filter)
  );
}

/** Stable identity excludes optional metadata so older exports still deduplicate. */
export function observationKey(r: Observation) {
  return JSON.stringify([r.name, r.at, r.source, r.status, r.detail ?? ""]);
}
export function newestRecordedNames(state: NameState, names: string[]) {
  const order = new Map(state.history.map((r, i) => [observationKey(r), i]));
  return [...names].sort((a, b) => {
    const left = state.records[a],
      right = state.records[b];
    return (
      Date.parse(right.at) - Date.parse(left.at) ||
      (order.get(observationKey(right)) ?? -1) -
        (order.get(observationKey(left)) ?? -1) ||
      a.localeCompare(b)
    );
  });
}
export interface CheckBatch {
  at: string;
  rows: Observation[];
}
export function recentCheckBatches(state: NameState): CheckBatch[] {
  const batches = new Map<string, Observation[]>();
  const seen = new Set<string>();
  for (const r of state.history) {
    if (
      r.source !== "Manual" ||
      r.status === "unreviewed" ||
      (r.action && r.action !== "check")
    )
      continue;
    const rows = batches.get(r.at) || [];
    const key = observationKey(r);
    if (!seen.has(key)) {
      rows.push(r);
      seen.add(key);
    }
    batches.set(r.at, rows);
  }
  return [...batches]
    .map(([at, rows]) => ({ at, rows }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
export function unchangedBatchRows(state: NameState, batch: CheckBatch) {
  return batch.rows.filter(
    (r) =>
      state.records[r.name] &&
      observationKey(state.records[r.name]) === observationKey(r),
  );
}
function correctionTime(state: NameState, names: string[], at: string) {
  return new Date(
    Math.max(
      Date.parse(at),
      ...names.map((n) => Date.parse(state.records[n]?.at || "1970-01-01") + 1),
    ),
  ).toISOString();
}
export function returnNamesToCheck(
  state: NameState,
  names: string[],
  at = new Date().toISOString(),
) {
  const changedAt = correctionTime(state, names, at);
  return mergeObservations(
    state,
    names.map((name) => ({
      name,
      status: "unreviewed",
      source: "Manual",
      at: changedAt,
      action: "reopen",
      detail: "Returned to check by user.",
    })),
  );
}
/** Undo only this batch's unchanged records; never overwrite a later user correction. */
export function undoCheckBatch(
  state: NameState,
  batch: CheckBatch,
  at = new Date().toISOString(),
) {
  const rows = unchangedBatchRows(state, batch);
  if (!rows.length)
    throw Error(
      "These names have already been changed. Nothing was overwritten.",
    );
  const restored = rows.map((r) => r.name);
  const changedAt = correctionTime(state, restored, at);
  const changes: Observation[] = rows.map((r) => {
    const previous = mergeObservations(
      { records: {}, history: [], exclusions: [] },
      state.history.filter(
        (old) =>
          old.name === r.name &&
          observationKey(old) !== observationKey(r) &&
          Date.parse(old.at) <= Date.parse(r.at),
      ),
    ).records[r.name];
    return {
      name: r.name,
      status: previous?.status || "unreviewed",
      source: "Manual",
      at: changedAt,
      action: "undo",
      detail: `Undid check from ${batch.at}.`,
    };
  });
  return { state: mergeObservations(state, changes), restored };
}

/** Reversible list removal: retain results/notes/history and reuse backed-up exclusions. */
export function removeNamesFromList(
  state: NameState,
  batch: string[],
): NameState {
  const names = batch.map(cleanName);
  if (!names.every(isName)) throw Error("Invalid name. Nothing removed.");
  return {
    ...state,
    exclusions: [...new Set([...state.exclusions, ...names])],
  };
}
export function restoreNamesToList(
  state: NameState,
  batch: string[],
): NameState {
  const restored = new Set(batch.map(cleanName));
  return {
    ...state,
    exclusions: state.exclusions.filter((n) => !restored.has(n)),
  };
}
