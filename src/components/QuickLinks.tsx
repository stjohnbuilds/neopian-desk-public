import { SalesImport } from "./SalesImport";
import { useEffect, useRef, useState } from "react";
import { Pencil, MoreHorizontal, ClipboardPaste } from "lucide-react";
import {
  defaultShortcuts,
  shopGroupIDs,
  type Shortcut,
} from "../core/shortcuts";
import { useStore, readLegacy } from "../persistence/store";
import { isNative } from "../core/bridge";
import { safeURL } from "../core/utils";
import { useShopLauncher } from "../app/useShopLauncher";
import { shortcutGlyphs } from "./ShortcutIcons";
import { ShortcutEditor } from "./ShortcutEditor";

export function QuickLinks() {
  const store = useStore(),
    links = readLegacy<Shortcut[]>(
      store,
      "nd_header_shortcuts",
      defaultShortcuts,
    );
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState(false),
    [more, setMore] = useState(false);
  const [limit, setLimit] = useState(4);
  const root = useRef<HTMLDivElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const { opening, message, open, batchRunning, batchMessage, stop } =
    useShopLauncher();
  const [visibleMessage, setVisibleMessage] = useState("");
  useEffect(() => {
    const header = root.current?.closest(".app-header");
    if (!header) return;
    const resize = new ResizeObserver(([entry]) =>
      setLimit(entry.contentRect.width >= 1000 ? 8 : 4),
    );
    resize.observe(header);
    return () => resize.disconnect();
  }, []);
  useEffect(() => {
    setVisibleMessage(opening ? message : batchMessage || message);
    if (opening || batchRunning) return;
    const timeout = setTimeout(() => setVisibleMessage(""), 7000);
    return () => clearTimeout(timeout);
  }, [message, opening, batchRunning, batchMessage]);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setMore(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const render = (link: Shortcut, overflow = false) => {
    const Icon = shortcutGlyphs[link.icon];
    const content = (
      <>
        <Icon size={16} />
        {overflow ? (
          <span>{link.label}</span>
        ) : link.kind === "shops" && link.group === "collectibles" ? (
          <span>Collectibles</span>
        ) : link.kind === "shops" ? (
          <span className="shortcut-number">{link.group}</span>
        ) : null}
      </>
    );
    const props = {
      className: overflow
        ? "shortcut-overflow-item"
        : `quick-link${link.kind === "shops" && link.group === "collectibles" ? " quick-link-labelled" : ""}`,
      "aria-label": link.label,
      title: link.label,
      onClick: () => {
        setMore(false);
        if (link.kind === "shops") void open(shopGroupIDs(link.group));
      },
    };
    return link.kind === "url" ? (
      <a
        {...props}
        key={link.id}
        href={safeURL(link.url)!}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    ) : (
      <button {...props} key={link.id} disabled={opening || !isNative()}>
        {content}
      </button>
    );
  };
  return (
    <>
      <div
        className="quick-links"
        ref={root}
        aria-label="Quick links"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setMore(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMore(false);
        }}
      >
        {links.slice(0, limit).map((s) => render(s))}
        <button
          className="quick-link"
          ref={importButton}
          aria-label="Import sales"
          title="Import sales"
          aria-haspopup="dialog"
          onClick={() => {
            setMore(false);
            setImporting(true);
          }}
        >
          <ClipboardPaste size={16} />
        </button>
        {links.length > limit && (
          <button
            className="quick-link"
            aria-label="More quick links"
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            <MoreHorizontal size={16} />
          </button>
        )}
        <button
          className="quick-link quick-edit"
          aria-label="Edit quick links"
          title="Edit quick links"
          onClick={() => {
            setMore(false);
            setEditing(true);
          }}
        >
          <Pencil size={14} />
        </button>
        {more && (
          <div className="shortcut-overflow">
            {links.slice(limit).map((s) => render(s, true))}
          </div>
        )}
      </div>
      {(batchRunning || visibleMessage) && (
        <div className="header-feedback">
          <span role="status">
            {batchRunning ? batchMessage : visibleMessage}
          </span>
          {batchRunning && (
            <button
              type="button"
              onClick={() =>
                void stop().catch((error) => setVisibleMessage(String(error)))
              }
            >
              Stop checking shops
            </button>
          )}
        </div>
      )}
      {importing && (
        <SalesImport
          onClose={() => {
            setImporting(false);
            requestAnimationFrame(() => importButton.current?.focus());
          }}
        />
      )}
      {editing && (
        <ShortcutEditor
          links={links}
          baseline={store.legacy.nd_header_shortcuts}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
