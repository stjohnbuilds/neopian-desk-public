import { WantedItems } from "./WantedItems";
import { WearableShops } from "./WearableShops";
import { useState } from "react";
import catalogues from "../data/catalogues.json";
import { isNative } from "../core/bridge";
import { useShopLauncher } from "../app/useShopLauncher";
import { Button, Panel, Link, Feedback } from "../components/shared";
import { InfoHelp } from "../components/InfoHelp";

type Shop = { id: number; name: string };
const shops = [...catalogues.DESK_SHOP_LAUNCH_DATA].sort((a, b) =>
  a.name.localeCompare(b.name),
);
const groups = Array.from({ length: Math.ceil(shops.length / 10) }, (_, i) =>
  shops.slice(i * 10, i * 10 + 10),
);

export function ShopRestocks() {
  const {
    message,
    opening,
    open: launch,
    batchRunning,
    batchMessage,
    stop,
  } = useShopLauncher();
  const open = (shops: Shop[]) => void launch(shops.map((s) => s.id));
  return (
    <div className="feature-stack">
      <WantedItems />
      <WearableShops />
      <Panel
        title="Neopian shops"
        actions={
          <InfoHelp title="Opening shops">
            <p>
              Choose a shop or open a group of up to ten ordinary links. Saved
              price estimates are dated and may differ from current asking
              prices.
            </p>
            <p>
              With Prices and Jump to expensive finds enabled, Desk checks each
              opened page once. Stop cancels the remaining check; it never buys
              or refreshes.
            </p>
          </InfoHelp>
        }
      >
        <ShopList
          groups={groups}
          label="Find a shop"
          opening={opening}
          onOpen={open}
        />
      </Panel>
      <Feedback message={message} />
      {batchMessage && (
        <div className="actions" role="status">
          <span>{batchMessage}</span>
          {batchRunning && (
            <Button variant="outline" onClick={() => void stop()}>
              Stop batch jump
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ShopList({
  groups,
  label,
  opening,
  onOpen,
  ranked = false,
}: {
  groups: Shop[][];
  label: string;
  opening: boolean;
  onOpen: (shops: Shop[]) => void;
  ranked?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const matches = groups
    .map((group) =>
      group.filter((s) =>
        s.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    )
    .filter((group) => group.length);
  const current = Math.min(page, Math.max(0, matches.length - 1));
  const batch = matches[current] || [];
  const count = matches.reduce((total, group) => total + group.length, 0);
  const start = matches
    .slice(0, current)
    .reduce((total, group) => total + group.length, 0);
  return (
    <>
      <div className="table-toolbar">
        <input
          aria-label={label}
          placeholder="Find a shop…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <Button
          className="push"
          disabled={!isNative() || opening || !batch.length}
          onClick={() => onOpen(batch)}
        >
          Open these {batch.length} shops
        </Button>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {ranked && <th>Rank</th>}
              <th>Shop</th>
              <th>Open individually</th>
            </tr>
          </thead>
          <tbody>
            {batch.map((s) => (
              <tr key={s.id}>
                {ranked && (
                  <td>{shops.findIndex((shop) => shop.id === s.id) + 1}</td>
                )}
                <td>{s.name}</td>
                <td>
                  <Link
                    href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${s.id}`}
                  >
                    Open shop
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!batch.length && <p className="empty">No shops match that search.</p>}
      </div>
      <div className="table-footer">
        <Button
          size="sm"
          variant="outline"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        >
          Previous
        </Button>
        <span>
          {count ? start + 1 : 0}–{start + batch.length} of {count}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={current + 1 >= matches.length}
          onClick={() => setPage(current + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
