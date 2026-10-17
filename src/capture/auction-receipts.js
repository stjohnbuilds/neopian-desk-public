// Seller Neomail format: labelled From/Sent/Subject/Message table. Read only
// the opened official notification, never an inbox subject or page-wide quote.
export function auctionMailDate(sentAt) {
  if (typeof sentAt !== 'string') return null;
  const m = sentAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m || +m[4] < 1 || +m[4] > 12 || +m[5] > 59) return null;
  // Neomail uses day/month/year, as in the existing sales-history import.
  const date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const stamp = Date.parse(date + 'T12:00:00Z');
  return date >= '1999-01-01' && Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0,10) === date ? date : null;
}

export function readAuctionReceipts(doc, account, now = Date.now()) {
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
