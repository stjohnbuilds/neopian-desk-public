import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(p,'utf8');
const catalogues = JSON.parse(read('src/data/catalogues.json'));
const shared = read('userscripts/sources/desk-connection.js');
const identities = catalogues.DESK_STAMP_CATALOG.pages.flatMap(p=>p.items.map(i=>({page:p.page,position:i.position,name:i.name,image:i.image})));
const entries = [
 ['purchase-tracker','Purchase Tracker','Receipts and Sales History from pages you open, with account pairing, offline retry and duplicate checks.'],
 ['stamp-tracker','Stamp Tracker','Records confirmed album slots; buying or selecting an item does not mark it collected.'],
 ['random-events','Random Events Logger','Saves recognised events with the signed-in account and sends matching records to your desk.'],
 ['training-helper','Training Helper','Reads displayed training status and synchronises course timers for your paired account.'],
];
const releases = [];
for (const [id,name,change] of entries) {
 let code=read('userscripts/sources/'+id+'.js').replace('/* DESK_CONNECTION */',shared)
  .replace(/(\/\/ @namespace\s+).*/, '$1neopian-desk-public-'+id)
  .replace(/(\/\/ @version\s+).*/, '$11.0.0')
  .replace('/* SHOP_IDENTITIES */','const shopNames = '+JSON.stringify(catalogues.ND_SHOP_NAMES)+';')
  .replace('/* STAMP_IDENTITIES */','const stampIdentities = '+JSON.stringify(identities)+';');
 for(const [marker,file] of [['TRADING_RECEIPTS','src/capture/trading-receipts.js'],['AUCTION_RECEIPTS','src/capture/auction-receipts.js'],['PLAYER_SHOP_RECEIPTS','src/capture/player-shop-receipts.js'],['SALES_HISTORY','src/capture/sales-history.js'],['STAMP_SDB','userscripts/sources/stamp-sdb.js'],['STAMP_INVENTORY','userscripts/sources/stamp-inventory.js'],['TRAINING_READER','userscripts/sources/training-reader.js'],['TRAINING_SYNC','userscripts/sources/training-sync.js']])
  code=code.replace('/* '+marker+' */',()=>read(file).replaceAll('export function ','function '));
 new vm.Script(code,{filename:id});
 const file='neopets-'+id+'.user.js';fs.writeFileSync('userscripts/'+file,code);
 releases.push({id,name,file,version:'1.0.0',date:'2026-10-16',changes:[change],code});
}
const search=read('userscripts/neopets-search-helper.user.js');new vm.Script(search);
releases.push({id:'search-helper',name:'Search Helper',file:'neopets-search-helper.user.js',version:search.match(/@version\s+(\S+)/)[1],date:'2026-10-16',changes:['Adds item search links to supported pages. Requests and purchases remain under your control.'],code:search});
fs.writeFileSync('src/data/training-script.json',JSON.stringify(releases.find(s=>s.id==='training-helper'),null,2)+'\n');
catalogues.DESK_SCRIPT_RELEASES=releases.filter(s=>s.id!=='training-helper');fs.writeFileSync('src/data/catalogues.json',JSON.stringify(catalogues,null,2)+'\n');
