import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { searchDesk } from "../core/desk-search";
import { useStore, readLegacy } from "../persistence/store";
import { defaultShortcuts, type Shortcut } from "../core/shortcuts";
import { navigate } from "../app/useNavigation";
export function DeskSearch() {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null);
  const store = useStore();
  const results = searchDesk(
    query,
    readLegacy<Shortcut[]>(store, "nd_header_shortcuts", defaultShortcuts),
  );
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (open && active >= 0)
      document
        .getElementById(`desk-result-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  return (
    <div
      ref={root}
      className="desk-search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Search size={16} aria-hidden="true" />
      <input
        ref={input}
        aria-label="Search desk"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="desk-search-results"
        aria-activedescendant={
          open && active >= 0 ? `desk-result-${active}` : undefined
        }
        placeholder="Search desk…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Escape") {
            setOpen(false);
            setActive(-1);
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((a) =>
              results.length
                ? a < 0
                  ? e.key === "ArrowDown"
                    ? 0
                    : results.length - 1
                  : (a + (e.key === "ArrowDown" ? 1 : -1) + results.length) %
                    results.length
                : -1,
            );
          }
          if (e.key === "Enter" && open && results.length) {
            e.preventDefault();
            document
              .getElementById(`desk-result-${Math.max(0, active)}`)
              ?.click();
          }
        }}
      />
      {query && (
        <button
          className="search-clear"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setActive(-1);
            input.current?.focus();
          }}
        >
          <X size={13} />
        </button>
      )}
      {open && (
        <div className="desk-search-dropdown">
          <div className="search-caption">
            {query.trim() ? "Matches" : "Go to"}
          </div>
          <div
            id="desk-search-results"
            role="listbox"
            aria-label="Desk search results"
          >
            {results.map((r, i) => {
              const common = {
                id: `desk-result-${i}`,
                role: "option",
                "aria-selected": active === i,
                className: "desk-search-result",
                onMouseEnter: () => setActive(i),
                onClick: () => {
                  if ("navigation" in r) navigate(r.navigation);
                  setOpen(false);
                },
                tabIndex: -1,
              };
              const content = (
                <>
                  <span>
                    <strong>{r.label}</strong>
                    <small>{r.detail}</small>
                  </span>
                  {"url" in r && <ArrowUpRight size={14} />}
                </>
              );
              return "url" in r ? (
                <a
                  {...common}
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {content}
                </a>
              ) : (
                <button {...common} key={r.id}>
                  {content}
                </button>
              );
            })}
            {!results.length && (
              <p className="search-empty">
                No matches. Try an activity, shop or section.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
