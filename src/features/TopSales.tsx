import { useState } from "react";
import {
  rankSales,
  type RankedItem,
  type TopSalesSort,
} from "../core/sales-overview";
import { np } from "../core/utils";
import { Button, Disclosure } from "../components/shared";

export function TopSales({
  items,
  dates,
}: {
  items: RankedItem[];
  dates: string;
}) {
  const [sort, setSort] = useState<TopSalesSort>("income");
  const [showAll, setShowAll] = useState(false);
  const ranked = rankSales(items, sort);
  const shown = showAll ? ranked : ranked.slice(0, 10);
  return (
    <Disclosure title="Top sales">
      <div className="sales-top-controls">
        <label className="sales-sort">
          Rank by
          <select
            aria-label="Rank top sales by"
            value={sort}
            onChange={(e) => setSort(e.target.value as TopSalesSort)}
          >
            <option value="income">Total sales income</option>
            <option value="count">Quantity sold</option>
            <option value="profit">Profit with known costs</option>
          </select>
        </label>
      </div>
      <p className="panel-note muted text-small">
        {dates}. Repeated sales of the same item are combined.
      </p>
      {!items.length ? (
        <p className="empty">
          No sales in this period. Choose another week, month or year above.
        </p>
      ) : (
        <>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Top sales table"
          >
            <table className="data-table top-sales-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Sold</th>
                  <th scope="col">Sales income</th>
                  <th scope="col">Paid amount</th>
                  <th scope="col">Profit</th>
                  <th scope="col">Highest sale</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item, i) => (
                  <tr key={item.name}>
                    <th scope="row">
                      <span className="sales-rank">{i + 1}</span>
                      {item.name}
                    </th>
                    <td data-label="Sold">{item.count}</td>
                    <td data-label="Sales income">{np(item.income)}</td>
                    <td data-label="Paid amount">
                      {item.knownCount ? np(item.knownCost) : "Cost unknown"}
                      {item.missingCosts > 0 && item.knownCount > 0 && (
                        <small className="history-source muted">
                          Cost known for {item.knownCount} of {item.count}
                        </small>
                      )}
                    </td>
                    <td data-label="Profit">
                      {item.knownCount ? np(item.knownProfit) : "Cost unknown"}
                      {item.missingCosts > 0 && item.knownCount > 0 && (
                        <small className="history-source muted">
                          Cost known for {item.knownCount} of {item.count}
                        </small>
                      )}
                    </td>
                    <td data-label="Highest sale">{np(item.highestSale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-note sales-top-footer">
            <span className="muted text-small">
              {shown.length} of {items.length} items · Paid amount and profit use
              recorded purchase costs only.
            </span>
            {items.length > 10 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show top 10" : `Show all ${items.length} items`}
              </Button>
            )}
          </div>
        </>
      )}
    </Disclosure>
  );
}
