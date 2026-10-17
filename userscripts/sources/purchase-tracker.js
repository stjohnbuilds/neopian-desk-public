// ==UserScript==
// @name         Neopets - Purchase Tracker
// @namespace    neopian-desk-purchases
// @version      1.3.0
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
  /* DESK_CONNECTION */
  /* SHOP_IDENTITIES */
  /* TRADING_RECEIPTS */
  /* AUCTION_RECEIPTS */
  /* PLAYER_SHOP_RECEIPTS */
  /* SALES_HISTORY */
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
