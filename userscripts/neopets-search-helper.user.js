// ==UserScript==
// @name         Neopets - Search Helper
// @version      1.0.56
// @namespace    neopets
// @description  Shop Wizards, Trading Post, Auctions and numeric itemdb market estimates.
// @author       diceroll123
// @match        *://*.neopets.com/auctions.phtml*
// @match        *://*.neopets.com/closet.phtml*
// @match        *://*.neopets.com/dome/neopets.phtml*
// @match        *://*.neopets.com/faerieland/darkfaerie.phtml*
// @match        *://*.neopets.com/faerieland/employ/employment.phtml*
// @match        *://*.neopets.com/faerieland/hiddentower938.phtml
// @match        *://*.neopets.com/gallery/index.phtml?*
// @match        *://*.neopets.com/games/kadoatery/*
// @match        *://*.neopets.com/generalstore.phtml*
// @match        *://*.neopets.com/genie.phtml*
// @match        *://*.neopets.com/halloween/esophagor*.phtml*
// @match        *://*.neopets.com/halloween/witchtower*.phtml*
// @match        *://*.neopets.com/hospital.phtml
// @match        *://*.neopets.com/inventory.phtml*
// @match        *://*.neopets.com/island/*training.phtml?*type=status*
// @match        *://*.neopets.com/island/kitchen*.phtml*
// @match        *://*.neopets.com/island/tradingpost.phtml*
// @match        *://*.neopets.com/market.phtml*
// @match        *://*.neopets.com/market_your.phtml*
// @match        *://*.neopets.com/medieval/earthfaerie.phtml*
// @match        *://*.neopets.com/objects.phtml*
// @match        *://*.neopets.com/pirates/academy.phtml?type=status*
// @match        *://*.neopets.com/process_cash_object.phtml
// @match        *://*.neopets.com/pool/puddle_quests.phtml
// @match        *://*.neopets.com/quests.phtml
// @match        *://*.neopets.com/quickstock.phtml*
// @match        *://*.neopets.com/safetydeposit.phtml*
// @match        *://*.neopets.com/shops/wizard.phtml*
// @match        *://*.neopets.com/space/coincidence.phtml
// @match        *://*.neopets.com/winter/igloo.phtml*
// @match        *://*.neopets.com/winter/snowfaerie*.phtml*
// @match        *://*.neopets.com/questlog/
// @match        *://*.neopets.com/games/teatime/
// @icon         https://www.neopets.com/favicon.ico
// @grant        none
// ==/UserScript==

const imgSize = 20; // for the search images

$(`<style type='text/css'>
.searchimg { cursor: pointer; height: ${imgSize}px !important; width: ${imgSize}px !important; border: none !important; border-radius: 0px !important;}
.search-helper { margin-top: 0; margin-bottom: 0; display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:4px; width:100%; box-sizing:border-box; text-align:center; }
.search-helper-price { font: 600 12px Arial,sans-serif; color:#3979ad !important; white-space:nowrap; text-decoration:none; padding:0 3px; flex:0 0 100%; box-sizing:border-box; text-align:center; }
.search-helper-price[data-deal="profit"] { color:#3979ad !important; }
/* Multiples describe estimated resale / listed cost; NP gains have separate badges. */
.search-helper-price[data-multiple="2"] { color:#16813b !important; font-weight:700; }
.search-helper-price[data-multiple="3"] { color:#d00080 !important; font-weight:700; }
.search-helper-price[data-multiple="4"] { color:#7928ca !important; font-weight:800; text-shadow:0 0 4px #d6a5ff,0 0 9px #e8cfff; }
.search-helper-price .deal-label { display:block; font-size:10px; letter-spacing:.05em; line-height:1.4; }
.search-helper-price .profit-percent { display:inline; margin-left:5px; color:#767676 !important; font-size:10px; font-weight:400; text-shadow:none; letter-spacing:normal; }
.search-helper-price .profit-star { display:inline; margin-left:5px; font-size:13px; font-weight:700; text-shadow:none; }
.search-helper-price .profit-star[data-tier="bronze"] { color:#a5632b !important; }
.search-helper-price .profit-star[data-tier="silver"] { color:#7b8794 !important; }
.search-helper-price .profit-star[data-tier="gold"] { color:#b58200 !important; text-shadow:0 0 3px #ffe7a0; }
.search-helper-price[data-deal="loss"] { color:#8b98a3 !important; font-weight:400; text-shadow:none; }
.search-helper-best-deal { outline:3px solid #b58200 !important; outline-offset:5px; border-radius:6px; }
#search-helper-best-button { position:fixed; bottom:18px; left:18px; z-index:9999; max-width:min(420px,85vw); padding:10px 14px; border:1px solid #b58200; border-radius:20px; background:#fff8e6; color:#49330a; font:600 13px Arial,sans-serif; cursor:pointer; box-shadow:0 2px 10px #0002; }
#search-helper-best-button.search-helper-deal-pulse { animation:search-helper-deal-pulse 1s ease-in-out 3; }
@keyframes search-helper-deal-pulse { 50% { box-shadow:0 0 0 7px #e4b64066,0 0 18px #e4b64088; } }
@media (prefers-reduced-motion:reduce) { #search-helper-best-button.search-helper-deal-pulse { animation:none; } }
#search-helper-best-button[hidden] { display:none !important; }
.search-helper-price:hover { text-decoration:underline; }
.qs-search-helper a { display: inline-block !important; }
.sdb-item-info > .search-helper, .sdb-grid-item-content > .search-helper, .closet-list-item > div > .search-helper, .closet-grid-item-content > .search-helper { display: flex !important; flex-flow: row wrap; gap: 2px 3px; align-items: center; margin: 0; padding: 0; }
.sdb-item-info > .search-helper a, .sdb-grid-item-content > .search-helper a, .closet-list-item > div > .search-helper a, .closet-grid-item-content > .search-helper a { display: inline-block !important; }
.sdb-table .sdb-item-cell, .sdb-grid .sdb-grid-item, .closet-list-row .closet-list-item, .closet-grid .closet-grid-item { pointer-events: none; }
.sdb-table .sdb-item-cell > *, .sdb-grid .sdb-grid-item > *, .closet-list-row .closet-list-item > *, .closet-grid .closet-grid-item > * { pointer-events: auto; }
</style>`).appendTo("head");

jQuery.fn.exists = function () {
  return this.length > 0;
};

// if the active pet dropdown image is there, we're in beta
const isBeta = $("[class^='nav-pet-menu-icon']").exists();

const linkmap = {
  // for urls and images for each search type
  // if the image is not from images.neopets.com, base64 it
  ssw: {
    img: "https://images.neopets.com/premium/shopwizard/ssw-icon.svg",
  },
  sw: {
    url: "https://www.neopets.com/shops/wizard.phtml?string=%s",
    img: "https://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png",
  },
  tp: {
    url: "https://www.neopets.com/island/tradingpost.phtml?type=browse&criteria=item_exact&search_string=%s",
    img: "https://images.neopets.com/themes/h5/basic/images/tradingpost-icon.png",
  },
  au: {
    url: "https://www.neopets.com/genie.phtml?type=process_genie&criteria=exact&auctiongenie=%s",
    img: "https://images.neopets.com/themes/h5/basic/images/auction-icon.png",
  },
};

// user has premium toolbar
let premium = false;
if (isBeta) {
  premium = $("[class^='navsub-ssw-icon']").exists();
} else {
  premium = $("#sswmenu .imgmenu").exists();
}

function combiner(item, url, image, label) {
  return $("<a>")
    .attr({
      target: "_blank",
      rel: "noopener noreferrer",
      href: url.replace("%s", encodeURIComponent(item)),
      title: label,
      "aria-label": label,
    })
    .append($("<img>").attr({ src: image, alt: label }).addClass("searchimg"));
}

function sswlink(item) {
  return $("<a>")
    .attr({
      href: "#",
      "data-item": item,
      title: "Super Shop Wizard",
      "aria-label": "Super Shop Wizard",
    })
    .addClass("ssw-helper")
    .append(
      $("<img>")
        .attr({ src: linkmap.ssw.img, alt: "Super Shop Wizard" })
        .addClass("searchimg"),
    );
}

function inURL(substr) {
  return document.URL.includes(substr);
}

