import { useState } from "react";
import { Button, Disclosure, Feedback, Link, useAction } from "../components/shared";
import { updateStore, getState, useStore, type Album } from "../persistence/store";
import { parseStampUpdate } from "../core/stamps";
import { mergeAlbums } from "../core/collections";
import { isNative, nativeMessage } from "../core/bridge";
import catalogue from "../data/stamp-collection.json";
export function StampAlbumImport() {
  const store=useStore();
  const [page, setPage] = useState(1), [source, setSource] = useState("");
  const { run, message, busy } = useAction();
  const pages = [...new Map(catalogue.items.map(item => [item.page, item.album])).entries()];
  return <Disclosure title="Update from an album page">
    <p>Visiting an album page with Stamp Tracker updates its checks automatically. You can also import the page source here.</p>
    <div className="actions"><select aria-label="Album page" value={page} onChange={e => setPage(Number(e.target.value))}>
      {pages.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select><Link href={`https://www.neopets.com/stamps.phtml?type=album&page_id=${page}&owner=${encodeURIComponent(store.profile.account)}`}>Open album</Link></div>
    <textarea aria-label="Album page source" rows={4} value={source} onChange={e => setSource(e.target.value)} placeholder="Paste the selected album’s page source…" />
    <Button variant="outline" disabled={busy || !source.trim()} onClick={() => void run(async () => {
      const old = getState().native.browser.albums[String(page)];
      const base: Album = { account: store.profile.account, page, observedAt: Date.now(), items: catalogue.items.filter(i => i.page === page).map(item => ({
        name: item.name, image: item.image, position: item.position,
        owned: old?.items.some(i => i.position === item.position && i.image === item.image && i.owned) === true,
      })) };
      const album = parseStampUpdate(source, base);
      await updateStore(s => ({ ...s, native: { ...s.native, browser: { ...s.native.browser,
        albums: mergeAlbums(s.native.browser.albums, { [String(page)]: album }) } } }));
      if (isNative()) nativeMessage("deskBrowser", { action: "importAlbum", album });
      setSource("");
    }, "Album checks saved.")}>Import selected page</Button>
    <Feedback message={message} />
  </Disclosure>;
}
