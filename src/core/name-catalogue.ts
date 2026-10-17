import raw from "../data/catalogues.json";
const data = raw as unknown as { PetNameWords: {word:string;meaning:string;source_url:string}[]; PetNamePairs: {word:string;kind:string}[]; PetNameFour:string[] };
import pools from "../data/name-pools/pools.json";
import definitions from "../data/name-definitions.json";
import pokemon from "../data/name-pools/pokemon.json";
import cute from "../data/name-pools/cute.json";
import pokemonPlurals from "../data/name-pools/pokemon-plurals.json";
import threeCharacterNumbers from "../data/name-pools/three-character-numbers.json";
import { combinations, unusualScore } from "./names";

export const nameCategories = [
  ["3", "3 letters"],
  ["4", "4 letters"],
  ["3numbers", "3 characters with numbers"],
  ["cute", "Cute"],
  ["words", "Words"],
  ["variations", "Name variations"],
  ["pairs", "Word pairs"],
  ["pokemon", "Pokémon"],
] as const;
// Legacy ID remains readable in saved bookmarks/backups; only Pokémon is displayed.
export type NameCategory =
  | (typeof nameCategories)[number][0]
  | "pokemon-plurals";
const distinct = (names: string[]) => [
  ...new Set(names.map((n) => n.toLowerCase())),
];
const realWords = distinct([
  ...data.PetNameWords.map((w) => w.word),
  ...pools.filter((p) => p.id === "obscure_real_words").flatMap((p) => p.names),
]);
const realWordSet = new Set(realWords);
export const pokemonNames = new Map(pokemon.map((p) => [p.candidate, p]));
export const nameDefinitions: Readonly<
  Record<string, { text: string; source: string }>
> = {
  ...Object.fromEntries(
    data.PetNameWords.map((w) => [
      w.word.toLowerCase(),
      { text: w.meaning, source: w.source_url },
    ]),
  ),
  ...definitions,
};
const pairs = distinct(
  data.PetNamePairs.filter((w) => w.kind !== "variation").map((w) => w.word),
);
const variations = distinct([
  ...data.PetNamePairs.filter((w) => w.kind === "variation").map((w) => w.word),
  ...pools
    .filter((p) => p.id === "name_and_word_variations")
    .flatMap((p) => p.names),
]);
const membership = new Map<string, NameCategory>();
// One display category per name; original source-pool membership stays in the data files.
for (const [category, names] of [
  ["words", realWords],
  ["pairs", pairs],
  ["variations", variations],
] as const)
  for (const name of names)
    if (!membership.has(name))
      membership.set(
        name,
        name.length === 3 ? "3" : name.length === 4 ? "4" : category,
      );
// Explicit user curation takes precedence over generic word/variation pools.
for (const name of cute) membership.set(name, "cute");
for (const name of pokemonPlurals) membership.set(name, "pokemon");
for (const name of threeCharacterNumbers) membership.set(name, "3numbers");
export function categoryForName(name: string): NameCategory {
  name = name.toLowerCase();
  return /^[a-z0-9]{3}$/.test(name) && /\d/.test(name)
    ? "3numbers"
    : /^[a-z]{3}$/.test(name)
      ? "3"
      : /^[a-z]{4}$/.test(name)
        ? "4"
        : membership.get(name) ||
          (pokemonNames.has(name) ? "pokemon" : "words");
}
// Themed lists share results with the complete short-letter pools.
export const nameInCategory = (name: string, category: NameCategory) =>
  category === "pokemon" || category === "pokemon-plurals"
    ? pokemonNames.has(name.toLowerCase()) ||
      membership.get(name.toLowerCase()) === "pokemon"
    : category === "cute"
      ? membership.get(name.toLowerCase()) === "cute"
      : categoryForName(name) === category;
const cached = new Map<NameCategory, string[]>();
export function nameCandidates(category: NameCategory): string[] {
  if (cached.has(category)) return cached.get(category)!;
  let result: string[];
  if (category === "3")
    result = combinations(3).sort(
      (a, b) => unusualScore(a) - unusualScore(b) || a.localeCompare(b),
    );
  else if (category === "4")
    result = distinct([
      ...data.PetNameFour,
      ...[...membership].filter(([, c]) => c === "4").map(([n]) => n),
      ...combinations(4),
    ]);
  else if (category === "pokemon" || category === "pokemon-plurals")
    result = distinct([...pokemon.map((p) => p.candidate), ...pokemonPlurals]);
  else
    result = [...membership]
      .filter(([, c]) => c === category)
      .map(([n]) => n)
      .sort((a, b) => a.localeCompare(b));
  cached.set(category, result);
  return result;
}
export const definitionURL = (name: string) =>
  realWordSet.has(name) || categoryForName(name) === "words"
    ? `https://www.google.com/search?q=${encodeURIComponent(name + " definition")}`
    : undefined;
