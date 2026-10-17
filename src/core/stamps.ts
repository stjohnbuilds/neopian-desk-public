import type { Album } from "../persistence/store";

/** Pasted markup stays in an inert template: no scripts or remote images run. */
export function parseStampUpdate(source: string, album: Album): Album {
  if (!source.trim() || source.length > 2_000_000)
    throw Error("Paste a complete album page source, up to 2 MB.");
  const template = document.createElement("template");
  template.innerHTML = source;
  const imageID = (raw: string | null) =>
    raw?.match(
      /\/items\/([a-zA-Z0-9_-]+)\.(?:gif|png|jpe?g)(?:[?#]|$)/i,
    )?.[1] || "";
  const eligible = (img: Element) =>
    img.getAttribute("alt") === "No Stamp" ||
    !!imageID(img.getAttribute("src"));
  const groups = new Set<Element>();
  template.content.querySelectorAll("img").forEach((img) => {
    if (!eligible(img)) return;
    let parent = img.parentElement;
    for (let i = 0; parent && i < 6; i++, parent = parent.parentElement)
      groups.add(parent);
  });
  const candidates = [...groups]
    .map((group) => [...group.querySelectorAll("img")].filter(eligible))
    .filter((slots) => slots.length === 25);
  const signatures = new Set(
    candidates.map((slots) =>
      slots
        .map((img) => img.getAttribute("src") + "|" + img.getAttribute("alt"))
        .join("\n"),
    ),
  );
  if (signatures.size !== 1)
    throw Error("Could not find one complete 25-slot album. Nothing changed.");
  const slots = candidates[0],
    byPosition = new Map(album.items.map((item) => [item.position, item]));
  for (let i = 0; i < 25; i++) {
    const img = slots[i],
      image = imageID(img.getAttribute("src"));
    if (
      img.getAttribute("alt") !== "No Stamp" &&
      image !== "stamp_blank" &&
      image !== byPosition.get(i + 1)?.image
    )
      throw Error(
        "Pictures do not match the selected album page. Nothing changed.",
      );
  }
  return {
    ...album,
    observedAt: Date.now(),
    items: album.items.map((item) => ({
      ...item,
      owned:
        item.owned ||
        (slots[item.position - 1].getAttribute("alt") !== "No Stamp" &&
          imageID(slots[item.position - 1].getAttribute("src")) === item.image),
    })),
  };
}
