import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
export const day = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const np = (value: number) => `${value.toLocaleString("en-US")} NP`;
export function safeURL(value: string) {
  try {
    const url = new URL(value);
    if (
      url.hostname === "neopets.com" ||
      url.hostname.endsWith(".neopets.com")
    ) {
      const markers = ["nd-native-shop-batch", "nd-restock-batch", "nd-ssw"];
      if (markers.some((key) => url.hash.startsWith(`#${key}=`))) url.hash = "";
      const query = url.searchParams;
      if (markers.some((key) => query.has(key))) {
        if (query.has("nd-ssw")) {
          query.delete("batch");
          query.delete("slot");
        }
        markers.forEach((key) => query.delete(key));
      }
    }
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
