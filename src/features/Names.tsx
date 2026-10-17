import { Modal } from "../components/Modal";
import { NameBatches } from "./NameBatches";
import { NameLengthFilter } from "./NameLengthFilter";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Trash2,
  Upload,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { useStore, updateStore } from "../persistence/store";
import {
  statuses,
  canonicalStatus,
  parseObservations,
  mergeObservations,
  mergeNameNotes,
  parseNameNotes,
  saveNameNote,
  recordResult,
  removeNamesFromList,
  restoreNamesToList,
  returnNamesToCheck,
  undoCheckBatch,
  recentCheckBatches,
  unchangedBatchRows,
  type CheckBatch,
  cleanName,
  isName,
  type Status,
} from "../core/names";
import {
  nameCategories,
  definitionURL,
  pokemonNames,
  type NameCategory,
} from "../core/name-catalogue";
import { isResultView, reviewNames, reviewWindow } from "../core/name-review";
import { availableNamesCSV, availableNamesTSV } from "../core/name-export";
import { nameNote } from "../core/name-notes";
import { useNameReview } from "./useNameReview";
import { nativeMessage, exportText, isNative, copyText } from "../core/bridge";
import {
  Button,
  CopyButton,
  Link,
  Feedback,
  useAction,
  Empty,
} from "../components/shared";

