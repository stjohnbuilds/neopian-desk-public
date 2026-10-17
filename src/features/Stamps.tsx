import catalogue from "../data/stamp-collection.json";
import type { CollectionItem } from "../core/collections";
import { CollectionTable } from "./CollectionTable";
import { StampAlbumImport } from "./StampAlbumImport";
export const stampItems = catalogue.items as CollectionItem[];
export const stampGroups = [
  ["stamps", "Stamps"], ["coins", "Coins"], ["shells", "Sea shells & treasures"],
  ["scarabs", "Scarabs"], ["charms", "Charms"], ["coconuts", "Evil coconuts"],
  ["business-cards", "Business cards"], ["album-cards", "Album cards"],
  ["haunted-amulets", "Haunted amulets"], ["special-amulets", "Special amulets"],
] as const;
export function Stamps() {
  return <div className="feature-stack">
    <CollectionTable kind="stamps" title="Stamp collection" items={stampItems} groups={stampGroups} catalogueDate={catalogue.catalogueDate} />
    <StampAlbumImport />
  </div>;
}
