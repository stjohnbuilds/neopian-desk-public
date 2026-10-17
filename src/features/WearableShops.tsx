import { ExternalLink } from "lucide-react";
import shops from "../data/wearable-shops.json";
import { useShopLauncher } from "../app/useShopLauncher";
import { isNative } from "../core/bridge";
import { Button, Panel, Link, Feedback } from "../components/shared";

/** Browsing group, not a daily task: shops can be revisited without completion checks. */
export function WearableShops() {
  const { open, opening, message } = useShopLauncher();
  return (
    <Panel
      collapsible
      title="Wearables"
      actions={
        <Button
          size="sm"
          variant="outline"
          disabled={opening || !isNative()}
          aria-label="Open wearable shops"
          onClick={() => void open(shops.map((s) => s.id))}
        >
          <ExternalLink size={14} />
          {opening ? "Opening…" : `Open shops (${shops.length})`}
        </Button>
      }
    >
      <p className="muted text-small panel-note">
        Backgrounds, foregrounds and trinkets. Shop stock can also include other
        items.
      </p>
      <div className="daily-grid">
        {shops.map((shop) => (
          <article className="daily-card" key={shop.id}>
            <div className="daily-title">
              <strong>{shop.name}</strong>
            </div>
            <p>{shop.note}</p>
            <div className="actions">
              <Link
                href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shop.id}`}
              >
                Open shop
              </Link>
            </div>
          </article>
        ))}
      </div>
      <Feedback message={message} />
    </Panel>
  );
}