const title = (name: string) => name[0].toUpperCase() + name.slice(1);
const noLengths: number[] = [];
export function Names() {
  const store = useStore(),
    { names } = store;
  const {
    review,
    bookmark,
    error: positionError,
    updateBookmark,
    navigate,
    resultCategory: setResultCategory,
  } = useNameReview(store);
  const { category, filter } = review;
  const isResults = isResultView(filter);
  const shownCategory = isResults ? review.resultCategory || "all" : category;
  const query = bookmark.query;
  const sheetText = useMemo(() => availableNamesTSV(names), [names]);
  const lengths = bookmark.lengths || noLengths;
  const importInput = useRef<HTMLInputElement>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const [removing, setRemoving] = useState<string[]>([]);
  const [showRemoved, setShowRemoved] = useState(false);
  const [custom, setCustom] = useState("");
  const [result, setResult] = useState<Exclude<Status, "unreviewed">>("exists");
  const [current, setCurrent] = useState(""),
    [history, setHistory] = useState(false);
  const [note, setNote] = useState("");
  const { message, setMessage, busy, run } = useAction();
  useEffect(() => {
    const report = (event: Event) =>
      setMessage(String((event as CustomEvent).detail.message));
    window.addEventListener("desk-petpages-opened", report);
    return () => window.removeEventListener("desk-petpages-opened", report);
  }, []);
  const list = useMemo(
    () => reviewNames(names, category, filter, query, shownCategory, lengths),
    [names, filter, query, category, shownCategory, lengths],
  );
  const { offset, visible, selected: chosen } = reviewWindow(list, bookmark);
  useEffect(() => {
    updateBookmark({ start: visible[0] || "", offset, selected: chosen });
  }, [
    category,
    filter,
    shownCategory,
    query,
    lengths.join("|"),
    visible[0],
    offset,
    chosen.join("|"),
  ]);
  const changeView = (nextCategory: NameCategory, nextFilter: string) => {
    navigate(nextCategory, nextFilter);
    setCurrent("");
    setMessage("");
  };
  const select = (names: string[]) => updateBookmark({ selected: names });
  const latestBatch = useMemo(
    () =>
      recentCheckBatches(names).find(
        (batch) => unchangedBatchRows(names, batch).length,
      ),
    [names],
  );
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate =
        chosen.length > 0 && chosen.length < visible.length;
  }, [chosen.length, visible.length]);
  async function removeSelected() {
    const batch = removing;
    await updateStore((s) => ({
      ...s,
      names: removeNamesFromList(s.names, batch),
    }));
    select([]);
    setRemoving([]);
    setMessage(
      `Removed ${batch.length} ${batch.length === 1 ? "name" : "names"} from the list. Restore them from Removed names below.`,
    );
  }
  async function restoreRemoved(batch: string[]) {
    await updateStore((s) => ({
      ...s,
      names: restoreNamesToList(s.names, batch),
    }));
    updateBookmark({ start: "", offset: 0, selected: [] });
    setMessage(
      `Restored ${batch.length} ${batch.length === 1 ? "name" : "names"}.`,
    );
  }
  const record = names.records[current];
  const definition = definitionURL(current);
  async function save(
    batch: string[],
    status: Exclude<Status, "unreviewed">,
    detail?: string,
  ) {
    if (!batch.length) return;
    await updateStore((s) => ({
      ...s,
      names: recordResult(
        detail === undefined
          ? s.names
          : saveNameNote(s.names, batch[0], detail),
        batch,
        status,
        new Date().toISOString(),
      ),
    }));
    select(chosen.filter((name) => !batch.includes(name)));
    setCurrent("");
    setResult("exists");
    setMessage(
      `Saved ${batch.length === 1 ? title(batch[0]) : batch.length + " names"} · ${statuses[status]}`,
    );
  }
  async function saveNote() {
    await updateStore((s) => ({
      ...s,
      names: saveNameNote(s.names, current, note),
    }));
    setMessage(`Note saved for ${title(current)}`);
    setCurrent("");
  }
  async function reopen(batch: string[]) {
    if (!batch.length) return;
    await updateStore((s) => ({
      ...s,
      names: returnNamesToCheck(s.names, batch),
    }));
    select([]);
    setCurrent("");
    setMessage(
      `Returned ${batch.length} ${batch.length === 1 ? "name" : "names"} to check. History kept.`,
    );
  }
  async function undo(batch: CheckBatch) {
    let restored: string[] = [];
    await updateStore((s) => {
      const result = undoCheckBatch(s.names, batch);
      restored = result.restored;
      return { ...s, names: result.state };
    });
    select([]);
    setCurrent("");
    setMessage(
      `Undid ${restored.length} ${restored.length === 1 ? "name" : "names"}: ${restored.map(title).join(", ")}. Earlier results restored; unchecked names are back in To check.`,
    );
  }
  const editName = (name: string) => {
    const status = canonicalStatus(names.records[name]?.status || "exists");
    setCurrent(name);
    setResult(status !== "unreviewed" ? status : "exists");
    setNote(nameNote(names, name));
  };
  async function openNames(batch: string[]) {
    if (isNative())
      nativeMessage("deskPetNames", { action: "openPetpages", names: batch });
    else
      throw Error(
        "Open the desktop app to open a batch. Individual petpage links work in this preview.",
      );
    setMessage(
      `Requested ${batch.length} petpages. Results have not been changed.`,
    );
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 20_000_000)
      throw Error("Choose a JSON file smaller than 20 MB.");
    const input = JSON.parse(await file.text());
    const notes = parseNameNotes(input.notes);
    const records = [
      ...parseObservations(input),
      ...(!Array.isArray(input) && input.history
        ? parseObservations(input.history)
        : []),
    ];
    const exclusions =
      !Array.isArray(input) && input.exclusions ? input.exclusions : [];
    if (
      !Array.isArray(exclusions) ||
      !exclusions.every((n: unknown) => typeof n === "string" && isName(n))
    )
      throw Error("Invalid excluded names. Nothing imported.");
    await updateStore((s) => ({
      ...s,
      names: {
        ...mergeNameNotes(mergeObservations(s.names, records), notes),
        exclusions: [...new Set([...s.names.exclusions, ...exclusions])],
      },
    }));
    setMessage(
      `Imported ${records.length.toLocaleString()} observations. Existing manual results preserved.`,
    );
  }
  return (
    <div className="feature-stack">
      <div className="name-summary">
        <button
          className={
            filter === "unreviewed" ? "summary-chip active" : "summary-chip"
          }
          onClick={() => changeView(category, "unreviewed")}
        >
          To check
        </button>
        <button
          className={
            filter === "available" ? "summary-chip active" : "summary-chip"
          }
          onClick={() => changeView(category, "available")}
        >
          <span className="status-dot green" />
          Available{" "}
          <strong>
            {
              Object.values(names.records).filter(
                (r) =>
                  ["available", "missing"].includes(r.status) &&
                  !names.exclusions.includes(r.name),
              ).length
            }
          </strong>
        </button>
        <button
          className={
            filter === "graveyard" ? "summary-chip active" : "summary-chip"
          }
          onClick={() => changeView(category, "graveyard")}
        >
          Graveyard
        </button>
        <button
          className={
            filter === "created" ? "summary-chip active" : "summary-chip"
          }
          onClick={() => changeView(category, "created")}
        >
          Created{" "}
          <strong>
            {
              Object.values(names.records).filter(
                (r) =>
                  r.status === "created" && !names.exclusions.includes(r.name),
              ).length
            }
          </strong>
        </button>
        <div
          className="push actions name-utilities"
          aria-label="Name list utilities"
        >
          <CopyButton
            text={sheetText}
            label="Copy all available names for Google Sheets"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Download available names"
            title="Download available names (CSV)"
            onClick={() =>
              run(() =>
                exportText(
                  availableNamesCSV(names),
                  "available-pet-names.csv",
                  "text/csv;charset=utf-8",
                ),
              )
            }
          >
            <Download />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Export name records"
            title="Export name records (backup)"
            onClick={() =>
              run(() =>
                exportText(
                  JSON.stringify(names, null, 2),
                  "pet-name-checks.json",
                ),
              )
            }
          >
            <FileDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Import name records"
            title="Import name records"
            disabled={busy}
            onClick={() => importInput.current?.click()}
          >
            <Upload />
          </Button>
          <input
            hidden
            ref={importInput}
            type="file"
            aria-label="Name records file"
            accept=".json"
            onChange={(e) => {
              void run(() => importFile(e.target.files?.[0]));
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <div className="segmented" aria-label="Name categories">
        {isResults && (
          <button
            aria-pressed={shownCategory === "all"}
            onClick={() => setResultCategory("all")}
          >
            All
          </button>
        )}
        {nameCategories.map(([id, label]) => (
          <button
            key={id}
            title={
              id === "3numbers"
                ? "Three characters with numbers"
                : id === "3"
                  ? "Three letters"
                  : id === "4"
                    ? "Four letters"
                    : label
            }
            aria-pressed={shownCategory === id}
            onClick={() =>
              isResults ? setResultCategory(id) : changeView(id, "unreviewed")
            }
          >
            {id === "3"
              ? "3L"
              : id === "4"
                ? "4L"
                : id === "3numbers"
                  ? "3L #"
                  : label}
          </button>
        ))}
      </div>
      <div className="panel names-panel">
        <div className="table-toolbar">
          <form
            className="actions custom-name"
            onSubmit={(e) => {
              e.preventDefault();
              const n = cleanName(custom);
              if (!isName(n)) {
                setMessage("Use 3–20 letters or numbers.");
                return;
              }
              editName(n);
            }}
          >
            <input
              aria-label="Try your own name"
              placeholder="Try a name…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button variant="outline" size="sm" type="submit">
              Use
            </Button>
          </form>
          <div className="push actions filters">
            <NameLengthFilter
              lengths={lengths}
              onChange={(lengths) =>
                updateBookmark({ lengths, start: "", offset: 0, selected: [] })
              }
            />
            <select
              aria-label="Show names"
              value={filter}
              onChange={(e) => changeView(category, e.target.value)}
            >
              {Object.entries(statuses)
                .filter(([v]) => v !== "missing")
                .map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              <option value="graveyard">
                Graveyard · taken / frozen / rejected
              </option>
              <option value="all">All names</option>
            </select>
            <div className="search-input">
              <Search size={14} />
              <input
                aria-label="Search names"
                placeholder="Search"
                value={query}
                maxLength={100}
                onChange={(e) =>
                  updateBookmark({
                    query: e.target.value,
                    start: "",
                    offset: 0,
                    selected: [],
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="batch-toolbar">
          <label className="checkbox-label">
            <input
              type="checkbox"
              ref={selectAll}
              aria-label="Select these ten names"
              checked={visible.length > 0 && chosen.length === visible.length}
              onChange={(e) => select(e.target.checked ? visible : [])}
            />
            Select {visible.length}
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={!visible.length || busy}
            onClick={() =>
              run(() => openNames(chosen.length ? chosen : visible))
            }
          >
            Open {chosen.length || visible.length} <ArrowUpRight />
          </Button>
          <Button
            size="sm"
            disabled={!chosen.length || busy}
            onClick={() => run(() => save(chosen, "exists"))}
          >
            Mark {chosen.length || "selected"} taken
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!chosen.length || busy}
            onClick={() => run(() => save(chosen, "available"))}
          >
            Mark {chosen.length || "selected"} available
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete selected names"
            title="Delete selected names"
            disabled={!chosen.length || busy}
            onClick={() => setRemoving([...chosen])}
          >
            <Trash2 />
          </Button>
          {filter === "graveyard" && (
            <Button
              size="sm"
              variant="outline"
              disabled={!chosen.length || busy}
              onClick={() => run(() => reopen(chosen))}
            >
              Return selected to check
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="push"
            disabled={!list.length}
            onClick={() =>
              run(
                () => copyText(visible.map(title).join("\n")),
                "These names copied",
              )
            }
          >
            Copy these names
          </Button>
        </div>
        <div className="table-scroll">
          <table className="data-table names-table">
            <thead>
              <tr>
                <th className="check-col">
                  <span className="sr-only">Select</span>
                </th>
                <th>Name</th>
                <th>Result</th>
                <th className="right">Links</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((name) => (
                <tr
                  key={name}
                  data-selected={chosen.includes(name) || current === name}
                >
                  <td>
                    <input
                      aria-label={`Select ${title(name)}`}
                      type="checkbox"
                      checked={chosen.includes(name)}
                      onChange={(e) =>
                        select(
                          e.target.checked
                            ? [...chosen, name]
                            : chosen.filter((n) => n !== name),
                        )
                      }
                    />
                  </td>
                  <td>
                    <div className="name-cell">
                      <button
                        className="name-link"
                        onClick={() => {
                          editName(name);
                        }}
                      >
                        {pokemonNames.get(name)?.name || title(name)}
                      </button>
                      <CopyButton text={title(name)} />
                    </div>
                    {pokemonNames.get(name)?.name !== undefined &&
                      pokemonNames.get(name)?.name !== title(name) && (
                        <p className="name-note">Check as {title(name)}</p>
                      )}
                    {nameNote(names, name) && (
                      <p className="name-note">{nameNote(names, name)}</p>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-label status-${canonicalStatus(names.records[name]?.status || "unreviewed")}`}
                    >
                      {statuses[names.records[name]?.status || "unreviewed"]}
                    </span>
                  </td>
                  <td className="right">
                    <div className="row-links">
                      <Button
                        size="xs"
                        variant="ghost"
                        aria-label={`Edit ${title(name)}`}
                        onClick={() => editName(name)}
                      >
                        Edit
                      </Button>
                      {definitionURL(name) && (
                        <Link href={definitionURL(name)!}>Definition</Link>
                      )}
                      <Link href={`https://www.neopets.com/~${title(name)}`}>
                        Petpage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <Empty>No names match this view.</Empty>}
        </div>
        <div className="table-footer">
          <span>
            {filter === "graveyard" && "Newest first · "}
            {list.length
              ? `${offset + 1}–${offset + visible.length} of ${list.length.toLocaleString()}`
              : "0 names"}
          </span>
          <div className="actions">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous names"
              disabled={offset === 0}
              onClick={() => {
                const previous = Math.max(0, offset - 10);
                updateBookmark({
                  offset: previous,
                  start: list[previous] || "",
                  selected: [],
                });
              }}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next names"
              disabled={offset + visible.length >= list.length}
              onClick={() => {
                const next = offset + 10;
                updateBookmark({
                  offset: next,
                  start: list[next] || "",
                  selected: [],
                });
              }}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
      {current && (
        <Modal title={`Edit ${title(current)}`} onClose={() => setCurrent("")}>
          <div className="feature-stack">
            <div className="actions">
              <CopyButton text={title(current)} />
              <Link href={`https://www.neopets.com/~${title(current)}`}>
                Petpage
              </Link>
              {definition && <Link href={definition}>Definition</Link>}
            </div>
            <div className="actions" aria-label="Quick name results">
              <Button
                disabled={busy}
                onClick={() => run(() => save([current], "available", note))}
              >
                Available
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => run(() => save([current], "exists", note))}
              >
                Taken
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => run(() => save([current], "frozen", note))}
              >
                Frozen
              </Button>
            </div>
            <label>
              Result
              <select
                aria-label="Lookup result"
                value={result}
                onChange={(e) => setResult(e.target.value as typeof result)}
              >
                {Object.entries(statuses)
                  .filter(([s]) => s !== "unreviewed" && s !== "missing")
                  .map(([s, l]) => (
                    <option key={s} value={s}>
                      {l}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Definition / note
              <textarea
                aria-label="Name notes"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a brief meaning or your own note"
                rows={3}
              />
            </label>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(saveNote)}
            >
              Save note
            </Button>
            {record && (
              <p className="muted text-small">
                {statuses[record.status]} · {record.source} ·{" "}
                {new Date(record.at).toLocaleString()}
              </p>
            )}
            <div className="actions">
              <Button
                disabled={busy}
                onClick={() => run(() => save([current], result, note))}
              >
                Save result
              </Button>
              {record && record.status !== "unreviewed" && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => reopen([current]))}
                >
                  Return to check
                </Button>
              )}
            </div>
            <Feedback message={message} />
          </div>
        </Modal>
      )}
      {removing.length > 0 && (
        <Modal
          title={`Delete ${removing.length === 1 ? title(removing[0]) : removing.length + " names"} from list?`}
          onClose={() => {
            if (!busy) setRemoving([]);
          }}
        >
          <p>{removing.map(title).join(", ")}</p>
          <p className="muted">
            These names will leave your lists. Their notes and check history are
            kept, and you can restore them from Removed names.
          </p>
          <div className="actions">
            <Button
              variant="outline"
              autoFocus
              disabled={busy}
              onClick={() => setRemoving([])}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => run(removeSelected)}
            >
              {busy ? "Deleting…" : "Delete from list"}
            </Button>
          </div>
          <Feedback message={message} />
        </Modal>
      )}
      {showRemoved && (
        <Modal
          title="Removed names"
          onClose={() => {
            if (!busy) setShowRemoved(false);
          }}
        >
          <div className="removed-names">
            {names.exclusions.length ? (
              names.exclusions.map((name) => (
                <div className="actions" key={name}>
                  <span>{title(name)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => run(() => restoreRemoved([name]))}
                  >
                    Restore {title(name)}
                  </Button>
                </div>
              ))
            ) : (
              <Empty>No removed names.</Empty>
            )}
          </div>
          <Feedback message={message} />
        </Modal>
      )}
      <Feedback message={message} />
      <Feedback message={positionError} />
      <div className="actions text-small">
        {latestBatch && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(() => undo(latestBatch))}
          >
            Undo last check ({latestBatch.rows.length})
          </Button>
        )}
        <Button variant="link" size="sm" onClick={() => setHistory(!history)}>
          Check history
        </Button>
        <Button variant="link" size="sm" onClick={() => setShowRemoved(true)}>
          Removed names ({names.exclusions.length})
        </Button>
        <span className="muted">
          Edit any name to change its result or notes.
        </span>
        <Link href="https://www.neopets.com/createpet.phtml">Create-A-Pet</Link>
      </div>
      <NameBatches
        names={names}
        busy={busy}
        undo={(batch) => void run(() => undo(batch))}
      />
      {history && (
        <div className="panel history-list">
          {names.history
            .slice(-100)
            .reverse()
            .map((r, i) => (
              <div key={i}>
                <button
                  className="name-link"
                  onClick={() => {
                    editName(r.name);
                  }}
                >
                  {title(r.name)}
                </button>
                <span>{statuses[r.status]}</span>
                <small>
                  {r.source} · {new Date(r.at).toLocaleString()}
                </small>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
