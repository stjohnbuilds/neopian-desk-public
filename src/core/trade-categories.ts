// Complete hand-authored pages own their navigation and CSS. The legacy single-list
// generator must never wrap their multiple lists or discard their Permies layout.
export function isCompleteTradePage(html: string): boolean {
  return /<div\b[^>]*\bclass=["'][^"']*\bpage-window\b[^"']*["']/.test(html);
}

export const tradeCategories = [
  ["all", "All"], ["four", "4-letter"], ["words", "RW"],
  ["names", "Names"], ["misspells", "Misspells"], ["favorites", "Favorites"],
  ["compounds", "Compounds"], ["older", "Older pets"], ["other", "Other"],
] as const;

// Category-only labels live on their visible tags after migration out of the name.
export function categoryOnlyLabels(card: string): string[] {
  const labels = card.match(/class="trade-features">([^<]*)/)?.[1] || "";
  return ["Compound", "Name misspell", "Misspell"].filter(label =>
    labels.includes(`[${label}]`) || card.includes(`class="trade-label-${label.toLowerCase().replace(/ /g, "-")}"`));
}

export function categoriesForCard(card: string): string[] {
  const name = card.match(/pet=([^"&]+)/)?.[1] || "";
  const labels = (card.match(/class="trade-features">([^<]*)/)?.[1] || "") + " " + categoryOnlyLabels(card).join(" ");
  const categories: string[] = [];
  if (/^[a-z]{4}$/i.test(name)) categories.push("four");
  if (/\bRW\b/i.test(labels)) categories.push("words");
  if (/\bRN\b|\bName(?: misspell)?\b/i.test(labels)) categories.push("names");
  if (/\bMisspell\b/i.test(labels)) categories.push("misspells");
  if (/\bCompound\b/i.test(labels)) categories.push("compounds");
  if (/\bY\d+\b/i.test(labels)) categories.push("older");
  if (!categories.length) categories.push("other");
  if (/\bFavorite\b/i.test(labels) || /class="trade-favorite"/.test(card)) categories.push("favorites");
  return categories;
}

export function withoutTradeCategories(html: string): string {
  if (isCompleteTradePage(html)) return html;
  const tabsStart = html.indexOf('<div class="trade-tabs"');
  const start = tabsStart < 0 ? html.indexOf('<div class="trade-window">') : tabsStart;
  if (start < 0) return html;
  const allStart = html.indexOf('<div class="trade-view" id="trade-all"', start);
  const next = html.indexOf('</div><div class="trade-view" id="trade-four"', allStart);
  const end = html.indexOf('<div class="trade-end"></div>', next);
  if (allStart < 0 || next < 0 || end < 0) return html;
  const content = html.slice(html.indexOf('>', allStart) + 1, next)
    .replace(/^<div class="trade-navigation">[\s\S]*?<\/div>/, '')
    .replace(/^<div class="trade-pane"[^>]*>([\s\S]*)<\/div>$/, '$1')
    .replace(/^<p class="trade-category">[^<]*<\/p>/, '');
  // Older saved exports repeat navigation inside each view; newer exports keep
  // one bar outside the scrolling window. Both unwrap to the same editable All.
  const prefix = html.slice(0, start).replace(/<div class="trade-navigation">[^]*?<\/div>$/, '');
  return prefix + content + html.slice(end + '<div class="trade-end"></div>'.length);
}

export function withTradeCategories(html: string): string {
  if (isCompleteTradePage(html)) return html;
  html = withoutTradeCategories(html);
  const start = html.indexOf('<ul>');
  const end = html.lastIndexOf('</ul>') + 5;
  if (start < 0 || end < 5) return html;
  const all = html.slice(start, end);
  const cards = all.match(/<li\b[\s\S]*?<\/li>/g) || [];
  const navigation = '<div class="trade-navigation" style="position:absolute;top:0;left:0;z-index:2;">' + tradeCategories.map(([key, label]) =>
    cards.some(card => key === 'all' || categoriesForCard(card).includes(key))
      ? `<a href="#trade-${key}">${label}</a>`
      : `<span class="trade-unavailable" title="No pets in this category">${label}</span>`
  ).join(' ') + '</div>';
  const views = tradeCategories.map(([key, label]) => {
    let content = all;
    if (key !== 'all') {
      content = content.replace(/<ul>([\s\S]*?)<\/ul>/g, (_, list: string) => {
        let index = 0;
        const cards = (list.match(/<li\b[\s\S]*?<\/li>/g) || []).filter(card => categoriesForCard(card).includes(key));
        if (!cards.length) return '<ul></ul><p class="trade-empty">No pets in this section.</p>';
        return '<ul>' + cards.map(card => {
          const i = index++;
          return card.replace(/class="trade-pet-[^"]*" style="[^"]*"/, `class="trade-pet-${['one','two','three'][(i + Math.floor(i / 3)) % 3]}" style="${i % 3 === 0 ? 'clear:left;' : ''}border-radius:38px 38px 0 0;"`);
        }).join('') + '</ul>';
      });
    }
    const count = (content.match(/<li\b/g) || []).length;
    return `<div class="trade-view" id="trade-${key}" style="position:relative;"><div class="trade-pane" style="position:absolute;top:50px;bottom:0;left:0;"><p class="trade-category">${label} &middot; ${count}</p>${content}</div></div>`;
  }).join('');
  return html.slice(0, start) + '<div class="trade-tabs" style="position:fixed;top:233px;bottom:24px;left:0;right:0;margin:0 auto;">' + navigation + '<div class="trade-window">' + views + '</div></div><div class="trade-end"></div>' + html.slice(end);
}

export function tradeCategoryCSS(ink: string, border: string, hover: string): string { return `.trade-navigation{margin:0 0 18px;line-height:2.2;text-align:center;}
.trade-navigation a,.trade-navigation .trade-unavailable{display:inline-block;margin:0 3px;text-decoration:none;border:1px solid ${border};padding:2px 8px;font-size:12px;color:${ink};}
.trade-navigation .trade-unavailable{color:${border};cursor:default;}
.trade-navigation a:hover,.trade-navigation a:focus{background:${hover};}
.trade-tabs{width:696px;max-height:570px;background:inherit;}
.trade-window{width:696px;height:100%;overflow:hidden;}
.trade-view{width:696px;height:100%;overflow:hidden;}
.trade-pane{width:720px;overflow:auto;}
form{position:fixed;left:8px;top:8px;z-index:5;}
form center{padding-top:32px;}
.trade-view ul,.trade-navigation,.trade-category,.trade-view .trade-heart,.trade-empty{width:696px;}
.wrap .trade-view h2{width:680px;}
.trade-category{margin:0 0 16px;font-size:13px;letter-spacing:0.08em;}
.trade-empty{font-size:13px;font-style:italic;}
.trade-end{clear:both;}`; }
