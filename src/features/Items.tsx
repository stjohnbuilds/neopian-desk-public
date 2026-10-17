import { WardrobeEditor } from "./WardrobeEditor";
import {
  readWardrobe,
  validWardrobe,
  type WardrobeItem,
} from "../core/wardrobe";
import { Modal } from "../components/Modal";
import { useState } from "react";
import dreamSeed from "../data/dreams.json";
import { useStore, readLegacy, setLegacy } from "../persistence/store";
import { safeURL, np } from "../core/utils";
import {
  Button,
  Panel,
  CopyButton,
  Link,
  Disclosure,
  Feedback,
  useAction,
} from "../components/shared";
interface Dream {
  n: string;
  link?: string;
  u?: string;
  items: string[];
}
export function Items() {
  const store = useStore(),
    items = readWardrobe(store.legacy),
    dreams = readLegacy<Dream[]>(store, "nd_dreams", dreamSeed);
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("value"),
    [name, setName] = useState(""),
    [url, setURL] = useState("");
  const { run, message } = useAction();
  const [editing, setEditing] = useState<WardrobeItem | null | false>(false);
  const [imported, setImported] = useState<WardrobeItem[] | null>(null);
  const val = (i: WardrobeItem) =>
    i.caps
      ? i.caps + " caps"
      : i.np !== undefined
        ? np(i.np) + " NP"
        : "Not set";
  const compareValue = (a: WardrobeItem, b: WardrobeItem) =>
    (b.np ?? 0) - (a.np ?? 0) || a.n.localeCompare(b.n);
  const rows = items
    .filter((i) => i.n.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "qty"
        ? b.q - a.q || a.n.localeCompare(b.n)
        : sort === "list"
          ? a.l.localeCompare(b.l) || a.n.localeCompare(b.n)
          : sort === "value"
            ? compareValue(a, b)
            : a.n.localeCompare(b.n),
    );
  return (
    <div className="feature-stack">
      {editing !== false && (
        <WardrobeEditor
          item={editing ?? undefined}
          onClose={() => setEditing(false)}
        />
      )}
      {imported && (
        <Modal title="Import item list" onClose={() => setImported(null)}>
          <p>
            Replace your current {items.length} entries with {imported.length}{" "}
            imported entries? Export a full backup in Settings first if you need
            a separate copy.
          </p>
          <div className="actions">
            <Button
              onClick={() =>
                void run(async () => {
                  await setLegacy("nd_items_v2", imported);
                  setImported(null);
                }, "Item list saved")
              }
            >
              Replace item list
            </Button>
            <Button variant="outline" onClick={() => setImported(null)}>
              Cancel
            </Button>
          </div>
          <Feedback message={message} />
        </Modal>
      )}
      <Panel
        collapsible
        title="Your collection"
        defaultOpen
        actions={
          <div className="actions">
            <span className="muted text-small">{items.length} item types</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Add item
            </Button>
          </div>
        }
      >
        <div className="table-toolbar">
          <input
            aria-label="Search items"
            placeholder="Find an item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Sort items"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="qty">Quantity</option>
            <option value="list">For me / UFT</option>
            <option value="value">Saved NP value</option>
          </select>
        </div>
        <div className="table-scroll bounded">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>List</th>
                <th>Qty</th>
                <th>Saved estimate</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && (
                <tr>
                  <td colSpan={5}>
                    {items.length
                      ? "No matching items."
                      : "No items yet. Add an item or import your list below."}
                  </td>
                </tr>
              )}
              {rows.map((i) => (
                <tr key={i.n + "-" + i.l}>
                  <td>
                    <div className="name-cell">
                      {i.n}
                      <CopyButton text={i.n} label={"Copy " + i.n} />
                    </div>
                  </td>
                  <td>
                    <span className="status-label">
                      {i.l === "F" ? "For me" : "UFT"}
                    </span>
                  </td>
                  <td>{i.q}</td>
                  <td>
                    {val(i)}
                    {i.pricedOn && (
                      <small className="muted"> · {i.pricedOn}</small>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit collection item ${i.n}`}
                      onClick={() => setEditing(i)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted text-small panel-note">
          Values are estimates you saved, not live prices. NC caps and NP prices
          are different measures.
        </p>
      </Panel>
      <Panel collapsible title="Dream outfits">
        <div className="daily-grid">
          {dreams.map((d, i) => (
            <article className="daily-card" key={i}>
              <strong>{d.n}</strong>
              <p>{d.items?.join(", ")}</p>
              <Link href={d.link || d.u || ""}>Dress to Impress</Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  run(
                    () =>
                      setLegacy(
                        "nd_dreams",
                        dreams.filter((_, index) => index !== i),
                      ),
                    "Outfit removed",
                  )
                }
              >
                Remove
              </Button>
            </article>
          ))}
        </div>
        <form
          className="table-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const safe = safeURL(url);
              if (
                !safe ||
                !["impress.openneo.net", "impress-2020.openneo.net"].includes(
                  new URL(safe).hostname,
                )
              )
                throw Error("Use a Dress to Impress outfit link.");
              await setLegacy("nd_dreams", [
                ...dreams,
                { n: name.trim() || "Untitled outfit", link: safe, items: [] },
              ]);
              setName("");
              setURL("");
            }, "Outfit saved");
          }}
        >
          <input
            aria-label="Outfit name"
            placeholder="Outfit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            aria-label="Dress to Impress URL"
            placeholder="Dress to Impress link"
            required
            value={url}
            onChange={(e) => setURL(e.target.value)}
          />
          <Button type="submit">Add outfit</Button>
        </form>
      </Panel>
      <Disclosure title="Update the item list">
        <p className="muted">
          Import a JSON array of items with n (name), l (F or U), and q
          (quantity). Review the entry count before replacing your list. Export
          a backup in Settings first.
        </p>
        <label className="file-button">
          Import items
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              void run(async () => {
                if (!f) return;
                if (f.size > 5_000_000) throw Error("File too large.");
                const rows = JSON.parse(await f.text());
                if (!validWardrobe(rows))
                  throw Error("Invalid item list. Nothing changed.");
                setImported(rows);
              });
              e.target.value = "";
            }}
          />
        </label>
        <Link href={store.profile.closetURL || "https://impress.openneo.net/"}>
          Dress to Impress closet
        </Link>
      </Disclosure>
      <Feedback message={message} />
    </div>
  );
}
