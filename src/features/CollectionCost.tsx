import {
  remainingCollectionCost,
  type CollectionRow,
} from "../core/collections";
import { np } from "../core/utils";

export function CollectionCost({
  rows,
  label,
}: {
  rows: readonly CollectionRow[];
  label: string;
}) {
  const cost = remainingCollectionCost(rows);
  return (
    <div className="collection-cost" aria-label={`${label} remaining cost`}>
      <span className="muted text-small">
        {label} · estimated cost remaining
      </span>
      <strong>
        {cost.subtotal === null ? "Price unknown" : np(cost.subtotal)}
        {cost.unpriced > 0 && cost.subtotal !== null ? " + unpriced items" : ""}
      </strong>
      <span className="muted text-small">
        {cost.remaining === 0
          ? "Nothing left to buy"
          : `${cost.remaining} still to buy · ${cost.priced} priced${cost.unpriced ? ` · ${cost.unpriced} unpriced, excluded from total` : ""}`}
      </span>
    </div>
  );
}
