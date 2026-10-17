import petpetTypes from "../data/petpets.json";
import requirements from "../data/avatar-requirements.json";
import tasks from "../data/avatar-tasks.json";
import games from "../data/games.json";
import groups from "../data/groups.json";
import timeLocked from "../data/time-locked.json";
import annual from "../data/avatar-dates.json";
import dates from "../data/dates.json";
import catalogue from "../data/avatar-catalogue.json";
import concerts from "../data/concerts.json";

export interface AvatarRef {
  key: string;
  id: string;
}
export interface AvatarEntry {
  id: string;
  name: string;
  group: string;
  detail: string;
  url: string;
  guide?: string;
  guideLabel?: string;
  activity?: string;
  cadence?: string;
  catalogueCode?: string;
  referenceName?: string;
  categories?: string[];
  retired?: boolean;
  refs: AvatarRef[];
  concertId?: string;
}
type Legacy = Record<string, string>;
const entries: AvatarEntry[] = [];
function add(
  entry: Omit<AvatarEntry, "refs">,
  ref: AvatarRef,
  canonical = entry.id,
) {
  const existing = entries.find((e) => e.id === canonical);
  if (existing) existing.refs.push(ref);
  else entries.push({ ...entry, id: canonical, refs: [ref] });
}
for (const t of tasks)
  add(
    {
      id: t.id,
      name: t.name,
      group: t.group === "Seasonal" ? "Date-locked avatars" : t.group,
      detail: t.note,
      url: "https://www.neopets.com" + t.path,
      guide: t.source || "https://www.jellyneo.net/?go=" + t.guide,
      activity: t.activity,
      cadence: t.cadence,
    },
    { key: "nd_avatar_tasks", id: t.id },
  );
for (const g of games)
  add(
    {
      id: g.id,
      name: g.name,
      group: "Game score avatars",
      detail: `${g.game} · send ${g.score}+ points`,
      url: g.url || g.guide || "https://www.jellyneo.net/?go=avatars&id=games",
    },
    { key: "nd_game_scores", id: g.id },
  );
for (const g of groups)
  for (const r of g.rows)
    add(
      {
        id: r.id,
        name: r.name,
        group: g.title,
        detail: r.need,
        url:
          "url" in r
            ? String(r.url)
            : "guide" in r
              ? String(r.guide)
              : "https://www.jellyneo.net/?go=avatars",
      },
      { key: g.storage, id: r.id },
    );
for (const t of timeLocked)
  add(
    {
      id: t.id,
      name: t.title,
      group: "Time-locked avatars",
      detail: `${t.when} · ${t.body}`,
      url: t.url || "https://www.jellyneo.net/?go=avatars",
    },
    { key: "nd_time_locked", id: t.id },
  );
for (const a of annual)
  add(
    {
      id: a.id,
      name: a.title,
      group: "Date-locked avatars",
      detail: `${a.month}/${a.days.join(", ")} · ${a.body}`,
      url: a.url || "https://www.jellyneo.net/?go=avatars&id=annual",
    },
    { key: "nd_avatar_dates", id: a.id },
    a.id === "jhudora-feb" ? "jhudora-day" : a.id,
  );
// These two calendar entries are avatar prompts, not general celebrations.
for (const d of dates.filter((d) => ["borovan", "christmas"].includes(d.id)))
  add(
    {
      id: d.id,
      name: d.title,
      group: "Date-locked avatars",
      detail: `${d.month}/${d.day} · ${d.body}`,
      url: d.url,
    },
    { key: "nd_avatar_dates", id: d.id },
  );

for (const c of concerts)
  add(
    {
      id: `concert-${c.id}`,
      name: c.avatar,
      group: "Concert avatars",
      detail: `Attend ${c.band} with the matching ticket in your inventory. Buying a ticket alone does not award the avatar.`,
      cadence: c.when,
      url: "https://www.neopets.com/prehistoric/concerthall.phtml",
      guide: "https://www.jellyneo.net/?go=concerts",
      activity: "Concert hall",
      concertId: c.id,
    },
    { key: "nd_concerts", id: c.id },
  );

const nameKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
// Explicit aliases retain the existing task IDs, attempts and calendar references.
const catalogueAliases: Record<string, string> = {
  "double-or-nothing": "snargan",
  "kiss-the-mortog": "mortogkiss",
  cheeseroller: "cheeseroller",
  gormball: "gormball_gargarox",
  "kacheek-seek": "islandkacheek",
  "poogle-racing": "pooglewinner",
  "sloth-quiz": "iheartslothy",
  "sloth-clone": "aim_sloth_clone",
  "valentine-chia": "valentine_chia",
  "easter-cybunny": "easterbunny",
  "coltzan-shrine": "ava_coltzan_shrine",
  "illusen-vs-jhudora": "fq2023",
  "esophagor-quests": "ava_esophagor",
  "plastic-fir": "plasticfir",
  "attack-pea": "attack_pea",
  "borovan-dipped": "borovan_dipped",
  borovan: "aim_borovan_cup",
  christmas: "ac_christmas_aisha",
};
const categoryOrder = [
  "Retired",
  "Seasonal",
  "Battledome",
  "Random",
  "Game",
  "Item",
  "Petpet",
  "Pet",
  "Clickable",
  "Random",
  "Miscellaneous",
];
for (const reference of catalogue.entries) {
  const matches = entries.filter(
    (e) =>
      catalogueAliases[e.id] === reference.code ||
      (!e.catalogueCode && nameKey(e.name) === nameKey(reference.name)),
  );
  const metadata = {
    catalogueCode: reference.code,
    referenceName: reference.name,
    categories: reference.categories,
    retired: reference.categories.includes("Retired"),
  };
  const category =
    categoryOrder.find((c) => reference.categories.includes(c)) ||
    "Miscellaneous";
  if (matches.length === 1) {
    Object.assign(matches[0], metadata);
    if (!matches[0].concertId)
      matches[0].group =
        matches[0].group === "Wheels"
          ? "Wheel avatars"
          : ["Game score avatars", "Luck-based games"].includes(
                matches[0].group,
              )
            ? matches[0].group
            : `${category} avatars`;
    matches[0].refs.push({ key: "nd_avatar_catalogue", id: reference.code });
  } else {
    const variant =
      reference.code === "royalkorbat_boy"
        ? " · Royalboy"
        : reference.code === "royalkorbat_girl"
          ? " · Royalgirl"
          : "";
    entries.push({
      id: `catalogue-${reference.code}`,
      name: reference.name + variant,
      group: `${category} avatars`,
      detail: reference.observedInOwnSelector
        ? "Confirmed in the account's avatar selector. Earning requirements and availability have not been verified."
        : metadata.retired
        ? "Listed as retired. Check the requirements page for availability."
        : reference.categories.join(" · "),
      url: reference.source,
      activity: reference.observedInOwnSelector ? "Your avatars" : "Requirements",
      refs: [{ key: "nd_avatar_catalogue", id: reference.code }],
      ...metadata,
    });
  }
}
// Dated, concise factual summaries; source prose is not shipped in the app.
for (const entry of entries) {
  const requirement = (
    requirements as Record<
      string,
      {
        detail: string;
        guide: string;
        url?: string;
        activity?: string;
        cadence?: string;
        dailyGuide?: "walkthrough" | "requirements";
      }
    >
  )[entry.catalogueCode || ""];
  if (requirement?.dailyGuide) {
    entry.detail = requirement.detail;
    entry.guide = requirement.guide;
    entry.guideLabel =
      requirement.dailyGuide === "walkthrough"
        ? "Full guide · Jellyneo"
        : "Requirements · Jellyneo";
  }
  if (requirement && entry.id.startsWith("catalogue-")) {
    entry.detail = requirement.detail;
    entry.guide = requirement.guide;
    entry.url = requirement.url || requirement.guide;
    entry.activity = requirement.activity || "Requirements guide";
    entry.cadence = requirement.cadence;
    if (!entry.retired && entry.group === "Game avatars")
      entry.group =
        entry.detail.startsWith("Submit a") ||
        entry.detail.startsWith("Submit an")
          ? "Game score avatars"
          : "Games and challenges";
    if (!entry.retired && /album page/.test(entry.detail))
      entry.group = "Stamp avatars";
  }
  if (!entry.guide && entry.catalogueCode)
    entry.guide = catalogue.entries.find(
      (r) => r.code === entry.catalogueCode,
    )?.source;
}
const petpetCodes: Record<string, string> = {
  harris: "windyharris",
  snicklebeast: "snicklebeasty",
  snowbunny: "white_snowbunnies",
  fire: "fireblumaroo",
  mummy: "mummifiedruki",
  doglefox: "doglefox_mud",
  meowclops: "meowclops_close",
  angelpuss: "angelpuss2",
};
for (const type of petpetTypes) {
  const entry = entries.find(
    (e) => e.catalogueCode === (petpetCodes[type.id] || type.id),
  );
  if (entry) entry.refs.push({ key: "nd_reminders", id: type.id });
}
const dailyActionPaths: Record<string, string> = {
  edna: "/halloween/witchtower.phtml",
  lever: "/space/strangelever.phtml",
  plushie: "/faerieland/tdmbgpop.phtml",
  lurker: "/halloween/neovia.phtml",
};
for (const entry of entries) {
  if (dailyActionPaths[entry.id]) {
    entry.url = "https://www.neopets.com" + dailyActionPaths[entry.id];
    entry.activity = "Open activity";
  } else if (
    !entry.activity &&
    !new URL(entry.url).hostname.endsWith("neopets.com")
  ) {
    entry.activity = "Activity guide";
  }
}
// Ordinary activities retain their old data, but are not collectible avatars.
// Unmatched factual avatar records remain searchable under their original group.
const ordinaryIDs = new Set(["tombola", "trick-or-treat"]);
export const avatarCatalogue = catalogue;
export const avatarEntries: readonly AvatarEntry[] = entries.filter(
  (e) => !ordinaryIDs.has(e.id),
);
export function findAvatar(key: string, id: string) {
  return avatarEntries.find((e) =>
    e.refs.some((r) => r.key === key && r.id === id),
  );
}
export function isCollected(legacy: Legacy, entry: AvatarEntry) {
  return entry.refs.some((r) => {
    const saved = JSON.parse(
      legacy[r.key] ||
        (r.key === "nd_avatar_tasks"
          ? "{}"
          : r.key === "nd_concerts"
            ? '{"tickets":[],"avatars":[]}'
            : r.key === "nd_reminders"
              ? '{"petpets":[]}'
              : "[]"),
    );
    return r.key === "nd_avatar_tasks"
      ? saved[r.id]?.done === true
      : r.key === "nd_concerts"
        ? saved.avatars.includes(r.id)
        : r.key === "nd_reminders"
          ? saved.petpets.some(
              (p: { avatar: string; done: boolean }) =>
                p.avatar === r.id && p.done,
            )
          : saved.includes(r.id);
  });
}
export function isAvatarCollected(legacy: Legacy, key: string, id: string) {
  const entry = findAvatar(key, id);
  return entry ? isCollected(legacy, entry) : false;
}
/** Keep legacy aliases synchronized in one atomic store update, preserving attempts. */
export function withAvatarCollected(
  legacy: Legacy,
  entry: AvatarEntry,
  done: boolean,
): Legacy {
  const next = { ...legacy };
  for (const r of entry.refs) {
    if (r.key === "nd_avatar_tasks") {
      const saved = JSON.parse(next[r.key] || "{}");
      next[r.key] = JSON.stringify({
        ...saved,
        [r.id]: { ...saved[r.id], done, tried: saved[r.id]?.tried || "" },
      });
    } else if (r.key === "nd_reminders") {
      if (!next[r.key]) continue;
      const saved = JSON.parse(next[r.key]);
      next[r.key] = JSON.stringify({
        ...saved,
        petpets: saved.petpets.map((p: { avatar: string; done: boolean }) =>
          p.avatar === r.id ? { ...p, done } : p,
        ),
      });
    } else if (r.key === "nd_concerts") {
      const saved = JSON.parse(next[r.key] || '{"tickets":[],"avatars":[]}');
      next[r.key] = JSON.stringify({
        ...saved,
        avatars: done
          ? [...new Set([...saved.avatars, r.id])]
          : saved.avatars.filter((id: string) => id !== r.id),
      });
    } else {
      const saved: string[] = JSON.parse(next[r.key] || "[]");
      next[r.key] = JSON.stringify(
        done
          ? [...new Set([...saved, r.id])]
          : saved.filter((id) => id !== r.id),
      );
    }
  }
  return next;
}
export function matchingAvatars(
  legacy: Legacy,
  search: string,
  showCollected: boolean,
  showRetired = true,
) {
  const query = search.trim().toLowerCase();
  return avatarEntries.filter(
    (e) =>
      (showCollected || !isCollected(legacy, e)) &&
      (showRetired || !e.retired) &&
      [
        e.name,
        e.referenceName || "",
        e.detail,
        e.activity || "",
        ...(e.categories || []),
      ].some((s) => s.toLowerCase().includes(query)),
  );
}

/** Countdown dates stay saved when their avatar is collected. */
export function isPetpetAvatarCollected(legacy: Legacy, petpetId: string) {
  return isAvatarCollected(legacy, "nd_reminders", petpetId);
}
