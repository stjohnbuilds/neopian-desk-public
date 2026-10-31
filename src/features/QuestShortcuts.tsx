import { Button, Link } from "../components/shared";
import { isNative } from "../core/bridge";

export function QuestShortcuts({
  links,
  ticked,
  expanded,
  busy,
  opening,
  onOpenToday,
  onOpenTicked,
  onTick,
  onExpand,
  onVisit,
}: {
  links: { label: string; url: string }[];
  ticked: string[];
  expanded: boolean;
  busy: boolean;
  opening: "" | "today" | "ticked";
  onOpenToday: () => void;
  onOpenTicked: () => void;
  onTick: (url: string, checked: boolean) => void;
  onExpand: (open: boolean) => void;
  onVisit: (url: string) => void;
}) {
  return (
    <div className="quest-shortcuts">
      <Button
        size="sm"
        variant="outline"
        disabled={busy || !isNative()}
        aria-label="Open the Quest Log and Trudy's Surprise"
        title="Opens the Quest Log and Trudy's Surprise, then shows the quest shortcuts to tick"
        onClick={onOpenToday}
      >
        {opening === "today" ? "Opening…" : "Open Quest Log + Trudy"}
      </Button>
      {!isNative() && <p>Opening pages is available in the desktop app.</p>}
      <details
        open={expanded}
        onToggle={(event) => onExpand(event.currentTarget.open)}
      >
        <summary>Quest shortcuts ({links.length})</summary>
        <ul aria-label="Quest Log shortcuts">
          {links.map((link) => (
            <li
              key={link.url}
              onClick={(event) => {
                if ((event.target as Element).closest("a")) onVisit(link.url);
              }}
            >
              <input
                type="checkbox"
                aria-label={`Tick ${link.label}`}
                checked={ticked.includes(link.url)}
                disabled={busy}
                onChange={(event) => onTick(link.url, event.target.checked)}
              />
              <Link href={link.url}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !isNative() || !ticked.length}
          aria-label="Open the ticked quest pages"
          onClick={onOpenTicked}
        >
          {opening === "ticked" ? "Opening…" : `Open ticked (${ticked.length})`}
        </Button>
        <p>
          Tick today's quests from your Quest Log, then press Open ticked. Visit
          Quest Log before doing tasks. For Popular NC items, use View more in
          the Mall homepage’s Popular Items box.
        </p>
      </details>
    </div>
  );
}