function slugfy(itemName) {
  // for itemdb.com.br
  return itemName
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// Compare only an unambiguous shop asking price beside this item's helper.
function shopAskingPrice(node) {
  const url = new URL(document.URL);
  if (url.pathname !== '/objects.phtml' || url.searchParams.get('type') !== 'shop') return null;
  let parent = node.closest('.search-helper')?.parentElement;
  for (let depth=0; parent && depth<3; depth++, parent=parent.parentElement) {
    if (parent.querySelectorAll('.search-helper').length > 1) return null;
    const matches = [...(parent.innerText || parent.textContent).matchAll(/\bCost:\s*((?:\d{1,3}(?:,\d{3})+)|\d+)\s*NP\b/gi)];
    if (matches.length > 1) return null;
    if (matches.length === 1) {
      const price = Number(matches[0][1].replace(/,/g,''));
      return Number.isSafeInteger(price) && price >= 0 ? price : null;
    }
  }
  return null;
}
function priceComparison(estimate, asking) {
  if (!Number.isSafeInteger(estimate) || estimate < 0 || !Number.isSafeInteger(asking) || asking < 0) return 'unknown';
  if (asking > estimate) return 'loss';
  const profit = estimate - asking;
  if (profit >= 100000) return 'jackpot';
  if (profit >= 20000) return 'highprofit';
  if (profit > 0 && asking <= estimate/2) return 'bargain';
  return profit > 0 ? 'profit' : 'even';
}

function resaleMultiple(estimate, asking) {
  if (!Number.isSafeInteger(estimate) || estimate < 0 || !Number.isSafeInteger(asking) || asking <= 0) return '';
  const ratio = estimate / asking;
  return ratio >= 4 ? '4' : ratio >= 3 ? '3' : ratio >= 2 ? '2' : '';
}

// Whole percentages are truncated so 99.9% never appears as the 100% tier.
function profitPercentLabel(estimate, asking) {
  if (!Number.isSafeInteger(estimate) || estimate < 0 || !Number.isSafeInteger(asking) || asking <= 0) return '';
  const percent = ((estimate - asking) / asking) * 100;
  if (percent === 0) return '0%';
  const magnitude = Math.abs(percent);
  return (percent > 0 ? '+' : '−') + (magnitude < 1 ? '<1' : Math.floor(magnitude).toLocaleString('en-US')) + '%';
}

function profitStarTier(estimate, asking) {
  if (!Number.isSafeInteger(estimate) || estimate < 0 || !Number.isSafeInteger(asking) || asking < 0) return '';
  const gain = estimate - asking;
  return gain >= 100000 ? 'gold' : gain >= 50000 ? 'silver' : gain >= 20000 ? 'bronze' : '';
}

// Scrolls and highlights new deals. Never activates a Neopets control.
// BEGIN RESTOCK WATCHLIST (generated by tools/build-userscripts.py)
const restockWatchlist = {"asOf":"2026-09-10","shops":{"1":{"Leaf Taco":82000000,"Cheesy Strawberry Slice":15000000,"Wocky Steak":12000000,"Fun Icy Cheese Pop":11000000,"Cheesy Chocoshake":8850000,"Mighty Steakwich":8500000,"Onion and Mustard Pie":8000000,"Egg and Tomato Sandwich":7750000,"Fancy Rack of Lamb with Fruit":6550000,"BLT Croissant":6400000,"Invisible Cookie":6200000,"Candy Floss Carrot":6050000,"Red Picnic Hamper":5200000,"Zeenana Toffee Apple":4900000,"Acara Ice Cream Surprise":4500000,"Rainbow Cybunny Negg":3550000,"Rainbow Neggnog":2900000,"Meerca Apertif":2350000,"Ice Apple":2300000,"Tigersquash Custard":2100000,"Bangers and Mash":2050000,"Puzzle Fruit":1900000,"Island Meatloaf":1750000,"Heart Shaped Negg":1300000,"Krawken Calamari":1150000,"Lime Negg":1150000,"Animal-style Chips":998594,"Black Currant Juice":970000,"Square Meat":890000,"Borovan Layered Cake":600000,"Mutated Negg":480000,"Blue Cybunny Negg":400000,"Chocolate Coated Blue Cheese":390000,"Rainbow Negg":380000,"Le Sausage":340000,"Frozen Veggie Delight":340000,"Speckled Negg":320000,"Purple Cybunny Negg":320000,"Borovan Hot Chocolate Bomb":280000,"Battle Duck Negg":260000,"Christmas Pattern Negg":260000,"Ultimate Icy Negg":260000,"Rainbow Apple":240000,"Cheesy Chokato Pie":230000,"Rock Negg":220000,"Maple Syrup Negg":210000,"Partitioned Negg":200000,"Sweet and Sour Negg":200000,"Decorative Negg":200000,"Apple Juice Sippy Cup":200000,"Raspberry Toffee Apple":200000,"Leftover Shortcrust Pastry":200000,"Yellow Negg":190000,"Ultra Icy Negg":190000,"Candy Cane Negg":190000,"Kadoatie Biscuits":190000,"Puntec Cupcake":190000,"Green Picnic Hamper":190000,"Purple Negg":180000,"Pink Negg":170000,"Blue Negg":170000,"Ornate Purple Negg":170000,"Glowing Apple":170000,"Swirly Negg #498":160000,"Glass Negg":160000,"Happy Anniversary Negg":160000,"Jinjah Maple Mocktail":150000,"Lemon Swirly Negg":140000,"Twirly Fruit Flavoured Milk":140000,"Mega Tuna Sandwich":140000,"Chain of Onions":140000,"Phear Flavoured Milk":130000,"CPMPB Pizza":130000,"Orange Negg":130000,"Fruit Tart":130000,"Super Icy Negg":120000,"Tonu Trifle":120000,"Quiggle Stew":120000,"Carrot On A Stick":120000,"Fall Leaf Salad":120000,"Chocolate Coated Cheese":120000,"Chocolate Coated Holey Cheese":120000,"Raspberry Yurblecone":110000,"Sparkling Twirly Fruit Juice":110000,"Peanut Dash Shake":110000,"Brown Sugar Oatmeal":100000,"Ruki Juicebox":100000,"Xweetok Burger":100000,"Lutari Fizz":100000,"Blue Picnic Hamper":100000},"2":{"Blue Varwolf Morphing Potion":145000000,"Yellow Varwolf Morphing Potion":125000000,"Red Varwolf Morphing Potion":115000000,"Green Varwolf Morphing Potion":115000000,"Woodland Eyrie Morphing Potion":20000000,"Halloween Cybunny Morphing Potion":20000000,"Royal Boy Kyrii Morphing Potion":20000000,"Striped Jetsam Morphing Potion":19000000,"Royal Girl Kyrii Morphing Potion":19000000,"Maraquan Usul Morphing Potion":18000000,"Shadow Cybunny Morphing Potion":18000000,"Snow Eyrie Morphing Potion":17000000,"Rainbow Flotsam Morphing Potion":17000000,"Darigan Draik Morphing Potion":17000000,"Plushie Korbat Morphing Potion":16000000,"Fire Ixi Morphing Potion":15000000,"Green Jetsam Morphing Potion":15000000,"Desert Aisha Morphing Potion":15000000,"Halloween Aisha Morphing Potion":15000000,"Darigan Kau Morphing Potion":15000000,"Water Draik Morphing Potion":14000000,"Island Blumaroo Morphing Potion":14000000,"Blue Kiko Morphing Potion":14000000,"Faerie Usul Morphing Potion":14000000,"Darigan Wocky Morphing Potion":14000000,"Faerie Draik Morphing Potion":13000000,"Striped Xweetok Morphing Potion":13000000,"Maractite Peophin Morphing Potion":13000000,"Maraquan Grarrl Morphing Potion":13000000,"Striped Kau Morphing Potion":12000000,"Checkered Kiko Morphing Potion":12000000,"Fire Skeith Morphing Potion":12000000,"Faerie Blumaroo Morphing Potion":12000000,"Ghost Draik Morphing Potion":11000000,"Island Grundo Morphing Potion":11000000,"Starry Draik Morphing Potion":11000000,"Desert Lutari Morphing Potion":11000000,"Plushie Bori Morphing Potion":11000000,"Island Peophin Morphing Potion":11000000,"Baby Kau Morphing Potion":11000000,"Island Lupe Morphing Potion":11000000,"Woodland Tonu Morphing Potion":11000000,"Christmas Kougra Morphing Potion":10000000,"Blue Krawk Morphing Potion":10000000,"Red Kau Morphing Potion":10000000,"Halloween Kau Morphing Potion":10000000,"Plushie Scorchio Morphing Potion":10000000,"Spotted Kau Morphing Potion":10000000,"Striped Chia Morphing Potion":10000000,"Yellow Skeith Morphing Potion":10000000,"Blue Kacheek Morphing Potion":10000000,"Striped Skeith Morphing Potion":10000000,"Wraith Draik Morphing Potion":10000000,"Darigan Grarrl Morphing Potion":10000000,"Baby Koi Morphing Potion":9950000,"Halloween Chia Morphing Potion":9950000,"Starry Bruce Morphing Potion":9900000,"Island Mynci Morphing Potion":9900000,"Snow Peophin Morphing Potion":9900000,"Ghost Shoyru Morphing Potion":9850000,"Transparent Skeith Morphing Potion":9850000,"Brown Ixi Morphing Potion":9800000,"Wraith Ogrin Morphing Potion":9800000,"Yellow Gelert Morphing Potion":9750000,"Fire Kacheek Morphing Potion":9650000,"Island Shoyru Morphing Potion":9600000,"Faerie Ruki Morphing Potion":9550000,"Blue Zafara Morphing Potion":9500000,"Disco Shoyru Morphing Potion":9500000,"Ghost Peophin Morphing Potion":9500000,"Zombie Buzz Morphing Potion":9500000,"Plushie Tuskaninny Morphing Potion":9400000,"Speckled Cybunny Morphing Potion":9400000,"Island Tuskaninny Morphing Potion":9350000,"Darigan Bori Morphing Potion":9350000,"Woodland Skeith Morphing Potion":9300000,"Green Draik Morphing Potion":9300000,"Red Mynci Morphing Potion":9250000,"Starry Kau Morphing Potion":9250000,"Halloween Hissi Morphing Potion":9250000,"Transparent Elephante Morphing Potion":9200000,"Island Cybunny Morphing Potion":9150000,"Ghost Gelert Morphing Potion":9150000,"Halloween Lenny Morphing Potion":9150000,"Pirate Cybunny Morphing Potion":9100000,"Faerie Acara Morphing Potion":9050000,"Electric Ixi Morphing Potion":9000000,"Island JubJub Morphing Potion":9000000,"Halloween Kyrii Morphing Potion":9000000,"Halloween Nimmo Morphing Potion":8950000,"Red Skeith Morphing Potion":8950000,"Desert Poogle Morphing Potion":8900000,"Island Krawk Morphing Potion":8900000,"Darigan Mynci Morphing Potion":8900000,"Flaming Torch":8850000,"Blue Acara Morphing Potion":8850000,"Plushie Yurble Morphing Potion":8850000,"Maraquan Mynci Morphing Potion":8850000,"Glowing Korbat Morphing Potion":8800000,"Rainbow Lupe Morphing Potion":8800000,"White Skeith Morphing Potion":8750000,"Halloween Ixi Morphing Potion":8750000,"Fire Moehog Morphing Potion":8650000,"Baby JubJub Morphing Potion":8650000,"Brown Bruce Morphing Potion":8650000,"Fire Chia Morphing Potion":8550000,"Green Peophin Morphing Potion":8500000,"Maraquan Korbat Morphing Potion":8450000,"Green Grarrl Morphing Potion":8450000,"Christmas Kiko Morphing Potion":8400000,"Fire Ruki Morphing Potion":8400000,"Starry Kacheek Morphing Potion":8350000,"Blue Jetsam Morphing Potion":8300000,"Starry Skeith Morphing Potion":8300000,"Striped Shoyru Morphing Potion":8250000,"Woodland Bori Morphing Potion":8250000,"Faerie Bori Morphing Potion":8250000,"Shadow Skeith Morphing Potion":8200000,"Green Kacheek Morphing Potion":8150000,"Baby Jetsam Morphing Potion":8150000,"Plushie Bruce Morphing Potion":8000000,"Stealthy Krawk Morphing Potion":8000000,"Wraith Grundo Morphing Potion":8000000,"Green Chia Morphing Potion":7950000,"Wraith Scorchio Morphing Potion":7950000,"Green Koi Morphing Potion":7900000,"Green Usul Morphing Potion":7900000,"Woodland Wocky Morphing Potion":7900000,"Maractite Draik Morphing Potion":7900000,"Shadow Lenny Morphing Potion":7850000,"Blue Korbat Morphing Potion":7850000,"Red Jetsam Morphing Potion":7850000,"Maractite Aisha Morphing Potion":7850000,"Water Buzz Morphing Potion":7800000,"Cloud Bruce Morphing Potion":7750000,"Spotted Flotsam Morphing Potion":7750000,"Spotted Koi Morphing Potion":7750000,"Green Zafara Morphing Potion":7700000,"Red Cybunny Morphing Potion":7700000,"Faerie Tuskaninny Morphing Potion":7700000,"Desert Scorchio Morphing Potion":7700000,"White Xweetok Morphing Potion":7600000,"Ghost Hissi Morphing Potion":7600000,"Island Skeith Morphing Potion":7550000,"Island Koi Morphing Potion":7500000,"Purple Draik Morphing Potion":7450000,"Shadow Chomby Morphing Potion":7450000,"Invisible Wocky Morphing Potion":7450000,"Yellow Draik Morphing Potion":7450000,"Faerie Kau Morphing Potion":7350000,"Ghost Lenny Morphing Potion":7350000,"Christmas Gelert Morphing Potion":7350000,"Yellow Bori Morphing Potion":7350000,"Faerie Quiggle Morphing Potion":7350000,"Ghost Grarrl Morphing Potion":7300000,"Red Kiko Morphing Potion":7250000,"Faerie Poogle Morphing Potion":7250000,"Ghost Korbat Morphing Potion":7150000,"Green Skeith Morphing Potion":7150000,"Desert Chomby Morphing Potion":7150000,"Plushie Usul Morphing Potion":7150000,"Christmas Pteri Morphing Potion":7100000,"Yellow Wocky Morphing Potion":7100000,"Darigan Kyrii Morphing Potion":7100000,"Maraquan Hissi Morphing Potion":7050000,"Woodland Mynci Morphing Potion":7050000,"Stealthy Techo Morphing Potion":7050000,"Island Kiko Morphing Potion":7000000,"Rainbow Koi Morphing Potion":7000000,"Snow Ogrin Morphing Potion":7000000,"Shadow Ruki Morphing Potion":6950000,"Skunk Buzz Morphing Potion":6950000,"Darigan Ixi Morphing Potion":6950000,"Baby Korbat Morphing Potion":6900000,"Darigan Blumaroo Morphing Potion":6900000,"Yellow Lupe Morphing Potion":6850000,"Water Acara Morphing Potion":6850000,"Kauvaras Potion":6850000,"Island Nimmo Morphing Potion":6750000,"Yellow Jetsam Morphing Potion":6750000,"Snow Wocky Morphing Potion":6700000,"Red Shoyru Morphing Potion":6650000,"Purple Pteri Morphing Potion":6650000,"Stealthy Kyrii Morphing Potion":6650000,"Woodland Draik Morphing Potion":6600000,"Cloud Lenny Morphing Potion":6600000,"Snow Blumaroo Morphing Potion":6550000,"Wraith Korbat Morphing Potion":6500000,"Halloween Grundo Morphing Potion":6450000,"Yellow Krawk Morphing Potion":6450000,"Faerie Bruce Morphing Potion":6450000,"Red Kacheek Morphing Potion":6450000,"Split Flotsam Morphing Potion":6400000,"White Chomby Morphing Potion":6350000,"Maraquan Meerca Morphing Potion":6350000,"Desert Blumaroo Morphing Potion":6300000,"Cloud Eyrie Morphing Potion":6250000,"Faerie Lupe Morphing Potion":6100000,"Baby Scorchio Morphing Potion":6050000,"Blue Nimmo Morphing Potion":6050000,"Rainbow Swirly Potion":6050000,"Blue Lenny Morphing Potion":6000000,"Blue Wocky Morphing Potion":6000000,"Shadow Peophin Morphing Potion":6000000,"Desert Flotsam Morphing Potion":6000000,"Halloween Meerca Morphing Potion":6000000,"Faerie Yurble Morphing Potion":6000000,"Baby Meerca Morphing Potion":5950000,"Green Krawk Morphing Potion":5950000,"Blue Tonu Morphing Potion":5950000,"Darigan Eyrie Morphing Potion":5950000,"Striped Grarrl Morphing Potion":5950000,"Disco Bruce Morphing Potion":5900000,"Yellow Poogle Morphing Potion":5900000,"Red Acara Morphing Potion":5850000,"Split Chia Morphing Potion":5850000,"Disco Korbat Morphing Potion":5850000,"Eventide Draik Morphing Potion":5800000,"Purple Peophin Morphing Potion":5800000,"Faerie JubJub Morphing Potion":5800000,"Island Bruce Morphing Potion":5800000,"Darigan Aisha Morphing Potion":5800000,"Rainbow JubJub Morphing Potion":5750000,"Red Peophin Morphing Potion":5700000,"Island Korbat Morphing Potion":5700000,"Rainbow Kau Morphing Potion":5700000,"Orange Yurble Morphing Potion":5600000,"Camouflage Krawk Morphing Potion":5500000,"Plushie Grundo Morphing Potion":5450000,"Blue Quiggle Morphing Potion":5450000,"Island Bori Morphing Potion":5450000,"Darigan Grundo Morphing Potion":5450000,"Christmas Scorchio Morphing Potion":5400000,"Fire Pteri Morphing Potion":5350000,"Disco Mynci Morphing Potion":5350000,"Fire Chomby Morphing Potion":5300000,"Baby Acara Morphing Potion":5300000,"Faerie Meerca Morphing Potion":5300000,"Polkadot Tonu Morphing Potion":5250000,"Water Flotsam Morphing Potion":5250000,"Island Kacheek Morphing Potion":5100000,"Checkered Acara Morphing Potion":5050000,"Wraith Krawk Morphing Potion":5050000,"Red Tonu Morphing Potion":5000000,"Fire Draik Morphing Potion":5000000,"Blue Skeith Morphing Potion":5000000,"Pink Lenny Morphing Potion":5000000,"Fire Wocky Morphing Potion":4950000,"Red Flotsam Morphing Potion":4950000,"Yellow Kacheek Morphing Potion":4950000,"Relic Chia Morphing Potion":4950000,"Faerie Skeith Morphing Potion":4900000,"Faerie Cybunny Morphing Potion":4900000,"Baby Kougra Morphing Potion":4900000,"Purple Tonu Morphing Potion":4900000,"Baby Chomby Morphing Potion":4900000,"Yellow Blumaroo Morphing Potion":4900000,"Yellow Tonu Morphing Potion":4850000,"Transparent Korbat Morphing Potion":4850000,"Skunk Flotsam Morphing Potion":4800000,"Woodland Lenny Morphing Potion":4750000,"Green JubJub Morphing Potion":4650000,"Christmas Koi Morphing Potion":4650000,"Green Poogle Morphing Potion":4650000,"Maractite Hissi Morphing Potion":4650000,"Cloud Grarrl Morphing Potion":4600000,"Zombie Eyrie Morphing Potion":4600000,"Faerie Xweetok Morphing Potion":4500000,"Plushie Skeith Morphing Potion":4500000,"Strawberry Kacheek Morphing Potion":4450000,"Island Wocky Morphing Potion":4450000,"Rainbow Cybunny Morphing Potion":4400000,"Island Zafara Morphing Potion":4400000,"Christmas Uni Morphing Potion":4400000,"Blue Chomby Morphing Potion":4350000,"Desert Krawk Morphing Potion":4350000,"Woodland Acara Morphing Potion":4300000,"Shadow Ogrin Morphing Potion":4300000,"Fire Bruce Morphing Potion":4250000,"Fire Xweetok Morphing Potion":4200000,"Baby Kiko Morphing Potion":4150000,"Transparent Lenny Morphing Potion":4150000,"Halloween Korbat Morphing Potion":4100000,"Fire Quiggle Morphing Potion":4050000,"Cloud Elephante Morphing Potion":4050000,"Green Quiggle Morphing Potion":4050000,"Woodland Peophin Morphing Potion":4000000,"Red Ixi Morphing Potion":4000000,"Green Moehog Morphing Potion":4000000,"Faerie Techo Morphing Potion":4000000,"Checkered Aisha Morphing Potion":4000000,"Island Xweetok Morphing Potion":3950000,"Faerie Lutari Morphing Potion":3950000,"Blue Peophin Morphing Potion":3950000,"Yellow Kiko Morphing Potion":3950000,"Cloud Bori Morphing Potion":3950000,"Glowing Jetsam Morphing Potion":3850000,"Pirate Kacheek Morphing Potion":3850000,"Darigan Techo Morphing Potion":3850000,"Yellow Techo Morphing Potion":3800000,"Island Acara Morphing Potion":3750000,"Eventide Hissi Morphing Potion":3750000,"Green Meerca Morphing Potion":3750000,"Fire Shoyru Morphing Potion":3750000,"Checkered Poogle Morphing Potion":3750000,"Striped Nimmo Morphing Potion":3750000,"Water Kau Morphing Potion":3700000,"Strange Potion":3700000,"Pirate Lenny Morphing Potion":3650000,"Red Wocky Morphing Potion":3650000,"Red Grarrl Morphing Potion":3650000,"Dimensional Aisha Morphing Potion":3550000,"Faerie Pteri Morphing Potion":3550000,"Desert Elephante Morphing Potion":3550000,"Starry Cybunny Morphing Potion":3550000,"Red Kougra Morphing Potion":3500000,"Green Mynci Morphing Potion":3500000,"Red Krawk Morphing Potion":3450000,"Eventide Gelert Morphing Potion":3450000,"Green Korbat Morphing Potion":3450000,"Green Wocky Morphing Potion":3450000,"Tyrannian JubJub Morphing Potion":3450000,"Faerie Nimmo Morphing Potion":3450000,"Pink Draik Morphing Potion":3400000,"Red Koi Morphing Potion":3400000,"Pirate Flotsam Morphing Potion":3400000,"Christmas Magic Hat":3350000,"Christmas Acara Morphing Potion":3300000,"Cloud Gelert Morphing Potion":3300000,"Baby Lupe Morphing Potion":3300000,"Spotted Nimmo Morphing Potion":3250000,"Rainbow Kyrii Morphing Potion":3200000,"Ghost Techo Morphing Potion":3200000,"Plushie Techo Morphing Potion":3200000,"Starry Zafara Morphing Potion":3150000,"Blue Techo Morphing Potion":3150000,"Plushie Flotsam Morphing Potion":3150000,"Eventide Zafara Morphing Potion":3100000,"Halloween Uni Morphing Potion":3100000,"Fire Buzz Morphing Potion":3100000,"Fire Nimmo Morphing Potion":3050000,"Christmas Lupe Morphing Potion":3000000,"Yellow Acara Morphing Potion":3000000,"Yellow Kau Morphing Potion":3000000,"Tyrannian Bori Morphing Potion":3000000,"Blue Koi Morphing Potion":2950000,"Split Bruce Morphing Potion":2950000,"Gold Tonu Morphing Potion":2950000,"Faerie Lenny Morphing Potion":2900000,"White Ixi Morphing Potion":2900000,"Christmas Grundo Morphing Potion":2900000,"Yellow Korbat Morphing Potion":2900000,"Blue Kau Morphing Potion":2900000,"Pink Peophin Morphing Potion":2850000,"Red Korbat Morphing Potion":2850000,"Pirate Poogle Morphing Potion":2850000,"Christmas Cybunny Morphing Potion":2800000,"Dimensional Poogle Morphing Potion":2800000,"Maraquan Krawk Morphing Potion":2800000,"Tyrannian Gnorbu Morphing Potion":2700000,"Stealthy Lutari Morphing Potion":2700000,"Purple Aisha Morphing Potion":2650000,"Halloween Bori Morphing Potion":2650000,"Island Chomby Morphing Potion":2600000,"Pirate Wocky Morphing Potion":2600000,"Pirate Lutari Morphing Potion":2550000,"Red Chomby Morphing Potion":2500000,"Shadow Tonu Morphing Potion":2500000,"Blue Buzz Morphing Potion":2500000,"Plushie Aisha Morphing Potion":2450000,"Baby Kacheek Morphing Potion":2450000,"Disco Acara Morphing Potion":2400000,"Christmas Kacheek Morphing Potion":2400000,"Spotted Hissi Morphing Potion":2400000,"Eventide Aisha Morphing Potion":2350000,"Blue Uni Morphing Potion":2350000,"Woodland Grundo Morphing Potion":2300000,"Plushie Ixi Morphing Potion":2300000,"Purple Shoyru Morphing Potion":2300000,"White Flotsam Morphing Potion":2300000,"Eventide Poogle Morphing Potion":2250000,"Halloween Xweetok Morphing Potion":2250000,"Plushie Cybunny Morphing Potion":2250000,"Pirate Gnorbu Morphing Potion":2200000,"Green Flotsam Morphing Potion":2150000,"Speckled Kau Morphing Potion":2100000,"Halloween Eyrie Morphing Potion":2100000,"Faerie Aisha Morphing Potion":2100000,"Blue Mynci Morphing Potion":2100000,"Spotted Pteri Morphing Potion":2100000,"Blue Usul Morphing Potion":2100000,"Darigan Zafara Morphing Potion":2100000,"Plushie Kau Morphing Potion":2050000,"Disco Kacheek Morphing Potion":2050000,"Plushie Wocky Morphing Potion":2000000,"Green Lutari Morphing Potion":2000000,"Plushie Hissi Morphing Potion":2000000,"Baby Peophin Morphing Potion":1950000,"Shadow Hissi Morphing Potion":1950000,"Camouflage Cybunny Morphing Potion":1950000,"Desert Chia Morphing Potion":1950000,"Maraquan Ixi Morphing Potion":1950000,"Faerie Grundo Morphing Potion":1950000,"Green Ruki Morphing Potion":1900000,"Rainbow Kacheek Morphing Potion":1900000,"Pink Lutari Morphing Potion":1900000,"Island Lutari Morphing Potion":1850000,"Red Pteri Morphing Potion":1850000,"Yellow Kyrii Morphing Potion":1850000,"Yellow Grarrl Morphing Potion":1850000,"Cloud Acara Morphing Potion":1800000,"Desert Peophin Morphing Potion":1750000,"Christmas Zafara Morphing Potion":1750000,"Purple Zafara Morphing Potion":1700000,"Maraquan Acara Morphing Potion":1700000,"Baby Buzz Morphing Potion":1700000,"Wraith Shoyru Morphing Potion":1700000,"Fire Kau Morphing Potion":1650000,"Dimensional Shoyru Morphing Potion":1650000,"Baby Blumaroo Morphing Potion":1650000,"Green Buzz Morphing Potion":1650000,"Plushie JubJub Morphing Potion":1600000,"Yellow Zafara Morphing Potion":1600000,"Skunk Draik Morphing Potion":1550000,"Red Ruki Morphing Potion":1550000,"Faerie Buzz Morphing Potion":1550000,"Ghost Tuskaninny Morphing Potion":1550000,"Faerie Ixi Morphing Potion":1550000,"Island Aisha Morphing Potion":1500000,"Desert Buzz Morphing Potion":1500000,"Faerie Uni Morphing Potion":1500000,"Maraquan Cybunny Morphing Potion":1500000,"Faerie Flotsam Morphing Potion":1500000,"Yellow Peophin Morphing Potion":1450000,"Tyrannian Peophin Morphing Potion":1450000,"Green Pteri Morphing Potion":1450000,"Disco Moehog Morphing Potion":1450000,"Halloween Tonu Morphing Potion":1400000,"Pastel Gnorbu Morphing Potion":1400000,"Plushie Mynci Morphing Potion":1400000,"Blue Bruce Morphing Potion":1350000,"Zombie Usul Morphing Potion":1350000,"Plushie Gnorbu Morphing Potion":1350000,"Island Usul Morphing Potion":1300000,"Glowing Lupe Morphing Potion":1300000,"Pink Shoyru Morphing Potion":1300000,"Christmas Chia Morphing Potion":1300000,"Christmas Chomby Morphing Potion":1300000,"Plushie Tonu Morphing Potion":1300000,"Plushie Jetsam Morphing Potion":1300000,"Dimensional Jetsam Morphing Potion":1250000,"Maraquan Buzz Morphing Potion":1250000,"Yellow Hissi Morphing Potion":1250000,"Striped Scorchio Morphing Potion":1200000,"Desert Kyrii Morphing Potion":1200000,"Woodland Cybunny Morphing Potion":1200000,"Baby Shoyru Morphing Potion":1200000,"Spotted Jetsam Morphing Potion":1200000,"Yellow Aisha Morphing Potion":1150000,"Yellow Ruki Morphing Potion":1150000,"Christmas Peophin Morphing Potion":1150000,"Maraquan Gelert Morphing Potion":1150000,"Water Faerie Bubbles":1100000,"Island Quiggle Morphing Potion":1100000,"Pastel Cybunny Morphing Potion":1000000,"Baby Aisha Morphing Potion":1000000,"Brown Aisha Morphing Potion":999999,"Split Lupe Morphing Potion":999999,"Tyrannian Usul Morphing Potion":999998,"Wraith Gelert Morphing Potion":998145,"Checkered Shoyru Morphing Potion":997994,"Starry Hissi Morphing Potion":990000,"Desert Grundo Morphing Potion":990000,"Yellow Bruce Morphing Potion":980000,"Purple Yurble Morphing Potion":980000,"Plushie Poogle Morphing Potion":970000,"Faerie Shoyru Morphing Potion":970000,"Plushie Kougra Morphing Potion":940000,"Red Aisha Morphing Potion":930000,"Desert Kacheek Morphing Potion":930000,"Gold Scorchio Morphing Potion":920000,"Pink Korbat Morphing Potion":910000,"Pink Eyrie Morphing Potion":900000,"Dimensional Kougra Morphing Potion":900000,"Starry Flotsam Morphing Potion":890000,"Blue Aisha Morphing Potion":860000,"Darigan Acara Morphing Potion":860000,"Fire Flotsam Morphing Potion":850000,"Ghost Acara Morphing Potion":840000,"Baby Hissi Morphing Potion":840000,"Red Yurble Morphing Potion":830000,"Pink Pteri Morphing Potion":820000,"Swamp Gas Ogrin Morphing Potion":820000,"Zombie Cybunny Morphing Potion":780000,"Blue Scorchio Morphing Potion":780000,"Pastel Xweetok Morphing Potion":770000,"Woodland Uni Morphing Potion":760000,"Snow Chia Morphing Potion":760000,"White Shoyru Morphing Potion":750000,"Desert Ogrin Morphing Potion":750000,"Striped Aisha Morphing Potion":740000,"Plushie Buzz Morphing Potion":740000,"Clay Aisha Morphing Potion":730000,"Rainbow Uni Morphing Potion":690000,"Green Ixi Morphing Potion":680000,"Blue Flotsam Morphing Potion":670000,"Shadow Shoyru Morphing Potion":660000,"Brown Ruki Morphing Potion":660000,"Zombie Flotsam Morphing Potion":660000,"Starry Shoyru Morphing Potion":650000,"Spotted Gelert Morphing Potion":650000,"Striped Blumaroo Morphing Potion":620000,"Yellow Shoyru Morphing Potion":610000,"Darigan Buzz Morphing Potion":610000,"Faerie Krawk Morphing Potion":610000,"Strawberry Bruce Morphing Potion":580000,"Gold Shoyru Morphing Potion":560000,"Green Cybunny Morphing Potion":530000,"Blue Ixi Morphing Potion":530000,"Stealthy Grarrl Morphing Potion":530000,"Rainbow Quiggle Morphing Potion":520000,"Grey Ixi Morphing Potion":510000,"Yellow Ixi Morphing Potion":500000,"Tyrannian Eyrie Morphing Potion":500000,"Desert Hissi Morphing Potion":500000,"Fire Gnorbu Morphing Potion":460000,"Fire Blumaroo Morphing Potion":460000,"Green Gelert Morphing Potion":460000,"Snowy Flotsam Morphing Potion":440000,"Rainbow Hissi Morphing Potion":440000,"Blue Hissi Morphing Potion":430000,"Purple Eyrie Morphing Potion":410000,"Island Buzz Morphing Potion":410000,"Island Techo Morphing Potion":410000,"Faerie Peophin Morphing Potion":410000,"Rainbow Ogrin Morphing Potion":400000,"Plushie Ogrin Morphing Potion":400000,"Starry Bori Morphing Potion":390000,"Faerie Eyrie Morphing Potion":390000,"Stealthy Blumaroo Morphing Potion":380000,"Yellow Cybunny Morphing Potion":350000,"Checkered Koi Morphing Potion":350000,"Eventide Korbat Morphing Potion":350000,"Cloud Poogle Morphing Potion":350000,"Grey Zafara Morphing Potion":350000,"Baby Chia Morphing Potion":330000,"White Grarrl Morphing Potion":320000,"Transparent Wocky Morphing Potion":320000,"Fire Techo Morphing Potion":320000,"Baby Poogle Morphing Potion":310000,"Christmas Lenny Morphing Potion":300000,"Grey Cybunny Morphing Potion":300000,"Starry Korbat Morphing Potion":290000,"Strawberry Meerca Morphing Potion":290000,"Island Ixi Morphing Potion":290000,"Wraith Pteri Morphing Potion":290000,"Strawberry Lupe Morphing Potion":280000,"Green Hissi Morphing Potion":270000,"Christmas Elephante Morphing Potion":270000,"Slorg Slime":270000,"Red Hissi Morphing Potion":260000,"Rainbow Wocky Morphing Potion":260000,"Baby Draik Morphing Potion":260000,"Pirate Ixi Morphing Potion":250000,"Blue Shoyru Morphing Potion":240000,"Green Chomby Morphing Potion":230000,"Rainbow Grundo Morphing Potion":230000,"Pink Ruki Morphing Potion":230000,"Starry Uni Morphing Potion":220000,"Pirate Meerca Morphing Potion":220000,"Camouflage JubJub Morphing Potion":220000,"Speckled Bruce Morphing Potion":220000,"Plushie Pteri Morphing Potion":220000,"Purple Chia Morphing Potion":210000,"Starry Scorchio Morphing Potion":210000,"Grey Grarrl Morphing Potion":210000,"Rainbow Chomby Morphing Potion":210000,"Disco Chomby Morphing Potion":200000,"Cloud Pteri Morphing Potion":200000,"Island Gelert Morphing Potion":200000,"Red Nimmo Morphing Potion":200000,"Blue Draik Morphing Potion":200000,"Camouflage Kyrii Morphing Potion":190000,"Grey JubJub Morphing Potion":190000,"Spotted Korbat Morphing Potion":180000,"Striped Korbat Morphing Potion":180000,"Strawberry Mynci Morphing Potion":180000,"Powerful Pest Removal Potion":170000,"Zombie JubJub Morphing Potion":170000,"Rainbow Tuskaninny Morphing Potion":170000,"Pirate Chomby Morphing Potion":170000,"Pirate Ogrin Morphing Potion":170000,"Grey Lenny Morphing Potion":170000,"Starry Pteri Morphing Potion":160000,"Tyrannian Ogrin Morphing Potion":160000,"Water Kyrii Morphing Potion":160000,"Starry Xweetok Morphing Potion":160000,"Striped Ixi Morphing Potion":160000,"Fire Poogle Morphing Potion":160000,"Yellow Chomby Morphing Potion":150000,"Camouflage Scorchio Morphing Potion":150000,"Tyrannian Ixi Morphing Potion":150000,"Grey Korbat Morphing Potion":150000,"Grey Techo Morphing Potion":150000,"Spotted Eyrie Morphing Potion":140000,"Spotted Scorchio Morphing Potion":140000,"Speckled Bori Morphing Potion":140000,"Desert Tuskaninny Morphing Potion":140000,"Grey Mynci Morphing Potion":140000,"Snow Bruce Morphing Potion":140000,"Starry Usul Morphing Potion":130000,"Starry Techo Morphing Potion":130000,"Strawberry Pteri Morphing Potion":130000,"Grey Yurble Morphing Potion":130000,"Camouflage Wocky Morphing Potion":120000,"Apple Chia Morphing Potion":120000,"Spotted Grarrl Morphing Potion":120000,"Spotted Grundo Morphing Potion":120000,"Red Tuskaninny Morphing Potion":120000,"Split Grarrl Morphing Potion":120000,"Yellow Mynci Morphing Potion":120000,"Rainbow Grarrl Morphing Potion":110000,"Spotted Shoyru Morphing Potion":110000,"Ghost Ogrin Morphing Potion":110000,"Red Uni Morphing Potion":100000,"Yellow Quiggle Morphing Potion":100000,"Blue Ruki Morphing Potion":100000},"3":{"Cyodrake Collectable Charm":78000000,"Y28 Usukicon Goodie Bag":49000000,"Lord Kass Quiguki":35000000,"Blue PaintBrush Collectable Charm":32000000,"Gallion Collectable Charm":27000000,"Luxury Faerie Festival Snowglobe":27000000,"Tigerfruit Collectable Charm":22000000,"Luxury Beach Scene Faerie Snowglobe":18000000,"Baelia Charm":15000000,"Quiguki Zombie":15000000,"Techo Statue Collectable Charm":13000000,"Feather Bow and Arrow":12000000,"Taiko Standing Drum Collectable Charm":9300000,"Mutant Golf Club":9300000,"Neopets 26th Birthday Goodie Bag":7100000,"Elephante Lamp Collectable Charm":5000000,"Quiguki Musketeer":4300000,"Wherfy Collectable Charm":4200000,"Library Faerie Doll":3400000,"Jhuidah Snowglobe":3050000,"Soup Faerie Doll":2900000,"Faerie Buzz Plushie Collectable Charm":2000000,"Water Faerie Doll":1850000,"Handsome Valentine Quiguki":1400000,"Negg Faerie Snowglobe":1300000,"Taelia Quiguki":1150000,"Tooth Faerie Snowglobe":999999,"Traditional Welsh Quiguki":999771,"Psellia Doll":999764,"Baby Techo Bobblehead":998114,"King Skarl Quiguki":910000,"Vexing Varwolf Goodie Bag":890000,"Omelette Faerie Doll":790000,"Mr Chuckles Action Figure":790000,"Illusen Faerie Doll":720000,"Cheerleader Quiguki Doll":720000,"Fyora Quiguki Set":700000,"Quiguki Prom Queen":620000,"Green Kougra Pocket Pet":490000,"Tarlas Mystery Blind Box":450000,"Darigan Aisha Action Figure":450000,"Luxury Dark and Light Faerie Snowglobe":410000,"Faerie Techo Plushie Collectable Charm":400000,"Queen Fyora Quiguki":400000,"Clock":400000,"Soup Faerie Snowglobe":350000,"Fire Faerie Doll":300000,"Luxury Dark and Earth Faerie Snowglobe":270000,"King Hagan Quiguki":270000,"Red Wocky Balloon":230000,"Summer Fun Quiguki":200000,"Pop Star Quiguki":200000,"Ballerina Quiguki":190000,"Halloween Y14 Goodie Bag":180000,"Mime Quiguki":170000,"Happy Halloween Bag":160000,"Tyrannia Snowglobe":160000,"Dark Faerie Doll":150000,"Dark Faerie Snowglobe":140000,"Aethia Quiguki":140000,"Princess Amira Action Figure":130000,"Rainbow Scooter":130000,"Glyme Collectable Charm":120000,"Starry Stocking":120000,"Year 9 Quiguki":120000,"00 Moehog Action Figure":110000,"Hopping Nimmo Action Figure (with awesome LEG POWER!)":110000,"Snot Blocks":110000,"Princess Terrana Collectable Charm":100000},"4":{"Shoyru Pink Aviator Jacket":16000000,"Erisim T-Shirt":12000000,"I Love Lyins T-Shirt":9250000,"Yellow Avabot T-Shirt":8750000,"Yellow Zebba T-Shirt":8550000,"Autumn Ixi Forest Cape":8500000,"Yellow Moltenore T-Shirt":8000000,"I Love Buzzer T-Shirt":7300000,"I Love Splyke T-Shirt":7300000,"Red Proper Peophin Lady Wig":6950000,"I Love Hornsby T-Shirt":6850000,"Pinceron T-Shirt":6650000,"Gold Female Kiko Dancer Dress":6350000,"Yellow Sunutek T-Shirt":6000000,"I Love Kadoatie T-Shirt":5450000,"Aisha Space Suit":5300000,"Plaid Gothic Ruki Skirt":4850000,"Magical Meerca Chibi Wings":4500000,"Baby Cloud Hat":4400000,"Kacheek Pyjama Cap":4250000,"I Love Wadjet T-Shirt":3600000,"Moth Queen Aisha Gown":2950000,"Plant Reaper Grundo Backpack":2650000,"I got taxed by the Tax Beast T-Shirt":2500000,"Cool Blonde Acara Wig":2350000,"Alien Aisha Ears":2350000,"Moth Queen Aisha Headdress":2200000,"Lupe Knight Foot Armour":2200000,"Lupe Knight Sword":1900000,"Lupe Knight Top Armour":1850000,"Lupe Knight Bottom Armour":1850000,"Texting Barbat Flip Phone":1800000,"Anime Valentine Suit Jacket":1750000,"On the Go Cybunny Makeup":1750000,"Red Tuskaninny Parka":1700000,"Uni Neon Hooves":1550000,"Elegant Draik Earrings":1500000,"Mutant Bleached Denim Jacket":1450000,"Pretty Net Dress":1350000,"Blumaroo Ghostkerchief Boomaroo Accessories":1300000,"Pretty Kau Dusk Cloud Dress":1250000,"Uni Neon Wings Decoration":1100000,"Mystical Astronomer Kiko Cape":1100000,"Nimmo Emerald Shenkuu Dress":1000000,"Ixi Forest Cape":999997,"Uni Knight Helmet":999949,"JubJub Detective Trench Coat":999844,"Jungle Aisha Hat":998613,"Xweetok Popstar Dress":998093,"Gothic Kougra Jacket":995357,"Ombre Fyora Wig":980000,"Usul Ski Suit":950000,"Lutari Gentleman Shoes":950000,"Mysterious Draik Mask":940000,"Female Wanderer Koi Coat":910000,"Buzz Tennis Shirt":890000,"Supreme Deluxe Faerie Queen Dress":880000,"Nimmo Farmer Overalls":880000,"Rugged Usul Boots":860000,"Chomby Gentleman Hat":850000,"Fabled Zafara Body":820000,"Gothic Nimmo Shirt":810000,"Elegant Flotsam Hat":810000,"Cybunny Diver Suit":800000,"Dark Gnorbu Boots":800000,"Hissi Pop Star Wig":790000,"Pink Kacheek Bathing Cap":780000,"Stylish Nimmo Shoes":780000,"Draik Archer Hat":780000,"Red Mushroom JubJub Hat":770000,"Pink Flowered Kougra Dress":760000,"Pink Scorchio Sun Glasses":750000,"Chimney Sweep Techo Trousers":750000,"Green Kougra Skirt":740000,"Lutari Rollerskate Waitress Tray":730000,"Delightful Poogle Necklace":720000,"Glamorous Moehog Gloves":720000,"Gelert Spy Jacket":710000,"Studded Leather Uni Trousers":700000,"Quiggle Hostess Dress":690000,"Lutari Gentleman Trousers":690000,"Lupe Knight Helm":660000,"Quiggle Adventurer Trousers":660000,"Delicate Lavender Draik Necklace":630000,"Xweetok Popstar Earrings":620000,"Flower Basket":620000,"Lutari Aristocrat Wig":620000,"Draik Archer Trousers":610000,"Snowy Xweetok Dress":610000,"Leaf-Sewn Tonu Top":610000,"Trendy Aisha Shirt and Trousers":610000,"Ixi Bandit Belt":600000,"Golden Acara Headpiece":590000,"Blue Bogie T-Shirt":590000,"I Love Khamette T-Shirt":590000,"Quiggle Tea Party Teapot":580000,"Lutari Gentleman Jacket":580000,"Cybunny Diver Gloves":580000,"Elephante Barbarian Armour":580000,"Traditional Shenkuu Hissi Gloves":570000,"On the Go Cybunny Dress":570000,"Chomby Grave Digger Trench Coat":570000,"Chomby Gentleman Jacket":570000,"Poogle Wizard Hat":570000,"Fancy Aisha Wig":560000,"Bruce Tuxedo Jacket":560000,"Gnorbu Gentleman Trousers":550000,"Anime Valentine Suit Heart Staff":530000,"Red Fur Jacket":520000,"Studded Leather Uni Shoes":520000,"Punk Kiko Contacts":520000,"Anti Valentines Tea":510000,"Mystical Astronomer Kiko Lantern":510000,"Shrouded Draik Trousers":510000,"Flotsam Artist Smock":500000,"Lupe Hunter Jacket":500000,"Mysterious Draik Trousers":500000,"Gothic Korbat Wig":490000,"Shoyru Pyjama Bottom":480000,"Kyrii Hostess Gloves":480000,"Blood of my Enemies Mutant Makeup":470000,"Spring Time Male Krawk Shirt":470000,"Uni Neon Hair Accessory":460000,"Tonu Knight Top Armour":460000,"Kyrii Hostess Dress":460000,"Draik Sorceress Cloak":440000,"Quiggle Adventurer Shoes":440000,"Dapper Poogle Hat":430000,"Gentleman Ogrin Boots":430000,"Faerie Drugal Wig":420000,"Nimmo Emerald Shenkuu Cuff":420000,"Sakhmet Aisha Dancer Costume":410000,"Fancy Uni Bracelets":410000,"Light Buzz Sash":410000,"Exotic Techo Dress":400000,"Gothic Kougra Shoes":400000,"Draik Boxer Gloves":400000,"Gnorbu Pyjama Bottoms":400000,"Lutari Band Leader Jacket":390000,"Light Buzz Wig":380000,"Lotus Xweetok Dress":370000,"Rustic Female Usul Warrior Wig":370000,"Fashionable Gelert Purse":370000,"Stylish Nimmo Hat":370000,"Trendy Korbat Shirt":370000,"Kyrii Host Microphone":370000,"Purple Krawk Cloak":370000,"Hissi Gentleman Shoes":370000,"Glamorous Moehog Shoes":370000,"Tuskaninny Boy Beach Hat":370000,"Medieval Illusen Dress":360000,"Uni Neon Tail Accessory":360000,"Moehog Flapper Shoes":360000,"Bori Detective Coat":360000,"Ruki Scientist Hat":350000,"Rocking Eyrie Wig":350000,"Flotsam Yellow Tourist Shirt":350000,"Mysterious Draik Gloves":350000,"Gnorbu Gentleman Shoes":350000,"Fabled Zafara Head":340000,"Gothic Kougra Wig":340000,"Cool Jetsam Wig":340000,"Skeith Pineapple Hat":340000,"Chomby Altador Heroine Sash":340000,"Shoyru Knight Gloves":340000,"Pride Aisha Wig":330000,"Kacheek Pyjama Doll":330000,"Elegant Flotsam Watering Can":330000,"Cozy Techo Wig":330000,"Cool Jetsam Trousers":330000,"Uni Neon Horn":320000,"Shoyru Rain Slicker":320000,"Gothic Kougra Trousers":320000,"Colourful Female Kiko Dancer Dress":320000,"Leaf-Sewn Tonu Belt":320000,"Cozy Kau Hat":320000,"Proper Lady Ogrin Shoes":320000,"Trendy Acara Shirt":310000,"Fashionable Aisha Jacket":310000,"Pride Aisha Flames":300000,"Celestial Wayfarer Peophin Mane":300000,"Blumaroo Jester Hat":300000,"Jetsam Lunch Lady Spoon":300000,"Cybunny Ancient Warrior Armour":300000,"Krawk Wizard Beard":300000,"Leaf-Sewn Tonu Skirt":300000,"Scorchio Folk Dancer Shoes":300000,"Lutari Sweet Little Sailor Dress":300000,"Kougra Adventurer Shorts":290000,"Space Wanderer Xweetok Dress":290000,"Lovely Gnorbu Gloves":290000,"Cozy Techo Shirt":290000,"Lutari Aviator Jacket":290000,"Supreme Deluxe Faerie Queen Makeup & Contacts":280000,"Supreme Deluxe Faerie Queen Hair":280000,"Studded Leather Uni Top":280000,"Male Wanderer Koi Headband":280000,"Red Wocky Suit Trousers":280000,"Poogle Pink Tiara":280000,"Krawk Wizard Shoes":280000,"Quiggle Summer Tote":280000,"Elegant Lutari Gloves":280000,"Celestial Wayfarer Peophin Harness":270000,"Proper Peophin Lady Rose":270000,"Krawk Hiking Trousers and Boots":270000,"Delightful Poogle Dress":270000,"Tonu Knight Helm":270000,"Lovely Bruce Shoes":270000,"Elegant Pink Draik Fan":270000,"Cybunny Ocean Warrior Gloves":270000,"Rocket Shoyru Helmet":270000,"Curly Blonde Skeith Wig":270000,"Krawk T-Shirt":270000,"Cosy Jinjah Cardigan":260000,"Adorable Illusen Wig":260000,"Illusen Umbrella Cut Dress":260000,"On the Go Cybunny Wig":260000,"Hissi Gentleman Jacket":260000,"Fancy Aisha Dress":260000,"Lutari Gentleman Hat":260000,"Stylish Bruce Jacket":260000,"Quaint Gelert Hat":260000,"Elephante Barbarian Wig":260000,"Quiggle Tea Party Makeup":260000,"Milk Maid Techo Wig":260000,"Cool Jetsam Jacket":260000,"Hasee T-Shirt":260000,"Pink Kadoatie T-Shirt":260000,"Fabled Zafara Tail":250000,"Kougra Adventurer Hat":250000,"Dark Hooded Elephante Tunic":250000,"Elegant Uni Shoes":250000,"Lab Assistant Ogrin Shoes":250000,"Chomby Grave Digger Gloves":250000,"Pink Blooky T-Shirt":250000,"Xweetok Popstar Microphone":240000,"Draik Sorceress Belt and Tunic":240000,"Usul Ski Goggles":240000,"Rustic Male Usul Warrior Trousers":240000,"Tuskaninny Ballet Tutu":240000,"Kougra Warrior Princess Dress":240000,"Milk Maid Kau Blouse":240000,"Lotus Xweetok Wig":230000,"Lutari Aviator Cap":230000,"Worn Leather Yurble Vest":230000,"Cybunny Diver Fins":230000,"Chia Barbarian Tunic":230000,"Chomby Altador Heroine Wig":230000,"Rainy Day Quiggle Shoes":230000,"Mynci Ranger Helm":230000,"Glamorous Moehog Dress":230000,"Cybunny Ocean Warrior Dress":230000,"Buzz Diver Gloves":230000,"Buzz Tennis Shoes":230000,"Trendy Korbat Gloves":230000,"Sunny Flotsam Sandals":230000,"Buzz Diver Net":220000,"Chomby Prehistoric Trousers":220000,"Poogle Punk Jacket":220000,"Pink Pyjama Wocky Top":220000,"Super Tough Jetsam Boots":220000,"Glamorous Moehog Hat":220000,"Cobrall Charming Hissi Shirt":220000,"Cybunny Ocean Warrior Shoes":220000,"Gothic Kougra Mask":210000,"Snowy Xweetok Collar":210000,"Kyrii Mage Bracers":210000,"Zafara Altador Heroine Wig":210000,"Aisha Maiden Hair":210000,"Outrageous Grarrl Tie":210000,"Little Red Riding Hood Cybunny Cape":210000,"Pretty Spring Cybunny Dress":210000,"Rebellious Ogrin Shoes":210000,"Flotsam Band Leader Shoes":210000,"Mysterious Draik Jacket":210000,"Meerca Thieving Garb":210000,"Slick Gelert Shirt and Vest":200000,"Pretty Kyrii Purse":200000,"Mynci Explorer Trousers":200000,"Futuristic Lutari Diving Helmet":200000,"Sparkling Green Chia Shoes":200000,"Pink Tonu Wig":200000,"Outrageous Grarrl Gloves":200000,"Dark Nimmo Boots":200000,"Green Suit Tuskaninny Shadow":200000,"Comfortable Blumaroo Shoes":200000,"Eyrie Magician Jacket":200000,"Nurse Gelert Dress":200000,"Ogrin Maid Blouse":190000,"Techo Cheeseroller Tunic":190000,"Simple Korbat Peasant Shoes":190000,"Lutari Aviator Trousers":190000,"Krawk Wizard Cloak":190000,"Adorable Chomby Shirt":190000,"Leaf-Sewn Tonu Wig":190000,"Mysterious Draik Shoes":190000,"Stylish Nimmo Trousers":190000,"Proper Lady Ogrin Scarf":190000,"Strange Quiggle Trousers":190000,"Spring Time Male Krawk Shoes":190000,"Techo Fighting Robe":190000,"Tuskaninny Boy Beach Trousers":190000,"Grey Gothic School Make Up":180000,"Sakhmet Aisha Dancer Slippers":180000,"Chomby Belle Necklace":180000,"Maractite Koi Trousers":180000,"Pretty Kau Cloud Dress":180000,"Gelert Race Cart Driver Jacket":180000,"Quiggle Tea Party Wig":180000,"Elegant Lutari Wig":180000,"Elephante Bard Cape":180000,"Colourful Patterned Blumaroo Trousers":180000,"Highland Gelert Boots":180000,"Super Tough Jetsam Wig":180000,"Bori Detective Magnifying Glass":180000,"I Love Spyder T-Shirt":180000,"Aisha Rain Slicker":170000,"Kougra Noil Tamer Jacket":170000,"Hissi Gentleman Trousers":170000,"Chimney Sweep Techo Hat":170000,"Eyrie Magician Hat":170000,"Rocket Shoyru Rocket Pack":170000,"Mynci Ranger Boots":170000,"Elephante Bard Wig":170000,"Stylish Tuskaninny Jacket":170000,"Strange Quiggle Wig":170000,"Elegant JubJub Dress":170000,"Super Tough Moehog Jacket":170000,"Elegant Lutari Shoes":170000,"Poogle Mohawk":170000,"Witch Eyrie Wings":160000,"Shoyru Wizard Cloak":160000,"Basket of Baked Draik Goodies":160000,"Pteri Washerwoman Outfit":160000,"Poogle Witch Doctor Mask":160000,"Tonu Knight Bottom Armour":160000,"Elegant Flotsam Shirt":160000,"Tonu Chef Jacket":160000,"Super Tough Moehog Shoes":160000,"Casual Kiko Wig":150000,"Shimmering Blue Peophin Bracers":150000,"Ruki Flower Vendor Apron":150000,"Winter Ranger Kougra Jacket":150000,"Chia Rock Star Trousers":150000,"Lupe Hunter Trousers":150000,"Chomby Gentleman Moustache":150000,"Lovely Kacheek Wig":150000,"Ritzy Aisha Hat":150000,"Elegant Kacheek Warrior Wig":150000,"JubJub Clown Overalls":150000,"Leather Jacket":150000,"Lacy Poogle Sleeping Gown":150000,"Punk Kiko Skirt":150000,"Jetsam Aviator Boots":150000,"Acara Rebel Boots":150000,"Scary Moehog Trousers":150000,"Milk Maid Techo Skirt":150000,"Dapper Poogle Trousers":150000,"Waterskiing Jetsam Trousers":150000,"Warrior Lupe Maiden Necklace":140000,"Space Grundo Shoes":140000,"Elegant Draik Slippers":140000,"Laid Back Xweetok Shirt":140000,"Simple Zafara Trousers":140000,"Elegant Uni Skirt":140000,"Cozy Techo Purse":140000,"Chomby Belle Hat":140000,"Gelert Spy Shirt":140000,"Uni Knight Bottom Armour":140000,"Skeith Bib":140000,"Purple Moehog Skirt":140000,"On the Go Bruce Handbag":140000,"Colourful Female Kiko Dancer Wig":140000,"Warrior Lupe Maiden Shoes":140000,"Kyrii Host Trousers":140000,"Grarrl Dancing Shirt":140000,"Colourful Male Hissi Dancer Boots":140000,"Poogle Tutu":140000,"Elephante Barbarian Bracers":140000,"Spoiled Kougra Collar":130000,"Cartographer Ruki Glasses":130000,"Mystical Astronomer Kiko Compass":130000,"Cute Cup of Borovan":130000,"Dark Uni Armoured Shirt":130000,"Lupe Hunter Cap":130000,"Neopian Times Zafara Shirt and Vest":130000,"Kacheek Mail Carrier Cap":130000,"Gothic Ruki Shirt":130000,"Morning Meerca Mug":130000,"Meerca Magician Hat":130000,"Dark Hooded Elephante Cloak":130000,"Female Wanderer Koi Crystal Ball":130000,"Lutari Gentleman Monocle":130000,"Sunny Flotsam Bracelet":130000,"Warrior Zafara Belt":130000,"Elephante Detective Trousers":130000,"Fashionable Gelert Skirt":130000,"Adorable Chomby Trousers":130000,"Hissi Gentleman Shirt and Waistcoat":130000,"Mynci Zoot Suit Hat":130000,"Buzz Tennis Ball":130000,"Punk Ogrin Trousers":130000,"Shoyru Knight Boots":130000,"Highland Gelert Kilt":130000,"Lacy Gnorbu Dress":130000,"Meerca Worker Shirt":130000,"Dapper Shoyru Shirt and Coat":130000,"Shoyru Pink Aviator Trousers":130000,"Chomby Grave Digger Belt":130000,"Kiko Space Exploration Helmet":130000,"Glamourous Skeith Dress":130000,"Yellow Kookith T-Shirt":130000,"Sakhmet Aisha Dancer Headdress":120000,"Hissi Thief Belt":120000,"Cybunny Carrot Robe":120000,"Lovely Kacheek Dress":120000,"Chomby Flower Child Rose Glasses":120000,"Space Wanderer Xweetok Wig":120000,"Zafara Altador Heroine Dress":120000,"Shoyru Knight Sword":120000,"JubJub Scientist Wig and Goggles":120000,"Koi Ocean Lord Crown":120000,"Draik Traveller Boots":120000,"Easygoing Xweetok Scarf":120000,"Chia Sailor Hat":120000,"Elephante Fortune Teller Shirt":120000,"Steel Nails":120000,"Demure Usul Jacket":120000,"Ritzy Aisha Shoes":120000,"Shoyru Pyjama Top":120000,"Rugged Kyrii Sweater":120000,"Warrior Zafara Tank Top":120000,"Grundo Miner Shoes":120000,"Shoyru Yellow Flower Dress":120000,"Shipwrecked Techo Shorts":120000,"Tuskaninny Parka":120000,"Fashionable Koi Purse":120000,"Regal Yurble Lady Dress":120000,"Male Wanderer Koi Shirt":120000,"Purple Moehog Top":120000,"Gnorbu Sheriff Trousers":120000,"Lenny Archer Tights":120000,"Chomby Belle Gloves":120000,"Pretty Purple Lutari Dress":120000,"Pretty Pink and Black Hissi Dress":120000,"Scorchio Masquerade Dress":120000,"Elegant JubJub Earrings":120000,"Delightful Poogle Shoes":120000,"Chomby Gentleman Shoes":120000,"Spring Time Female Krawk Shoes":120000,"Warm Yurble Shoes":120000,"Jazzy Bori Gown":120000,"Grey Gothic Moody Hair Wig":110000,"Milkman Kau Milk":110000,"Desert Princess Peophin Outfit":110000,"Chomby Prehistoric Spear":110000,"Shimmering Blue Peophin Crown":110000,"Kiko Altador Heroine Bracelet":110000,"Elegant Draik Necklace":110000,"Kougra Altador Heroine Necklace":110000,"Punk Xweetok Necklace":110000,"Chomby Flower Child Peace Symbol":110000,"Black Hissi Choker":110000,"Cybunny Miner Clothes":110000,"Acara Festival Gown":110000,"Cybunny Diver Goggles":110000,"Punk Ogrin Shirt":110000,"Fashionable Zafara Trousers":110000,"Winter Ranger Kougra Trousers":110000,"Chomby Belle Dress":110000,"Winter Zafara Tail Sock":110000,"Draik Sorceress Shoes":110000,"Usul Beatnik Outfit":110000,"Light Buzz Dress":110000,"Lutari Aristocrat Shoes":110000,"Slick Gelert Shoes":110000,"Trendy Uni Shoes":110000,"Colourful Female Kiko Dancer Fan":110000,"Little Red Riding Hood Krawk Dress":110000,"Colourful Female Hissi Dancer Dress":110000,"Skeith Hair Stylist Scissors":110000,"Grarrl Rainy Day Trousers":110000,"Eyrie Pilot Scarf":110000,"JubJub Detective Shirt and Tie":110000,"Chomby Grave Digger Hat":110000,"Fashionable Koi Shoes":110000,"Elephante Barbarian Trousers":110000,"Tuskaninny Boy Beach Shirt":110000,"Illusen Pant Suit":100000,"Evening Draik Jewellery":100000,"Lutari Aviator Belt":100000,"Jungle Aisha Collar":100000,"Usul Red Winter Hat":100000,"Proper Peophin Lady Necklace":100000,"JubJub Clown Hat":100000,"Quiggle Hostess Shoes":100000,"Kyrii Swordsman Shirt and Tunic":100000,"Demure Usul Skirt":100000,"Dapper Poogle Shirt and Waistcoat":100000,"Bruce Buzzer Keeper Suit":100000,"Koi Ocean Lord Toga":100000,"Casual JubJub Shoes":100000,"Brown Scorchio Bracelet":100000,"Cozy Kau Dress":100000,"Cozy Kau Shoes":100000,"Warm Yurble Shirt":100000},"5":{"Wibreth Comb":8250000,"Aromatic Candle":390000,"Glyme Perfume":140000},"7":{"Koya Korbat Huntress":100000000,"Zafara Lore":20000000,"Kau Pastures":20000000,"The Voodoo Techo":20000000,"Suspicious Art Journal":18000000,"Lenny Witchcraft":18000000,"Neopian Heroes":18000000,"Beating Sloth":17000000,"My Life As A Lenny":16000000,"Kougra Classics":16000000,"Olde Zafara":16000000,"The Joys of Cooking with Magma":15000000,"A Chia Halloween":15000000,"Unabridged Dictionary":12000000,"Poogle Pages":12000000,"The Bad Skeith":11000000,"Trigonometry Hyperbolics":10000000,"Care of Koi":9500000,"The Eyrie Guard":7550000,"Super Secret Guide to the Defenders of Neopia Headquarters":7400000,"The Happiest Day":6800000,"Blumaroo Pharooh":6700000,"Decoding a Coded Decoding Book":5950000,"The Draik":5400000,"Cleaning Technology":5250000,"Gallery Of Toast":4950000,"An Apple a Day? No Way!":4550000,"Uni Myths":3400000,"Happy Birthday Meerca!":3050000,"When Neggs Explode":2950000,"Buzz Acrobatic Stunts":2800000,"Lenny Cookbook":2800000,"Zafara Mystery Collection":2600000,"Spike Fashion":2500000,"A Chia Story":2400000,"Best Friends":2150000,"Grundo Tales":1950000,"Ixi Woods":1850000,"Kiko Lake Altador Cup Media Book":1700000,"Ultimate Space Chronicles Set":1450000,"A History of Chias":1300000,"Bruces Guide to Combat Eating":1250000,"Mortog Music":1050000,"Modern Lupe Magazine":1050000,"Captain Meerca":1000000,"Faerie Imprisonment for Fun and Profit":1000000,"Decorative Towel Folding":999999,"Jelly Acara Travels":999999,"Iron Skeith":999746,"Moehog Matching":999621,"Go Home Moehog!":999190,"Faerie Secrets":997695,"The Magic Staff":990582,"Cheat By Capara":950000,"Chia Art History":950000,"Illusens Diary":910000,"Chomby Poems":900000,"Princess Vyssas Diary":840000,"Petfolio":830000,"Do It Yourself Bobbleheads":800000,"Inside the Mind of Bob":790000,"Spotting Seaweed":780000,"Moehog Masterpieces":780000,"Cooking With Your Wock(y)":770000,"Pteri Poetry":740000,"12 Angry Myncies":740000,"Brain Trees Brainiac":740000,"Mystery Island Altador Cup Media Book":730000,"Illusens Journey":730000,"The Way of the Draik":730000,"Infamous Xweetok Guide":670000,"Neopian Atlas":660000,"Rubber Mallard Collecting":630000,"Feeding Your Chomby":620000,"Calculus Basics":610000,"Krawk Island Altador Cup Media Book":600000,"Cenanit Ragamans":590000,"Skeith Tails":580000,"Kacheek Magic":580000,"The Grizzly Gruslen":560000,"Nimmo Battle Cry":550000,"Darigan Citadel Altador Cup Media Book":540000,"Gruslens Galore":540000,"Neopets Fanfiction":530000,"Aerial Shots of Neopia":500000,"The Guide to Facial Hair":480000,"Baby JubJub Cloth Book":470000,"Book Of Peas":470000,"Book of Fake Scratchcards":450000,"1052 Sakhmetian Tales":450000,"Book of Bruno":440000,"Neopias Past":440000,"300m Peanut Dash Guide Book":410000,"Shenkuu Altador Cup Media Book":410000,"Acara Algebra":400000,"Ixi Glade":400000,"The Book of Paper Cuts":390000,"Meruth The True Story":350000,"Meercas In Love":350000,"Lutari Tales":340000,"Cooking With Peas":330000,"The Velveteen Draik":330000,"The Zombie Chomby":320000,"Chia Quotes":320000,"The Spectre Legacy":310000,"A Grarrls Growl":300000,"The Draconian Scroll":290000,"How to Make a Bonfire":290000,"Shenkuu Floral Arrangement":290000,"Chianatomy":290000,"Lupe Digest":280000,"Gifts for your Enemies":280000,"Growing a Vine Yard":270000,"Wocky Magic":260000,"I, Moehog":250000,"Aisha Lovin It":250000,"Draik Tales":250000,"The Chomby Secret":250000,"Friends Forever":240000,"Legend Of The Quiggle Runner":240000,"Secret Lenny Book":230000,"The Ultimate Sticker Book":230000,"JubJub Journal":230000,"Gelert A to Z":230000,"Zap the Robot Aisha":220000,"Krawk Island Altador Cup Play Book":220000,"Pteri Pop-Up Book":220000,"Usul Health":210000,"Purple Lupe Photo Album":210000,"Faerie Chombies":190000,"Calendar Scroll":180000,"Scorchio Defence":180000,"101 Uses for Ice":170000,"Altador Paperback Book":170000,"Common Cures: Revised Edition":160000,"An Elderly Acaras Day Off":160000,"Advert Attack Guide Book":150000,"Tis Be Harvesting Time":150000,"Roo Island Altador Cup Media Book":150000,"Making Kau Plushies":140000,"Better Than You":140000,"Altador Altador Cup Media Book":140000,"Legend of the Alabriss":140000,"A Magazine":140000,"Jazzmosis Biography":140000,"Happy Feet":130000,"On Tour with Chomby and the Fungus Balls":120000,"The Red Paw":120000,"Fall Destinations":120000,"The Chomby Champion":120000,"How to Creatively Stop Kitchen Fires":110000,"Dont Call Me Cute":110000,"Zombie Legends":110000,"The Dark Peophin":110000,"Super Lupe Comics":110000,"Spooky Usul Stories":110000,"Conquer the Dark":110000,"Rare Stamps":100000,"The Hot Scorchio Cook Book":100000},"8":{"Little Timmy":195000000,"Marillis Harbane":55000000,"Duel Bazuka":23000000,"Sargug":18000000,"Champion":16000000,"Meruth":16000000,"Siona":16000000,"The Shop Wizard":15000000,"Hubrid Nox":14000000,"Grotson":12000000,"Scauderwelsch":10000000,"Lord Kass Card":8800000,"The Hairy Tongue Beast":7800000,"Mr. Chuckles":7650000,"Garrox5 The Grundo Trooper":6800000,"Khan the Unstoppable":6800000,"Shylock Usulski":6600000,"Sergeant Brexis":5650000,"Zygorax":5350000,"Punchbag Bob":5250000,"Kyrii Sorceror":4000000,"The Incredible Grarrl":2750000,"Draconus Maximus":2500000,"Captain Xelqued":2100000,"Professor Kachevski":1850000,"Enchanted Ixi":1450000,"Kalandra":1400000,"Wock Til You Drop":1200000,"Remnok the Nomad":1150000,"Zeirn the Electric Kougra":1150000,"Iskha Lightbringer":1100000,"Lord Darigan":1100000,"Extreme Herder":1050000,"Zafara Double Agent":999999,"Nocan Vish":999999,"Swamp Ghoul":930000,"Jahbal":900000,"Mechanoid Warrior":880000,"Jeran":880000,"Mechachiazilla":760000,"Lunchtime":700000,"Krawk Swashbuckler":680000,"Branston the Eyrie":640000,"Valrigard":630000,"Neopet Version Two":620000,"Treasure Seekers":510000,"Gilly the Usul":460000,"The Brain Tree":440000,"The Pant Devil":420000,"Korosu Crestscar":400000,"Krawk card":400000,"Maths Nightmare":340000,"Space Krawk":330000,"Deckswabber":320000,"Cherlops, Protector of Garn":310000,"Illusen the Earth Faerie":280000,"The Soup Faerie":260000,"Kauvara":260000,"Guardian of Ice Magic":230000,"Stan the Kyrii":200000,"Princess Sankara":140000,"Master Vex":130000,"Lady Quintara":120000},"9":{"Love Bomb":400000000,"Strawberry Bomb":190000000,"Glittery Scorchstone":170000000,"Nova Blade":19000000,"Techo Dagger Of Speed":17000000,"Light Faerie Token":12000000,"Maraquan Aisha Bow":12000000,"Wooden Krawk Mallet":10000000,"Kyrii Swordhammer":10000000,"Chia Mites":10000000,"Staff of Supernova":10000000,"Enchanted Ixi Wand":10000000,"Hand Carved Draik Slingshot":9900000,"Bottled Uni Essence":9850000,"Xweetok Battle Batons":9500000,"Draik Enhancement Brew":9000000,"Poogle Slingshot":8850000,"Mighty Techo Hammer":8800000,"Padded Mynci Gloves":8800000,"Golden Peophin Harp":7800000,"Gelert Blade of Frozen Wrath":7400000,"Bony Grarrl Club":7300000,"Acara Twin Blade":7150000,"Ornate Buzz Stinger":7050000,"Ruby Krawk Stun Ray":7000000,"Grarrl Claw":6800000,"Flotsam Shell Sword":6650000,"Hand Stitched Usul Dagger":6600000,"Gilded Ruki Flail":6200000,"Peophin Bubble":6200000,"Wooden Krawk Staff":6100000,"Pink Clockwork Poogle":5850000,"Ruby Krawk Shield":5600000,"Skeith Destructo Horn":5550000,"Painted Techo Club":5300000,"Furry Lupe Staff":5150000,"Golden Kougra Slingshot":5050000,"Horned Grarrl Slingshot":4900000,"Pteri Throwing Feathers":4500000,"Wooden Krawk Bow":4450000,"Icy Chia Goggles":4450000,"Brass Bruce Horn Of Deafening":4400000,"Taelias Snowball":4350000,"Sharpened Hook":4150000,"Lupe Chia Bomb":4050000,"Highland Chia War Hammer":4000000,"Sack of Garlic Powder":3750000,"Emerald Krawk Sword":3500000,"Poogle Liquid Freeze Potion":3400000,"Maraquan Draik Dagger":3400000,"Pteri Egg Shot":3200000,"Golden Bori Bow":3200000,"Potion of Skeith Scales":3150000,"Under and Overripe Avocado Bombs":3050000,"Barbed Buzz Dagger":2900000,"Enchanted Kougra Pendant":2900000,"Earth Faerie Token":2900000,"Aisha Acorn Darts":2750000,"Golden Lupe Bone Sword":2750000,"Coral Koi Slingshot":2350000,"Sticky Quiggle Flicky Thing":2350000,"Brown Clockwork Grundo":2150000,"Steel Chomby Sword":2050000,"Kacheek Flour":2050000,"Rainbow Sticky Hand":1650000,"Chia Ray Gun":1600000,"Uni Hoof Magnet":1500000,"Wooden Meerca Mallet":1200000,"Acara Gladiator Boots":997801,"Hand Carved Blumaroo Bow":996888,"Cybunny Sword":900000,"Sinsis Grail":830000,"Yellow Clockwork Lupe":630000,"Kougra Wool Bomb":610000,"Sack Of Kougranip":600000,"Jagged Krawk Blade":520000,"Bruce Icicle Spear":450000,"Illusens Gems":420000,"Staff of Ultranova":420000,"Pirate Slingshot":370000,"Kacheek Extinguisher":330000,"Peophin Magical Medallion":270000,"Hardened Ruki Claws":260000,"Kacheek Pebble Lobber":250000,"Rainbow Frost Cannon":250000,"Toothbrush Sword":240000,"Super Attack Bacon":240000,"Illusens Hip Blade":240000,"Oaken Kacheek Sword":210000,"Ticking Eyrie Bomb":210000,"Buzz Hive Bomb":200000,"Blade of Supernova":200000,"Blumaroo Pepper Shaker":170000,"Winged Shoyru Spear":170000,"Tangle Net Gun":160000,"Golden Korbat Charm":160000,"Green Clockwork Hissi":140000,"Padded Cybunny Claw":130000,"Water Faerie Token":130000,"Tonu Golden Horn":120000,"Fish Bone Bruce Sword":110000,"Nimmo Throwing Star":100000},"10":{"Superior Reflection Shield":24000000,"Full Kau Armour":7850000,"Green Shoyru Wing Armour":7450000,"Full Pteri Armour":6950000,"Thyoras Tear":6150000,"Full Aisha Armour":5600000,"Bubbling Flotsam Elixir":5300000,"Palace Guard Helmet":5100000,"Silver Draik Wing Guards":5000000,"Poogle Lightning Boots":4350000,"Spotted Kau Shield":4200000,"Golden Full Kacheek Armour":4150000,"Full Ixi Armour":4150000,"Full Quiggle Armour":4150000,"Ornate Jetsam Shield":4100000,"Bag of Lenny Healing Seeds":4100000,"Full Lutari Armour":3950000,"Yurble Blocking Shield":3750000,"Koi Full Armour":3750000,"Full Chomby Armour":3650000,"Full Shoyru Armour":3550000,"Shimmering Acara Breastplate":3400000,"Shadow Armour":3400000,"Highland Chia Battle Shield":3400000,"Full Zafara Armour":3350000,"Regulation Chainmail":3200000,"Full Hissi Armour":3000000,"Nimmo Elixir of Healing":2950000,"Full Poogle Armour":2950000,"Full Elephante Armour":2950000,"Full Lenny Armour":2850000,"Hand Carved Shoyru Wand":2750000,"Meerca Speed Potion":2650000,"Full Chia Armour":2650000,"Flame Reflectozap":2550000,"Ornate Buzz Chestplate":2500000,"Full Xweetok Armour":2500000,"Full Peophin Armour":2350000,"Blumaroo Health Potion":2350000,"Rainbow Scorchstone":2200000,"Full Kougra Armour":2150000,"Full Cybunny Armour":2150000,"Uni Healing Crown":2100000,"Full Meerca Armour":2100000,"Full Skeith Armour":2100000,"Full Usul Armour":2050000,"Red Yurble Breast Plate":2000000,"Full Uni Armour":2000000,"Full Kyrii Armour":1950000,"Full Buzz Armour":1750000,"Lucky Uni Charm":1750000,"Tuskaninny Raiders Helm":1650000,"Full Tuskaninny Armour":1450000,"Squishy Shoyru Healing Stone":1450000,"Full Grarrl Armour":1350000,"Mystical Nimmo Amulet":1300000,"Brilliant Poogle Buckler":1200000,"Full Nimmo Armour":1200000,"Tower Shield":1000000,"Gilded Kougra Chestplate":999999,"Honeycomb Buzz Shield":930000,"Enchanted Kiko Shield":850000,"Quiggle Leaping Boots":820000,"Ultra Dual Shovel":780000,"Mega U-Bend":780000,"Ornate Jetsam Battle Helmet":750000,"Illusens Silver Shield":750000,"Dazzling Steel Lenny Wings":720000,"Cybunny Shield":660000,"Kougra Wing Collar":540000,"Triple Turbo Dryer":500000,"Scorchio Molten Tail Guard":420000,"Full Korbat Armour":400000,"Full Krawk Armour":310000,"Sparkling Acara Shield":290000,"Padded Bruce Jacket":280000,"Full Scorchio Armour":280000,"Full Mynci Armour":250000,"Emerald Hissi Breastplate":230000,"Shoyru Battle Shield":220000,"Pteri Precision Helmet":210000,"Blue Nimmo Boots":200000,"Ultra Supreme Kiko Walker":190000,"Elixir of the Pirate":180000,"Sledge Shield":160000,"Cloak of Night":120000},"12":{"Jellybean Tree":15000000,"Mini Giant Jelly":14000000,"Lord Kass Gnome":14000000,"Faerie Birdhouse":12000000,"Star Tree":10000000,"Coconut Shy Outdoor Play Set":9600000,"Tuskaninny Plant":7250000,"Strange Bulb":5950000,"Disco Birdhouse":4400000,"Bat Thing Gnome":570000,"All Seeing Tree":560000,"Burnt Dummy":400000,"Halloween Meerca Gnome":240000,"Negg Terrarium":190000,"Gnarled Stump":190000,"Large Purple Poppies":170000,"White Wood Pergola":170000,"Volcanic Pond":170000,"Techo Statue":130000,"Chia Statue":130000,"Jelly River":110000,"Dr Sloth Pond":110000,"Icy Bridge":100000,"Asparagus Garden":100000},"13":{},"14":{"Chocolate Sandwich":320000000,"Chocolate Peanuts With Peas":180000000,"Choco Spray":100000000,"Chocolately Cheese Wedges":100000000,"Chocolate Lipstick":90000000,"Creamy Chocolate Pie":87000000,"Crunchy Chocolate Grarrl":60000000,"Chococherry Blumaroo Ears":48000000,"Orange Lightmite Lollypop":9850000,"Chocolate Gum":7350000,"Chocolate Orange Easter Negg":5000000,"Neotruffle":4450000,"Snowflake Chocolate Advent Calendar":4200000,"Candy Cane Chocolate Advent Calendar":3900000,"Double Chocolate Jelly Beans":3650000,"Mint Chocolate Easter Negg":3550000,"Chocolate Advent Calendar":3150000,"Pretty Pink Easter Negg":3050000,"Chocolate Dr Sloth":2650000,"Luxury Chocolate Easter Negg":2550000,"Creamy Choccywhip":2050000,"Spotted Easter Negg":1200000,"Strawberries and Cream Easter Negg":999569,"Sniddberry Meerca Gobstopper":870000,"Blumaroo Popping Candy Macaron":830000,"Spooky Flying Doughnut":820000,"Caramel and Custard Drops":760000,"Grape Gummy Slorg":730000,"Rainbow Candy Floss":690000,"Deluxe Strawberry Toffee Chokato":680000,"Fishy Delight Grarrl Gobstopper":680000,"Hazelnut Whirl":670000,"ErgyFruit Jelly Beans":640000,"Chocolate Moltenore":570000,"Chocolate Crown of the Faeries":420000,"Chocolate Crown of Sinsi":400000,"Yummy Drops":390000,"Chocolate Peach":390000,"Gnorbu Gum":190000,"Apple Moquot Lollypop":170000,"Chocolate Jeran":150000,"Super Spicy Jelly Beans":150000,"Neverending Jar of Jellybeans":140000,"Lime Grarrl Pop":130000,"Orange Scoach Lolly":130000,"Chocolate Blossom":100000},"15":{"Meepit Muffins":20000000,"Chia Cake":10000000,"Fyora Cookies":9950000,"Grapefruit Cake":9800000,"Gooseberry Crepe":9150000,"Chocolate Chip Quiggle Cookie":8450000,"Blue PaintBrush Cookie":7550000,"Dargil Meat Mince Pie":7550000,"Chocolate Cream Biscuit":6900000,"Frosted Babaa Cookies":6800000,"Cinnamon Eyrie Cookie":6800000,"Pterimisu":6500000,"Chocolate Chip Eyrie Cookie":5850000,"Haiku Dessert":5300000,"Stack It High Cake":4500000,"Sugar Nerkmid Biscuit":2850000,"Double Cream Vanilla Sponge":2850000,"Hostile Quiche":2650000,"Ultimate Grilled Cheese Sandwich":2450000,"Kacheek Baby Cabbage Sandwiches":2350000,"Blueberry Deluxe Cake":2200000,"Blackberry Eyrie Cookie":1650000,"Chocolate Chip Nerkmid Biscuit":1200000,"Chokato Deluxe Aisha Cake":1200000,"Minty Eyrie Cookie":800000,"Lime Chomby Cake":700000,"Chocolate Stuffed Pastry":330000,"Bluepepper Muffin":300000,"Buttered Juppie Waffle":200000,"Strawberry Shimmer Cake":140000,"Babaa Cake":130000,"Rainbow Cybunny Cake":120000,"Angry Varwolf Cookie":110000,"Carrot Shoyru Muffin":110000,"Grunion Fruit Krawk Cake":110000,"Chocolate Chip JubJub Gnome Cookie":100000,"Vionanna Mince Pie":100000},"16":{"Souper Bowl":11000000,"Cauliflower Shake":8900000,"French Onion Soup":8650000,"Tomato Kebab":7650000,"Asparagus Balls":6050000,"Artichoke and Onion Surprise":999999,"Cheesy Asparagus":820000,"Broccoli with Sprinkles":640000,"Cauliflower Lolly":550000,"Artichoke Cupcake":490000,"Fresh Sushi Roll":450000,"Pickled Cauliflower":380000,"Cauliflower Soup":220000,"Cone-Shaped Cherry":190000,"Radish and Cheese":110000,"Baked Apple with Snowberries":100000},"17":{"Ornate Ivory Love Spoon":5000000,"Raining Confetti Hearts":2550000,"Tree of Love":2250000,"Pretty Baby Stroller":1700000,"Freshly Frosted Cake Counter Foreground":1450000,"Extreme Potato Counting Shower":730000,"Lawyerbot Self-Portrait":690000,"Green Gem Negg":420000},"18":{"Large Sand Smoothie":2400000,"Mega Salmon Sherbert Smoothie":2000000,"Mega Honeyplume Smoothie":840000,"Mega Lemon Blitz Smoothie":140000},"20":{"Pink Chokato":20000000,"Yellow Doughnutfruit":20000000,"Rainbow Doughnutfruit":20000000,"Green Doughnutfruit":18000000,"Sponge Doughnutfruit":18000000,"Purple Doughnutfruit":18000000,"Golden Doughnutfruit":18000000,"Fiery Doughnutfruit":17000000,"Icy Doughnutfruit":15000000,"Blue Doughnutfruit":12000000,"Plantcake":12000000,"TeaLeef":4400000,"Fresh Lobster Tail":4250000,"Marafalop":3750000,"Vein Cabbage":3650000,"Doughnutfruit":3650000,"Chokato":3650000,"Strange Pinanna":3350000,"Fish Doughnutfruit":2950000,"Cornupepper":2450000,"Ugly Pinanna":2450000,"Thornberry":2350000,"Krakuberries":2200000,"Gelupepper":1750000,"Lavaberry":1750000,"Silver Doughnutfruit":1550000,"Zibblifruit":999999,"Fruity Swirl Souffle":999417,"Checkered Doughnutfruit":840000,"Acnefruit":810000,"Goparokko Fish Surprise":740000,"Zeenana":620000,"Tigerfruit":610000,"Roe Sushi":550000,"ErgyFruit":420000,"Green Chyrsaberry":400000,"Strong Berry":400000,"Phear":290000,"Tigersquash":190000,"Pink Peachpa Cooler":180000,"Tigermelon":180000,"Greengage Breeze":170000,"Bludberry":170000,"Strawberry Salmon":140000,"Songray":130000,"Purple Juppie Slurpbowl":100000},"21":{"Fancy Bottle of Sand":9450000,"Volcano Crystal":9200000},"22":{"Vegetarian Sloth Wrap":20000000,"Tigersquash Spectacular":3450000,"Sloth Wrap":360000,"Obliteratoes":200000},"23":{"Virtublaster 5000":2700000,"Bzzapper":110000},"24":{"Force Shield":15000000,"Full Grundo Armour":4000000},"25":{"Bogie":7300000,"Babith":1450000,"Kadoatie":1400000,"Cadro":970000},"26":{"Zoomik":5850000,"Skootle Bug":880000,"Beepallite":270000},"27":{},"30":{"Hungry Fungus":15000000,"Parts on a Pizza":11000000,"Jelly Finger":9500000,"Spoooky Muffin":7350000,"Snorkle Pudding":6150000,"Wing of Korbat":950000,"Vampire Pea":440000,"Ednas Spooky Brew":430000,"Crunchy Snotball":430000,"Menacing Brew":340000,"Meerca Pie":340000,"Mound of Rotten Fruit":310000,"Disturbing Gelatin":290000,"Elephante Trunk Stew":250000,"Steamed Ectoplasm":240000,"Jalapeno Cheese Nightmare":230000,"Worm Stew":210000,"Bloody Ghost Toast":190000,"Strawberry Ice Cream Apple Lantern":170000,"Roast Worm with Cranberries":160000,"Sponge Apple":100000},"31":{"Pofew":5700000,"Schnelly":1250000},"34":{"Murky Green":2850000,"Coffee Service":580000,"Borovan Service":560000,"Dark Tea":280000},"35":{"Cheeseburger Slushie":7400000,"Pan Galactic Gargle Slushie":6300000,"Creme Brulee Slushie":1850000,"Transparaberry Slushie":999999,"Tiger Orange Slushie":790000,"Peanut and Chocolate Slushie":350000,"Secret Sloth Slushie":330000,"Cherry Lemonade Slushie":220000,"Berry Blend Slushie":130000},"36":{"Frozen Scroll":1700000,"Claw of the Ancient Bori":1150000,"Stone Snowflake":700000,"Freezing Potion":550000,"Icy Snowflake":300000,"Unlockable Ice Treasure":290000},"37":{"Magical Mallow Chia Pop":58000000,"Magical Asparagus Chia Pop":11000000,"Magical Tomato Chia Pop":10000000,"Magical Pea Chia Pop":9850000,"Magical Pepper Chia Pop":9150000,"Magical Coconut Chia Pop":8950000,"Magical Strawberry Chia Pop":8600000,"Magical Plum Chia Pop":8000000,"Magical Chokato Chia Pop":7800000,"Angelic Ice Lolly":7500000,"Magical Lemon Chia Pop":7450000,"Magical Blueberry Chia Pop":7350000,"Magical Peach Chia Pop":6650000,"Magical Pineapple Chia Pop":6250000,"Magical Apple Chia Pop":6050000,"Magical Agueena Chia Pop":5750000,"Magical Gooseberry Chia Pop":5650000,"Magical Pear Chia Pop":5550000,"Magical Aubergine Chia Pop":5200000,"Magical Onion Chia Pop":5000000,"Magical Ummagine Chia Pop":4750000,"Crystal Turkey":999780,"Magical Thornberry Chia Pop":640000,"Frozen Negg":460000,"Magical Avocado Chia Pop":460000,"Magical Banana Chia Pop":390000,"Magical Potato Chia Pop":230000,"Ice Ice Cream":190000,"Magical Grape Chia Pop":140000},"38":{"Fountain of Youth":2100000,"Building Igloos with Taelia":200000},"39":{"Faerie Dreamwich":5950000,"Bacon Belly Buster":1250000,"Ultra Nova Pop":999998,"Earth Faerie Mushroom":999988,"Deluxe Fyora Day Cake":800000,"Fyora Apple":380000,"Peachpa Stuffed Potato":150000,"Fire Faerie Red Pepper":150000,"Soup Faerie Mushroom":100000},"40":{"Zumagorn":960000,"Gwortz":600000,"Faellie":190000},"41":{"Gold Velvet Chair":18000000,"Jolly Pumpkin":13000000,"Mootix Table":12000000,"Tiger Sofa":11000000,"I Love Lord Kass Bed":9750000,"I Love Lord Kass Bean Bag":9650000,"Glowing Bath Tub":9100000,"Long Glowing Drawer":8900000,"Chokato Bean Bag":8200000,"Glaring Pumpkin":7900000,"Tall Pumpkin":7400000,"Robo Blumaroo":7050000,"Wiggly Glowing Drawer":7050000,"Glowing Table":6850000,"Cheese Mat":6550000,"Mutant Loveseat":6250000,"Disco Print Bed":6150000,"Hilarious Pumpkin":5750000,"The Three Poster":5750000,"Rainbow Bath Tub":5750000,"Cheese Chair":5000000,"Glowing Sofa":4400000,"Glowing Rug":3650000,"Rainbow Disco Ball":920000,"Robo Poogle":710000,"Plushie Yurble Bed":420000,"Pirates Chest":390000,"I Love Lord Kass Pillow":350000,"Jeran Bed":330000,"Gruslen Bean Bag":240000,"I Love Lord Kass Lamp":150000,"Autumn Leaf Welcome Mat":150000,"Dark Nova Sofa":140000,"Chocolate Play Pen":130000,"Robo JubJub":130000,"Crystal Leaf Lamp":110000,"Kau Toast Sculpture":100000,"Lord Kass Emblem Flag":100000,"Sticks N Stones Speaker":100000},"42":{"Blood Mole Plant":2000000,"Terry Berry":110000},"43":{"Stone Bedside Table":640000},"44":{"Gathow":820000,"Woolypapith":390000,"Krawk":210000},"45":{},"46":{"Mummified Hot Dog":110000000,"Big Beefy Hot Dog":8650000,"Mini Baby Hot Dogs":7700000,"Natural Hot Dog":7150000,"Burning Hot Dog":5650000,"Diamond Hot Dog":3350000,"Salt Water Hot Dog":750000,"Dessert Hot Dog":240000,"Strawberry Flavoured Hot Dog":240000,"Punk Rocker Hot Dog":240000,"Well-Aged Hot Dog":150000,"Linked Hot Dogs":140000,"Mecha Hot Dog":100000},"47":{"Happy Birthday Pizza":5800000,"Pirate Pizza":270000,"Peachy Pizza":190000,"Whole Steak and Egg Pizza":120000,"Whole Cheeseburger Pizza":110000},"48":{"Bat Thing Usuki":165000000,"Queen Fyora Usuki Doll":95000000,"Mayor Thumburt Usuki":20000000,"Little Brother Usuki":13000000,"Pirate Captain Usuki":12000000,"Werewolf Usuki":12000000,"Hawaiian Usuki Reject":12000000,"Super Hero Usuki":11000000,"Usuki Dream Jetski":9800000,"Meridell Usuki King":9750000,"Teenage Usuki Reject":9600000,"Gondolier Usuki":9150000,"Year 9 Usuki":8800000,"Lost Desert Usuki":8800000,"Valentines Boy Usuki":8050000,"Usuki Defender":8000000,"Lord Kass Usuki":7950000,"Ornate Usuki":7400000,"Usukicon Year 9 Usuki":6800000,"Valentines Girl Usuki":5900000,"Tyrannian Usuki Reject":5800000,"Cylara Usuki":5550000,"Prom Date Usuki Reject":4900000,"Summer Fun Usuki":3900000,"Usuki Reaper":2800000,"Usuki Artist Set":1750000,"Year 8 Usuki":1100000,"Water Faerie Usuki Doll":1050000,"Negg Faerie Usuki Set":1050000,"Meridell Usuki Queen":1050000,"Strange Metal Usuki":999999,"Fire Faerie Usuki Doll":999996,"Rose Usuki":970000,"Usuki Zombie":840000,"Traditional Welsh Usuki":800000,"Alien Usuki":750000,"Mime Usuki":690000,"King Skarl Usuki":630000,"Kauvara Usuki":570000,"Space Prom Date Usuki Reject":490000,"Zafara Double Agent Usuki":480000,"Tiki Tack Man Usuki":430000,"Outback Usuki":420000,"Lisha Usuki Doll":390000,"Bree Usuki Doll":300000,"Rock n Roll Usuki":220000,"Jockey Usuki Set":200000,"Usuki Poetry Set":200000,"Grundo Independence Day Usuki":200000,"Usuki Pirate Wench":180000,"Pretty Pink Usuki":180000,"Soup Faerie Usuki":170000,"Vira Usuki Doll":170000,"Usuki Dream Camper":170000,"Official Usuki Battle Set":170000,"Shiver Me Timbers Usuki":160000,"Dark Faerie Usuki Doll":160000,"Tribal Desert Usuki":150000,"Astrophysics Professor Usuki":140000,"Usuki Frenzy Usuki":140000,"Deluxe Sledding Usuki":140000,"Jhuidah Usuki Doll":130000,"Sloth Usuki":120000,"Slalom Usuki Set":120000,"Goodie Two Shoes Usuki":110000,"Gardener Girl Usuki":110000,"Trick-Or-Treating Usuki":100000},"49":{"Pyramid Purpple":1800000,"Peppered Kersla Bug":140000,"Dried Blusops":130000},"50":{"Scamander":1500000,"Geb":1100000},"51":{"You Will Get Verrucas!":18000000,"Book of Scarabs":15000000,"The Legendary Sutek Scroll":15000000,"Golden Scamander Scroll":14000000,"Curse of Foul Odour":9950000,"A Plague Upon You!":6800000,"Scroll of the Ancients":5400000,"Forgotten Tome":4550000,"Malediction for Beginners":2900000,"Professional Curses":2200000,"Dusty Harmless Looking Scroll":1600000,"Mummified Scroll":950000,"The Scroll of Scrolls":860000,"Vile Scroll of Possession":720000,"Curse of Ultimate Malison":680000,"Vile Curse of Pestilence":460000,"Scroll of Hunger":280000,"Intermediate Curses":140000},"53":{"Scorchio Calculator":2100000,"Ilere Crayons":999756,"Light Faerie Backpack":590000,"Stealthy Pencil Case":530000,"Charcoal":410000,"MSPP Backpack":400000,"Grundo Backpack":360000,"Asparagus Pen":300000,"Jeran Backpack":280000,"Striped Meerca Lunch Box":190000,"Dr Sloth Backpack":130000,"Vira Ruler":130000,"Halloween Grundo Notebook":120000},"54":{"Scarab Medallion":7350000,"Coltzans Battle Sceptre":3400000,"Super Sand Grain":140000,"Sakhmetian Dagger":130000},"55":{},"56":{"Gold Draik Egg":60000000,"Red Draik Egg":7950000,"Zombie Draik Egg":5150000,"Yellow Draik Egg":2650000,"Blue Draik Egg":1300000,"Green Draik Egg":740000,"Meridellian Style Mashed Potatoes":720000,"Ice Draik Egg":520000,"Bread Wreath":480000,"Roast Pork":130000,"Pootato":110000},"57":{"Turmac":6600000,"Vullard":2500000,"Seece":200000},"58":{"Swordsmaster Talek Stamp":150000000,"ARGH!!!! DONNA STAMP":135000000,"Gold Mote Stamp":125000000,"Baseball Kacheek Stamp":110000000,"Wise Gnorbu Stamp":98000000,"Holographic Usukicon Stamp":65000000,"Golden Dubloon Stamp":65000000,"Foil Food Shop Stamp":60000000,"Kiss the Mortog Stamp":55000000,"Flaming Meerca Stamp":51000000,"Battle Slices Stamp":51000000,"Mutant Whalein Stamp":47000000,"Skeith Defender Stamp":46000000,"Haunted Mansion Stamp":45000000,"Shumi Telescope Stamp":45000000,"NeoQuest Logo Stamp":45000000,"Terask Stamp":44000000,"Darigan Moehog Stamp":41000000,"Morris Stamp":39000000,"Xantan Stamp":38000000,"Mipsy Stamp":36000000,"Isca Stamp":35000000,"Holographic Virtupets Stamp":35000000,"Snowbunny Stamp":33000000,"Grave Danger Petpet Stamp":31000000,"Nightsteed Stamp":30000000,"Battle Uni Stamp":29000000,"Geraptiku Stamp":26000000,"Talinia Stamp":24000000,"Jacques Stamp":24000000,"Sasha Stamp":24000000,"Igneot Stamp":24000000,"Morguss Stamp":23000000,"Shiny Monoceraptor Stamp":22000000,"Upside Down Island Acara Stamp":21000000,"Horace Stamp":20000000,"Shadow Gulch Stamp":20000000,"Guardian Of Spectral Magic Stamp":20000000,"Grundo Warehouse Stamp":20000000,"Grimtooth Stamp":20000000,"Double Printed Evil Fuzzle Stamp":20000000,"Blugthak Stamp":19000000,"Magnus Stamp":18000000,"Gruntharxx Stamp":17000000,"Oscar Stamp":16000000,"Drackonack Stamp":16000000,"Ramtor Stamp":16000000,"Sword Of Apocalypse Stamp":16000000,"Sloth Evil Coconut":15000000,"NeoQuest II Esophagor Stamp":15000000,"Meerca Spy Stamp":15000000,"Red Shoyru Stamp":14000000,"Jahbal Stamp":14000000,"Hilda the Hedgewitch Stamp":13000000,"Von Roos Castle Stamp":13000000,"Gors The Mighty Stamp":13000000,"Holographic Magax Stamp":13000000,"Queen Fyora Stamp":13000000,"Negg Faerie Stamp":12000000,"Anubits Stamp":12000000,"Count Von Roo Plushie Stamp":12000000,"Ready to Roll Stamp":12000000,"Misaligned Printer Stamp":11000000,"Nibbled Cooking Pot Stamp":10000000,"Dark Battle Duck Stamp":9450000,"Zafara Double Agent Stamp":9050000,"Tomos Stamp":7950000,"Lord Kass Stamp":7850000,"Holographic Coltzans Shrine Stamp":7300000,"Biyako Stamp":7200000,"Usuki Doll Stamp":6800000,"Count Von Roo Stamp":6800000,"Siliclast Stamp":6300000,"Shenkuu Helmet Stamp":6100000,"Snowager Stamp":5950000,"Stone Stamp":5900000,"Foil Slorg Stamp":5900000,"One Hundred Million Neopoint Stamp":5300000,"Ski Lodge Stamp":5200000,"Pacha Stamp":5050000,"Captain Bloodhook Stamp":4550000,"Forgotten Shore Stamp":4550000,"Monty McTaggart Stamp":4500000,"Igneots Cavern Stamp":4400000,"Jade Scorchstone Stamp":4300000,"Fyoras Castle Stamp":4300000,"Second Hand Stamp":4250000,"The Three Stamp":4250000,"Orion Stamp":4000000,"Scuzzy Stamp":4000000,"The Great Battle Stamp":4000000,"Moloch Stamp":3950000,"Need a Better Printer Stamp":3900000,"Petpetorium Stamp":3800000,"Commemorative Defenders Stamp #4":3800000,"Misprint Meuka Stamp":3600000,"King Altador Stamp":3100000,"Bledynn Stamp":3050000,"Dark Ilere Stamp":3000000,"Capn Threelegs Stamp":2850000,"Spyder Stamp":2650000,"Hadrak Stamp":2600000,"Lampwyck Stamp":2550000,"Mr. Krawley Stamp":2450000,"Singed Tyrannian Volcano Stamp":2300000,"Jhudoras Cloud Stamp":2300000,"Finneus Stamp":2200000,"Dark Qasala Stamp":2050000,"Lucky Coin Stamp":1900000,"Moltara Town Hall Stamp":1800000,"Rainbow Pteri Feather Stamp":1750000,"Jhudora Stamp":1700000,"Darigan Citadel Stamp":1600000,"Altador Travel Stamp":1600000,"Faerie Slorg Stamp":1550000,"Darkest Faerie Stamp":1500000,"Lupe Shopkeeper Stamp":1400000,"Rainbow Sticky Hand Stamp":1400000,"Desert Paintbrush Stamp":1350000,"Hoban Stamp":1300000,"Green Knight Stamp":1200000,"Lab Ray Stamp":1200000,"Captain Scarblade Stamp":1200000,"Garin To The Rescue Stamp":1150000,"Caylis Stamp":1100000,"Fyora Faerie Doll Stamp":1100000,"King Jazan Stamp":1050000,"Lost Desert Scroll Stamp":1000000,"Tangor Stamp":1000000,"The Academy Stamp":999999,"Zombified Heroes Stamp":999998,"Northern Watch Tower Stamp":996502,"Scordrax Stamp":996411,"Christmas Scene Stamp":996268,"Lost City of Phorofor Stamp":960000,"Court Dancer Stamp":950000,"Gargarox Isafuhlarg Stamp":940000,"Altador Magic Stamp":940000,"Meridell Heroes Stamp":920000,"Thoughtful Linae Stamp":910000,"Razul Stamp":910000,"The Sleeper Constellation Stamp":850000,"Florin Stamp":770000,"Wheel of Monotony Stamp":500000,"Shenkuu Stamp":470000,"Virtupets Space Station Stamp":460000,"Tyrannian Victory Day Stamp":450000,"Sentient Headstones Stamp":420000,"Meridell Castle Stamp":420000,"Inverted Space Faerie Stamp":400000,"Zyrolon Stamp":380000,"King Kelpbeard Stamp":380000,"Orrin Stamp":370000,"Shenkuu Mask Stamp":360000,"Cliffhanger Stamp":350000,"Lisha vs Zombie Lisha Stamp":350000,"Glowing Brain Tree Stamp":340000,"Evil Fuzzles Stamp":340000,"The Krawken Stamp":340000,"Zurroball Stamp":330000,"Garin Stamp":320000,"Scurvy Island Stamp":300000,"Sunblade Stamp":300000,"Kreai Stamp":290000,"Hubrid Nox Commemorative Stamp":250000,"Aethia Stamp":250000,"Alien Aisha Myriad Stamp":240000,"Super Bright Rainbow Pool Stamp":240000,"Space Faerie Stamp":230000,"Cancelled Stamp":220000,"Nabile Stamp":220000,"Astronomy Club Stamp":210000,"Kou-Jong Tile Stamp":200000,"Chasm Beast Stamp":190000,"Peaceful Coexistence Stamp":190000,"Usukiland Stamp":180000,"Cybunny on a Cycle Stamp":180000,"Wand Of The Dark Faerie Stamp":170000,"Edna the Zafara Stamp":170000,"Cogs Togs Stamp":160000,"The Revenge Stamp":160000,"Destruction of Faerieland Stamp":160000,"Lava Monster Stamp":160000,"Scorchio Mummy Stamp":150000,"Chocolate Factory Stamp":150000,"Kentari Spyglass Stamp":140000,"Hot Dog Hero Stamp":140000,"Celestial Talisman Stamp":130000,"Usul-in-waiting Stamp":130000,"Castle Defender Stamp":130000,"Eleus Stamp":130000,"Mokti and Rikti Stamp":120000,"Holographic Sakhmet City Stamp":120000,"Dorak Stamp":120000,"Tasu Stamp":110000,"The Drenched Stamp":110000,"Torakor Stamp":100000},"59":{"Glowing Cauldron":6400000,"Dusty Magic Broom":730000},"60":{"Shadow Lantern":7000000},"61":{"Snowickle":140000,"Candychan":100000},"62":{"Moulded Jelly Dessert":1600000},"63":{},"66":{"Unguberry Kiko Candy Floss":2950000},"67":{},"68":{"Nerkmid Coin":300000000,"Giant Ghostkerchief Coin":48000000,"Dazzling Verdant Collectable Scarab":30000000,"Brass Usuki Coin":24000000,"Super Nova Coin":20000000,"Bzzt Blaster Coin":20000000,"Neopet V2 Coin":20000000,"Greater Yellow Collectable Scarab":17000000,"Larnikin Coin":17000000,"Silver Buzzer Coin":16000000,"Hasee Coin":15000000,"Crystal Kauvara Coin":14000000,"Defenders Of Neopia Coin":12000000,"Mallow Coin":9600000,"Silver Babaa Coin":9000000,"Red Striped Collectable Scarab":7900000,"Black and Yellow Collectable Scarab":7850000,"Money Tree Coin":6900000,"Snow PaintBrush Coin":6250000,"Spotted Blue Collectable Scarab":4900000,"Eliv Thade Coin":4750000,"Sparkleback Collectable Scarab":4500000,"Gorix and Cylara Coin":3100000,"Rainbow Pool Coin":3050000,"PaintBrush Coin":3000000,"Zoomik Coin":2000000,"Golden Scarab Coin":1850000,"Dr Sloth Coin":1850000,"Large Black Collectable Scarab":1850000,"Emerald Eyrie Coin":1800000,"Vacumatic 9000 Coin":1650000,"Book Coin":1450000,"Scowling Sloth Coin":1300000,"Turtum Coin":999998,"Smiling Space Faerie Coin":998493,"Goo Blaster Coin":991687,"Chocolate Factory Coin":925000,"N-4 Information Retrieval Bot Coin":850000,"Spotted Red Collectable Scarab":400000,"GX-4 Oscillabot Coin":340000,"Rainbow Collectable Scarab":310000,"Astral Blade Coin":290000,"Battledome Coin":220000,"Roast Gargapple Coin":180000},"69":{"Luxury Castle Petpet Bed":3800000,"Wobbly Turtum Toy":2850000},"70":{"How Purples Got Their Spots":285000000,"Interplanetary Communications":245000000,"Beam Me Aboard":225000000,"Kreludan Engineering":195000000,"Guide to the Neocola Machine":15000000,"Advanced Kreludan Physics":15000000,"Kreludor Versus Neopia":13000000,"It Came From the Mine":5500000,"The Green Grundo Invasion":4800000,"Kreludan Cookie Cookbook":2950000,"Kreludor Mining Corridor Maps":2900000,"Secrets of the Universe":1950000,"Eyrie Mythology":1800000,"Scenic Kreludan Views":1450000,"Adventures of the Kyrii Explorer":1100000,"Freds Pirate Tales":992559,"Diary of a Baby Space Fungus":830000,"Kreludan Architecture":590000,"Space Station Schematics":310000,"Slorganic Chemistry":240000,"The Space Ace":150000},"71":{},"72":{"Kreludan Candy Floss":5400000,"Kreludan Grunpop":3700000},"73":{"Elixir of Levelling":1100000,"Energising Elixir":999998,"Meridellian Potion of Defence":991741,"Kaylas Super Special Potion":940000,"Potion of Doldrums":860000,"Illusens Forest Essence":790000,"Mano Root Elixir":450000,"Potato Potion":440000,"Essence of Mortog":310000,"Bomberry Elixir":170000,"Cooling Balm of the Warrior":140000,"Strength Serum":130000,"Potion of Brightvale Castle":110000,"Bubbling Fungus":100000},"74":{"Darigan Globe":320000},"75":{"Water Faerie Bed":430000,"Dark Faerie Sofa":130000},"76":{"Blumaroo Oven":530000},"77":{"Waking the Draik":17000000,"Alchemy Lessons":900000,"Lengthy Quotations":690000,"Adventures of Young Hagan":270000,"Modern Spells":100000},"78":{},"79":{"Stained Glass Sophie Window":930000},"80":{"White Linen Tunic":5500000,"Heavy Robe of Thievery":950000,"Enchanted Robe":450000},"81":{"Carved Watermelon":1350000,"Prickly Merato":420000,"Edible Magenorb Bouquet":140000},"82":{},"83":{"Warriors Might":2750000,"Greater Earthen Potion":970000,"Scroll Potion":920000,"Greater Fire Potion":770000,"Leaded Elemental Vial":530000,"Greater Elemental Potion":490000,"Cooling Ointment":300000,"Lightning in a Bottle":120000},"84":{"Bronze Gong":970000,"Blueberry Jelly Bass":620000,"Bone Trombone":220000,"Orange Jelly Guitar":210000,"Golden Violin":100000},"85":{},"86":{"Floral Maractite Coin":71000000,"Golden Shell":30000000,"Nimmo Maractite Coin":20000000,"Acara Maractite Coin":20000000,"Streaked Maractite Coin":20000000,"Choker of the Deep":18000000,"Anklet of the Deep":17000000,"Ancient Seaweed Maractite Coin":15000000,"Quiggle Maractite Coin":13000000,"Dazzling Blue Mussel Shell":9000000,"Siren Harp of the Deep":5250000,"Royal Orange Cowry Shell":5050000,"Exquisite Peophin Ring of the Deep":4100000,"Purple Spiral Shell":3200000,"Isca Maractite Coin":2850000,"Blue and Gold Tube Shell":2750000,"Large Maractite Coin":1250000,"Diadem of the Deep":1050000,"Golden Koi of the Deep":980000,"Maraquan Skeith Maractite Coin":300000},"87":{"Swirling Seaweed Orb":3900000,"Glowing Maractite Wand":2250000,"Maractite Acara Shield":1900000,"Reinforced Maractite Shield":1750000,"Maractite Dimensional Trap":370000},"88":{},"89":{"Gypmu":140000},"90":{},"91":{"Qasalan Throwing Axe":4250000,"Golden Qasalan Chestpiece":2800000},"92":{"Strangely Etched Tablet":7150000,"Crystal Tablet":999999,"The Pyramid Tablets":850000,"Tablet of The Mummy":120000},"93":{"Bow of the Air Faerie":4600000,"Dark Faerie Bow":140000},"94":{"Altadorian Swordbreaker":100000},"95":{},"96":{},"97":{"Minitheus":890000},"98":{"Mastermind Plushie":75000000,"Rainbow Tuskaninny Plushie":45000000,"Old Beaten Chokato Chia Plushie":33000000,"King Terask Plushie":32000000,"Magical Blue Nimmo Plushie":20000000,"Magical Rainbow Aisha Plushie":20000000,"Magical Red Skeith Plushie":20000000,"Magical Red Krawk Plushie":20000000,"Magical Red Blumaroo Plushie":20000000,"Guardian of Fire Magic Plushie":20000000,"Magical Blue Flotsam Plushie":20000000,"Magical Purple Blumaroo Plushie":19000000,"Magical Green Gelert Plushie":19000000,"Magical Silver Kougra Plushie":18000000,"Magical Yellow Kiko Plushie":18000000,"Magical Red Kiko Plushie":18000000,"Halloween Draik Plushie":17000000,"Magical Green Koi Plushie":17000000,"Skunk Mynci Plushie":17000000,"Magical Yellow Skeith Plushie":17000000,"Magical Green Krawk Plushie":17000000,"Sidney Plushie":17000000,"Lightning Lizard Plushie":16000000,"Magical Red Wocky Plushie":16000000,"Magical Blue Krawk Plushie":16000000,"Magical Blue Shoyru Plushie":16000000,"Magical Spotted Blumaroo Plushie":16000000,"Monoceraptor Plushie":16000000,"Boraxis Plushie":15000000,"Shock Lizard Plushie":15000000,"Frozen Lizard Plushie":15000000,"Magical Yellow Wocky Plushie":15000000,"Magical Blue Kiko Plushie":15000000,"Magical Green Wocky Plushie":15000000,"Magical Yellow Lenny Plushie":15000000,"Magical Red Lenny Plushie":15000000,"Magical Green Kiko Plushie":15000000,"Darigan Lupe Plushie":14000000,"Cloud Lenny Plushie":14000000,"Magical Green Elephante Toy":14000000,"Magical Red Grarrl Plushie":14000000,"Mutant Krawk Plushie":14000000,"Magical Yellow Yurble Plushie":14000000,"Magical Desert Krawk Plushie":13000000,"Magical Blue Tonu Plushie":13000000,"Magical Blue Kacheek Plushie":13000000,"Wrawk the Merciless Plushie":13000000,"Roberta Plushie":12000000,"Disco Bruce Plushie":12000000,"Magical Red Koi Plushie":12000000,"Magical Red Yurble Plushie":12000000,"Maraquan Ixi Plushie":11000000,"Mokti Plushie":11000000,"Magical Red Gelert Plushie":11000000,"Magical Green Flotsam Plushie":11000000,"Spotted Koi Plushie":10000000,"Magical Red Nimmo Plushie":10000000,"Magical Red Usul Plushie":9350000,"Lightning Giant Plushie":8750000,"Electro Lizard Plushie":8300000,"Desert Aisha Plushie":7750000,"Magical Yellow Cybunny Plushie":7400000,"Magical Green Kyrii Plushie":7100000,"Magical Green Tonu Plushie":6850000,"Magical MSP Poogle Plushie":6400000,"Magical Electric Lupe Plushie":6250000,"Darigan Eyrie Plushie":6000000,"Mutant Korbat Plushie":5400000,"Magical Red Flotsam Plushie":5300000,"Darigan Acara Plushie":5250000,"Mutant Kiko Plushie":5000000,"Starry Draik Plushie":5000000,"Christmas Bruce Plushie":4950000,"Faerie Draik Plushie":4700000,"Bat Thing Plushie":4700000,"Faerie Korbat Plushie":4700000,"Faerie Kacheek Plushie":4650000,"King Skarl Plushie":4600000,"Magical Blue Cybunny Plushie":4350000,"Tormund Plushie":4350000,"Magical Red Kyrii Plushie":4150000,"Magical Yellow Kyrii Plushie":4100000,"NeoQuest Hero Plushie":3900000,"Halloween JubJub Plushie":3900000,"Pomanna Plushie":3800000,"Giant Jeran Plushie":3700000,"Magical Fire Lupe Plushie":3600000,"Archmagus of Roo Plushie":3350000,"Rainbow Grundo Plushie":3300000,"Magical Rainbow Cybunny Plushie":3250000,"Desert Lupe Plushie":3200000,"Lazulite Dervish Plushie":2600000,"Jahbal Plushie":2550000,"Magical Cloud Lupe Plushie":2450000,"Magical Cloud Gelert Plushie":2450000,"Glaxi Plushie":2400000,"Reject Gelert Plushie":2400000,"Cloud Kacheek Plushie":2350000,"Magical Starry Kau Plushie":2250000,"Angel Kiko Plushie":2150000,"Magical Red Buzz Plushie":2050000,"Keeper Of Time Plushie":2000000,"Magical Yellow Flotsam Plushie":1900000,"Melatite Dervish Plushie":1750000,"Magical Red Tonu Plushie":1750000,"Mist Kougra Plushie":1750000,"Magical Purple Zafara Plushie":1700000,"Glyme Plushie":1600000,"Rock Golem Neoquest Plushie":1600000,"Desert Elephante Plushie":1500000,"Halloween Chia Plushie":1500000,"Spotted Gelert Plushie":1500000,"Neoquest Gatekeeper Plushie":1450000,"Masila Plushie":1350000,"Magical Yellow Tonu Plushie":1350000,"Golden Bori Plushie":1300000,"Agate Dervish Plushie":1300000,"Reject Blue Acara Plushie":1300000,"Chaos Giant Plushie":1300000,"Magical Blue Yurble Plushie":1250000,"Black Wadjet Plushie":1200000,"Gloom Kougra Plushie":1050000,"Rikti Plushie":1000000,"Greedy Kadoatie Plushie":999999,"Baby Techo Plushie":999999,"Halloween Mynci Plushie":999999,"Handcrafted Tomos Plushie":999999,"Jake Plushie":999998,"Pink Blumaroo Plushie":999998,"Plushie Wocky Plushie":999925,"MSPP Plushie":999750,"Desert Wocky Plushie":997583,"Maraquan Techo Plushie":990000,"Evil Twin Blue Aisha Plushie":980000,"Knitted Chia Plushie":980000,"Reject Green Acara Plushie":980000,"Leirobas Plushie":980000,"Baby Uni Plushie":970000,"Magical Yellow Nimmo Plushie":970000,"Green Draik Plushie":950000,"Hannah Plushie":950000,"The Masked Intruder Plushie":940000,"King Roo Plushie":910000,"Mipsy Plushie":900000,"Father Time Plushie":890000,"Shumi Plushie":890000,"Baby Peophin Plushie":880000,"Halloween Nimmo Plushie":830000,"Kacheek Shepherd Plushie":780000,"Striped Lenny Plushie":770000,"Illusen Plushie":750000,"Reject Yellow Acara Plushie":750000,"Steel Golem Neoquest Plushie":750000,"Desert Krawk Plushie":700000,"Robot Kau Plushie":680000,"Reject Red Acara Plushie":670000,"Starry Fuzzle":660000,"Two Rings Archmagus Plushie":660000,"Magical Rainbow Blumaroo Plushie":640000,"Plushie Acara Plushie":630000,"White Draik Plushie":620000,"Zafara Double Agent Plushie":610000,"Darigan Krawk Plushie":600000,"Electric Ixi Plushie":590000,"Ghost Evil Fuzzle":570000,"Brown Wadjet Plushie":570000,"Orange Gelert Plushie":560000,"Chrysolite Dervish Plushie":520000,"Green Frogarott Plushie":510000,"Galgarroth Plushie":510000,"Edna Plushie":510000,"Magical Purple Koi Plushie":500000,"Fish Negg Plushie":490000,"Roburg Plushie":470000,"Orrin Plushie":470000,"Tylix Plushie":470000,"Plains Lupe Neoquest Plushie":450000,"Hagan Plushie":430000,"Magical Red Cybunny Plushie":420000,"Frost Lizard Plushie":420000,"Desert Ixi Plushie":410000,"Magical Green Cybunny Plushie":400000,"Faleinn Plushie":400000,"Inferno Lizard Plushie":390000,"White Ixi Plushie":390000,"Magical Green Yurble Plushie":390000,"Ghost Fuzzle":380000,"Rainbow Uni Plushie":380000,"Purple Florg Plushie":370000,"Tyrannian Techo Plushie":370000,"Desert Meerca Plushie":330000,"Magical Pirate Krawk Plushie":330000,"Darigan Uni Plushie":300000,"Insane Evil Fuzzle":300000,"Orange Draik Plushie":280000,"Blue Peophin Squishy Plushie":270000,"Plushie Quiggle Plushie":270000,"Handcrafted Kanrik Plushie":270000,"Mutant Usul Plushie":270000,"Scoach Plushie":260000,"Serpentine Dervish Plushie":260000,"Rainbow Cybunny Plushie":250000,"Orange Negg Plushie":250000,"Faerie Lupe Plushie":250000,"Evil Twin Yellow Chia Plushie":240000,"Thunder Lizard Plushie":240000,"Lord Kass Plushie":240000,"Mutant Shoyru Plushie":240000,"Baby Xweetok Plushie":230000,"Royal Boy Kyrii Plushie":230000,"Cloud Draik Plushie":230000,"Mutant Kougra Plushie":230000,"Chicken Leg Plushie":220000,"Ugly Bruno Plushie":220000,"Rainbow Scorchio Plushie":220000,"Royal Boy Usul Plushie":220000,"Yellow Draik Plushie":220000,"Stone Golem Neoquest Plushie":220000,"Kanrik Plushie":220000,"Magical Blueberry Meerca Plushie":210000,"Purple Koi Plushie":210000,"Disco Nimmo Plushie":200000,"Green Peophin Squishy Plushie":200000,"Shadow Tonu Plushie":200000,"Judge Hog Plushie":200000,"Faerie Nimmo Plushie":200000,"Purple Mynci Plushie":200000,"Fire Eyrie Plushie":200000,"Baby Kacheek Plushie":190000,"Dirt Golem Neoquest Plushie":190000,"Rainbow JubJub Plushie":190000,"Illusen Fan Blumaroo Plushie":180000,"Talek Plushie":180000,"Hoban Plushie":180000,"Collectors Edition Quiguki Girl Plushie":180000,"Cassile Plushie":170000,"Palace Guard Plushie":160000,"Striped Skeith Plushie":150000,"Blue Draik Plushie":150000,"Drakonid Plushie":150000,"Darigan Techo Plushie":140000,"Orange Peophin Squishy Plushie":140000,"Peopatra Plushie":130000,"Rorru Plushie":130000,"Bonju Plushie":130000,"Red Peophin Squishy Plushie":130000,"Rohane Plushie":130000,"Anshu Plushie":130000,"Darkest Faerie Plushie":130000,"Strawberry JubJub Plushie":120000,"Taelia Plushie":120000,"Tax Beast Plushie":120000,"Chocolate Kougra Plushie":110000,"Halloween Kougra Plushie":110000,"Halloween Lupe Plushie":110000,"New Years Moehog Plushie":110000,"Darigan Lenny Plushie":110000,"Spider Grundo Plushie":110000,"Baby Bruce Plushie":110000,"Dusk Kougra Plushie":110000,"Starry Evil Fuzzle":100000,"Plushie Ixi Plushie":100000,"Swamp Lupe Neoquest Plushie":100000},"100":{"Shuriken":260000,"Shenkuu Spikes":100000},"101":{"Sushi Boat":19000000,"Chomby Sushi":3300000},"102":{},"103":{"Pandaphant":18000000,"Quilin":8400000},"104":{},"105":{},"106":{"The Eve of the Eve":3100000,"Guide to Dilapidated Homes":2050000,"The Final Sunset":420000,"Waiting for Midnight":230000,"The 12th Chime":160000,"Fearless Finnigans Guide to Haunted Eateries":150000,"Beyond the Locked Door":120000,"Terrific Tales of Terror":110000,"Lost in the Dark":100000},"107":{},"108":{"Academy For Extraordinary Mutants Background":470000,"Outside Desert Arms Background":340000,"Foggy Lake Background":220000},"110":{},"111":{"Ethereal Uni Mane":750000,"Ethereal Uni Body":310000,"Ethereal Uni Horn":240000,"Elegant Punk Guitar":170000},"112":{"Red Moltite Popsicle":3900000,"Steaming Root Salad":260000},"113":{},"114":{"Locating Iron":16000000,"Steam Engineering":710000,"Cog Jewellery Making":210000},"116":{},"117":{"Mystical Forest Grove Foreground":950000,"Astral Constellation Frame":820000}}};
// END RESTOCK WATCHLIST

// BEGIN SHOP BATCH FOCUS
// One ordinary browser focus request for a manually opened batch; no tab-opening API.
function createShopBatchFocus(w, report = () => {}) {
  const key = 'nd_shop_focus_v1', ttl = 120000;
  let url, id, created, shops, currentShop;
  try {
    url = new URL(w.location.href);
    const match = url.hash.match(/^#nd-restock-batch=([a-f0-9-]{36})\.(\d{13})\.([\d,]+)$/);
    if (url.origin !== 'https://www.neopets.com' || url.pathname !== '/objects.phtml' || url.searchParams.get('type') !== 'shop' || !match) return null;
    [, id] = match; created = Number(match[2]); shops = match[3].split(',').map(Number);
    currentShop = Number(url.searchParams.get('obj_type'));
    if (shops.length > 11 || !shops.length || new Set(shops).size !== shops.length || shops.some(s => !Number.isInteger(s) || s < 1 || s > 200) || !shops.includes(currentShop)) return null;
    if (Date.now() < created || Date.now() - created > ttl) return null;
  } catch (_) { return null; }
  let closed = false, offering = false;
  const fresh = () => !closed && Date.now() >= created && Date.now() - created <= ttl;
  const read = () => JSON.parse(w.localStorage.getItem(key) || 'null');
  const write = state => w.localStorage.setItem(key, JSON.stringify(state));
  const same = state => state?.id === id && state.created === created && JSON.stringify(state.shops) === JSON.stringify(shops);
  const status = () => {
    try {
      const state = read();
      report(!fresh() ? 'Batch check ended.' : !same(state) ? 'A newer shop batch is active.' : state.stopped ? 'Batch jump stopped.' : state.winner ? `First match: shop ${state.winner.shop}. ${state.winner.focused === false ? 'Select its starred tab; Chrome kept the current tab.' : 'One jump requested; no further switching.'}` : 'Checking this opened batch for its first high-value match…', fresh() && same(state) && !state.stopped && !state.winner);
    } catch (_) { report('Batch jump unavailable: browser storage could not be read.', false); }
  };
  if (!w.navigator.locks?.request) {
    report('Batch jump unavailable: browser coordination is unavailable.', false);
    return null;
  }
  void w.navigator.locks.request(key, () => {
    if (!fresh()) return;
    const previous = read();
    if (!previous || previous.created < created || (previous.created === created && previous.id < id))
      write({id, created, shops, winner:null, stopped:false});
    status();
  }).catch(() => report('Batch jump unavailable: browser storage could not be saved.', false));
  w.addEventListener('storage', e => { if (e.key === key) status(); });
  w.addEventListener('pagehide', () => { closed = true; }, {once:true});
  w.setTimeout(status, Math.max(0, created + ttl - Date.now()) + 1);
  return {
    async offer(stillMatches) {
      if (offering || !fresh()) return false;
      offering = true;
      try {
        return await w.navigator.locks.request(key, () => {
          const state = read();
          if (!fresh() || !same(state) || state.stopped || state.winner || !stillMatches()) return false;
          state.winner = {shop:currentShop, at:Date.now()};
          write(state); // Persist before requesting focus, including blocked attempts and reloads.
          try { w.focus(); } catch (_) { /* A blocked request is never retried automatically. */ }
          if (!w.document.title.startsWith('★ ')) w.document.title = '★ ' + w.document.title;
          status();
          w.setTimeout(() => {
            void w.navigator.locks.request(key, () => {
              const latest = read();
              if (!same(latest) || latest.winner?.shop !== currentShop) return;
              latest.winner.focused = w.document.visibilityState === 'visible' && w.document.hasFocus();
              write(latest); status();
            }).catch(() => {});
          }, 250);
          return true;
        });
      } catch (_) { report('Batch jump unavailable: browser storage could not be saved.', false); return false; }
      finally { offering = false; }
    },
    async stop() {
      try {
        await w.navigator.locks.request(key, () => {
          const state = read();
          if (same(state)) { state.stopped = true; write(state); }
          status();
        });
      } catch (_) { report('Could not save Stop. Close these batch tabs to end their checks.', false); }
    }
  };
}
// END SHOP BATCH FOCUS

let shopBatchPanel, shopBatchMessage, shopBatchStop;
const shopBatchFocus = createShopBatchFocus(window, (message, running) => {
  if (!shopBatchPanel) {
    shopBatchPanel = document.createElement('aside');
    shopBatchPanel.id = 'nd-shop-batch-status';
    shopBatchPanel.style.cssText = 'position:fixed;left:18px;bottom:74px;z-index:9999;max-width:min(390px,85vw);padding:10px;background:#fff8e6;color:#49330a;border:1px solid #b58200;border-radius:12px;font:13px Arial,sans-serif;box-shadow:0 2px 10px #0002';
    shopBatchMessage = document.createElement('span');
    shopBatchMessage.setAttribute('role','status');
    shopBatchStop = document.createElement('button'); shopBatchStop.type = 'button';
    shopBatchStop.textContent = 'Stop batch jump'; shopBatchStop.style.marginLeft = '8px';
    shopBatchStop.addEventListener('click', () => { void shopBatchFocus?.stop(); });
    shopBatchPanel.append(shopBatchMessage, shopBatchStop); document.body.append(shopBatchPanel);
  }
  if (shopBatchMessage.textContent !== message) shopBatchMessage.textContent = message;
  shopBatchStop.hidden = !running;
});

const bestShopDeal = (() => {
  const candidates = new Map();
  const announced = new WeakMap();
  let button = null, selected = null, observer = null, queued = false;
  function cardFor(node) {
    let card = node.closest('.search-helper')?.parentElement;
    for (let depth = 0; card && depth < 3; depth++, card = card.parentElement) {
      if (card.querySelectorAll('.search-helper').length !== 1) return null;
      if (/\bCost:\s*[\d,]+\s*NP\b/i.test(card.innerText || card.textContent)) return card;
    }
    return null;
  }
  function render() {
    queued = false;
    const matches = [];
    for (const [node, data] of candidates) {
      if (!node.isConnected) { candidates.delete(node); continue; }
      const asking = shopAskingPrice(node), card = cardFor(node);
      if (!card || !card.getClientRects().length || !Number.isSafeInteger(asking) || asking <= 0) continue;
      if (data.value < 100000 || asking > data.value / 2 || data.inflated) continue;
      matches.push({node, card, asking, value:data.value});
    }
    matches.sort((a,b) => b.value-a.value || a.asking-b.asking);
    const next = matches[0] || null;
    if (selected?.card !== next?.card) {
      selected?.card.classList.remove('search-helper-best-deal');
      next?.card.classList.add('search-helper-best-deal');
    }
    selected = next;
    if (next) void shopBatchFocus?.offer(() => {
      const asking = shopAskingPrice(next.node), data = candidates.get(next.node);
      return next.node.isConnected && next.card.getClientRects().length > 0 && Number.isSafeInteger(asking) && asking > 0 && Number.isSafeInteger(data?.value) && data.value >= 100000 && asking <= data.value / 2 && !data.inflated;
    });
    if (!button && next) {
      button = document.createElement('button'); button.type = 'button';
      button.id = 'search-helper-best-button';
      button.setAttribute('aria-live','polite');
      button.addEventListener('click', () => {
        render();
        if (selected) selected.card.scrollIntoView({block:'center',behavior:'instant'});
      });
      document.body.append(button);
    }
    if (button) {
      if (button.hidden !== !next) button.hidden = !next;
      const label = next ? 'High value: '+next.node.dataset.item+' ↓' : '';
      if (button.textContent !== label) button.textContent = label;
      if (next) {
        const signature = next.value+':'+next.asking;
        if (announced.get(next.node) !== signature) {
          announced.set(next.node,signature);
          next.card.scrollIntoView({block:'center',behavior:'instant'});
          button.classList.remove('search-helper-deal-pulse');
          void button.offsetWidth;
          button.classList.add('search-helper-deal-pulse');
        }
      }
      button.title = 'High-value match: saved or current value of 100K+, asking no more than half. Saved list dated '+restockWatchlist.asOf+'. Click to return; purchase manually.';
    }
  }
  return {
    update(node, data) {
      const page = new URL(document.URL);
      if (page.pathname !== '/objects.phtml' || page.searchParams.get('type') !== 'shop') return;
      // Name lookup is local and independent of visibility or network responses.
      // A successful newer quote can disqualify a saved match; lookup failure cannot erase it.
      const savedValue = restockWatchlist.shops?.[page.searchParams.get('obj_type')]?.[node.dataset.item];
      const effective = data ?? (Number.isSafeInteger(savedValue) ? {value:savedValue, inflated:false} : null);
      if (Number.isSafeInteger(effective?.value)) candidates.set(node,effective); else candidates.delete(node);
      if (!observer && document.body) {
        observer = new MutationObserver(() => {
          if (!queued) { queued = true; setTimeout(render, 16); }
        });
        observer.observe(document.body,{childList:true,subtree:true,characterData:true});
      }
      if (!queued) { queued = true; setTimeout(render, 16); }
    }
  };
})();

// Price data comes from itemdb's documented, session-authenticated API.
// No Neopets account/game requests are made by the price loader.
const itemPrices = (() => {
  const CACHE_KEY = "marie_search_helper_prices_v1",
    TTL = 6 * 60 * 60 * 1000;
  const cache = new Map(),
    pending = new Map();
  let running = false,
    scheduled = null,
    stoppedReason = "",
    fetchedCount = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    if (Array.isArray(saved))
      saved.slice(-300).forEach((entry) => {
        if (
          Array.isArray(entry) &&
          typeof entry[0] === "string" &&
          entry[1] &&
          Number.isFinite(entry[1].savedAt) &&
          Date.now() - entry[1].savedAt < TTL &&
          Date.now() >= entry[1].savedAt &&
          Number.isSafeInteger(entry[1].value) &&
          entry[1].value >= 0
        )
          cache.set(entry[0], entry[1]);
      });
  } catch (_) {
    /* A cache failure must never break the Neopets page. */
  }
  function sourceURL(name) {
    return "https://itemdb.com.br/item/" + slugfy(name);
  }
  function display(node, data, reason) {
    const name = node.dataset.item;
    const hasPrice =
      data && Number.isSafeInteger(data.value) && data.value >= 0;
    const text = hasPrice ? data.value.toLocaleString("en-US") : "—";
    let title = hasPrice
      ? "Estimated market price: " +
        text +
        " NP · itemdb.com.br" +
        (data.addedAt ? " · price dated " + data.addedAt : "") +
        (data.inflated ? " · flagged as inflated" : "")
      : (reason || "No NP estimate available from itemdb.com.br") +
        ". Click to check itemdb.";
    const asking = shopAskingPrice(node);
    bestShopDeal.update(node, hasPrice ? data : null);
    const deal = priceComparison(hasPrice ? data.value : null, asking);
    const multiple = resaleMultiple(hasPrice ? data.value : null, asking);
    const percentage = profitPercentLabel(hasPrice ? data.value : null, asking);
    const starTier = profitStarTier(hasPrice ? data.value : null, asking);
    // Do not rebuild identical content: other page helpers observe DOM changes.
    if (node.dataset.deal !== deal || node.dataset.priceText !== text || node.dataset.multiple !== multiple || node.dataset.percentage !== percentage || node.dataset.profitTier !== starTier) {
      node.dataset.deal = deal; node.dataset.priceText = text; node.dataset.multiple = multiple; node.dataset.percentage = percentage; node.dataset.profitTier = starTier;
      node.replaceChildren();
      node.append(document.createTextNode(text));
      if (starTier) {
        const star = document.createElement('span');
        star.className = 'profit-star'; star.dataset.tier = starTier; star.textContent = '★';
        star.title = starTier.charAt(0).toUpperCase() + starTier.slice(1) + ' star: estimated profit ' + ({bronze:'20,000',silver:'50,000',gold:'100,000'}[starTier]) + ' NP or more';
        star.setAttribute('aria-label', star.title); node.append(star);
      }
      if (percentage) { const badge = document.createElement('span'); badge.className = 'profit-percent'; badge.textContent = percentage; badge.title = 'Estimated profit as a percentage of the listed shop cost'; node.append(badge); }
    }
    if (hasPrice && asking !== null) {
      const difference = data.value - asking;
      title += ' · Shop asking: ' + asking.toLocaleString('en-US') + ' NP · ' +
        (difference === 0 ? 'Estimated break-even' : 'Estimated ' + (difference > 0 ? 'profit: ' : 'loss: ') + Math.abs(difference).toLocaleString('en-US') + ' NP') +
        (percentage ? ' · Estimated return on cost: ' + percentage + ' (resale estimate minus cost, divided by cost)' : '') + '. Based on the listed price, not a guaranteed sale.';
    }
    if (node.title !== title) node.title = title;
    if (node.getAttribute("aria-label") !== name + ": " + title)
      node.setAttribute("aria-label", name + ": " + title);
  }
  function finish(name, data, reason) {
    const nodes = pending.get(name) || new Set();
    nodes.forEach((node) => {
      if (node.isConnected) display(node, data, reason);
    });
    pending.delete(name);
  }
  function schedule() {
    if (!running && !scheduled && pending.size)
      scheduled = setTimeout(flush, 350);
  }
  async function flush() {
    scheduled = null;
    if (running) return;
    if (stoppedReason) {
      for (const name of pending.keys()) finish(name, null, stoppedReason);
      return;
    }
    // Only load visible, still-present items. Batch instead of one request per icon.
    for (const [name, nodes] of pending) {
      for (const node of nodes) if (!node.isConnected) nodes.delete(node);
      if (!nodes.size) pending.delete(name);
    }
    const names = Array.from(pending.keys()).slice(0, 10);
    if (!names.length) return;
    if (fetchedCount + names.length > 200) {
      stoppedReason = "Price lookup limit reached for this page";
      schedule();
      return;
    }
    running = true;
    fetchedCount += names.length;
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("https://itemdb.com.br/api/v1/items/many", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: names }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          stoppedReason =
            "Visit itemdb.com.br, then reload Neopets to refresh price access";
        else if (response.status === 429)
          stoppedReason = "itemdb rate limit reached; try again later";
        throw new Error(stoppedReason || "itemdb price lookup failed");
      }
      const records = await response.json();
      if (!records || typeof records !== "object" || Array.isArray(records))
        throw new Error("Unexpected itemdb response");
      for (const name of names) {
        const matches = Object.values(records).filter(
          (item) => item && typeof item.name === "string" && item.name === name,
        );
        const item = matches.length === 1 ? matches[0] : null,
          price = item && item.price;
        // Never substitute estVal: that is Neopets' base value, not market price.
        const value =
          item &&
          !item.isNC &&
          price &&
          Number.isSafeInteger(price.value) &&
          price.value >= 0
            ? price.value
            : null;
        const data =
          value === null
            ? null
            : {
                value: value,
                addedAt: typeof price.addedAt === "string" ? price.addedAt : "",
                inflated: price.inflated === true,
                savedAt: Date.now(),
              };
        if (data) {
          cache.delete(name);
          cache.set(name, data);
          while (cache.size > 300) cache.delete(cache.keys().next().value);
        }
        finish(name, data);
      }
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache)));
      } catch (_) {}
    } catch (error) {
      const reason =
        stoppedReason ||
        "Price unavailable; visit itemdb.com.br and reload if needed";
      names.forEach((name) => finish(name, null, reason));
      // Network/CORS/session errors should not create a request storm.
      stoppedReason = reason;
    } finally {
      clearTimeout(timeout);
      running = false;
      if (pending.size) scheduled = setTimeout(flush, 1200);
    }
  }
  function enqueue(node) {
    const name = node.dataset.item,
      cached = cache.get(name);
    if (cached && Date.now() - cached.savedAt < TTL) {
      display(node, cached);
      return;
    }
    if (stoppedReason) {
      display(node, null, stoppedReason);
      return;
    }
    if (!pending.has(name)) pending.set(name, new Set());
    pending.get(name).add(node);
    schedule();
  }
  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              enqueue(entry.target);
            }
          });
        })
      : null;
  function link(name) {
    const node = document.createElement("a");
    node.className = "search-helper-price";
    node.dataset.item = name;
    node.href = sourceURL(name);
    node.target = "_blank";
    node.rel = "noopener noreferrer";
    node.textContent = "…";
    node.title = "Estimated NP market price from itemdb.com.br";
    node.setAttribute("aria-label", name + ": loading itemdb price");
    // Run after the synchronous shop markup insertion, before online prices load.
    queueMicrotask(() => bestShopDeal.update(node, null));
    if (observer) observer.observe(node);
    else setTimeout(() => enqueue(node), 0);
    return node;
  }
  return { link };
})();

