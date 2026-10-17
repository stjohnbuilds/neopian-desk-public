import { useEffect, useRef, useState } from "react";
import type { ProfitView } from "../core/profit-view";
import { displayDate } from "../core/sales-overview";
import { np } from "../core/utils";
import { Panel } from "../components/shared";

type Series = {
  unit: "day" | "month" | "year";
  records: number;
  points: { date: string; value: number }[];
};
export function SalesTrend({
  series,
  metric,
  onMetric,
  dates,
}: {
  series: Series;
  metric: ProfitView["metric"];
  onMetric: (metric: ProfitView["metric"]) => void;
  dates: string;
}) {
  const chart = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    if (!chart.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(chart.current);
    return () => observer.disconnect();
  }, [series.records]);
  const right = width - 20;
  const [active, setActive] = useState<string | null>(null);
  const { points, unit } = series;
  const title =
    metric === "income"
      ? "Sales income"
      : metric === "count"
        ? "Items sold"
        : "Profit";
  const amount = (n: number) =>
    metric === "count" ? `${n.toLocaleString("en-US")} items` : np(n);
  const dateLabel = (date: string) =>
    unit === "year"
      ? date
      : unit === "month"
        ? displayDate(`${date}-01`, { day: undefined, month: "short" })
        : displayDate(date);
  const shortDate = (date: string) =>
    unit === "year"
      ? date
      : unit === "month"
        ? displayDate(`${date}-01`, {
            day: undefined,
            month: "short",
            year: points.length > 12 ? "2-digit" : undefined,
          })
        : displayDate(date, { year: undefined });
  const high = Math.max(1, ...points.map((p) => p.value));
  const low = Math.min(0, ...points.map((p) => p.value));
  const x = (i: number) =>
    points.length === 1
      ? (76 + right) / 2
      : 76 + (i / (points.length - 1)) * (right - 76);
  const y = (v: number) => 20 + ((high - v) / (high - low)) * 84;
  const ticks = [
    ...new Set(
      Array.from({ length: 5 }, (_, i) => {
        const value = high - ((high - low) * i) / 4;
        return metric === "count" ? Math.round(value) : value;
      }),
    ),
  ];
  const selected = points.find((p) => p.date === active);
  const labelIndexes = new Set(
    Array.from(
      { length: Math.min(width < 500 ? 3 : 6, points.length) },
      (_, i) =>
        Math.round(
          (i * (points.length - 1)) /
            Math.max(1, Math.min(width < 500 ? 3 : 6, points.length) - 1),
        ),
    ),
  );
  return (
    <Panel
      title={`${title} by ${unit}`}
      actions={
        <select
          aria-label="Chart metric"
          value={metric}
          onChange={(e) => onMetric(e.target.value as ProfitView["metric"])}
        >
          <option value="income">Sales income</option>
          <option value="profit">Profit</option>
          <option value="count">Items sold</option>
        </select>
      }
    >
      <div className="sales-chart-intro">
        <p className="muted text-small">
          {dates} · Pacific time · By {unit}
          {metric === "profit" && " Sales with unknown costs are excluded."}
        </p>
      </div>
      {!series.records ? (
        <p className="empty">
          {metric === "profit"
            ? "No sales with a recorded purchase cost in this period."
            : "No recorded sales in this period."}
        </p>
      ) : (
        <>
          <div className="sales-chart-scroll">
            <svg
              className="sales-line-chart"
              ref={chart}
              viewBox={`0 0 ${width} 140`}
              role="group"
              aria-label={`${title} by ${unit}; ${dates}`}
            >
              <text x="12" y="12" className="chart-axis-title">
                {metric === "count" ? "Items" : "NP"}
              </text>
              {ticks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1="76"
                    x2={right}
                    y1={y(tick)}
                    y2={y(tick)}
                    className="chart-grid"
                  />
                  <text x="66" y={y(tick) + 4} textAnchor="end">
                    {new Intl.NumberFormat("en-US", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(tick)}
                  </text>
                </g>
              ))}
              <line
                x1="76"
                x2={right}
                y1={y(0)}
                y2={y(0)}
                className="chart-zero"
              />
              <polyline
                points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
                fill="none"
                className="chart-trend-line"
              />
              {points.map((p, i) => (
                <g
                  key={p.date}
                  tabIndex={0}
                  role="img"
                  aria-label={`${dateLabel(p.date)}: ${amount(p.value)}`}
                  onFocus={() => setActive(p.date)}
                  onMouseEnter={() => setActive(p.date)}
                  onClick={() => setActive(p.date)}
                  className="chart-point"
                >
                  <title>
                    {dateLabel(p.date)}: {amount(p.value)}
                  </title>
                  <circle cx={x(i)} cy={y(p.value)} r="12" fill="transparent" />
                  <circle
                    cx={x(i)}
                    cy={y(p.value)}
                    r={active === p.date ? 5 : 3}
                    className={p.value < 0 ? "chart-dot negative" : "chart-dot"}
                  />
                  {labelIndexes.has(i) && (
                    <text
                      x={x(i)}
                      y="130"
                      textAnchor={
                        i === 0
                          ? "start"
                          : i === points.length - 1
                            ? "end"
                            : "middle"
                      }
                    >
                      {shortDate(p.date)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <p className="sales-chart-readout text-small" aria-live="polite">
            {selected
              ? `${dateLabel(selected.date)} · ${amount(selected.value)}`
              : "Point to or select a dot for its exact amount."}
          </p>
          <details className="sales-chart-values">
            <summary>
              View{" "}
              {unit === "day"
                ? "daily"
                : unit === "month"
                  ? "monthly"
                  : "yearly"}{" "}
              amounts
            </summary>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{title}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.date}>
                      <td>{dateLabel(p.date)}</td>
                      <td>{amount(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Panel>
  );
}
