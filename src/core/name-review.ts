import {
  nameCandidates,
  nameCategories,
  nameInCategory,
  type NameCategory,
} from "./name-catalogue";
import {
  isName,
  newestRecordedNames,
  statusMatches,
  type NameState,
} from "./names";
export interface NameBookmark {
  start: string;
  offset: number;
  query: string;
  selected: string[];
  lengths?: number[];
}
export interface NameReview {
  category: NameCategory;
  filter: string;
  resultCategory?: NameCategory | "all";
  bookmarks: Record<string, NameBookmark>;
}
export const reviewFilters = [
  "unreviewed",
  "available",
  "created",
  "graveyard",
  "exists",
  "frozen",
  "unavailable",
  "unknown",
  "all",
];
export const emptyBookmark = (): NameBookmark => ({
  start: "",
  offset: 0,
  query: "",
  selected: [],
});
export const initialNameReview = (): NameReview => ({
  category: "words",
  filter: "unreviewed",
  bookmarks: {},
});
/** Every view reads the same saved results; catalogue additions never reset checks. */
export function reviewNames(
  names: NameState,
  category: NameCategory,
  filter: string,
  query = "",
  resultCategory: NameCategory | "all" = "all",
  lengths: number[] = [],
) {
  const results = isResultView(filter);
  const source = results
    ? Object.keys(names.records)
    : category === "3" || category === "4"
      ? nameCandidates(category)
      : [
          ...new Set([
            ...nameCandidates(category),
            ...Object.keys(names.records).filter((n) =>
              nameInCategory(n, category),
            ),
            ...Object.keys(names.notes || {}).filter((n) =>
              nameInCategory(n, category),
            ),
          ]),
        ];
  const exclusions = new Set(names.exclusions);
  const matching = source.filter(
    (n) =>
      !exclusions.has(n) &&
      (!query || n.includes(query.toLowerCase())) &&
      (!lengths.length || lengths.includes(n.length)) &&
      statusMatches(names.records[n], filter) &&
      (!results ||
        resultCategory === "all" ||
        nameInCategory(n, resultCategory)),
  );
  return results
    ? newestRecordedNames(names, matching)
    : category === "3" || category === "4" || category === "pokemon"
      ? matching
      : matching.sort((a, b) => a.localeCompare(b));
}
export const reviewKey = (
  category: NameCategory,
  filter: string,
  resultCategory: NameCategory | "all" = "all",
) =>
  isResultView(filter)
    ? `${filter}:${resultCategory}`
    : `${category}:${filter}`;
export const isResultView = (filter: string) =>
  ["available", "created", "graveyard"].includes(filter);
export function reviewWindow(list: string[], bookmark: NameBookmark) {
  const found = bookmark.start ? list.indexOf(bookmark.start) : -1;
  const offset =
    found >= 0
      ? found
      : Math.min(
          bookmark.offset,
          Math.max(0, Math.floor((list.length - 1) / 10) * 10),
        );
  const visible = list.slice(offset, offset + 10);
  return {
    offset,
    visible,
    selected: bookmark.selected.filter((n) => visible.includes(n)),
  };
}
export function validateNameReview(
  value: unknown,
): asserts value is NameReview {
  const s = value as NameReview;
  if (
    !s ||
    !(
      s.category === "pokemon-plurals" ||
      nameCategories.some(([c]) => c === s.category)
    ) ||
    !reviewFilters.includes(s.filter) ||
    (s.resultCategory !== undefined &&
      s.resultCategory !== "all" &&
      !(
        s.resultCategory === "pokemon-plurals" ||
        nameCategories.some(([c]) => c === s.resultCategory)
      )) ||
    !s.bookmarks ||
    Array.isArray(s.bookmarks) ||
    Object.keys(s.bookmarks).length > 100
  )
    throw Error("Invalid saved name-list position.");
  for (const [key, b] of Object.entries(s.bookmarks)) {
    const [view, scope, extra] = key.split(":");
    const categoryExists = (id: string) =>
      id === "pokemon-plurals" || nameCategories.some(([c]) => c === id);
    const validKey =
      extra === undefined &&
      (isResultView(view)
        ? scope === undefined || scope === "all" || categoryExists(scope)
        : categoryExists(view) &&
          reviewFilters.includes(scope) &&
          !isResultView(scope));
    if (
      !validKey ||
      !b ||
      typeof b.start !== "string" ||
      (b.start !== "" && !isName(b.start)) ||
      !Number.isSafeInteger(b.offset) ||
      b.offset < 0 ||
      b.offset > 500000 ||
      typeof b.query !== "string" ||
      b.query.length > 100 ||
      (b.lengths !== undefined &&
        (!Array.isArray(b.lengths) ||
          b.lengths.length > 18 ||
          !b.lengths.every((n) => Number.isInteger(n) && n >= 3 && n <= 20) ||
          new Set(b.lengths).size !== b.lengths.length)) ||
      !Array.isArray(b.selected) ||
      b.selected.length > 10 ||
      !b.selected.every((n) => typeof n === "string" && isName(n)) ||
      new Set(b.selected).size !== b.selected.length
    )
      throw Error("Invalid saved name-list position.");
  }
}

/** Fold the old plural tab into Pokémon without invalidating saved backups or positions. */
export function combinedPokemonReview(review: NameReview): NameReview {
  const category =
    review.category === "pokemon-plurals" ? "pokemon" : review.category;
  const resultCategory =
    review.resultCategory === "pokemon-plurals"
      ? "pokemon"
      : review.resultCategory;
  const bookmarks = { ...review.bookmarks };
  for (const [key, value] of Object.entries(review.bookmarks)) {
    if (!key.includes("pokemon-plurals")) continue;
    const target = key.replace("pokemon-plurals", "pokemon");
    const active =
      key === reviewKey(review.category, review.filter, review.resultCategory);
    if (!bookmarks[target] || active) bookmarks[target] = value;
  }
  return { ...review, category, resultCategory, bookmarks };
}
