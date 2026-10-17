import { accounting } from "./accounting";

export const profitViewKey = "nd_profit_view";
export interface ProfitView {
  version: 1;
  period: "last30" | "week" | "month" | "year" | "all" | "custom";
  anchor?: string;
  from: string;
  to: string;
  includeMissingCosts: boolean;
  metric: "profit" | "income" | "count";
}
export function validProfitView(value: unknown): value is ProfitView {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    (v.anchor === undefined ||
      v.anchor === "" ||
      (typeof v.anchor === "string" && accounting.validDate(v.anchor))) &&
    typeof v.period === "string" &&
    ["last30", "week", "month", "year", "all", "custom"].includes(v.period) &&
    typeof v.metric === "string" &&
    ["profit", "income", "count"].includes(v.metric) &&
    typeof v.includeMissingCosts === "boolean" &&
    [v.from, v.to].every(
      (d) => typeof d === "string" && (d === "" || accounting.validDate(d)),
    )
  );
}
export function readProfitView(
  legacy: Record<string, string>,
  today: string,
): ProfitView {
  if (Object.hasOwn(legacy, profitViewKey)) {
    const saved: unknown = JSON.parse(legacy[profitViewKey]);
    if (!validProfitView(saved)) throw Error("Invalid saved sales view.");
    return saved;
  }
  return {
    version: 1,
    period: "last30",
    from: today,
    to: today,
    includeMissingCosts: true,
    metric: "profit",
  };
}
