import { parseHTML } from "linkedom";
import { avatarEntries, isCollected, withAvatarCollected } from "./avatars";
const byCode = new Map(
  avatarEntries
    .filter((e) => e.catalogueCode)
    .map((e) => [e.catalogueCode!, e]),
);
export type PickerAvatar = {
  code: string;
  name: string;
  kind: "standard" | "secret";
};
export type AvatarImport = { version: 1; entries: PickerAvatar[] };

/** Parse as data only: linkedom has no browser networking or script execution. */
export function parseAvatarPicker(source: string): PickerAvatar[] {
  if (!source.trim())
    throw Error("Paste the Neoboard Settings page source first.");
  if (source.length > 2_000_000)
    throw Error("The source is too large. Paste at most 2 MB.");
  const { document } = parseHTML(source);
  const popup = document.querySelector("#SelectAvatarPopup");
  if (!popup)
    throw Error(
      "The avatar picker is missing. Copy the Neoboard Settings page source, including Your Avatars.",
    );
  const groups = [...popup.querySelectorAll(".settings-avatars")];
  if (
    groups.length !== 2 ||
    !/Secret Avatars\s*:/i.test(popup.textContent || "")
  )
    throw Error(
      "The standard and Secret Avatars sections are incomplete. Copy the whole page source again.",
    );
  const rows = [...popup.querySelectorAll(".settings-av")];
  if (!rows.length || rows.length > 2000)
    throw Error("No usable avatar picker found.");
  // Reject a cut-off final picker entry rather than silently accepting repaired HTML.
  const starts = [
    ...source.matchAll(
      /<div\b[^>]*class\s*=\s*(['"])[^'"]*\bsettings-av\b[^'"]*\1[^>]*>/gi,
    ),
  ];
  const tail = source.slice(starts.at(-1)?.index ?? source.length);
  if (!/<\/div>\s*<\/div>/i.test(tail))
    throw Error(
      "The avatar picker appears cut off. Copy the whole page source again.",
    );
  const found = new Map<string, PickerAvatar>();
  for (const row of rows) {
    const img = row.querySelector("img");
    const match = img
      ?.getAttribute("src")
      ?.match(
        /^(?:https?:)?\/\/images\.neopets\.com\/neoboards\/avatars\/([a-zA-Z0-9_-]+)\.gif$/,
      );
    const code = match?.[1];
    const name = img?.getAttribute("alt")?.trim();
    if (!code || !name || name.length > 200 || row.id !== `${code}Avvie`)
      throw Error(
        "An avatar entry is incomplete or inconsistent. Nothing was imported.",
      );
    const kind = groups[0].contains(row)
      ? "standard"
      : groups[1].contains(row)
        ? "secret"
        : null;
    if (!kind) throw Error("An avatar is outside its picker section.");
    const old = found.get(code);
    if (old && (old.kind !== kind || old.name !== name))
      throw Error(`Conflicting entries for ${name}. Nothing was imported.`);
    found.set(code, { code, name, kind });
  }
  return [...found.values()];
}
export function reviewAvatarImport(
  legacy: Record<string, string>,
  incoming: PickerAvatar[],
) {
  const standard = incoming.filter((r) => r.kind === "standard");
  const nonCounting = incoming.filter(
    (r) => r.kind === "secret" && r.code === "ncmall",
  );
  const secret = incoming.filter(
    (r) => r.kind === "secret" && r.code !== "ncmall",
  );
  const matches = secret.flatMap((row) => {
    const entry = byCode.get(row.code);
    return entry ? [{ row, entry }] : [];
  });
  const unmatched = secret.filter(
    (r) => !matches.some((m) => m.row.code === r.code),
  );
  return {
    standard,
    nonCounting,
    secret,
    matches,
    unmatched,
    added: matches.filter((m) => !isCollected(legacy, m.entry)),
    existing: matches.filter((m) => isCollected(legacy, m.entry)),
  };
}
export function mergeAvatarImport(
  legacy: Record<string, string>,
  incoming: PickerAvatar[],
) {
  const review = reviewAvatarImport(legacy, incoming);
  let next = { ...legacy };
  for (const { entry } of review.matches)
    next = withAvatarCollected(next, entry, true);
  const saved: AvatarImport = JSON.parse(
    legacy.nd_avatar_import || '{"version":1,"entries":[]}',
  );
  const records = new Map(saved.entries.map((r) => [r.code, r]));
  for (const row of incoming) records.set(row.code, row);
  next.nd_avatar_import = JSON.stringify({
    version: 1,
    entries: [...records.values()],
  });
  return { legacy: next, review };
}
export type ImportUndo = {
  before: Record<string, string>;
  after: Record<string, string>;
};
export function undoAvatarImport(
  legacy: Record<string, string>,
  undo: ImportUndo,
) {
  const changed = Object.keys(undo.after).filter(
    (key) => undo.before[key] !== undo.after[key],
  );
  if (changed.some((key) => legacy[key] !== undo.after[key]))
    throw Error(
      "Avatar records changed after this import. Review them before undoing; newer changes have been kept.",
    );
  const next = { ...legacy };
  for (const key of changed) {
    if (undo.before[key] === undefined) delete next[key];
    else next[key] = undo.before[key];
  }
  return next;
}
