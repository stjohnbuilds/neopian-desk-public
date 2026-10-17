import { usePacificDay } from "../core/usePacificDay";
import {
  triedToday,
  withAvatarAttempt,
  isRepeatableAvatar,
  avatarActivity,
} from "../core/dailies";
import { ConcertTicket } from "../components/ConcertTicket";
import { AvatarImport } from "../components/AvatarImport";
import { useState } from "react";
import { useStore, readLegacy, updateStore } from "../persistence/store";
import {
  avatarCatalogue,
  matchingAvatars,
  isCollected,
  withAvatarCollected,
} from "../core/avatars";
import { day } from "../core/utils";
import {
  Button,
  Link,
  Disclosure,
  Feedback,
  useAction,
} from "../components/shared";
import { InfoHelp } from "../components/InfoHelp";
import { AvatarWorkbookDetails, AvatarWorkbookSummary } from "./AvatarWorkbook";
import {
  byWorkbookDifficulty,
  matchesWorkbookFilter,
  type WorkbookFilter,
} from "../core/avatar-workbook";

function AvatarThumbnail({ code }: { code?: string }) {
  const [failed, setFailed] = useState(false);
  if (!code || code.startsWith("tdn-") || failed) return null;
  return (
    <img
      className="avatar-thumbnail"
      src={`https://images.neopets.com/neoboards/avatars/${encodeURIComponent(code)}.gif`}
      width="50"
      height="50"
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function Avatars() {
  const store = useStore();
  const today = usePacificDay();
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [spreadsheetOrder, setSpreadsheetOrder] = useState(true);
  const [sheetFilter, setSheetFilter] = useState<WorkbookFilter>("all");
  const counts = readLegacy<Record<string, number | string>>(
    store,
    "nd_goals",
    {},
  );
  const { run, message } = useAction();
  const matching = matchingAvatars(
    store.legacy,
    search,
    showDone,
    showRetired,
  ).filter((entry) => matchesWorkbookFilter(entry, sheetFilter));
  const rows = spreadsheetOrder ? byWorkbookDifficulty(matching) : matching;
  const sections = [
    ...new Set(
      matchingAvatars(store.legacy, "", true, true).map((e) => e.group),
    ),
  ].filter((group) => rows.some((entry) => entry.group === group));
  return (
    <div className="feature-stack">
      <div className="avatar-toolbar">
        <strong>Collected avatars</strong>
        <label>
          <span className="muted text-small">Total from account</span>
          <input
            className="count-input"
            type="number"
            min="0"
            max="2000"
            value={Number(counts.avatars) || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (Number.isSafeInteger(value) && value >= 0 && value <= 2000)
                void run(
                  () =>
                    updateStore((s) => ({
                      ...s,
                      legacy: {
                        ...s.legacy,
                        nd_goals: JSON.stringify({
                          ...readLegacy(s, "nd_goals", {}),
                          avatars: value,
                        }),
                      },
                    })),
                  "Avatar total saved",
                );
            }}
          />
        </label>
        <Link href="https://www.neopets.com/settings/neoboards">
          Check on Neopets
        </Link>
        <div className="actions avatar-search">
          <input
            type="search"
            aria-label="Find an avatar"
            placeholder="Find an avatar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InfoHelp title="Which avatars are listed?">
            <p>
              The catalogue covers {avatarCatalogue.entries.length} distinct
              reference avatars, checked on {avatarCatalogue.checkedOn},
              including concerts. Categories overlap; each reference avatar is
              listed once. Retired entries are available with Show retired.
            </p>
            <p>
              Search checks every list below, including games, species, dates
              and concerts. The total above is the number from your account;
              checking a task does not guess or change that total.
            </p>
            <p>
              Requirements are dated summaries with individual guide links.
              Example-pet links come from those references; check the pet still
              meets the conditions. The catalogue is a dated reference; unlisted
              or newly released avatars may still need adding. Existing task
              instructions are retained.
            </p>
            <p>
              An older undated Trick-or-Treat reminder is retained in saved
              data, but is not treated as a confirmed yearly avatar. Tombola
              remains an ordinary daily.
            </p>
            <Link href={avatarCatalogue.source}>Catalogue reference</Link>
          </InfoHelp>
        </div>
      </div>
      <AvatarImport />
      <div className="actions">
        <Button
          variant="outline"
          aria-pressed={!spreadsheetOrder}
          onClick={() => setSpreadsheetOrder(false)}
        >
          Original order
        </Button>
        <Button
          variant="outline"
          aria-pressed={spreadsheetOrder}
          onClick={() => setSpreadsheetOrder(true)}
        >
          Lowest effort first
        </Button>
        {(
          [
            ["all", "All costs and times"],
            ["free", "Free"],
            ["anytime", "Anytime"],
            ["daily", "Daily attempts"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant="outline"
            aria-pressed={sheetFilter === value}
            onClick={() => setSheetFilter(value)}
          >
            {label}
          </Button>
        ))}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          Show collected
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showRetired}
            onChange={(e) => setShowRetired(e.target.checked)}
          />
          Show retired
        </label>
        <span className="muted text-small">
          {rows.length}{" "}
          {search ? (rows.length === 1 ? "match" : "matches") : "listed"}
        </span>
      </div>
      {!rows.length && <p role="status">No avatars match these filters.</p>}
      {spreadsheetOrder && (
        <p className="muted text-small">
          Within each category, lowest effort comes first. Avatars without an
          estimate follow. Check the cost, timing and guide requirements.
        </p>
      )}
      {sections.map((group) => (
        <Disclosure
          key={`${group}-${!!search.trim()}-${sheetFilter}`}
          defaultOpen={!!search.trim() || sheetFilter !== "all"}
          title={`${group} · ${rows.filter((e) => e.group === group).length}`}
        >
          <div className="checklist">
            {rows
              .filter((e) => e.group === group)
              .map((e) => {
                const activity = avatarActivity(e);
                return (
                  <div className="checklist-row" key={e.id}>
                    <input
                      type="checkbox"
                      aria-label={`Collected ${e.name}`}
                      checked={isCollected(store.legacy, e)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        void run(
                          () =>
                            updateStore((s) => ({
                              ...s,
                              legacy: withAvatarCollected(s.legacy, e, checked),
                            })),
                          "Avatar saved",
                        );
                      }}
                    />
                    <div>
                      <div className="avatar-entry-heading">
                        <AvatarThumbnail code={e.catalogueCode} />
                        <strong>
                          {e.name}
                          {e.retired && (
                            <span className="muted text-small"> · Retired</span>
                          )}
                        </strong>
                      </div>
                      <p>{e.detail}</p>
                      {activity.cadence && <p>{activity.cadence}</p>}
                      <AvatarWorkbookDetails entry={e} />
                      <div className="actions">
                        {e.concertId && (
                          <>
                            <ConcertTicket id={e.concertId} name={e.name} />
                            <Link href="https://www.neopets.com/prehistoric/ticketbooth.phtml">
                              Tickets
                            </Link>
                          </>
                        )}
                        <Link href={activity.url}>{e.activity || "Open"}</Link>
                        {e.guide && e.guide !== activity.url && (
                          <Link href={e.guide}>{e.guideLabel || "Guide"}</Link>
                        )}
                        {isRepeatableAvatar(e) && (
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-pressed={triedToday(store.legacy, e, today)}
                            title={
                              triedToday(store.legacy, e, today)
                                ? "Clear today’s attempt"
                                : "Record an attempt today"
                            }
                            onClick={() =>
                              void run(
                                () =>
                                  updateStore((s) => ({
                                    ...s,
                                    legacy: withAvatarAttempt(
                                      s.legacy,
                                      e,
                                      day(),
                                      !triedToday(s.legacy, e, day()),
                                    ),
                                  })),
                                triedToday(store.legacy, e, today)
                                  ? "Attempt cleared"
                                  : "Marked tried today",
                              )
                            }
                          >
                            {triedToday(store.legacy, e, today)
                              ? "Tried today"
                              : "Mark tried today"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Disclosure>
      ))}
      <AvatarWorkbookSummary />
      <Feedback message={message} />
    </div>
  );
}
