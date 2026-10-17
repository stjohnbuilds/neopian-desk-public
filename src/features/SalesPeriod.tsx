import type { ProfitView } from "../core/profit-view";
import {
  periodStart,
  shiftPeriod,
  type CalendarPeriod,
} from "../core/sales-overview";
import { Button } from "../components/shared";

export function SalesPeriod({
  view,
  today,
  onChange,
}: {
  view: ProfitView;
  today: string;
  onChange: (change: Partial<ProfitView>) => void;
}) {
  const calendar = ["week", "month", "year"].includes(view.period)
    ? (view.period as CalendarPeriod)
    : null;
  const anchor = view.anchor || today;
  return (
    <section className="sales-period" aria-label="Sales date range">
      <div className="sales-period-controls">
        <label>
          <span className="sr-only">Period</span>
          <select
            aria-label="Profit period"
            value={view.period}
            onChange={(e) =>
              onChange({
                period: e.target.value as ProfitView["period"],
                anchor: "",
              })
            }
          >
            <option value="last30">Last 30 days</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="all">Lifetime</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        {calendar && (
          <div className="sales-calendar-controls">
            <Button
              variant="outline"
              size="sm"
              aria-label={`Previous ${calendar}`}
              disabled={periodStart(calendar, anchor) <= "1999-01-01"}
              onClick={() =>
                onChange({ anchor: shiftPeriod(calendar, anchor, -1) })
              }
            >
              ←
            </Button>
            {calendar === "month" ? (
              <label>
                <span className="sr-only">Choose month</span>
                <input
                  type="month"
                  aria-label="Choose month"
                  min="1999-01"
                  max={today.slice(0, 7)}
                  value={anchor.slice(0, 7)}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}$/.test(e.target.value))
                      onChange({ anchor: `${e.target.value}-01` });
                  }}
                />
              </label>
            ) : calendar === "year" ? (
              <label>
                <span className="sr-only">Choose year</span>
                <select
                  aria-label="Choose year"
                  value={anchor.slice(0, 4)}
                  onChange={(e) =>
                    onChange({ anchor: `${e.target.value}-01-01` })
                  }
                >
                  {Array.from(
                    { length: Number(today.slice(0, 4)) - 1998 },
                    (_, i) => String(Number(today.slice(0, 4)) - i),
                  ).map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                <span className="sr-only">Week containing</span>
                <input
                  type="date"
                  aria-label="Week containing"
                  min="1999-01-01"
                  max={today}
                  value={anchor}
                  onChange={(e) => {
                    if (e.target.value) onChange({ anchor: e.target.value });
                  }}
                />
              </label>
            )}
            <Button
              variant="outline"
              size="sm"
              aria-label={`Next ${calendar}`}
              disabled={
                periodStart(calendar, anchor) >= periodStart(calendar, today)
              }
              onClick={() => {
                const next = shiftPeriod(calendar, anchor, 1);
                onChange({
                  anchor:
                    periodStart(calendar, next) === periodStart(calendar, today)
                      ? ""
                      : next,
                });
              }}
            >
              →
            </Button>
          </div>
        )}
        {view.period === "custom" && (
          <>
            <label>
              From
              <input
                aria-label="From date"
                type="date"
                min="1999-01-01"
                max={today}
                value={view.from}
                onChange={(e) => onChange({ from: e.target.value })}
              />
            </label>
            <label>
              To
              <input
                aria-label="To date"
                type="date"
                min="1999-01-01"
                max={today}
                value={view.to}
                onChange={(e) => onChange({ to: e.target.value })}
              />
            </label>
          </>
        )}
      </div>
    </section>
  );
}