function makelinks(item, extras) {
  item = String(item || "").trim();
  extras = Object.assign(
    { cash: false, wearable: false, tradeable: true },
    extras || {},
  );
  const element =
    inURL("quests.phtml") || inURL("quickstock.phtml") ? "div" : "p";
  const helper = $("<" + element + ">")
    .addClass("search-helper")
    .attr("data-search-item", item);
  if (!item) return helper;
  if (!extras.cash && extras.tradeable) {
    if (!inURL("quests.phtml")) {
      if (premium) helper.append(sswlink(item));
      helper.append(
        combiner(item, linkmap.sw.url, linkmap.sw.img, "Shop Wizard"),
      );
    }
    helper.append(
      combiner(item, linkmap.tp.url, linkmap.tp.img, "Trading Post"),
    );
    helper.append(combiner(item, linkmap.au.url, linkmap.au.img, "Auctions"));
    helper.append(itemPrices.link(item));
  }
  return helper;
}

jQuery.fn.justtext = function () {
  return $(this).clone().children().remove().end().text();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// I don't really approve of doing the code this way, but in an effort to save as few headaches as possible
// for the countless people who may use this, it's easier to just put beta & non-beta into one file.
// As pages are converted, they will be removed from the non-beta half of the following if-statement, as TNT
// mentioned in their end-of-flash update that beta pages will be the default when those pages are done.
// That said, the point of no return starts here. May Sloth have mercy on us.

if (isBeta) {
  /*
     Adds the search icons under things in:
     Main Shops
     Inventory
     Kitchen Quest
     Snow Faerie Quests
     Esophagor Quests
     Edna Quests
     Puddle Quests
     Illusen/Jhudora
     Hospital
     Quest Log Daily Rewards
     Tea Time With Tavi
     Igloo Garage Sale
     General Store
     Battledome Equipment
     Safety Deposit Box
     Closet
    */

  // Common functions go here
  function hasSearchHelper(element) {
    // this will be used in ajaxSuccess handlers, as to not flood the page after hot-reloads
    return $(element).parent().find(".search-helper").length !== 0;
  }

  function isolateItemLinks($links) {
    $links.find("a").each(function () {
      const el = this;
      const isSsw = el.classList.contains("ssw-helper");
      ["click", "mousedown", "pointerdown"].forEach((type) => {
        el.addEventListener(type, (e) => {
          e.stopPropagation();
          if (isSsw && type === "click") {
            e.preventDefault();
            sswopen(el.getAttribute("data-item"));
          }
        });
      });
    });
  }

  function appendItemLinks($host, itemname, extras) {
    const $links = makelinks(itemname, extras);
    isolateItemLinks($links);
    $host.append($links);
  }

  function genericQuest() {
    // so far, we know this works on:
    // Kitchen Quests
    // Snow Faerie Quests

    // due to inconsistencies in the ajax requests, we will attempt to do two different kinds of search helper adds
    $(".item-img + .item-name")
      .find("b")
      .each(function (index, element) {
        if (!hasSearchHelper(element)) {
          $(element).after(makelinks($(element).text()));
        }
      });

    $("img[src*='/items/'] + br + p > b").each(function (index, element) {
      if (!hasSearchHelper(element)) {
        $(element).after(makelinks($(element).text()));
      }
    });
  }

  // Main Shops
  if (inURL("objects.phtml") || inURL("type=shop")) {
    $(".item-img + .item-name").each(function (index, element) {
      $(element).after(makelinks($(element).text()));
    });
  }

  // Inventory
  if (inURL("inventory")) {
    // the inventory system is more flexible than it used to be, so we have to do this a little differently
    function addInventoryLinks() {
      if (!document.getElementById("invDisplay")) return;
      $(".item-img + .item-name").each(function (index, element) {
        // this will add more and more if you do things like SSW searching, so check first
        if (!hasSearchHelper(element)) {
          let extras = {
            cash: document.getElementById("invDisplay").dataset.type === "nc",
            wearable:
              $(element).parent().find(":contains('wearable')").length > 0,
            tradeable:
              $(element).parent().find(":contains('(no trade)')").length === 0,
            itemid: -1,
          };
          $(element).after(makelinks($(element).text(), extras));
        }
      });
    }
    addInventoryLinks();
    $(document).ajaxSuccess(addInventoryLinks);
  }

  // Kitchen Quest
  if (inURL("island/kitchen")) {
    genericQuest();
    $(document).ajaxSuccess(genericQuest);
  }

  // Snow Faerie
  if (inURL("winter/snowfaerie")) {
    genericQuest();
    $(document).ajaxSuccess(genericQuest);
  }

  // Esophagor
  if (inURL("halloween/esophagor")) {
    genericQuest();
    $(document).ajaxSuccess(genericQuest);
  }

  // Edna
  if (inURL("halloween/witchtower")) {
    genericQuest();
    $(document).ajaxSuccess(genericQuest);
  }

  // Puddle Quests
  if (inURL("/pool/puddle_quests")) {
    function addPuddleQuestLinks() {
      $(".pppq-item-name").each(function (index, element) {
        if (!hasSearchHelper(element)) {
          $(element).after(makelinks($(element).text()));
        }
      });
    }

    let puddleT = 0;
    new MutationObserver(function () {
      clearTimeout(puddleT);
      puddleT = setTimeout(addPuddleQuestLinks, 50);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    addPuddleQuestLinks();
  }

  // Illusen & Jhudora
  if ($(".faerie-img").exists()) {
    let itemname = $(":contains('Where is my') > b").text();
    $(":contains('Where is my')")
      .parent()
      .find("img[src*='/items/']")
      .after(makelinks(itemname));
  }

  // Shop Wiz Auto-Exact
  // TODO: tbh this shouldn't be in this userscript
  if (inURL("wizard.phtml?string=")) {
    $("#criteria").val("exact");
  }

  // Hospital
  if (inURL("/hospital.phtml")) {
    $(".nh-disease-cure > span > b").each(function (k, v) {
      $(v)
        .parent()
        .after(makelinks($(v).text()));
    });
  }

  // Quest Log Daily Rewards
  if (inURL("/questlog")) {
    function addQuestLogLinks() {
      // Daily rewards

      $(".ql-reward-item + .ql-reward-label").each(function (k, v) {
        const name = $(v).text().trim(),
          existing = $(v).next(".search-helper");
        if (existing.attr("data-search-item") !== name) {
          existing.remove();
          $(v).after(makelinks(name));
        }
      });

      // Bonus rewards

      $(".ql-bonus-reward > .ql-bonus-name").each(function (k, v) {
        let itemname = $(v).text();
        if (itemname.endsWith(",000 NP")) {
          // ignore NP rewards
          return;
        }
        const existing = $(v).next(".search-helper");
        if (existing.attr("data-search-item") !== itemname.trim()) {
          existing.remove();
          $(v).after(makelinks(itemname));
        }
      });
    }

    addQuestLogLinks();

    const questLogContent = document.getElementById("QuestLogContent");
    if (questLogContent) {
      const observer = new MutationObserver(function (mutations, obs) {
        obs.disconnect();
        addQuestLogLinks();
        obs.observe(questLogContent, {
          childList: true,
          subtree: true,
        });
      });

      observer.observe(questLogContent, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Tea Time With Tavi
  if (inURL("/games/teatime")) {
    function TaviQuest() {
      $(".ttwt-item > img[src*='/items/'] + span").each(
        function (index, element) {
          if (!hasSearchHelper(element)) {
            $(element).after(makelinks($(element).text()));
          }
        },
      );
    }
    TaviQuest();
    $(document).ajaxSuccess(function () {
      setTimeout(TaviQuest, 1000);
    });
  }

  // Igloo Garage Sale
  if (inURL("/winter/igloo.phtml")) {
    $(".igs-item b").each(function (index, element) {
      $(element).after(makelinks($(element).text()));
    });
  }

  // General Store
  if (inURL("generalstore.phtml")) {
    $(".item-title").each(function (index, element) {
      const links = makelinks($(element).text());
      links.css({ "margin-top": "-10px" });
      $(element).after(links);
    });
  }

  // Quickstock
  if (inURL("quickstock.phtml")) {
    function addQuickstockLinks() {
      const $qsTable = $("table.quickstock-table");
      if (!$qsTable.length) {
        return;
      }
      $qsTable.find("tbody tr").each(function (index, row) {
        const $row = $(row);
        if ($row.find('input[type="radio"][name="checkall"]').length) {
          return;
        }
        const cells = $row.find("td");
        const cell = cells.first();

        const itemCell = cell.clone();
        itemCell.find(".qs-count-badge").remove();
        const itemname = itemCell.text().trim();
        if (itemname && cell.find(".search-helper").length === 0) {
          const isNeoCash = cell.find(".qs-cash-marker").length !== 0;
          const hasClosetOption =
            $row.find("input[type='radio'][value='closet']").length !== 0;
          const extras = {
            cash: isNeoCash,
            wearable: hasClosetOption,
          };
          cell
            .css({
              display: "flex",
              flexFlow: "row wrap",
              gap: "4px 6px",
            })
            .append(makelinks(itemname, extras).addClass("qs-search-helper"));
        }
      });
    }

    let qsT = 0;
    new MutationObserver(function () {
      clearTimeout(qsT);
      qsT = setTimeout(addQuickstockLinks, 50);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    addQuickstockLinks();
  }

  // Safety Deposit Box
  if (inURL("safetydeposit")) {
    function addSDBLinks() {
      $("table.sdb-table tbody tr").each(function (index, row) {
        const $row = $(row);
        if ($row.find(".search-helper").length) {
          return;
        }
        const $info = $row.find(".sdb-item-info").first();
        const itemname = $info.find(".sdb-item-name").text().trim();
        if (!itemname) {
          return;
        }
        const infoText = $info.text();
        const chkId = $row
          .find(".sdb-col-select .sdb-item-checkbox")
          .attr("id");
        appendItemLinks($info, itemname, {
          cash: /Type:\s*Neocash/i.test(infoText),
          wearable: $row.find("select.sdb-action-select option[value='closet']")
            .length,
          tradeable: !infoText.includes("(no trade)"),
          itemid: chkId?.match(/\d+$/)?.[0] ?? -1,
        });
      });

      $(".sdb-grid .sdb-grid-item").each(function (index, item) {
        const $item = $(item);
        if ($item.find(".search-helper").length) {
          return;
        }
        const $content = $item.find(".sdb-grid-item-content").first();
        const itemname = $content.find(".sdb-grid-item-name").text().trim();
        if (!itemname) {
          return;
        }
        const category = $content.find(".sdb-grid-item-category").text().trim();
        const contentText = $content.text();
        appendItemLinks($content, itemname, {
          cash: category === "Neocash",
          wearable: category === "Clothes",
          tradeable: !contentText.includes("(no trade)"),
          itemid: -1,
        });
      });
    }

    let sdbT = 0;
    new MutationObserver(function () {
      clearTimeout(sdbT);
      sdbT = setTimeout(addSDBLinks, 50);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    addSDBLinks();
  }

  // Closet
  if (inURL("closet")) {
    function addClosetLinks() {
      $(".closet-list .closet-list-row").each(function (index, row) {
        const $row = $(row);
        if ($row.find(".search-helper").length) {
          return;
        }
        const $name = $row.find(".closet-list-item-name");
        const itemname = $name.text().trim();
        if (!itemname) {
          return;
        }
        appendItemLinks($name.parent(), itemname, {
          cash: /102,\s*102,\s*102/.test($name.attr("style") || ""),
          wearable: true,
          tradeable: !$row.text().includes("(no trade)"),
          itemid: -1,
        });
      });

      $(".closet-grid .closet-grid-item").each(function (index, item) {
        const $item = $(item);
        if ($item.find(".search-helper").length) {
          return;
        }
        const $content = $item.find(".closet-grid-item-content").first();
        const itemname = $content.find(".closet-item-name").text().trim();
        if (!itemname) {
          return;
        }
        const category = $content.find(".closet-item-category").text().trim();
        appendItemLinks($content, itemname, {
          cash: category === "Neocash",
          wearable: true,
          tradeable: !$content.text().includes("(no trade)"),
          itemid: -1,
        });
      });
    }

    let closetT = 0;
    new MutationObserver(function () {
      clearTimeout(closetT);
      closetT = setTimeout(addClosetLinks, 50);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    addClosetLinks();
  }

  // Battledome Beta
  if (inURL("/dome/neopets")) {
    $(".equipFrame").each(function (index, element) {
      const itemname = $(element).text().trim();
      if (itemname) {
        // ignore if empty slot
        $(makelinks(itemname)).appendTo($(element));
      }
    });
    $(".equipTable").css({ "overflow-y": "scroll" });
  }

  // Your Shop
  if (inURL("type=your") || inURL("market_your")) {
    $(".market-your-item__name").each(function (index, element) {
      appendItemLinks($(element).parent(), $(element).text());
    });
  }

  // Your Shop's Sales History
  if (inURL("market.phtml?type=sales")) {
    $(".mkt-page table tr").each(function (index, element) {
      const cell = $(element).find("td").eq(1);
      if (cell.attr("bgcolor") === "#ffffcc") {
        appendItemLinks(cell, cell.text());
      }
    });
  }

  function sswopen(item) {
    $(".premium-widget__2024").hide(); // hide all open widgets
    toggleWidget__2020("ssw");

    $("#ssw-criteria").val("exact");
    $("#searchstr").val(item);
    $("#ssw-button-new-search")[0].click();
  }
} else {
  /*
     Adds the search icons under things in:
     Trading Post
     Redeeming Cash
     Auction Bidding Page
     Your Shop Price Page
     Coincidence
     MI Training
     Secret Training
     KI Training
     Employment Agency
     Faerie Quest Page
     Kadoatery
     Hidden Tower
     Your Shop's Sales History
     Battledome
     Gallery Rankings
    */

  // Trading Post
  if (inURL("/island/tradingpost.phtml")) {
    $("img[src*='/items/']").each(function (k, v) {
      $(this.nextSibling).after(makelinks($(this)[0].nextSibling.nodeValue));
    });
  }

  // Redeeming Cash
  if (inURL("process_cash_object")) {
    let extras = { cash: true, wearable: true };
    $("img[src*='/items/']")
      .parent()
      .find("b")
      .each(function (k, v) {
        $(v)
          .before("<br>")
          .after(makelinks($(v).text(), extras));
      });
  }

  // Auctions
  if (inURL("auction_id")) {
    let nameb = $("b:contains('owned by')");
    let fixname = nameb.html();
    fixname = fixname.substr(0, fixname.indexOf(" (own")); // remove "owned by..."
    nameb.parent().find("img").after(makelinks(fixname));
  }
  if (inURL("auctions.phtml") || inURL("genie.phtml")) {
    $("a[href*='?type=bids&auction_id=']:not(:has('img'))").each(
      function (index, element) {
        const itemname = $(element).text();
        $(element).after(makelinks(itemname));
      },
    );
  }

  // Coincidence
  if (inURL("space/coincidence")) {
    $("img[src*='/items/']").each(function (k, v) {
      let nametd = $(v).parent();
      nametd.find("b").eq(0).after(makelinks(nametd.justtext()));
    });
  }

  // MI Training
  if (inURL("/island/training.phtml?type=status")) {
    $("img[src*='/items/']").each(function (k, v) {
      $(v).after(makelinks($(v).prev().text()));
    });
  }

  // Secret Training
  if (inURL("/island/fight_training.phtml?type=status")) {
    $("img[src*='/items/']").each(function (k, v) {
      $(v).after(makelinks($(v).prev().text()));
    });
  }

  // KI Training
  if (inURL("/pirates/academy.phtml?type=status")) {
    $("img[src*='/items/']").each(function (k, v) {
      let nametd = $(v).parent();
      let itemname = nametd.parent().find("td > b").eq(0).text();
      nametd.parent().find("td > b").eq(0).after(makelinks(itemname));
    });
  }

  // employment agency
  if (inURL("employment")) {
    if (inURL("type=jobs")) {
      $("b:contains('Find')").each(function (k, v) {
        let itemname = $(v)
          .parent()
          .clone()
          .find("b")
          .remove()
          .end()
          .html()
          .split("<br>")[0];
        $($(v)[0].nextSibling).after(makelinks(itemname));
      });
    }
    if (inURL("job_id")) {
      $("b:contains('Find')")
        .eq(0)
        .after(makelinks($("b:contains('Find')").eq(0).justtext()));
    }
  }

  // Faerie Quests
  if (inURL("quests.phtml")) {
    $("img[src*='/items/']").each(function (k, v) {
      let itemname = $(v).parent().find("b");
      itemname.after(makelinks(itemname.text()));
    });
  }

  // Kadoatery
  if (inURL("games/kadoatery")) {
    $("td:contains('You should give it'):not(:contains('Thanks,'))").each(
      function (k, v) {
        let itemname = $(v).find("strong").last();
        itemname.after(makelinks(itemname.text()));
      },
    );
  }

  // Gallery pages
  if (inURL("/gallery/index.phtml")) {
    $("img.itemimg[src*='/items/']").each(function (k, img) {
      $(img)
        .siblings("b.textcolor")
        .first()
        .each(function (i, nameEl) {
          $(nameEl).after(makelinks($(nameEl).text()));
        });
    });
  }

  // Hidden Tower
  if (inURL("hiddentower938.phtml")) {
    $(".content table")
      .find("b:not([style*='red;'])")
      .each(function (index, element) {
        $(element).after(makelinks($(element).text()));
      });
  }

  function sswlimited(item) {
    return (
      /Nerkmid($|.X+$)/.test(item) ||
      item.endsWith("Paint Brush") ||
      item.endsWith("Transmogrification Potion") ||
      item.endsWith("Laboratory Map")
    );
  }

  function sswopen(item) {
    if ($(".sswdrop").hasClass("panel_hidden")) {
      $("#sswmenu .imgmenu").click();
    }

    if ($("#ssw-tabs-1").hasClass("ui-tabs-hide")) {
      $("#ssw-tabs").tabs("select", 0);
    }

    $("#price-limited").prop("checked", sswlimited(item));

    $("#ssw-criteria").val("exact");

    $("#searchstr").val(item);
    $("#searchstr").focus();
  }
}

$("body").on("click", "a.ssw-helper", function (event) {
  event.preventDefault();
  sswopen($(this).attr("data-item"));
});
