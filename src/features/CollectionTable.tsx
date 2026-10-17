import { useMemo, useRef, useState } from "react";
import {
  Button,
  Panel,
  Link,
  CopyButton,
  Feedback,
  useAction,
  Disclosure,
} from "../components/shared";
import { SectionTabs } from "../components/SectionTabs";
import { CollectionCost } from "./CollectionCost";
import { useStore, updateStore, getState } from "../persistence/store";
import { isNative, request } from "../core/bridge";
import { np } from "../core/utils";
import { marketURL } from "../core/priority-market";
import {
  collectionRows,
  collectionSearch,
  collectionBatch,
  withCollectionView,
  type CollectionItem,
  type CollectionKind,
} from "../core/collections";

export function CollectionTable({
  kind,
  title,
  items,
  groups,
  catalogueDate,
}: {
  kind: CollectionKind;
  title: string;
  items: readonly CollectionItem[];
  groups: readonly (readonly [string, string])[];
  catalogueDate: string;
}) {
  const store = useStore();
  const view = store.collections?.views[kind] ?? {
    group: groups[0][0],
    onlyMissing: true,
  };
  const group = groups.some(([id]) => id === view.group)
    ? view.group
    : groups[0][0];
  const [query, setQuery] = useState("");
  const [queryBatch, setQueryBatch] = useState<string[]>();
  const tableRegion = useRef<HTMLDivElement>(null);
  const { run, busy, message, setMessage } = useAction();
  const rows = useMemo(() => collectionRows(items, store), [items, store]);
  const inGroup = rows.filter((row) => row.item.group === group);
  const albums = [...new Set(inGroup.map((row) => row.item.album))].sort();
  const album =
    view.album && albums.includes(view.album) ? view.album : undefined;
  const inAlbum = album
    ? inGroup.filter((row) => row.item.album === album)
    : inGroup;
  const searched = inAlbum.filter((row) =>
    `${row.item.name} ${row.item.album}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const { batch, visible, previous, next, remaining } = collectionBatch(
    searched,
    view.onlyMissing,
    query.trim() ? queryBatch : view.batch,
  );
  const groupName = groups.find(([id]) => id === group)![1];
  const batchIds = batch.map((row) => row.item.id);
  const toBuy = visible.filter((row) => !row.inAlbum && !row.purchased);
  const waiting = batch.filter((row) => !row.inAlbum && row.purchased).length;
  function changeView(change: Partial<typeof view>) {
    void run(async () => {
      await updateStore((s) =>
        withCollectionView(s, kind, {
          ...view,
          group,
          batch: undefined,
          ...change,
        }),
      );
      setQuery("");
      setQueryBatch(undefined);
      setMessage("");
    });
  }
  function moveBatch(ids: string[]) {
    if (query.trim()) {
      setQueryBatch(ids);
      setMessage("");
    } else changeView({ batch: ids });
    tableRegion.current?.focus();
  }
  function openAll() {
    void run(async () => {
      const ids = new Set(visible.map((row) => row.item.id));
      const latest = collectionRows(items, getState()).filter(
        (row) => ids.has(row.item.id) && !row.inAlbum && !row.purchased,
      );
      if (!latest.length)
        throw Error(
          "Nothing left to buy in this batch. Add your bought items to your album or choose Next ten.",
        );
      if (query.trim()) setQueryBatch(batchIds);
      else
        await updateStore((s) =>
          withCollectionView(s, kind, { ...view, group, batch: batchIds }),
        );
      await request("openMarketSearches", {
        searches: latest.map((row) => collectionSearch(row.item)),
      });
      setMessage(
        `Opened ${latest.length} searches in Chrome. This batch stays together until you choose Next ten.`,
      );
    });
  }
  return (
    <div className="feature-stack collection-shopping">
      <SectionTabs
        label={`${title} types`}
        value={group}
        onChange={(next) => changeView({ group: next, album: undefined })}
        options={groups}
      />
      <Panel
        title={groupName}
        actions={
          <Button
            disabled={busy || !isNative() || !toBuy.length}
            aria-label={`Open all ${toBuy.length} collection searches`}
            onClick={openAll}
          >
            {busy
              ? "Saving / opening…"
              : toBuy.length === 10
                ? "Open all ten"
                : `Open all (${toBuy.length})`}
          </Button>
        }
      >
        <div className="table-toolbar collection-toolbar">
          <label className="collection-album-filter">
            <span className="muted text-small">Album</span>
            <select
              aria-label="Filter by album"
              value={album ?? ""}
              disabled={busy}
              onChange={(e) =>
                changeView({ album: e.target.value || undefined })
              }
            >
              <option value="">All albums</option>
              {albums.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <input
            aria-label={`Search ${title.toLowerCase()}`}
            placeholder="Find an item or album…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setQueryBatch(undefined);
              setMessage("");
            }}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={view.onlyMissing}
              disabled={busy}
              onChange={(e) => changeView({ onlyMissing: e.target.checked })}
            />
            Show only missing from album
          </label>
          <span className="muted text-small" aria-live="polite">
            {inAlbum.filter((row) => row.collected).length} of {inAlbum.length}{" "}
            in album
          </span>
        </div>
        <div className="collection-costs panel-note" aria-live="polite">
          <CollectionCost rows={rows} label="All album collectibles" />
          <CollectionCost
            rows={inAlbum}
            label={album ? `${groupName} · ${album}` : groupName}
          />
        </div>
        <div className="collection-batch-bar panel-note actions">
          <span role="status">
            <strong>
              This batch: {batch.filter((row) => row.collected).length} of{" "}
              {batch.length} in album
            </strong>{" "}
            · {waiting} bought, waiting to be added · {remaining} missing
            {query.trim()
              ? " in this search"
              : album
                ? " in this album"
                : " in this category"}
          </span>
          {waiting > 0 && (
            <div className="actions">
              <Link href="https://www.neopets.com/inventory.phtml">
                Open inventory
              </Link>
              <Link href="https://www.neopets.com/safetydeposit.phtml">
                Open SDB
              </Link>
            </div>
          )}
        </div>
        <p className="panel-note muted text-small">
          Only confirmed album additions check off and hide items. Bought items
          stay visible until added; Open all skips them. Choose Next ten when
          ready.
        </p>
        <p className="panel-note muted text-small">
          Cheapest first · dated ItemDB estimates · unknown prices last. Cost
          totals cover all remaining items in the labelled scope, including
          other batches; typing a search does not change them.
        </p>
        <div
          ref={tableRegion}
          className="table-scroll collection-scroll"
          role="region"
          aria-label={groupName}
          tabIndex={0}
        >
          <table className="data-table collection-table">
            <thead>
              <tr>
                <th scope="col">In album</th>
                <th scope="col">Item</th>
                <th scope="col">Estimated price</th>
                <th scope="col">Find</th>
              </tr>
            </thead>
            <tbody>
              {!visible.length && (
                <tr>
                  <td colSpan={4} className="empty">
                    {batch.length &&
                    batch.every((row) => row.collected) &&
                    view.onlyMissing
                      ? "This batch is complete. Choose Next ten to continue."
                      : query
                        ? "No items match this search."
                        : view.onlyMissing
                          ? `All listed ${groupName.toLowerCase()} are confirmed in your album. Turn off the filter to see them.`
                          : "No items in this collection yet."}
                  </td>
                </tr>
              )}
              {visible.map((row) => (
                <tr key={row.item.id} data-collection-id={row.item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.inAlbum}
                      disabled
                      aria-label={`In album: ${row.item.name}`}
                      title={
                        row.inAlbum
                          ? "Confirmed in your album"
                          : "Checks automatically after a confirmed album addition"
                      }
                    />
                  </td>
                  <th scope="row">
                    <div className="collection-item">
                      {row.item.image && (
                        <img
                          src={`https://images.neopets.com/items/${row.item.image}.gif`}
                          width="40"
                          height="40"
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <div>
                        <div className="name-cell">
                          <span>{row.item.name}</span>
                          <CopyButton
                            text={row.item.name}
                            label={`Copy ${row.item.name}`}
                          />
                        </div>
                        <span className="muted text-small">
                          {row.item.album} · {row.status}
                        </span>
                      </div>
                    </div>
                  </th>
                  <td data-label="Estimated price">
                    <strong>
                      {row.item.price === null ? "Unknown" : np(row.item.price)}
                    </strong>
                    <div className="muted text-small">
                      {row.item.priceDate?.slice(0, 10) ??
                        "No reliable estimate"}
                    </div>
                    <Link href={row.item.sourceUrl}>
                      {row.item.priceSource}
                    </Link>
                  </td>
                  <td data-label="Find">
                    <div className="collection-links">
                      {!row.inAlbum && !row.purchased && (
                        <Link href={marketURL(collectionSearch(row.item))}>
                          {collectionSearch(row.item).market === "trading"
                            ? "Trading Post"
                            : "Shop Wizard"}
                        </Link>
                      )}
                      {row.item.page !== undefined && (
                        <Link
                          href={`https://www.neopets.com/stamps.phtml?type=album&page_id=${row.item.page}&owner=${encodeURIComponent(store.profile.account)}`}
                        >
                          Album
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav
          className="collection-pagination actions"
          aria-label={`${title} batches`}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !previous.length}
            onClick={() => moveBatch(previous)}
          >
            Previous ten
          </Button>
          <span className="muted text-small">
            {visible.length} shown · {batch.length} items in this batch
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !next.length}
            onClick={() => moveBatch(next)}
          >
            Next ten
          </Button>
        </nav>
        <Feedback message={message} />
        {!isNative() && (
          <p className="panel-note muted text-small">
            Open all is available in the desktop app. Individual search links work
            here.
          </p>
        )}
      </Panel>
      <Disclosure title="How collection tracking works">
        <p>
          A checkmark means the tracker confirmed this exact item in your album.
          Buying, moving an item to SDB, and older manual checks do not
          establish album ownership. Individual additions and SDB album batches
          use the paired Stamp Tracker. Open an item's Album link to check its
          page again.
        </p>
        <p>
          Bought items stay visible until their album addition is confirmed.
          Open all and remaining purchase costs skip recorded purchases so you
          do not buy them twice. Turn off Show only missing from album to review
          confirmed items. Your existing purchase records remain in My Sales.
        </p>
        <p>
          Open all opens this page only, up to ten searches. Items estimated at
          1M NP or more use Trading Post. Other links open the ordinary Shop
          Wizard with the item name filled in. You can open Super Shop Wizard
          manually on Neopets. You choose and buy each item yourself.
        </p>
        <p>
          Catalogue reference: {catalogueDate}. New releases may need a
          catalogue update. A missing receipt or an unchecked album remains
          unconfirmed.
        </p>
      </Disclosure>
    </div>
  );
}
