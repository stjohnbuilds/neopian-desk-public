import { Button, Link } from "../components/shared";
import { isNative } from "../core/bridge";

export function QuestShortcuts({
  links,
  busy,
  opening,
  onOpen,
  onVisit,
}: {
  links: { label: string; url: string }[];
  busy: boolean;
  opening: boolean;
  onOpen: () => void;
  onVisit: (url: string) => void;
}) {
  return (
    <div className="quest-shortcuts">
      <Button
        size="sm"
        variant="outline"
        disabled={busy || !isNative()}
        aria-label="Open all Quest Log pages"
        onClick={onOpen}
      >
        {opening ? "Opening…" : `Open all (${links.length + 1})`}
      </Button>
      {!isNative() && <p>Open all is available in the desktop app.</p>}
      <details>
        <summary>Quest shortcuts ({links.length})</summary>
        <ul aria-label="Quest Log shortcuts">
          {links.map((link) => (
            <li
              key={link.url}
              onClick={(event) => {
                if ((event.target as Element).closest("a")) onVisit(link.url);
              }}
            >
              <Link href={link.url}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <p>
          Visit Quest Log before doing tasks. For Popular NC items, use View
          more in the Mall homepage’s Popular Items box.
        </p>
      </details>
    </div>
  );
}
