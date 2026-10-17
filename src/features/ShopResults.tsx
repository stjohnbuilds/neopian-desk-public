import type { PurchaseRow } from "../core/accounting";
import { shopResults } from "../core/shop-results";
import { np } from "../core/utils";
import catalogues from "../data/catalogues.json";
import { Disclosure } from "../components/shared";

const names = new Map<number, string>(
  catalogues.DESK_SHOP_LAUNCH_DATA.map((s) => [s.id, s.name]),
);

names.set(0, "Manual purchases");
names.set(-1, "Players’ shops");

export function ShopResults({
  rows,
  range,
}: {
  rows: PurchaseRow[];
  range: { start: string; end: string };
}) {
  const shops = shopResults(rows);
  return (
    <Disclosure title="Results by shop">
      <div className="feature-stack">
        <p className="muted text-small">
          Bought in this period:{" "}
          {range.start ? `from ${range.start}` : "from the beginning"} through{" "}
          {range.end}, Pacific time. {rows.length} recorded purchases across{" "}
          {shops.length} shops. Sorted by realised profit. Includes later sales
          of these purchases.
        </p>
        {shops.length ? (
          <div
            className="shop-results-scroll"
            tabIndex={0}
            role="region"
            aria-label="Shop results table, scroll horizontally for all columns"
          >
            <table className="shop-results-table">
              <caption className="sr-only">
                Recorded purchase results by shop
              </caption>
              <thead>
                <tr>
                  {[
                    "Shop",
                    "Bought",
                    "Sold",
                    "Unsold",
                    "Sale income",
                    "Sold cost",
                    "Profit",
                    "Unsold cost",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.shopId}>
                    <th scope="row">
                      {names.get(shop.shopId) || `Shop ${shop.shopId}`}
                    </th>
                    <td>{shop.purchased}</td>
                    <td>{shop.sold}</td>
                    <td>{shop.unsold}</td>
                    <td>{shop.sold ? np(shop.income) : "—"}</td>
                    <td>{shop.sold ? np(shop.soldCost) : "—"}</td>
                    <td>{shop.sold ? np(shop.profit) : "—"}</td>
                    <td>{np(shop.unsoldCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            No recorded purchases in this period. Choose another period above or
            record a shop purchase with the purchase tracker.
          </p>
        )}
        <p className="muted text-small">
          Profit is sale income minus the cost of sold items. Later sales count
          towards the original purchase date. Unsold means no matching sale is
          recorded yet. Sales with missing purchase costs cannot be assigned to
          a shop. These results describe this sample of purchases; they are not
          an estimate of hourly earnings.
        </p>
      </div>
    </Disclosure>
  );
}
