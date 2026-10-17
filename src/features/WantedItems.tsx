import { Fragment, useMemo, useState } from "react";
import {
  Panel,
  CopyButton,
  Link,
  Button,
  Feedback,
  useAction,
} from "../components/shared";
import { InfoHelp } from "../components/InfoHelp";
import {
  readPriorityItems,
  readEstimates,
} from "../core/trade-estimates";
import { useStore, readLegacy } from "../persistence/store";
import { TradeEstimate } from "../components/TradeEstimate";
import { accounting as C, type Ledger } from "../core/accounting";
import {
  marketURL,
  prioritySearch,
  priorityBatches,
  type MarketSearch,
} from "../core/priority-market";
import { request, isNative } from "../core/bridge";
import { np } from "../core/utils";
import { PriorityEditor } from "./PriorityEditor";
export function WantedItems() {
  const store = useStore(),
    estimates = readEstimates(store.legacy);
  const ledger = readLegacy<Ledger>(store, "nd_shop_profit_v1", {
    version: 1,
    sales: [],
    restoredPurchases: [],
  });
  const holdings = useMemo(
    () =>
      C.account(
        C.mergePurchases(store.native.purchases, ledger.restoredPurchases),
        ledger.sales,
      ).rows.filter((p) => !p.sale),
    [store.native.purchases, store.legacy.nd_shop_profit_v1],
  );
  const { run, busy, message, setMessage } = useAction();
  const wantedItems = readPriorityItems(store.legacy);
  const [editing, setEditing] = useState<string | null>(null);
  const pages = priorityBatches(wantedItems);
  const [page, setPage] = useState(0);
  const currentPage = Math.min(page, Math.max(0, pages.length - 1));
  const visibleItems = pages[currentPage] ?? [];
  const batch = visibleItems.map((item) => prioritySearch(item, estimates));
  function changePage(next: number) {
    setPage(next);
    setMessage("");
  }
  function open(searches: MarketSearch[], copyName?: string) {
    void run(
      async () => {
        await request("openMarketSearches", {
          searches,
          ...(copyName ? { copyName } : {}),
        });
      },
      copyName
        ? "Name copied. Open Neopets’ SSW popup and paste."
        : `Opened ${searches.length} searches in Chrome.`,
    );
  }
  return (
    <Panel
      title="Priority items"
      actions={
        <div className="actions">
          <Button size="sm" variant="outline" onClick={()=>setEditing("")}>Add item</Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !isNative() || !batch.length}
            title="Open every item on this page"
            onClick={() => open(batch)}
          >
            {busy ? "Opening…" : `Open all (${batch.length})`}
          </Button>
          <InfoHelp title="Priority searches and targets">
            <p>
              Open all opens only the items on the current page, up to ten tabs.
              Items estimated below 1M NP use Shop Wizard; higher prices use
              Trading Post. Without an estimate, the buy target chooses the
              destination. Saved targets remain here while you compare prices.
            </p>
            <p>
              SSW copies the item name and opens Shop Wizard. Open Neopets’
              Super Shop Wizard popup and paste the name there. Searches are not
              submitted automatically.
            </p>
            <p>
              Buy and sell amounts are targets per item, in NP. Not set means
              there is no sell target yet. Held counts use unsold purchases in
              My Sales.
            </p>
            <p>
              Add your own item names and targets. Edit or remove them at any time.
            </p>
          </InfoHelp>
        </div>
      }
    >
      {editing !== null && <PriorityEditor name={editing} onClose={()=>setEditing(null)}/>}
      <p className="panel-note muted text-small">
        Targets per item · NP · Open all opens this page
      </p>
      {pages.length > 1 && (
        <nav
          className="actions priority-pagination"
          aria-label="Priority item pages"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={busy || currentPage === 0}
            aria-label="Previous priority page"
            onClick={() => changePage(currentPage - 1)}
          >
            Previous
          </Button>
          <span role="status" aria-live="polite" className="muted text-small">
            Page {currentPage + 1} of {pages.length} · {currentPage * 10 + 1}–
            {currentPage * 10 + visibleItems.length} of {wantedItems.length}{" "}
            items
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || currentPage === pages.length - 1}
            aria-label="Next priority page"
            onClick={() => changePage(currentPage + 1)}
          >
            Next
          </Button>
        </nav>
      )}
      <Feedback message={message} />
      {!isNative() && (
        <p className="panel-note muted text-small">
          Open the desktop app to launch a batch or use SSW. Individual search links
          remain available.
        </p>
      )}
      <div
        className="table-scroll priority-scroll"
        tabIndex={0}
        role="region"
        aria-label="Priority items"
      >
        <table className="data-table priority-table">
          <colgroup>
            {[22, 22, 14, 11, 14, 17].map((width, i) => (
              <col key={i} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {[
                "Item",
                "ItemDB estimate",
                "Buy at",
                "Sell at",
                "Quantity",
                "Find",
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!wantedItems.length && (
              <tr>
                <td colSpan={6}>No priority items.</td>
              </tr>
            )}
            {visibleItems.map((item) => {
              const search = prioritySearch(item, estimates);
              const owned = holdings.filter(
                (p) => p.name.toLowerCase() === item.name.toLowerCase(),
              );
              return (
                <Fragment key={item.name}>
                  <tr className="priority-values">
                    <th scope="row">
                      <div className="name-cell">
                        <Link href={item.slug ? "https://itemdb.com.br/item/" + item.slug : "https://itemdb.com.br/"}>
                          {item.name}
                        </Link>
                        <CopyButton text={item.name} /><Button variant="ghost" size="sm" aria-label={`Edit ${item.name}`} onClick={()=>setEditing(item.name)}>Edit</Button>
                      </div>
                    </th>
                    <td data-label="ItemDB estimate">
                      <TradeEstimate
                        name={item.name}
                        slug={item.slug}
                        estimates={estimates}
                      />
                    </td>
                    <td data-label="Buy at">
                      <strong>{item.buyAt}</strong>
                      {item.buyDetail && (
                        <div className="muted text-small">{item.buyDetail}</div>
                      )}
                    </td>
                    <td data-label="Sell at">
                      {item.sellAt ? (
                        <>
                          <strong>{item.sellAt}</strong>
                          {item.sellDetail && (
                            <div className="muted text-small">
                              {item.sellDetail}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="muted">Not set</span>
                      )}
                    </td>
                    <td data-label="Quantity">
                      <strong>{item.quantity}</strong>
                      <div className="muted text-small">
                        Held: {owned.length}
                      </div>
                      {owned.length > 0 && (
                        <div className="muted text-small">
                          Paid{" "}
                          {np(
                            Math.round(
                              owned.reduce((sum, p) => sum + p.cost, 0) /
                                owned.length,
                            ),
                          )}{" "}
                          each
                        </div>
                      )}
                    </td>
                    <td data-label="Find">
                      <div className="priority-links">
                        <Link
                          href={marketURL({
                            name: item.name,
                            market: "trading",
                          })}
                        >
                          Trading Post
                        </Link>
                        {search.market === "wizard" && (
                          <Link href={marketURL(search)}>Shop Wizard</Link>
                        )}
                        {search.market === "wizard" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy || !isNative()}
                            title="Copy name and open Shop Wizard; use Neopets’ SSW popup there"
                            onClick={() => open([search], item.name)}
                          >
                            SSW · copy & open
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="priority-notes">
                    <td colSpan={6}>
                      <span className="muted">Notes: ({item.note})</span>
                      {item.reference && (
                        <>
                          {" "}
                          <Link href={item.reference.url}>
                            {item.reference.label}
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
