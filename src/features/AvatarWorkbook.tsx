import { InfoHelp } from "../components/InfoHelp";
import { useState } from "react";
import {
  avatarWorkbook,
  workbookMappings,
  workbookRows,
  workbookDifficulty,
  workbookField,
  type WorkbookRow,
} from "../core/avatar-workbook";
import type { AvatarEntry } from "../core/avatars";
import { Button } from "../components/shared";

function Requirements({ row }: { row: WorkbookRow }) {
  return (
    <dl className="workbook-requirements">
      {Object.entries({
        "Cost NP": row.cost,
        Timing: row.timing,
        Daily: row.daily,
        Luck: row.luck,
        Grinding: row.grinding,
        Steps: row.steps,
        Skill: row.skill,
        "BD level": row.bdLevel,
        "Browser needs": row.browser,
        Clickable: row.clickable,
      }).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{String(value || (value === 0 ? "Free" : "Not recorded"))}</dd>
        </div>
      ))}
    </dl>
  );
}
function readableField(entry: AvatarEntry, field: "cost" | "timing") {
  const value = workbookField(entry, field);
  if (["Unclear in sheet", "Not recorded"].includes(value)) return "Unknown";
  return value === "Time-Specific" ? "Set times" : value;
}
export function AvatarWorkbookDetails({ entry }: { entry: AvatarEntry }) {
  const rows = workbookRows(entry);
  if (!rows.length) return null;
  const difficulty = workbookDifficulty(entry);
  const extra = (
    [
      ["daily", "Daily attempts"],
      ["luck", "Luck needed"],
      ["grinding", "Repeated effort"],
      ["skill", "Skill"],
      ["steps", "Extra steps"],
      ["bdLevel", "BD level"],
      ["browser", "Browser requirement"],
    ] as const
  )
    .map(([field, label]) => ({ label, value: workbookField(entry, field) }))
    .filter(
      ({ value }) =>
        !["No", "None", "Not recorded", "Unclear in sheet"].includes(value),
    );
  return (
    <div
      className="avatar-sheet-facts"
      aria-label={`Spreadsheet facts for ${entry.name}`}
    >
      <dl className="workbook-requirements">
        <div>
          <dt>
            Effort{" "}
            <InfoHelp title={`About the effort estimate for ${entry.name}`}>
              <p>
                Lower scores mean less estimated effort. The estimate uses the
                spreadsheet's cost, timing, luck, skill and other requirements;
                it does not confirm that you can earn the avatar today.
              </p>
              {difficulty === null && (
                <p>
                  Some scoring values are missing or inconsistent, so this
                  avatar has no reliable estimate. Check its guide; readable
                  cost and timing information is still shown.
                </p>
              )}
              <p>
                Source: Avatars.xlsx, Master rows{" "}
                {rows.map((row) => row.row).join(", ")}.
              </p>
              {rows.map((row) => (
                <div key={row.row}>
                  <Requirements row={row} />
                  {!!row.issues.length && (
                    <p className="muted text-small">
                      {row.issues.join(". ")}. Original score:{" "}
                      {row.recordedDifficulty ?? "not recorded"}.
                    </p>
                  )}
                </div>
              ))}
            </InfoHelp>
          </dt>
          <dd>{difficulty === null ? "Not estimated" : difficulty}</dd>
        </div>
        <div>
          <dt>Cost · NP</dt>
          <dd>{readableField(entry, "cost")}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{readableField(entry, "timing")}</dd>
        </div>
      </dl>
      {extra.length > 0 && (
        <p className="muted text-small">
          {extra
            .map(({ label, value }) =>
              value === "Yes" ? label : `${label}: ${value}`,
            )
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

export function AvatarWorkbookSummary() {
  const [review, setReview] = useState(false);
  const unmatched = workbookMappings.filter((mapping) => !mapping.entry);
  const mapped = new Set(
    workbookMappings.flatMap((m) => (m.entry ? [m.entry.id] : [])),
  );
  return (
    <div className="avatar-sheet-source">
      <Button
        variant="ghost"
        aria-expanded={review}
        onClick={() => setReview(!review)}
      >
        {review
          ? "Close spreadsheet details"
          : `Spreadsheet source · ${unmatched.length} unmatched rows`}
      </Button>
      {review && (
        <div className="feature-stack">
          <p className="muted text-small">
            {avatarWorkbook.summary.sourceRows} source rows map to {mapped.size}{" "}
            avatars. App collection marks are the sole source of ownership.
          </p>
          <p className="muted text-small">
            Imported {avatarWorkbook.source.importedOn} from Master, columns
            A–O. Have? is blank in Master and was not imported from other
            sheets. Scores are calculated only when the input fields are clear,
            using the workbook’s Modifiers sheet. Unclear rows stay unranked.
            Existing avatar names, links, instructions and progress are
            retained.
          </p>
          <p className="muted text-small">
            {avatarWorkbook.summary.rankableRows} rows have usable scoring
            fields; {avatarWorkbook.summary.rowsWithIssues} have a score
            mismatch or unclear fields.{" "}
            {Object.keys(avatarWorkbook.summary.duplicateNames).length} names
            repeat. Matching duplicate names uses one existing avatar;
            conflicting scores are withheld.
          </p>
          <p className="muted text-small">
            Source checksum:{" "}
            <code className="workbook-hash">
              {avatarWorkbook.source.sha256}
            </code>
          </p>
          <h3>Rows needing a name match</h3>
          {unmatched.map(({ row, reason }) => (
            <div key={row.row}>
              <strong>{row.name}</strong>
              <p className="muted text-small">
                Master row {row.row} · {reason}. No collection mark added.
              </p>
              <Requirements row={row} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
