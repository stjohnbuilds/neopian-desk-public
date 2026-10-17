// The modern player-shop success dialog, inspected on 23 September 2026.
// Ignore shop descriptions, asking prices, failed purchases and URL prices.
export function playerShopConfirmation(doc, href, account) {
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
export function playerShopObserver(win, retain, getAccount) {
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
