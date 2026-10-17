// ==UserScript==
// @name         Neopets Random Events Logger - Modern
// @namespace    neopian-desk-public-random-events
// @version      1.0.0
// @description  Saves Random Events quietly, with a five-second notification and history in the script menu.
// @author       Local replacement
// @match        *://www.neopets.com/*
// @connect      127.0.0.1
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(async function () {
  "use strict";
  // Included inside each userscript scope by the release builder.
let DESK_ACCOUNT = await GM.getValue("neopianDeskAccount", "");
if (!/^[a-z0-9_]{1,50}$/.test(DESK_ACCOUNT)) DESK_ACCOUNT = "";
function createDeskConnection() {
  const KEY = "neopianDeskPairingKey";
  async function pair() {
    const key = prompt(
      "Open Neopian Desk → Tools → App scripts → Enable connection, then Copy connection key. Paste the key here.",
    );
    if (key === null) return false;
    if (!/^[a-f0-9]{64}$/.test(key.trim())) {
      alert("That is not a Neopian Desk connection key.");
      return false;
    }
    try {
      const profile = await request("profile", undefined, key.trim());
      if (!/^[a-z0-9_]{1,50}$/.test(profile.account || "")) throw Error("Save your username in Desk Settings first.");
      if (DESK_ACCOUNT && DESK_ACCOUNT !== profile.account) throw Error("This script already belongs to another account. Use a separate browser profile for another account.");
      await GM.setValue("neopianDeskAccount", profile.account);
      await GM.setValue(KEY, key.trim());
      DESK_ACCOUNT = profile.account;
      return true;
    } catch (error) { alert(errorMessage(error)); return false; }
  }
  function errorMessage(error) {
    if (typeof error?.message === "string" && error.message.trim()) return error.message;
    return "Cannot reach Desk. Open Neopian Desk → Tools → App scripts and enable the browser connection. If it is already enabled, check the browser’s local-network permission.";
  }
  async function request(path, body, pairingKey) {
    let key;
    try { key = pairingKey || await GM.getValue(KEY, ""); }
    catch (_) { throw new Error("Tampermonkey could not read the saved connection key. Retry from the script menu."); }
    if (!key) throw new Error("Connect this script first: copy the key from Desk → Tools → App scripts, then use this script’s Connect menu.");
    let response;
    try {
      response = await GM.xmlHttpRequest({
        method: body === undefined ? "GET" : "POST",
        url: "http://127.0.0.1:47831/v1/" + path,
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        data: body === undefined ? undefined : JSON.stringify(body),
        timeout: 5000,
        anonymous: true,
      });
    } catch (_) { throw new Error(errorMessage(null)); }
    if (!response || !response.status) throw new Error(errorMessage(null));
    if (response.status === 401)
      throw new Error("Connection key rejected. Copy the key from Neopian Desk → Tools → App scripts and reconnect this script from its Tampermonkey menu.");
    if (response.status !== 200)
      throw new Error("Desk could not save this update (" + response.status + "). Your browser copy is retained. Retry after checking Desk’s connection status.");
    let parsed;
    try { parsed = JSON.parse(response.responseText); }
    catch (_) { throw new Error("Desk returned an unreadable response. Your browser copy is retained; nothing was marked synced."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        (body === undefined ? (path === "profile" ? !/^[a-z0-9_]{1,50}$/.test(parsed.account || "") : !parsed.albums || typeof parsed.albums !== "object") : parsed.ok !== true))
      throw new Error("Desk did not confirm this update. Your browser copy is retained; retry from the script menu.");
    return parsed;
  }
  function account() {
    // Read existing account markup only; never fetch an account page or execute page code.
    const links = document.querySelectorAll(
      '#header a[href*="userlookup.phtml"], .nav-top a[href*="userlookup.phtml"], #navprofiledropdown a[href*="userlookup.phtml"], #navprofiledropdown__2020 a[href*="userlookup.phtml"]',
    );
    for (const link of links) {
      const user = new URL(link.href).searchParams.get("user");
      if (user && link.textContent.trim().toLowerCase() === user.toLowerCase())
        return user.toLowerCase();
    }
    for (const script of document.scripts) {
      const match = script.textContent.match(
        /\b(?:var|let|const)\s+appInsightsUserName\s*=\s*["']([a-zA-Z0-9_]+)["']/,
      );
      if (match) return match[1].toLowerCase();
    }
    return null;
  }
  return { pair, request, account, errorMessage };
}

  const desk = createDeskConnection();
  let syncing = false,
    scanning = false;
  let syncMessage = "Connect to Neopian Desk to save events in the app too.";

  /******************************************************************
   * SETTINGS
   ******************************************************************/

  // Same storage key as the old script so existing logs remain usable.
  const STORAGE_KEY = "randomevents";

  // Maximum number displayed in the popup.
  const DISPLAY_LIMIT = 100;

  // Ignore duplicate copies of the exact same event detected within
  // this many milliseconds.
  const DUPLICATE_WINDOW = 15000;

  /******************************************************************
   * INTERNAL STATE
   ******************************************************************/

  const seenThisPage = new Set();

  let panelOpen = false;
  let scanTimer = null;

  /******************************************************************
   * STORAGE
   ******************************************************************/

  async function getEvents() {
    const stored = await GM.getValue(STORAGE_KEY, "[]");

    try {
      if (Array.isArray(stored)) {
        return stored;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) throw Error("Invalid event history");
      return parsed;
    } catch (error) {
      console.error("[RE Logger] Could not read stored events:", error);

      throw new Error(
        "Stored event history could not be read; it was left untouched.",
      );
    }
  }

  async function saveEvents(events) {
    await GM.setValue(STORAGE_KEY, JSON.stringify(events));
  }

  async function clearEvents() {
    await saveEvents([]);

    updateButtonCount();
    renderPanel();
  }

  /******************************************************************
   * TEXT HELPERS
   ******************************************************************/

  function normalizeWhitespace(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanEventText(text) {
    let cleaned = normalizeWhitespace(text);

    cleaned = cleaned.replace(/^Something\s+has\s+happened!\s*/i, "").trim();

    return cleaned;
  }

  function looksUseful(text) {
    if (!text) {
      return false;
    }

    if (text.length < 4) {
      return false;
    }

    if (text.length > 1200) {
      return false;
    }

    return true;
  }

  /******************************************************************
   * EVENT STORAGE
   ******************************************************************/

  async function logEvent(text, options = {}) {
    const save = () => logEventUnlocked(text, options);
    return navigator.locks
      ? navigator.locks.request("neopian-desk-random-events", save)
      : save();
  }
  async function logEventUnlocked(text, options = {}) {
    text = cleanEventText(text);

    if (!looksUseful(text)) {
      return false;
    }

    const now = Date.now();

    const type = options.type || "regular";

    const pageSignature = type + "|" + text;

    /*
      Prevent MutationObserver scans from saving the same visible
      banner over and over on the current page.
    */
    if (seenThisPage.has(pageSignature)) {
      return false;
    }

    const events = await getEvents();

    /*
      Cross-check recent stored events too.

      This prevents duplicate logging if Neopets changes the page DOM
      and the same banner is rediscovered a moment later.
    */
    const recentDuplicate = events.some((event) => {
      const sameText =
        normalizeWhitespace(event.event) === normalizeWhitespace(text);

      const sameType =
        (event.type ||
          (event.premium
            ? "premium"
            : event.fq
              ? "faerieQuest"
              : "regular")) === type;

      const closeInTime =
        Math.abs(Number(event.timestamp || 0) - now) < DUPLICATE_WINDOW;

      return sameText && sameType && closeInTime;
    });

    if (recentDuplicate) {
      seenThisPage.add(pageSignature);
      return false;
    }

    const event = {
      event: text,
      timestamp: now,

      // Retain old-format fields for compatibility.
      premium: type === "premium",
      fq: type === "faerieQuest",

      // New fields.
      type: type,
      url: location.origin + location.pathname,
      account: desk.account(),
    };

    events.unshift(event);

    await saveEvents(events);
    seenThisPage.add(pageSignature);
    syncToDesk();

    console.log("[RE Logger] Captured:", event);

    showCapturedToast(text);

    updateButtonCount();
    renderPanel();

    return true;
  }

  /******************************************************************
   * EVENT DETECTION
   ******************************************************************/

  // User-authored text, quotes and avatar pictures are never event evidence.
  // Only the site's established event containers are observed; no body-text fallback.
  function officialEventNode(node) {
    return !node.closest(
      '#reLoggerModernRoot, blockquote, q, textarea, template, script, style, [contenteditable], .boardPost, .board-post, .boardPostContent, .board-post-content, .post-content, .postbody, .signature, .siggy, [data-user-content]',
    );
  }

  async function detectOldRegularEvent() {
    const selectors = [
      ".randomEvent .copy",
      ".randomEvent",
      "#randomEvent",
    ];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);

      for (const node of nodes) {
        if (!officialEventNode(node)) {
          continue;
        }

        if (node.closest("#shh_prem_bg, .pushdown")) continue;
        const text = cleanEventText(
          (node.querySelector(".copy") || node).innerText,
        );

        if (looksUseful(text)) {
          await logEvent(text, {
            type: "regular",
          });
        }
      }
    }
  }

  async function detectPremiumEvent() {
    const node = document.getElementById("shh_prem_bg");

    if (!node || !officialEventNode(node)) {
      return;
    }

    const text = cleanEventText(node.innerText);

    if (looksUseful(text)) {
      await logEvent(text, {
        type: "premium",
      });
    }
  }

  async function detectFaerieQuest() {
    const selectors = [".pushdown .inner_wrapper2", ".pushdown"];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);

      for (const node of nodes) {
        if (!officialEventNode(node)) {
          continue;
        }

        const text = cleanEventText(node.innerText);

        if (!looksUseful(text)) {
          continue;
        }

        /*
          Pushdown can theoretically be used by other site messages,
          so require some quest/faerie language where possible.
        */
        if (/faerie|quest/i.test(text)) {
          await logEvent(text, {
            type: "faerieQuest",
          });
        }
      }
    }
  }

  async function scanForEvents() {
    if (scanning) return;
    scanning = true;
    try {
      await detectPremiumEvent();
      await detectFaerieQuest();
      await detectOldRegularEvent();
    } catch (error) {
      console.error("[RE Logger] Scan error:", error);
    } finally {
      scanning = false;
    }
  }

  function scheduleScan() {
    clearTimeout(scanTimer);

    scanTimer = setTimeout(scanForEvents, 150);
  }

  /******************************************************************
   * FLOATING UI
   ******************************************************************/

  function injectStyles() {
    const style = document.createElement("style");

    style.textContent = `
      #reLoggerModernRoot {
        all: initial;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }

      #reLoggerModernPanel {
        position: fixed;

        right: 18px;
        bottom: 18px;

        width: 390px;
        max-width:
          calc(100vw - 36px);

        max-height: 70vh;

        overflow-y: auto;

        z-index: 2147483647;

        background: white;
        color: #222;

        border:
          2px solid #555;

        border-radius: 10px;

        box-shadow:
          0 5px 24px
          rgba(0, 0, 0, 0.4);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: 13px;

        display: none;
      }

      #reLoggerModernPanel.open {
        display: block;
      }

      .relog-header {
        position: sticky;
        top: 0;

        display: flex;
        align-items: center;
        justify-content: space-between;

        background: #ad4e7b;
        color: white;

        padding: 10px 12px;

        font-weight: bold;

        z-index: 2;
      }

      .relog-header button {
        background: white;
        color: #222;

        border: none;
        border-radius: 4px;

        cursor: pointer;

        padding: 4px 8px;
      }

      .relog-toolbar {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        padding: 10px;

        border-bottom:
          1px solid #ddd;
      }

      .relog-toolbar button {
        padding: 6px 9px;

        cursor: pointer;

        background: #f0f0f0;

        border:
          1px solid #aaa;

        border-radius: 5px;
      }

      .relog-status {
        padding:
          8px 10px;

        background: #fff0f6;

        border-bottom:
          1px solid #ccc;

        color: #71314e;

        font-weight: bold;
      }

      .relog-empty {
        padding: 16px;

        color: #666;

        text-align: center;
      }

      .relog-event {
        padding: 10px;

        border-bottom:
          1px solid #ddd;
      }

      .relog-event:nth-child(even) {
        background: #f7f7f7;
      }

      .relog-date {
        color: #777;

        font-size: 11px;

        margin-bottom: 4px;
      }

      .relog-type {
        display: inline-block;

        margin-right: 5px;

        padding: 2px 5px;

        border-radius: 3px;

        background: #e8e8e8;

        font-size: 10px;
        font-weight: bold;

        text-transform: uppercase;
      }

      .relog-event-text {
        line-height: 1.4;
        white-space: pre-wrap;
      }

      #reLoggerToast {
        position: fixed;

        right: 18px;
        bottom: 18px;

        width: 330px;
        max-width:
          calc(100vw - 36px);

        z-index: 2147483647;

        background: #87365d;
        color: white;

        padding: 10px 12px;

        border-radius: 8px;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: 12px;

        box-shadow:
          0 3px 12px
          rgba(0, 0, 0, 0.35);

        opacity: 0;

        pointer-events: none;

        transition:
          opacity 0.2s ease;
      }

      #reLoggerToast.show {
        opacity: 1;
      }
    `;

    document.head.appendChild(style);
  }

  function createUI() {
    if (document.getElementById("reLoggerModernRoot")) {
      return;
    }

    const root = document.createElement("div");

    root.id = "reLoggerModernRoot";

    root.innerHTML = `
      <div
        id="reLoggerModernPanel"
      >
        <div class="relog-header">
          <span>
            Random Events Log
          </span>

          <button
            id="reLoggerClose"
            type="button"
          >
            ×
          </button>
        </div>

        <div class="relog-status">
          Logger running ✓<br><span id="reLoggerSyncStatus"></span>
        </div>

        <div class="relog-toolbar">
          <button id="reLoggerConnect" type="button">Connect to Desk</button>
          <button id="reLoggerSync" type="button">Sync to Desk</button>
          <button id="reLoggerOld" type="button">Send older logs</button>
          <button
            id="reLoggerExport"
            type="button"
          >
            Export CSV
          </button>

          <button
            id="reLoggerRescan"
            type="button"
          >
            Scan Page Now
          </button>

          <button
            id="reLoggerClear"
            type="button"
          >
            Clear browser log
          </button>
        </div>

        <div
          id="reLoggerEvents"
        ></div>
      </div>

      <div
        id="reLoggerToast" role="status" aria-live="polite"
      ></div>
    `;

    document.body.appendChild(root);
    document
      .getElementById("reLoggerConnect")
      .addEventListener("click", async () => {
        if (await desk.pair()) {
          await GM.setValue("deskSyncedEvents", []);
          syncToDesk();
        }
      });
    document
      .getElementById("reLoggerSync")
      .addEventListener("click", syncToDesk);
    document
      .getElementById("reLoggerOld")
      .addEventListener("click", async () => {
        if (
          !confirm(
            "Send older unlabelled logs to " + DESK_ACCOUNT + " in Neopian Desk? Only continue if those logs belong to that account.",
          )
        )
          return;
        const events = await getEvents();
        for (const event of events)
          if (!event.account) event.account = DESK_ACCOUNT;
        await saveEvents(events);
        syncToDesk();
      });

    document.getElementById("reLoggerClose").addEventListener("click", () => {
      panelOpen = false;

      updatePanelVisibility();
    });

    document
      .getElementById("reLoggerExport")
      .addEventListener("click", exportCSV);

    document
      .getElementById("reLoggerRescan")
      .addEventListener("click", async () => {
        await scanForEvents();

        alert("Page scanned for Random Events.");
      });

    document
      .getElementById("reLoggerClear")
      .addEventListener("click", async () => {
        const confirmed = confirm(
          "Clear all browser Random Event history? The app’s saved log will remain.",
        );

        if (!confirmed) {
          return;
        }

        await clearEvents();
      });
  }

  function updatePanelVisibility() {
    const panel = document.getElementById("reLoggerModernPanel");

    if (!panel) {
      return;
    }

    panel.classList.toggle("open", panelOpen);
  }

  async function updateButtonCount() {
    document.getElementById("reLoggerSyncStatus").textContent = syncMessage;
  }

  function getTypeLabel(event) {
    if (event.type === "premium" || event.premium) {
      return "Premium";
    }

    if (event.type === "faerieQuest" || event.fq) {
      return "Faerie Quest";
    }

    return "Random Event";
  }

  async function renderPanel() {
    const container = document.getElementById("reLoggerEvents");

    if (!container) {
      return;
    }

    const events = await getEvents();

    if (!events.length) {
      container.innerHTML = `
        <div class="relog-empty">
          No Random Events logged yet.
        </div>
      `;

      return;
    }

    const visible = events.slice(0, DISPLAY_LIMIT);

    container.innerHTML = visible
      .map((event) => {
        const date = new Date(event.timestamp).toLocaleString();

        const text = escapeHTML(event.event);

        const type = escapeHTML(getTypeLabel(event));

        return `
            <div class="relog-event">
              <div class="relog-date">
                ${escapeHTML(date)}
              </div>

              <span class="relog-type">
                ${type}
              </span>

              <div class="relog-event-text">
                ${text}
              </div>
            </div>
          `;
      })
      .join("");
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /******************************************************************
   * TOAST
   ******************************************************************/

  let toastTimer = null;

  function showCapturedToast(text) {
    const toast = document.getElementById("reLoggerToast");

    if (!toast) {
      return;
    }

    toast.textContent = "Random Event logged: " + text;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 5000);
  }

  /******************************************************************
   * CSV EXPORT
   ******************************************************************/

  function csvEscape(value) {
    let text = String(value == null ? "" : value);
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;

    return '"' + text.replace(/"/g, '""') + '"';
  }

  async function exportCSV() {
    const events = await getEvents();

    if (!events.length) {
      alert("No Random Events are saved yet.");

      return;
    }

    const rows = [["Random Event", "Timestamp", "Type", "Page"]];

    events.forEach((event) => {
      rows.push([
        event.event,
        new Date(event.timestamp).toLocaleString(),
        getTypeLabel(event),
        event.url || "",
      ]);
    });

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "neopets-random-event-log.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /******************************************************************
   * TAMPERMONKEY MENU
   ******************************************************************/

  if (typeof GM.registerMenuCommand === "function") {
    GM.registerMenuCommand("Open Random Events Log", () => {
      panelOpen = true;

      updatePanelVisibility();
      renderPanel();
    });

    GM.registerMenuCommand("Export Random Events CSV", exportCSV);
  }

  async function syncToDesk() {
    if (syncing) return;
    syncing = true;
    try {
      const events = await getEvents();
      const sent = new Set(await GM.getValue("deskSyncedEvents", []));
      const identity = (e) =>
        String(e.timestamp) +
        "|" +
        (e.type || (e.premium ? "premium" : e.fq ? "faerieQuest" : "regular")) +
        "|" +
        e.event;
      const pending = events.filter(
        (e) => e.account === DESK_ACCOUNT && !sent.has(identity(e)),
      );
      // Verify pairing even if there is nothing new to send.
      if (!pending.length) await desk.request("events", { events: [] });
      for (let offset = 0; offset < pending.length; offset += 100) {
        const batch = pending.slice(offset, offset + 100);
        await desk.request("events", {
          events: batch.map((e) => ({
            event: e.event,
            timestamp: Number(e.timestamp),
            account: DESK_ACCOUNT,
            type:
              e.type ||
              (e.premium ? "premium" : e.fq ? "faerieQuest" : "regular"),
          })),
        });
        batch.forEach((e) => sent.add(identity(e)));
        await GM.setValue("deskSyncedEvents", [...sent]);
      }
      syncMessage =
        "Saved in Neopian Desk." +
        (events.some((e) => !e.account)
          ? " Older unlabelled logs need “Send older logs”."
          : "");
    } catch (error) {
      syncMessage =
        desk.errorMessage(error);
    } finally {
      syncing = false;
      updateButtonCount();
    }
  }
  GM.registerMenuCommand("Connect to Neopian Desk", async () => {
    if (await desk.pair()) {
      await GM.setValue("deskSyncedEvents", []);
      syncToDesk();
    }
  });
  GM.registerMenuCommand("Sync Random Events to Desk", syncToDesk);
  setInterval(syncToDesk, 60000);
  window.addEventListener("focus", syncToDesk);

  /******************************************************************
   * INITIALIZE
   ******************************************************************/

  injectStyles();
  createUI();

  await updateButtonCount();
  await renderPanel();

  /*
    Scan immediately plus a few delayed times because different
    Neopets layouts may finish rendering banners at different times.
  */
  await scanForEvents();
  syncToDesk();

  setTimeout(scanForEvents, 400);

  setTimeout(scanForEvents, 1200);

  setTimeout(scanForEvents, 2500);

  /*
    Watch for Random Events inserted dynamically after initial load.
  */
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      return (
        !mutation.target.closest?.("#reLoggerModernRoot") &&
        mutation.addedNodes &&
        mutation.addedNodes.length
      );
    });

    if (relevant) {
      scheduleScan();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("[RE Logger] Modern logger running.");
})();
