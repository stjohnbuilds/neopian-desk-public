export interface WardrobeItem {
  n: string;
  l: "F" | "U";
  q: number;
  np?: number;
  caps?: string;
  pricedOn?: string;
}
export const wardrobeKey = "nd_items_v2";
export function validWardrobe(value: unknown): value is WardrobeItem[] {
  return (
    Array.isArray(value) &&
    value.length <= 10000 &&
    new Set(value.map((i) => `${i?.n?.toLowerCase()}|${i?.l}`)).size ===
      value.length &&
    value.every(
      (i) =>
        i &&
        typeof i.n === "string" &&
        i.n.trim() === i.n &&
        i.n.length > 0 &&
        i.n.length <= 200 &&
        ["F", "U"].includes(i.l) &&
        Number.isSafeInteger(i.q) &&
        i.q > 0 &&
        i.q <= 1000000 &&
        (i.np === undefined ||
          (Number.isSafeInteger(i.np) && i.np >= 0 && i.np <= 2000000000)) &&
        (i.caps === undefined ||
          (typeof i.caps === "string" && i.caps.length <= 80)) &&
        (i.pricedOn === undefined || /^\d{4}-\d{2}-\d{2}$/.test(i.pricedOn)),
    )
  );
}
export const readWardrobe = (legacy: Record<string, string>): WardrobeItem[] =>
  JSON.parse(legacy[wardrobeKey] ?? "[]");
