// ==UserScript==
// @name         Neopets - Purchase Tracker
// @namespace    neopian-desk-public-purchase-tracker
// @version      1.0.0
// @description  Records official-shop and player-shop purchases and seller Trading Post Instant Buy and auction-success Neomail receipts for Neopian Desk. Never buys or refreshes.
// @match        https://www.neopets.com/market.phtml*
// @match        https://www.neopets.com/browseshop.phtml*
// @match        https://www.neopets.com/haggle.phtml*
// @match        https://www.neopets.com/objects.phtml*
// @match        https://www.neopets.com/island/tradingpost.phtml*
// @match        https://www.neopets.com/neomessages.phtml*
// @connect      127.0.0.1
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.registerMenuCommand
// @run-at       document-start
// ==/UserScript==
(async function () {
  'use strict';
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

  const shopNames = {"1":"Neopian Fresh Foods","2":"Kauvara's Magic Shop","3":"Toy Shop","4":"Unis Clothing Shop","5":"Grooming Parlour","7":"Magical Bookshop","8":"Collectable Card Shop","9":"Battle Magic","10":"Defense Magic","12":"Neopian Garden Centre","13":"Neopian Pharmacy","14":"Chocolate Factory","15":"The Bakery","16":"Neopian Health Foods","17":"Neopian Gift Shop","18":"Smoothie Store","20":"Tropical Food Shop","21":"Tiki Tack","22":"Grundos Cafe","23":"Space Weaponry","24":"Space Armour","25":"The Neopian Petpet Shop","26":"The Robo-Petpet Shop","27":"The Rock Pool","30":"Spooky Food","31":"Spooky Petpets","34":"The Coffee Cave","35":"Slushie Shop","36":"Ice Crystal Shop","37":"Super Happy Icy Fun Snow Shop","38":"Faerieland Bookshop","39":"Faerie Foods","40":"Faerieland Petpets","41":"Neopian Furniture","42":"Tyrannian Foods","43":"Tyrannian Furniture","44":"Tyrannian Petpets","45":"Tyrannian Weaponry","46":"Hubert's Hot Dogs","47":"Pizzaroo","48":"Usukiland","49":"Lost Desert Foods","50":"Peopatra's Petpets","51":"Sutek's Scrolls","53":"Neopian School Supplies","54":"Sakhmet Battle Supplies","55":"Osiri's Pottery","56":"Merifoods","57":"Ye Olde Petpets","58":"Neopian Post Office","59":"Haunted Weaponry","60":"Spooky Furniture","61":"Wintery Petpets","62":"Jelly Foods","63":"Refreshments","66":"Kiko Lake Treats","67":"Kiko Lake Carpentry","68":"Collectable Coins","69":"Petpet Supplies","70":"Booktastic Books","71":"Kreludan Homes","72":"Cafe Kreludor","73":"Kayla's Potion Shop","74":"Darigan Toys","75":"Faerie Furniture","76":"Roo Island Souvenirs","77":"Brightvale Books","78":"The Scrollery","79":"Brightvale Glaziers","80":"Brightvale Armoury","81":"Brightvale Fruits","82":"Brightvale Motery","83":"Royal Potionery","84":"Neopian Music Shop","85":"Lost Desert Medicine","86":"Collectable Sea Shells","87":"Maractite Marvels","88":"Maraquan Petpets","89":"Geraptiku Petpets","90":"Qasalan Delights","91":"Desert Arms","92":"Words of Antiquity","93":"Faerie Weapon Shop","94":"Illustrious Armoury","95":"Exquisite Ambrosia","96":"Magical Marvels","97":"Legendary Petpets","98":"Plushie Palace","100":"Wonderous Weaponry","101":"Exotic Foods","102":"Remarkable Restoratives","103":"Fanciful Fauna","104":"Chesterdrawers' Antiques","105":"The Crumpetmonger","106":"Neovian Printing Press","107":"Prigpants & Swolthy, Tailors","108":"Mystical Surroundings","110":"Lampwyck's Lights Fantastic","111":"Cog's Togs","112":"Molten Morsels","113":"Moltaran Petpets","114":"Moltaran Books","116":"Springy Things","117":"Ugga Shinies"};
  // Seller Instant Purchase receipt observed on Neopets, 14 September 2026.
// Read the receipt's item grid only; active lots behind the popup are not sales.
function readTradingReceipts(doc, account, now = Date.now()) {
  if (!(/^[a-z0-9_]{1,50}$/.test(account || ''))) return [];
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const receipts = [];
  for (const popup of doc.querySelectorAll('.tp-popup-confirm')) {
    if (![...popup.querySelectorAll('p')].some(p => text(p) === 'Instant Purchase')) continue;
    const summaries = [...popup.querySelectorAll('p')].filter(p =>
      /^Lot \d+ [a-zA-Z0-9_]+ purchased this lot! You have received [\d,]+ NP\.$/.test(text(p)));
    if (summaries.length !== 1) continue;
    const summary = summaries[0];
    const match = text(summary).match(/^Lot (\d{1,12}) ([a-zA-Z0-9_]{1,50}) purchased this lot! You have received ([\d,]+) NP\.$/);
    if (!match || match[2].toLowerCase() === account) continue;
    const received = Number(match[3].replace(/,/g, ''));
    if (!Number.isSafeInteger(received) || received < 1 || received > 2_000_000_000) continue;
    if (match[3] !== received.toLocaleString('en-US')) continue;
    const section = summary.parentElement?.nextElementSibling;
    if (!section?.classList.contains('grid')) continue;
    const items = [];
    let malformed = false;
    for (const row of section.children) {
      const names = row.querySelectorAll('p');
      const images = row.querySelectorAll('img');
      if (names.length !== 1 || images.length !== 1 || !/^https:\/\/images\.neopets\.com\/items\/[a-zA-Z0-9_.-]+$/.test(images[0].getAttribute('src') || '')) { malformed = true; break; }
      const name = text(names[0]);
      if (!name || name.length > 200) { malformed = true; break; }
      items.push(name);
    }
    if (malformed || !items.length || items.length > 10) continue;
    receipts.push({ id: 'tp:' + account + ':' + match[1], account, lotId: match[1], buyer: match[2], received, items, observedAt: now });
  }
  return receipts;
}

  // Seller Neomail format: labelled From/Sent/Subject/Message table. Read only
// the opened official notification, never an inbox subject or page-wide quote.
function auctionMailDate(sentAt) {
  if (typeof sentAt !== 'string') return null;
  const m = sentAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m || +m[4] < 1 || +m[4] > 12 || +m[5] > 59) return null;
  // Neomail uses day/month/year, as in the existing sales-history import.
  const date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const stamp = Date.parse(date + 'T12:00:00Z');
  return date >= '1999-01-01' && Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0,10) === date ? date : null;
}

