// ==UserScript==
// @name         Neopian Desk - Stamp Tracker
// @namespace    neopian-desk
// @version      1.0.9
// @description  Tracks confirmed album ownership, including checked SDB batches, and syncs to Neopian Desk.
// @match        https://www.neopets.com/*
// @connect      127.0.0.1
// @connect      itemdb.com.br
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
(async function () {
  "use strict";
  /* DESK_CONNECTION */
  /* STAMP_IDENTITIES */
  /* STAMP_SDB */
  /* STAMP_INVENTORY */
  const desk = createDeskConnection(),
    KEY = "deskStampAlbumsPublic";
  let albums = await GM.getValue(KEY, {}),
    busy = false,
    syncAgain = false,
    scanTimer,
    albumMessage = "",
    sdbCheck = null,
    inventoryCheck = null;
  if (!albums || typeof albums !== "object" || Array.isArray(albums)) {
    alert("Saved stamp data could not be read. It has been left untouched.");
    return;
  }
  const style = document.createElement("style");
  style.textContent =
    ".nd-stamp-mark.nd-stamp-owned{color:#247444!important;font-size:17px!important}.nd-stamp-mark{color:#b52f73!important;font:bold 23px Arial!important;margin-left:3px!important;pointer-events:none}#nd-stamp-status{position:fixed;bottom:62px;left:12px;z-index:99999;max-width:290px;padding:8px 12px;border:1px solid #dfa9c2;border-radius:10px;background:#fff0f6;color:#71314e;font:12px Arial}#nd-stamp-status button{margin:4px;padding:4px 8px;cursor:pointer}";
  document.head.append(style);
  const panel = document.createElement("div");
  panel.id = "nd-stamp-status";
  panel.dataset.version = "1.0.9";
  // Stay quiet on every page; controls are available from the Tampermonkey menu.
  panel.hidden = true;
  const status = document.createElement("div");
  panel.append(status);
  const guide = document.createElement("a");
  guide.href = "https://www.jellyneo.net/?go=stamps&id=album_listing";
  guide.target = "_blank";
  guide.rel = "noopener";
  guide.textContent = "Stamp guide";
  panel.append(guide);
  const albumLink = document.createElement('a');
  albumLink.href = 'https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner=' + encodeURIComponent(DESK_ACCOUNT);
  albumLink.textContent = 'Open my album'; albumLink.target = '_blank'; albumLink.rel='noopener';
  albumLink.style.marginLeft='10px'; panel.append(albumLink);
  function button(label, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", fn);
    panel.append(b);
  }
  button("Connect", async () => {
    if (await desk.pair()) sync();
  });
  button("Sync", sync);
  button("Hide", () => {
    panel.hidden = true;
  });
  document.body.append(panel);
  GM.registerMenuCommand("Show stamp tracker", () => {
    panel.hidden = false;
  });
  GM.registerMenuCommand("Connect stamp tracker to Desk", async () => {
    if (await desk.pair()) sync();
  });
  function imageID(url) {
    try {
      const u = new URL(url, location.href);
      return u.hostname === "images.neopets.com"
        ? u.pathname.match(/^\/items\/([\w-]+)\.(?:gif|png|webp)$/i)?.[1] ||
            null
        : null;
    } catch (_) {
      return null;
    }
  }
  function validAlbum(page) {
    return (
      page &&
      page.account === DESK_ACCOUNT &&
      Number.isInteger(page.page) &&
      page.page > 0 &&
      page.page <= 100 &&
      Number.isFinite(page.observedAt) &&
      Array.isArray(page.items) &&
      page.items.length > 0 &&
      page.items.length <= 25 &&
      page.items.every(
        (item) =>
          item &&
          typeof item.name === "string" &&
          /^[\w-]+$/.test(item.image) &&
          typeof item.owned === "boolean",
      )
    );
  }
  function index() {
    const images = new Map();
    Object.values(albums)
      .filter(validAlbum)
      .sort((a, b) => a.observedAt - b.observedAt)
      .forEach((page) =>
        page.items.forEach((item) =>
          images.set(item.image, { ...item, observedAt: page.observedAt }),
        ),
      );
    return images;
  }
  function markItems() {
    const known = index();
    // Actual image identity is used, including for coins/shells/coconuts; names alone can be ambiguous.
    document
      .querySelectorAll("img[src], [data-image], .item-img, .shop-item")
      .forEach((node) => {
        if (node.closest("#nd-stamp-status")) return;
        const raw =
          node.getAttribute("src") ||
          node.getAttribute("data-image") ||
          node.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
        const item = known.get(imageID(raw));
        let marker = node.nextElementSibling?.classList.contains(
          "nd-stamp-mark",
        )
          ? node.nextElementSibling
          : null;
        if (!item) {
          if (marker) marker.remove();
          return;
        }
        if (!marker) {
          marker = document.createElement("span");
          marker.className = "nd-stamp-mark";

          // A sibling marker leaves the original image, link and purchase handlers intact.
          node.after(marker);
        }
        marker.textContent = item.owned ? "✓" : "*";
        marker.classList.toggle("nd-stamp-owned", item.owned);
        marker.title =
          item.name +
          (item.owned ? " — owned in your album when checked " : " — missing from your album when checked ") +
          new Date(item.observedAt).toLocaleDateString() +
          ". Revisit the album after adding it.";
        marker.setAttribute("aria-label", marker.title);
      });
  }
  function summary(suffix = "") {
    const pages = Object.values(albums).filter(validAlbum);
    status.textContent =
      pages.length +
      " album pages checked · * = missing from album. " +
      albumMessage +
      " " +
      suffix;
  }
  async function sync() {
    if (busy) { syncAgain = true; return; }
    busy = true;
    try {
      if (!(await GM.getValue('neopianDeskPairingKey',''))) {
        summary(Object.keys(albums).length ? 'Stamps checked in this browser. App sync is optional.' : 'Open your album to start checking stamps.');
        return;
      }
      const remote = await desk.request("stamps");
      const merge = async () => {
        const local = await GM.getValue(KEY, {});
        if (!local || typeof local !== "object" || Array.isArray(local))
          throw Error(
            "Saved album data could not be read; it was left untouched.",
          );
        for (const page of Object.values(remote.albums || {}))
          if (validAlbum(page)) local[page.page] = mergeAlbum(local[page.page], page);
        await GM.setValue(KEY, local);
        albums = local;
      };
      if (navigator.locks)
        await navigator.locks.request("neopian-desk-stamp-save", merge);
      else await merge();
      // Send only newer observations; no timer repeatedly uploads every page.
      for (const page of Object.values(albums).filter(validAlbum)) {
        if (
          !remote.albums?.[page.page] ||
          remote.albums[page.page].observedAt < page.observedAt ||
          JSON.stringify(remote.albums[page.page].items) !== JSON.stringify(page.items)
        )
          await desk.request("stamps", page);
      }
      summary("Saved in Neopian Desk.");
      markItems();
    } catch (error) {
      summary(
        desk.errorMessage(error),
      );
    } finally {
      busy = false;
      if (syncAgain) { syncAgain = false; void sync(); }
    }
  }
  async function observeAlbum() {
    const params = new URLSearchParams(location.search);
    if (location.pathname !== "/stamps.phtml" || params.get("type") !== "album")
      return;
    const page = Number(params.get("page_id"));
    const owner = (params.get("owner") || desk.account() || "").toLowerCase();
    if (owner !== DESK_ACCOUNT) {
      summary("Only the paired account’s album is recorded.");
      return;
    }
    if (!Number.isInteger(page) || page < 1 || page > 100) return;
    // Snapshot before another helper can substitute pictures for empty slots.
    const eligible = img => img.alt === 'No Stamp' || !!imageID(img.src);
    const candidates = new Set();
    document.querySelectorAll('img').forEach(img => {
      if (!eligible(img)) return;
      let parent = img.parentElement;
      for (let depth=0; parent && depth<6; depth++, parent=parent.parentElement) candidates.add(parent);
    });
    // Current albums use divs; older albums used tables. Keep exact 25-slot
    // and per-position image checks before accepting either layout.
    const slots = [...candidates].map(parent => [...parent.querySelectorAll('img')].filter(eligible)).find(images=>images.length===25);
    if (!slots) {
      albumMessage = 'Album layout not recognised; nothing changed.'; summary(); return;
    }
    const snapshot = slots.map((img) => ({
      image: imageID(img.src),
      empty:
        img.alt === "No Stamp" ||
        imageID(img.src) === "stamp_blank" ||
        img.classList.contains("fake-stamp"),
    }));
    try {
      const result = await GM.xmlHttpRequest({
        method: "GET",
        url: "https://itemdb.com.br/api/v1/tools/album-helper?album_id=" + page,
        timeout: 10000,
      });
      if (result.status !== 200)
        throw Error(
          "Visit itemdb.com.br, then reload this album page to identify its stamps.",
        );
      const catalog = JSON.parse(result.responseText),
        items = [];
      for (let position = 1; position <= 25; position++) {
        const entry = catalog[position];
        if (!entry) {
          if (!snapshot[position - 1].empty)
            throw Error("Album list differs from the page; nothing changed.");
          continue;
        }
        const item = entry.itemData,
          image = imageID(item?.image);
        if (
          !image ||
          typeof item.name !== "string" ||
          !item.name ||
          Number(entry.position) !== position
        )
          throw Error("Album data not recognised; nothing changed.");
        const slot = snapshot[position - 1];
        if (!slot.empty && slot.image !== image)
          throw Error("Album pictures differ from the list; nothing changed.");
        items.push({ name: item.name, image, position, owned: !slot.empty });
      }
      if (!items.length)
        throw Error("No released stamps identified on this page.");
      const observed = {
        account: DESK_ACCOUNT,
        page,
        observedAt: Date.now(),
        items,
      };
      const save = async () => {
        const current = await GM.getValue(KEY, {});
        current[page] = mergeAlbum(current[page], observed);
        await GM.setValue(KEY, current);
        albums = current;
      };
      if (navigator.locks)
        await navigator.locks.request("neopian-desk-stamp-save", save);
      else await save();
      summary("This page saved. Visit the other album pages to check them.");
      markItems();
    } catch (error) {
      albumMessage = error.message;
      summary();
    }
  }
  // Album additions are irreversible: combine observations without losing known ownership.
  function mergeAlbum(old, incoming) {
    if (!old) return incoming;
    if (!validAlbum(old)) throw Error('Saved album data is invalid; nothing changed.');
    const items = new Map(old.items.map(item => [item.position, {...item}]));
    for (const item of incoming.items) {
      const previous = items.get(item.position);
      if (previous && (previous.image !== item.image || previous.name !== item.name)) throw Error('Album identities differ; recheck this page.');
      items.set(item.position, {...item,owned:!!(previous?.owned || item.owned)});
    }
    return {...incoming,observedAt:Math.max(old.observedAt,incoming.observedAt),items:[...items.values()].sort((a,b)=>a.position-b.position)};
  }
  async function saveAlbum(observed) {
    const save = async () => {
      const current = await GM.getValue(KEY, {});
      if (!current || typeof current !== 'object' || Array.isArray(current)) throw Error('Saved album data could not be read; nothing changed.');
      current[observed.page] = mergeAlbum(current[observed.page], observed);
      await GM.setValue(KEY, current); albums = current;
    };
    if (navigator.locks) await navigator.locks.request('neopian-desk-stamp-save', save);
    else await save();
    markItems();
  }
  let capturing = false;
  const captured = new Set();
  async function observeAddition() {
    if (capturing || location.pathname !== '/inventory.phtml' || desk.account() !== DESK_ACCOUNT) return;
    capturing = true;
    try {
      const nodes = [...document.querySelectorAll('p, div, span, b, strong')];
      for (const node of nodes) {
        if (node.closest('#nd-stamp-status') || !node.getClientRects().length) continue;
        const match = (node.innerText || '').trim().match(/^You have added (.+?) into your Stamp Album!$/);
        if (!match) continue;
        const candidates = stampIdentities.filter(item => item.name === match[1]);
        if (candidates.length !== 1) continue;
        const item = candidates[0];
        let container = node, picture = false;
        for (let depth=0; container && depth<4; depth++,container=container.parentElement) {
          if ([...container.querySelectorAll('img')].some(img=>imageID(img.src)===item.image)) {picture=true;break;}
        }
        if (!picture || captured.has(item.image)) continue;
        await saveAlbum({account:DESK_ACCOUNT,page:item.page,observedAt:Date.now(),items:[{name:item.name,image:item.image,position:item.position,owned:true}]});
        captured.add(item.image); markItems(); summary('Added '+item.name+'.');
        await sync();
      }
    } catch(error) { summary(error.message); }
    finally { capturing=false; }
  }
  // Read only the album page the user chose to visit; never crawl or buy/add stamps.
  await observeAlbum();
  await observeAddition();
  markItems();
  sync();
  try {
    sdbCheck = await startStampSdbCheck({
      document, location, identities: stampIdentities, imageID,
      account: desk.account,
      storage: {get: (key, fallback) => GM.getValue(key, fallback), set: (key, value) => GM.setValue(key, value)},
      lock: (name, work) => navigator.locks ? navigator.locks.request(name, work) : work(),
      fetchPage: (url, options) => fetch(url, options),
      parent: panel,
      sync,
      saveAlbum,
    });
    inventoryCheck = await startStampInventoryCheck({
      document, location, identities:stampIdentities, imageID, account:desk.account,
      fetchPage:(url, options) => fetch(url, options), saveAlbum, sync, parent:panel,
      storage: {get:(key, fallback) => GM.getValue(key, fallback), set:(key, value) => GM.setValue(key, value)},
      lock:(name, work) => navigator.locks ? navigator.locks.request(name, work) : work(),
    });
  } catch (error) { panel.hidden = false; summary(error.message); }
  const observer = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          !m.target.closest?.("#nd-stamp-status") &&
          !m.target.classList?.contains("nd-stamp-mark") &&
          (m.type === "attributes" || m.type === "characterData" ||
            [...m.addedNodes].some(
              (n) =>
                (n.nodeType === 1 || n.nodeType === 3) && !n.classList?.contains("nd-stamp-mark"),
            )),
      )
    ) {
      // Capture the result before a fast Close and Refresh removes the popup.
      inventoryCheck?.observe();
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => { markItems(); observeAddition(); sdbCheck?.observe(); }, 250);
    }
  });
  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "data-image", "style"],
  });
  window.addEventListener("focus", sync);
  setInterval(sync, 60000);
})();
