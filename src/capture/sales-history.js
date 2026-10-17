// Only the exact own-shop history table is evidence. Descriptions and prices
// elsewhere on the page cannot establish a sale.
export function readSalesHistory(document, href, account) {
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