function readAuctionReceipts(doc, account, now = Date.now()) {
  if (!(/^[a-z0-9_]{1,50}$/.test(account || ''))) return [];
  const text = node => (node?.innerText ?? node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const visible = node => {
    for (let p = node; p; p = p.parentElement) {
      if (p.hidden || p.getAttribute('aria-hidden') === 'true') return false;
      const style = doc.defaultView?.getComputedStyle?.(p) || p.style;
      if (style?.display === 'none' || style?.visibility === 'hidden') return false;
    }
    return true;
  };
  const receipts = [];
  for (const table of doc.querySelectorAll('table')) {
    if (!visible(table)) continue;
    const fields = new Map();
    let duplicate = false;
    for (const row of table.querySelectorAll('tr')) {
      if (row.closest('table') !== table) continue;
      const cells = [...row.children].filter(c => ['TD','TH'].includes(c.tagName));
      if (cells.length !== 2) continue;
      const label = text(cells[0]).replace(/\s*\[Report Message\]\s*$/, '');
      if (!['From:', 'Sent:', 'Subject:', 'Message:'].includes(label)) continue;
      if (fields.has(label)) duplicate = true;
      fields.set(label, cells[1]);
    }
    if (duplicate || fields.size !== 4 || [...fields.values()].some(cell => !visible(cell))) continue;
    if (text(fields.get('Subject:')) !== 'Auction Successful!') continue;
    const senders = [...fields.get('From:').querySelectorAll('a[href]')].filter(link => {
      try {
        const url = new URL(link.getAttribute('href'), 'https://www.neopets.com');
        return url.origin === 'https://www.neopets.com' && url.pathname === '/userlookup.phtml' && url.searchParams.get('user') === 'theneopetsteam' && text(link) === 'theneopetsteam';
      } catch { return false; }
    });
    if (senders.length !== 1) continue;
    const sentAt = text(fields.get('Sent:')), date = auctionMailDate(sentAt);
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
    if (!date || date > today) continue;
    const body = text(fields.get('Message:'));
    const match = body.match(/^Dear .+? You will be pleased to know that your Neopets auction Lot No\. (\d{1,12}) \((.+)\) has been successful, and that ([\d,]+) NeoPoints have been credited to your account\. Below is a list of the bids and other information\./);
    if (!match || !match[2].trim() || match[2].length > 200) continue;
    const money = raw => /^(?:\d+|[1-9]\d{0,2}(?:,\d{3})+)$/.test(raw) ? Number(raw.replace(/,/g,'')) : NaN;
    const received = money(match[3]);
    if (!Number.isSafeInteger(received) || received < 1 || received > 2_000_000_000) continue;
    const bids = [...body.matchAll(/Bid\s*:\s*([\d,]+) NeoPoints, placed by ([a-zA-Z0-9_]{1,50})\./g)];
    if (!bids.length || money(bids[0][1]) !== received || bids[0][2].toLowerCase() === account || bids.some(b => !Number.isSafeInteger(money(b[1])) || money(b[1]) < 1 || money(b[1]) > received)) continue;
    const winners = new Set(bids.filter(b => money(b[1]) === received).map(b => b[2].toLowerCase()));
    if (winners.size !== 1) continue;
    receipts.push({id:'auction:' + account + ':' + match[1], account, lotId:match[1], buyer:bids[0][2], received, items:[match[2].trim()], source:'auction', date, sentAt, observedAt:now});
  }
  // Multiple opened-message tables are ambiguous; do not guess which is real.
  return receipts.length === 1 ? receipts : [];
}

  // The modern player-shop success dialog, inspected on 23 September 2026.
// Ignore shop descriptions, asking prices, failed purchases and URL prices.
function playerShopConfirmation(doc, href, account) {
  if (!/^[a-z0-9_]{1,50}$/.test(account || '')) return null;
  const url = new URL(href);
  if (url.origin !== 'https://www.neopets.com' || url.pathname !== '/browseshop.phtml') return null;
  const seller = url.searchParams.get('owner');
  if (!/^[a-zA-Z0-9_]{1,50}$/.test(seller || '') || seller.toLowerCase() === account) return null;
  const popup = doc.querySelector('#bsp-buy-success-popup[role="dialog"]');
  if (!popup || popup.hidden || popup.getAttribute('aria-hidden') === 'true' || popup.style.display === 'none' || popup.style.visibility === 'hidden') return null;
  const title = popup.querySelector('#bsp-buy-success-title')?.textContent?.trim();
  const name = title?.match(/^You bought (.+)!$/)?.[1]?.trim();
  const imageName = popup.querySelector('#bsp-buy-success-img')?.getAttribute('alt')?.trim();
  const message = popup.querySelector('#bsp-buy-success-msg')?.textContent?.trim();
  const costText = message?.match(/^It has been added to your inventory\. You spent ([\d,]+) NP\.$/)?.[1];
  const cost = Number(costText?.replace(/,/g, ''));
  if (!name || name.length > 200 || imageName !== name || !Number.isSafeInteger(cost) || cost <= 0 || cost > 999999) return null;
  return {name, cost, seller: seller.toLowerCase(), source:'player-shop', shopId:-1};
}

const SLOT = 'nd_player_shop_confirmation_v1';
const ATTEMPT = 'nd_player_shop_attempt_v1';
const equal = (a,b) => a && b && ['name','cost','seller','source','shopId'].every(k => a[k] === b[k]);
function playerShopObserver(win, retain, getAccount) {
  function pending() {
    const account = getAccount();
    const value = JSON.parse(win.sessionStorage.getItem(ATTEMPT) || 'null');
    if (!value || !/^[a-f\d-]{36}$/i.test(value.id) || value.account !== account ||
        !Number.isFinite(value.startedAt) || value.startedAt > Date.now() ||
        Date.now() - value.startedAt > 30*60*1000) return null;
    return value;
  }
  function prepare(event) {
    const account = getAccount();
    if (!account) return;
    if (event?.type !== 'click' || event.isTrusted !== true) return;
    const target = event.target;
    // Observe the real item-card/confirmation action; never click it ourselves.
    // Closing the success popup cannot arm another purchase of the same item.
    if (!target?.closest?.('.bsp-item, [role="dialog"]') ||
        target.closest('#bsp-buy-success-popup') || playerShopConfirmation(win.document, win.location.href, account)) return;
    const seller = new URL(win.location.href).searchParams.get('owner')?.toLowerCase();
    if (!/^[a-z0-9_]{1,50}$/.test(seller || '') || seller === account) return;
    // Keep the action identity across navigation and observer lease expiry.
    // The completed receipt is still required before any money is recorded.
    win.sessionStorage.setItem(ATTEMPT, JSON.stringify({id:win.crypto.randomUUID(), account:account, seller, startedAt:Date.now()}));
  }
  function scan() {
    const account = getAccount();
    if (!account) return "";
    const info = playerShopConfirmation(win.document, win.location.href, account);
    if (!info) return '';
    const old = JSON.parse(win.sessionStorage.getItem(SLOT) || 'null');
    const attempt = pending();
    if (attempt && attempt.seller === info.seller) {
      const receipt = {id:attempt.id, account:account, ...info, boughtAt:Date.now()};
      // Persist identity before the outbox write, so retries and reloads replay
      // the same copy even when the dialog is initially hidden during loading.
      win.sessionStorage.setItem(SLOT, JSON.stringify({receipt}));
      win.sessionStorage.setItem(ATTEMPT, 'null');
      retain('purchase', receipt);
      return '';
    }
    if (old?.receipt?.account === account && equal(old.receipt, info)) {
      retain('purchase', old.receipt);
      return '';
    }
    return `Purchase needs review: ${info.name} · ${info.cost.toLocaleString('en-US')} NP. Desk did not observe its purchase action. It has not been added automatically.`;
  }
  return {prepare, scan};
}

  // Only the exact own-shop history table is evidence. Descriptions and prices
// elsewhere on the page cannot establish a sale.
function readSalesHistory(document, href, account) {
  const url = new URL(href);
  if (url.origin !== 'https://www.neopets.com' || url.pathname !== '/market.phtml' ||
      url.searchParams.getAll('type').join() !== 'sales' || !/^[a-z0-9_]{1,50}$/.test(account || '')) return null;
  const fronts = [...document.querySelectorAll('a[href]')].filter(a => a.textContent.trim() === 'Shop Front');
  if (fronts.length !== 1) return null;
  const owner = new URL(fronts[0].getAttribute('href'), url);
  if (owner.origin !== url.origin || owner.pathname !== '/browseshop.phtml' || owner.searchParams.getAll('owner').join().toLowerCase() !== account) return null;
  const matches = [];
  for (const table of document.querySelectorAll('table')) {
    const rows = [...table.querySelectorAll('tr')].filter(row => row.closest('table') === table)
      .map(row => [...row.children].filter(c => ['TH','TD'].includes(c.tagName)).map(cell => cell.textContent.replace(/\s+/g,' ').trim()));
    if (JSON.stringify(rows[0]) !== JSON.stringify(['Date','Item','Buyer','Price'])) continue;
    const data = rows.slice(1).filter(r => r.length === 4);
    if (!data.length || data.length > 5000 || rows.slice(1).some(r => r.length !== 4 && !(r.length === 1 && /^Clear Sales History/.test(r[0])))) return null;
    if (!data.every(row => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(row[0]) && row[1] && /^[a-zA-Z0-9_]{1,50}$/.test(row[2]) && /^[\d,]+ NP$/.test(row[3]) && row.every(c => c.length <= 400))) return null;
    matches.push(data);
  }
  return matches.length === 1 ? matches[0] : null;
}

  const desk = createDeskConnection(), pendingKey = 'nd_purchase_attempt_v1';
  const shopIDs = new Set([1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 112, 113, 114, 116, 117]);
  let busy = false, syncing = null, timer, messageTimer, lastMessage, prepared = false;
  const isSales = location.pathname === '/market.phtml';
  const isMail = location.pathname === '/neomessages.phtml';
  const isTradingPost = location.pathname === '/island/tradingpost.phtml';
  const isPlayerShop = location.pathname === '/browseshop.phtml';
  const playerReceipts = new Map();
  const playerShop = isPlayerShop ? playerShopObserver({document, location, crypto, sessionStorage}, (_kind, receipt) => {
    playerReceipts.set(receipt.id, receipt);
  }, () => desk.account() === DESK_ACCOUNT ? DESK_ACCOUNT : null) : null;
  function observePlayerShop() {
    if (!playerShop || desk.account() !== DESK_ACCOUNT) return;
    try { const issue = playerShop.scan(); if (issue) message(issue); }
    catch (_) { message('Could not retain this player-shop receipt. Keep the confirmation open and retry.'); }
  }
  function message(text) {
    if (!document.body || text === lastMessage) return;
    lastMessage = text;
    let box = document.getElementById('nd-purchase-status');
    if (!box) { box = document.createElement('aside'); box.id = 'nd-purchase-status'; box.setAttribute('role','status'); box.style.cssText = 'position:fixed;bottom:12px;right:12px;max-width:340px;padding:10px 14px;background:#fff4fa;color:#493649;border:1px solid #dcb7cc;border-radius:10px;font:13px Arial;z-index:99999'; document.body.append(box); }
    box.textContent = text;
    box.hidden = false;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { box.hidden = true; }, 6000);
  }
  function pageInfo() {
    const text = document.body?.innerText || '';
    const name = text.match(/(?:^|\n)\s*Haggle for ([^\n]+)(?:\n|$)/)?.[1]?.trim();
    const candidates = [...document.querySelectorAll('img[src*="/shopkeepers/"]')].map(img => img.src.match(/\/shopkeepers\/w(\d+)(?:\.[a-z]+)(?:\?|$)/i)?.[1]).filter(Boolean);
    const param = new URL(location.href).searchParams.get('obj_type');
    if (param) candidates.push(param);
    // Current haggle pages show a shop heading even when the image URL and
    // page URL no longer contain an ID. Match an exact known name, never a
    // substring in an item name or description.
    const normalize = value => value.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
    const beforeHaggle = text.split(/(?:^|\n)\s*Haggle for /)[0];
    const labels = new Set([
      ...beforeHaggle.split('\n'),
      ...[...document.querySelectorAll('h1, h2')].map(node => node.textContent),
      document.title.replace(/^Neopets\s*[-–—:]\s*/i, '')
    ].map(normalize));
    for (const [id, label] of Object.entries(shopNames)) {
      if (labels.has(normalize(label))) candidates.push(id);
    }
    const ids = [...new Set(candidates.map(Number).filter(id => shopIDs.has(id)))];
    return {text,name,shopId:ids.length === 1 ? ids[0] : null};
  }
  function attempt() { try { return JSON.parse(sessionStorage.getItem(pendingKey) || 'null'); } catch (_) { return null; } }
  // Observe the user's submission only; do not modify the form or its handlers.
  function beginAttempt(force = false) {
    if (isTradingPost || isPlayerShop || isMail) return;
    if (prepared && !force) return;
    const info = pageInfo();
    if (!info.name || !info.shopId || desk.account() !== DESK_ACCOUNT) return;
    if (/I accept your offer of/.test(info.text)) return;
    try { sessionStorage.setItem(pendingKey, JSON.stringify({id:crypto.randomUUID(),account:DESK_ACCOUNT,name:info.name,shopId:info.shopId,startedAt:Date.now()})); prepared = true; }
    catch (_) { message('Purchase tracking could not start: browser session storage is unavailable.'); }
  }
  document.addEventListener('submit', () => beginAttempt(true), true);
  document.addEventListener('click', event => {
    if (playerShop) {
      if (desk.account() === DESK_ACCOUNT) {
        try { playerShop.prepare(event); }
        catch (_) { message('Purchase tracking could not start: browser session storage is unavailable.'); }
      }
      return;
    }
    if (event.target.closest('button, input[type=submit], input[type=image]')) beginAttempt();
  }, true);
  async function sync(explicit = false) {
    // A receipt arriving during an older batch must get its own acknowledged
    // pass before its caller reports success. Browser copies remain retryable.
    if (syncing) { await syncing; return sync(explicit); }
    syncing = (async () => {
    try {
      const keys = (await GM.listValues()).filter(k=>k.startsWith('receipt:'));
      if (!keys.length && explicit) await desk.request('purchases', {purchases:[]});
      for (let i=0;i<keys.length;i+=100) {
        const purchases = await Promise.all(keys.slice(i,i+100).map(k=>GM.getValue(k)));
        await desk.request('purchases',{purchases});
      }
      const historyKeys = (await GM.listValues()).filter(k=>k.startsWith('sales-history:'));
      for (const key of historyKeys) {
        const capture = await GM.getValue(key);
        await desk.request('sales-history', capture);
        // Keep the newest confirmed page so reopening can restore erased imports.
        await GM.setValue('sales-history-latest', capture);
        await GM.deleteValue(key);
      }
      if (!historyKeys.length) {
        const latest = await GM.getValue('sales-history-latest');
        if (latest) await desk.request('sales-history', latest);
      }
      const tradeKeys = (await GM.listValues()).filter(k=>k.startsWith('trade-receipt:'));
      for (let i=0;i<tradeKeys.length;i+=100) {
        const receipts = await Promise.all(tradeKeys.slice(i,i+100).map(k=>GM.getValue(k)));
        await desk.request('trading-sales',{receipts});
      }
      if (explicit) { lastMessage = null; message('Connected to Neopian Desk · ' + keys.length + ' purchases and ' + tradeKeys.length + ' sale receipts synced.'); }
      return true;
    } catch (error) { if (explicit || (await GM.listValues()).some(k=>k.startsWith('receipt:') || k.startsWith('trade-receipt:'))) message('Could not sync to Neopian Desk. Browser receipts are retained. ' + desk.errorMessage(error)); return false; }
    finally { syncing = null; }
    })();
    return syncing;
  }
  async function scan() {
    if (!DESK_ACCOUNT || desk.account() !== DESK_ACCOUNT) return;
    if (busy) return;
    if (playerShop) {
      observePlayerShop();
      busy = true;
      let added = false;
      try {
        for (const [id, receipt] of playerReceipts) {
          const key = 'receipt:' + id, previous = await GM.getValue(key);
          if (previous && ['name','cost','seller','account','source','shopId'].some(field => previous[field] !== receipt[field])) throw Error('Conflicting receipt');
          if (!previous) {
            await GM.setValue(key, receipt);
            added = true;
            message('Recorded ' + receipt.name + ' · ' + receipt.cost.toLocaleString('en-US') + ' NP.');
          }
          playerReceipts.delete(id);
        }
      } catch (_) { message('Could not save this player-shop purchase. Keep the confirmation open and retry from the script menu.'); }
      finally { busy = false; }
      if (added) await sync();
      return;
    }
    if (isTradingPost || isMail) {
      busy = true;
      try {
        const receipts = isMail ? readAuctionReceipts(document, desk.account()) : readTradingReceipts(document, desk.account());
        for (const receipt of receipts) {
          const key = 'trade-receipt:' + receipt.id;
          const previous = await GM.getValue(key);
          if (previous) {
            if (['buyer','received','items','source','date','sentAt'].some(field => JSON.stringify(previous[field]) !== JSON.stringify(receipt[field]))) throw Error('Conflicting receipt');
            continue;
          }
          await GM.setValue(key, receipt);
          message('Saved ' + (isMail ? 'auction' : 'Trading Post') + ' receipt · ' + receipt.received.toLocaleString('en-US') + ' NP. Syncing to Desk…');
          if (await sync()) message('Sale receipt synced to Desk. Open My Sales for the sale or duplicate review.');
        }
      } catch (_) { message('Could not save this sale receipt. Keep the confirmation open and retry from the script menu.'); }
      finally { busy = false; }
      return;
    }
    beginAttempt();
    if (isSales) {
      busy = true;
      try {
        const rows = readSalesHistory(document, location.href, DESK_ACCOUNT);
        if (rows) {
          const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(DESK_ACCOUNT + JSON.stringify(rows)));
          const id = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
          const key = 'sales-history:' + id;
          if (!await GM.getValue(key)) await GM.setValue(key, {id,account:DESK_ACCOUNT,observedAt:Date.now(),rows});
          await sync();
        }
      } catch (error) { message(desk.errorMessage(error)); }
      finally { busy = false; }
      return;
    }
    const info = pageInfo(), saved = attempt();
    const acceptance = info.text.match(/I accept your offer of ([\d,]+) Neopoints!/);
    if (!acceptance || !info.name || !info.text.includes(info.name + ' has been added to your inventory')) return;
    prepared = false;
    if (!saved || saved.account !== DESK_ACCOUNT || saved.name !== info.name || saved.shopId !== info.shopId || Date.now()-saved.startedAt > 30*60*1000) {
      message('Purchase not recorded: ' + (!info.shopId ? 'shop could not be identified.' : desk.account() !== DESK_ACCOUNT ? 'signed-in account could not be confirmed.' : !saved ? 'the offer page was not captured.' : saved.name !== info.name ? 'item changed between offer and receipt.' : saved.shopId !== info.shopId ? 'shop changed between offer and receipt.' : 'the tracked offer is over 30 minutes old.') + ' Use Purchase Tracker status in the script menu.'); return;
    }
    if (desk.account() !== DESK_ACCOUNT) { message('Purchase not recorded: signed-in account does not match the paired account.'); return; }
    const cost = Number(acceptance[1].replace(/,/g,''));
    if (!Number.isSafeInteger(cost) || cost < 1 || cost > 2000000000) return;
    busy = true;
    try {
      const key = 'receipt:' + saved.id;
      if (!await GM.getValue(key)) {
        await GM.setValue(key,{id:saved.id,name:info.name,shopId:info.shopId,cost,boughtAt:Date.now(),account:DESK_ACCOUNT});
        message('Recorded ' + info.name + ' · ' + cost.toLocaleString('en-US') + ' NP.');
        await sync();
      }
    } catch (_) { message('Could not save this purchase. Keep this receipt open and retry from the script menu.'); }
    finally { busy = false; }
  }
  GM.registerMenuCommand('Purchase Tracker status', () => {
    const info = pageInfo(), saved = attempt();
    alert('Purchase Tracker 1.3.0\nAccount: ' + (desk.account() || 'not detected') + (isMail ? '\nAuction-success receipts detected: ' + readAuctionReceipts(document, desk.account()).length + '\nOpen the original Auction Successful! message from The Neopets Team. Mail dates use day/month/year.' : isPlayerShop ? '\nPlayer-shop confirmation: ' + (playerShopConfirmation(document, location.href, DESK_ACCOUNT)?.name || 'not visible') : isTradingPost ? '\nSeller Instant Buy receipts detected: ' + readTradingReceipts(document, desk.account()).length + '\nOther Trading Post receipt formats are not yet supported.' : '\nItem: ' + (info.name || 'not detected') + '\nShop: ' + (info.shopId || 'not detected') + '\nOffer captured: ' + (saved ? saved.name + ' (shop ' + saved.shopId + ')' : 'no')) + '\nUse Sync saved receipts to check the app connection.');
  });
  GM.registerMenuCommand('Connect Purchase Tracker to Neopian Desk',async()=>{if(await desk.pair())await sync(true);});
  GM.registerMenuCommand('Sync saved receipts / retry purchase or sale',async()=>{await scan();await sync(true);});
  async function start() {
    // Some game buttons submit with page JavaScript, bypassing submit events.
    // Prepare an identity on the offer page; only a matching receipt records a buy.
    // Observe before any network await: the Trading Post renders its receipt
    // asynchronously, including while older offline purchases are syncing.
    new MutationObserver(mutations=>{
      if (mutations.every(m=>m.target.closest?.('#nd-purchase-status'))) return;
      if (playerShop) { observePlayerShop(); void scan(); return; }
      clearTimeout(timer);timer=setTimeout(scan,150);
    }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:isPlayerShop,attributeFilter:isPlayerShop ? ['style','class','hidden','aria-hidden'] : undefined});
    beginAttempt();
    await scan(); await sync();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('focus',()=>sync());
})();
