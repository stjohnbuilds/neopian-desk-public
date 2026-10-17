import { useState } from "react";
import dreamSeed from "../data/dreams.json";
import itemsSeed from "../data/items.json";
import caps from "../data/caps.json";
import npv from "../data/npv.json";
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
    items = readLegacy<{n:string;l:string;q:number}[]>(store, "nd_items_v2", itemsSeed),
    dreams = readLegacy<Dream[]>(store, "nd_dreams", dreamSeed);
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("value"),
    [name, setName] = useState(""),
    [url, setURL] = useState("");
  const { run, message } = useAction();
  const val = (n: string) => {
    const c = (caps as Record<string, string>)[n],
      p = (npv as Record<string, number>)[n];
    return c ? c + " caps" : p != null ? np(p) : "—";
  };
  const compareValue = (a: string, b: string) => {
    const c = caps as Record<string, string>,
      p = npv as Record<string, number>;
    if (!!c[a] !== !!c[b]) return c[a] ? -1 : 1;
    const value = (name: string) =>
      c[name] ? Number(c[name].split("-").at(-1)) : p[name] || 0;
    return value(b) - value(a) || a.localeCompare(b);
  };
  const rows = items
    .filter((i) => i.n.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "qty"
        ? b.q - a.q || a.n.localeCompare(b.n)
        : sort === "list"
          ? a.l.localeCompare(b.l) || a.n.localeCompare(b.n)
          : sort === "value"
            ? compareValue(a.n, b.n)
            : a.n.localeCompare(b.n),
    );
  return (
    <div className="feature-stack">
      <Panel
        collapsible
        title="Your collection"
        actions={
          <span className="muted text-small">{items.length} item types</span>
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
            <option value="value">Value · caps first</option>
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
              </tr>
            </thead>
            <tbody>
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
                  <td>{val(i.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted text-small panel-note">
          Values are the original saved estimates, not live prices. NC caps and
          NP prices are different measures.
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
          (quantity). The original snapshot remains in your backup.
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
                if (
                  !Array.isArray(rows) ||
                  !rows.every(
                    (i) =>
                      typeof i.n === "string" &&
                      i.n.length > 0 &&
                      ["F", "U"].includes(i.l) &&
                      Number.isSafeInteger(i.q) &&
                      i.q > 0,
                  )
                )
                  throw Error("Invalid item list. Nothing changed.");
                await setLegacy("nd_items_v2", rows);
              }, "Item list saved");
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
