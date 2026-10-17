import {
  profitViewKey,
  readProfitView,
  type ProfitView,
} from "../core/profit-view";
import { ShopResults } from "./ShopResults";
import { SectionTabs } from "../components/SectionTabs";
import { ShopRestocks } from "./ShopRestocks";
import { TradeWatchlist } from "./TradeWatchlist";
import { SalesHistory } from "./SalesHistory";
import { SalesPeriod } from "./SalesPeriod";
import { SalesTrend } from "./SalesTrend";
import { TopSales } from "./TopSales";
import { InfoHelp } from "../components/InfoHelp";
import { navigate, useNavigation } from "../app/useNavigation";
import { useMemo } from "react";
import { useStore, readLegacy, updateStore } from "../persistence/store";
import { accounting as C, type Ledger } from "../core/accounting";
import {
  inRange,
  overviewRange,
  rangeLabel,
  salesOverview,
  validRange,
} from "../core/sales-overview";
import { np } from "../core/utils";
import { usePacificDay } from "../core/usePacificDay";
import { Feedback, useAction } from "../components/shared";
export function Profit() {
  const { profit: view } = useNavigation();
  return (
    <div
      className={`feature-stack profit-page ${view === "sales" ? "is-sales" : ""}`}
    >
      <SectionTabs
        label="Profit sections"
        value={view}
        onChange={(profit) => navigate({ profit })}
        options={[
          ["sales", "My Sales"],
          ["restocks", "Shop Restocks"],
          ["trades", "Trading Post"],
        ]}
      />
      <div hidden={view !== "sales"}>
        <MySales />
      </div>
      <div hidden={view !== "restocks"}>
        <ShopRestocks />
      </div>
      <div hidden={view !== "trades"}>
        <TradeWatchlist />
      </div>
    </div>
  );
}
export function MySales() {
  const store = useStore();
  const today = usePacificDay();
  const ledger = readLegacy<Ledger>(store, "nd_shop_profit_v1", {
    version: 1,
    sales: [],
    restoredPurchases: [],
  });
  const view = readProfitView(store.legacy, today);
  const { message, setMessage } = useAction();
  function updateView(change: Partial<ProfitView>) {
    void updateStore((current) => ({
      ...current,
      legacy: {
        ...current.legacy,
        [profitViewKey]: JSON.stringify({
          ...readProfitView(current.legacy, today),
          ...change,
        }),
      },
    }))
      .then(() => setMessage(""))
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : String(error)),
      );
  }
  const purchases = useMemo(
    () => C.mergePurchases(store.native.purchases, ledger.restoredPurchases),
    [store.native.purchases, ledger.restoredPurchases],
  );
  const result = useMemo(
    () => C.account(purchases, ledger.sales),
    [purchases, ledger.sales],
  );
  const range = overviewRange(view, today);
  const valid = validRange(range, view.period === "custom");
  const inside = (date: string) => inRange(date, range);
  const summary = valid
    ? salesOverview(result.rows, ledger.sales, range, view.includeMissingCosts)
    : null;
  const dates = valid ? rangeLabel(range) : "";
  const periodKey = `${view.period}:${range.start}:${range.end}`;
  return (
    <div className="feature-stack sales-page">
      <section className="sales-band" aria-label="Sales overview">
        <div className="sales-toolbar">
          <SalesPeriod view={view} today={today} onChange={updateView} />
          <label className="sales-included">
            <span className="sr-only">Sales shown</span>
            <select
              aria-label="Sales included in overview"
              value={view.includeMissingCosts ? "all" : "known"}
              onChange={(e) =>
                updateView({ includeMissingCosts: e.target.value === "all" })
              }
            >
              <option value="all">All recorded sales</option>
              <option value="known">Only sales with known costs</option>
            </select>
          </label>
          <InfoHelp title="How sales and profit are counted">
            <p>
              These totals and the graph use the date each item sold. Each sale
              is matched to the oldest earlier recorded purchase of the same
              item. Profit is the amount received minus that purchase cost.
            </p>
            <p>
              Awaiting a recorded sale counts purchases made during the selected
              dates with no matching sale recorded. It may include items kept,
              used, or sold without a captured receipt.
            </p>
            <p>
              Results by shop follows purchases made in the selected period and
              includes their later recorded sales. Its totals can differ from
              this sales overview.
            </p>
          </InfoHelp>
        </div>
        {!summary ? (
          <Feedback message="Choose a valid date range." />
        ) : (
          <>
            <div className="sales-metrics">
              <div className="metric">
                <span>Sales income</span>
                <strong>{np(summary.income)}</strong>
              </div>
              <div className="metric">
                <span>Profit</span>
                <strong>
                  {summary.sales.length && !summary.matchedCount
                    ? "Cost unknown"
                    : np(summary.profit)}
                </strong>
                <small>
                  {summary.missingCosts
                    ? `Based on ${summary.matchedCount} of ${summary.sales.length} sales; ${summary.missingCosts} ${summary.missingCosts === 1 ? "cost" : "costs"} missing`
                    : ""}
                </small>
              </div>
              <div className="metric">
                <span>Items sold</span>
                <strong>{summary.sales.length.toLocaleString("en-US")}</strong>
              </div>
              <div className="metric inventory-metric">
                <span>Awaiting a recorded sale</span>
                <strong>
                  {summary.awaiting.length.toLocaleString("en-US")}
                </strong>
                <small>Bought in this period</small>
              </div>
            </div>
            {summary.excludedCount > 0 && (
              <div className="sales-summary-note muted text-small">
                <span>
                  {summary.excludedCount > 0
                    ? `${summary.excludedCount} ${summary.excludedCount === 1 ? "sale with unknown cost is" : "sales with unknown costs are"} hidden by the filter.`
                    : ""}
                </span>
              </div>
            )}
          </>
        )}
      </section>
      {summary && (
        <>
          <SalesTrend
            key={`trend:${periodKey}:${view.metric}:${view.includeMissingCosts}`}
            series={summary.series(view.metric)}
            metric={view.metric}
            onMetric={(metric) => updateView({ metric })}
            dates={dates}
          />
          <TopSales items={summary.items} dates={dates} />
          <ShopResults
            rows={result.rows.filter((p) => inside(p.day))}
            range={range}
          />
        </>
      )}
      <SalesHistory
        key={`history:${periodKey}`}
        rows={result.rows}
        unmatched={result.unmatched}
        inside={inside}
        valid={valid}
      />
      <Feedback message={message} />
    </div>
  );
}
