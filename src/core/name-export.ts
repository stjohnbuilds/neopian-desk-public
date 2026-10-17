import {
  categoryForName,
  nameCategories,
  nameDefinitions,
} from "./name-catalogue";
import { nameNote } from "./name-notes";
import { statusMatches, type NameState } from "./names";

/** A full Available export is independent of the open category, search and page. */
export function availableNameRows(state: NameState) {
  const excluded = new Set(state.exclusions);
  return nameCategories.flatMap(([category, label]) =>
    Object.keys(state.records)
      .filter(
        (name) =>
          statusMatches(state.records[name], "available") &&
          !excluded.has(name) &&
          categoryForName(name) === category,
      )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const definition = nameDefinitions[name]?.text || "";
        const note = nameNote(state, name);
        return {
          category: label,
          name: name[0].toUpperCase() + name.slice(1),
          definition,
          note: note === definition ? "" : note,
          definitionSource: nameDefinitions[name]?.source || "",
        };
      }),
  );
}

function spreadsheetText(value: string) {
  // Quoting alone does not stop spreadsheet programs from interpreting a formula.
  return /^\s*[=+@-]/.test(value) ? "'" + value : value;
}

function availableNamesTable(state: NameState) {
  const rows = availableNameRows(state).map(
    ({ category, name, definition, note }) => [
      category,
      name,
      definition,
      note,
    ],
  );
  return [["Category", "Name", "Definition", "Note"], ...rows];
}

export function availableNamesCSV(state: NameState) {
  return (
    "\uFEFF" +
    availableNamesTable(state)
      .map((row) =>
        row
          .map((value) => `"${spreadsheetText(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}

/** Tabs paste as columns; note line breaks become spaces so each name stays on one row. */
export function availableNamesTSV(state: NameState) {
  return availableNamesTable(state)
    .map((row) =>
      row
        .map((value) => spreadsheetText(value).replace(/[\t\r\n]+/g, " "))
        .join("\t"),
    )
    .join("\n");
}
