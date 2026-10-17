import { effectiveEstimate, type Estimates } from "../core/trade-estimates";
import { np } from "../core/utils";
import { Link } from "./shared";
export function TradeEstimate({
  name,
  slug,
  seed,
  estimates,
}: {
  name: string;
  slug: string;
  seed?: { value: number; priceDate: string };
  estimates: Estimates;
}) {
  const estimate = effectiveEstimate(name, estimates, seed);
  return (
    <div>
      <Link href={slug ? "https://itemdb.com.br/item/" + slug : "https://itemdb.com.br/"}>
        {estimate?.value ? np(estimate.value) : "No estimate yet"}
      </Link>
      {estimate?.priceDate && (
        <div className="muted text-small">
          Price dated {estimate.priceDate.length === 10
            ? estimate.priceDate
            : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(estimate.priceDate))}
        </div>
      )}
      {estimate?.checkedAt && (
        <div className="muted text-small">
          Checked {new Date(estimate.checkedAt).toLocaleString()}
        </div>
      )}
      {estimate?.error && (
        <div className="text-small" role="status">
          {estimate.error}
          {estimate.attemptedAt &&
            ` Attempted ${new Date(estimate.attemptedAt).toLocaleString()}.`}
        </div>
      )}
    </div>
  );
}
