// Seller Instant Purchase receipt observed on Neopets, 14 September 2026.
// Read the receipt's item grid only; active lots behind the popup are not sales.
export function readTradingReceipts(doc, account, now = Date.now()) {
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
