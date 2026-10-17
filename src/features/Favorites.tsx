import { useState } from "react";
import { useStore, readLegacy } from "../persistence/store";
import {
  defaultShortcuts,
  shopGroupIDs,
  type Shortcut,
} from "../core/shortcuts";
import { ShortcutEditor } from "../components/ShortcutEditor";
import { Button, Link, Panel, Feedback } from "../components/shared";
import { useShopLauncher } from "../app/useShopLauncher";
import { isNative } from "../core/bridge";
export function Favorites() {
  const store = useStore(),
    links = readLegacy<Shortcut[]>(
      store,
      "nd_header_shortcuts",
      defaultShortcuts,
    );
  const [editing, setEditing] = useState(false);
  const { open, opening, message } = useShopLauncher();
  return (
    <div className="feature-stack">
      <Panel
        title="Favorite places"
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit favorites
          </Button>
        }
      >
        {!links.length && (
          <p>
            No favorites yet. Add a preset or your own link with Edit favorites.
          </p>
        )}
        <div className="daily-grid">
          {links.map((l) => (
            <article className="daily-card" key={l.id}>
              <strong>{l.label}</strong>
              <div className="actions">
                {l.kind === "url" ? (
                  <Link href={l.url}>Open</Link>
                ) : (
                  <Button
                    disabled={opening || !isNative()}
                    onClick={() => void open(shopGroupIDs(l.group))}
                  >
                    Open shops
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="muted text-small">Shared with your header quick links.</p>
        <Feedback message={message} />
      </Panel>
      {editing && (
        <ShortcutEditor
          links={links}
          baseline={store.legacy.nd_header_shortcuts}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
