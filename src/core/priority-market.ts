import {
  effectiveEstimate,
  type Estimates,
  type PriorityItem,
} from "./trade-estimates";
export interface MarketSearch {
  name: string;
  market: "wizard" | "super-wizard" | "trading";
}
export function prioritySearch(
  item: PriorityItem,
  estimates: Estimates,
): MarketSearch {
  const value =
    effectiveEstimate(item.name, estimates)?.value ?? item.buyCeiling;
  return { name: item.name, market: value < 1_000_000 ? "wizard" : "trading" };
}
export function marketURL({ name, market }: MarketSearch): string {
  return market !== "trading"
    ? "https://www.neopets.com/shops/wizard.phtml?" +
        new URLSearchParams({ string: name })
    : "https://www.neopets.com/island/tradingpost.phtml#/?" +
        new URLSearchParams({
          type: "browse",
          criteria: "item_phrase",
          sort: "newest",
          page: "1",
          search_string: name,
        });
}
export function priorityBatches<T>(items: readonly T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / 10) }, (_, i) =>
    items.slice(i * 10, i * 10 + 10),
  );
}
