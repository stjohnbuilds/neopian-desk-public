import {
  tradeCandidates,
  readEstimates,
  effectiveEstimate,
} from "../core/trade-estimates";
import { useStore } from "../persistence/store";
import { TradeEstimate } from "../components/TradeEstimate";
import { RefreshTradeEstimates } from "./RefreshTradeEstimates";
import { WantedItems } from "./WantedItems";
import { TradingSalesNotice } from "../components/TradingSalesNotice";
import { useEffect, useState } from "react";
import { nativeMessage, isNative } from "../core/bridge";
import { np } from "../core/utils";
import {
  Panel,
  Button,
  Link,
  CopyButton,
  Feedback,
  useAction,
} from "../components/shared";
const ratings: Record<string, string> = {
  ets: "Easier to sell",
  regular: "Average",
  hts: "Hard to sell",
};
const tradeURL = (name: string) =>
  "https://www.neopets.com/island/tradingpost.phtml#/?" +
  new URLSearchParams({
    type: "browse",
    criteria: "item_phrase",
    sort: "newest",
    page: "1",
    search_string: name,
  });
export function TradeWatchlist() {
  const estimates = readEstimates(useStore().legacy);
  const [search, setSearch] = useState(""),
    [rating, setRating] = useState("ets"),
    [maximum, setMaximum] = useState(15_000_000),
    [page, setPage] = useState(0);
  const { run, message, setMessage } = useAction();
  useEffect(() => {
    const report = (e: Event) => setMessage((e as CustomEvent).detail.message);
    window.addEventListener("desk-trades-opened", report);
    return () => window.removeEventListener("desk-trades-opened", report);
  }, []);
  const rows = tradeCandidates
    .map((i) => ({
      ...i,
      value: effectiveEstimate(i.name, estimates, i)?.value ?? i.value,
    }))
    .filter(
      (i) =>
        i.value >= 1_000_000 &&
        i.value <= 15_000_000 &&
        i.rating !== "hts" &&
        i.value <= maximum &&
        i.name.toLowerCase().includes(search.toLowerCase()) &&
        (rating === "all" ||
          i.rating === "ets" ||
          (rating === "regular" && i.rating === "regular")),
    );
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 10) - 1)),
    batch = rows.slice(current * 10, current * 10 + 10);
  return (
    <>
      <TradingSalesNotice />
      <RefreshTradeEstimates />
      <WantedItems />
      <Panel title="Trading Post watchlist">
        <p className="panel-note muted text-small">
          1–15 million NP resale shortlist. Easier-to-sell items first; your
          priority items above are always kept. Buy below a realistic quick-sale
          price, not just below an asking price.
        </p>
        <div className="table-toolbar">
          <input
            aria-label="Find watchlist item"
            placeholder="Find an item…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <select
            aria-label="Sale difficulty"
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All shortlisted ratings</option>
            <option value="ets">Easier to sell</option>
            <option value="regular">Easier or average</option>
          </select>
          <select
            aria-label="Maximum item estimate"
            value={maximum}
            onChange={(e) => {
              setMaximum(Number(e.target.value));
              setPage(0);
            }}
          >
            {[5_000_000, 10_000_000, 15_000_000].map((n) => (
              <option key={n} value={n}>
                Up to {np(n)}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Saved estimate</th>
                <th>Rating</th>
                <th>Search</th>
              </tr>
            </thead>
            <tbody>
              {!batch.length && (
                <tr>
                  <td colSpan={4}>
                    No matching items. Try another search or change the filters.
                  </td>
                </tr>
              )}
              {batch.map((item) => (
                <tr key={item.name}>
                  <td>
                    <div className="name-cell">
                      {item.name}
                      <CopyButton text={item.name} />
                    </div>
                  </td>
                  <td>
                    <TradeEstimate
                      name={item.name}
                      slug={item.slug}
                      seed={tradeCandidates.find((i) => i.name === item.name)}
                      estimates={estimates}
                    />
                  </td>
                  <td>{ratings[item.rating]}</td>
                  <td>
                    <Link href={tradeURL(item.name)}>Trading Post</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-toolbar">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <span>
            {rows.length ? current * 10 + 1 : 0}–
            {Math.min(rows.length, current * 10 + 10)} of {rows.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(current + 1) * 10 >= rows.length}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isNative() || !batch.length}
            onClick={() =>
              run(
                async () =>
                  nativeMessage("deskBrowser", {
                    action: "openTradingSearchesInChrome",
                    names: batch.map((i) => i.name),
                  }),
                "Opening searches…",
              )
            }
          >
            Open {batch.length} searches
          </Button>
        </div>
        <p className="muted text-small">
          ItemDB estimates are dated per row. Sale ratings are signals, not
          measured sale times or guaranteed profit. Broader shortlist research
          is still incomplete.
        </p>
        <Feedback message={message} />
      </Panel>
    </>
  );
}
