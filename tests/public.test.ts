import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import * as domain from '../desktop/domain';
import {Storage} from '../desktop/storage.cjs';
import {BrowserBridge} from '../desktop/browser-bridge.cjs';
import {recover} from '../desktop/recovery.cjs';
import {Reminders} from '../desktop/reminders.cjs';
import {parseHTML} from 'linkedom';
import {readSalesHistory} from '../src/capture/sales-history.js';
import {playerShopConfirmation,playerShopObserver} from '../src/capture/player-shop-receipts.js';
import {dailyFavorites,featuredDailies,otherDailies,withDailyFavorite,activeDailies,dailyId} from '../src/core/daily-favorites';
import {salesLedger} from '../src/core/sales-import';
import {readEstimates,mergeEstimates,validPriorityItems} from '../src/core/trade-estimates';
const account='test_account';
const configured=()=>({...domain.createInitialState(),profile:{account,pets:[],closetURL:''}});
const receipt=()=>({id:randomUUID(),account,name:'Test Item',shopId:1,cost:1234,boughtAt:Date.now()});
async function temporary(t:any){const folder=await mkdtemp(path.join(os.tmpdir(),'neopian-desk-test-'));t.after(()=>rm(folder,{recursive:true,force:true}));return folder;}

test('first launch contains no account records, choices or page designs',()=>{
 const state=domain.createInitialState();domain.validateStore(state);
 assert.deepEqual(state.profile,{account:'',pets:[],closetURL:''});assert.deepEqual(state.legacy,{});
 assert.equal(state.native.purchases.length,0);assert.equal(state.names.history.length,0);assert.deepEqual(state.names.records,{});
 assert.deepEqual(state.native.browser.albums,{});assert.deepEqual(state.native.browser.events,[]);assert.equal(state.pageCodes,undefined);
});
test('stars move one entry, leave the catalogue intact and support an empty list',()=>{
 let saved={};const target=activeDailies.find(d=>d.name==='Snowager')!;
 saved=withDailyFavorite(saved,dailyId(target),true);assert.ok(featuredDailies(saved).includes(target));assert.ok(!otherDailies(saved).includes(target));
 saved=withDailyFavorite(saved,dailyId(target),false);assert.ok(otherDailies(saved).includes(target));
 for(const id of dailyFavorites(saved))saved=withDailyFavorite(saved,id,false);
 assert.equal(featuredDailies(saved).length,0);assert.equal(otherDailies(saved).length,activeDailies.length);
 assert.throws(()=>withDailyFavorite(saved,'unknown',true));
});
test('receipt batches are atomic, reject wrong accounts and replay once',()=>{
 const state=configured(),row=receipt();const saved=domain.observe(state,'purchases',{purchases:[row]});
 assert.equal(saved.native.purchases.length,1);assert.equal(state.native.purchases.length,0);
 assert.deepEqual(domain.observe(saved,'purchases',{purchases:[row]}),saved);
 for(const bad of [{...row,account:'other_account'},{...row,cost:-1},{...row,cost:undefined}])assert.throws(()=>domain.observe(state,'purchases',{purchases:[receipt(),bad]}));
 assert.throws(()=>domain.observe(saved,'purchases',{purchases:[{...row,cost:5}]}));
 assert.throws(()=>domain.observe(state,'purchases',row));
});
test('sales history repeats preserve real duplicate quantities but do not import twice',()=>{
 const row={id:'a'.repeat(64),account,observedAt:Date.now(),rows:[['16/10/2026','Test Item','test_buyer','5,000 NP'],['16/10/2026','Test Item','test_buyer','5,000 NP']]};
 const state=domain.observe(configured(),'sales-history',row);assert.equal(salesLedger(state).sales.length,2);
 assert.equal(salesLedger(domain.observe(state,'sales-history',row)).sales.length,2);
 assert.throws(()=>domain.observe(state,'sales-history',{...row,account:'other_account'}));
 assert.throws(()=>domain.observe(state,'sales-history',{...row,rows:[['35/10/2026','Test Item','test_buyer','5,000 NP']]}));
});
test('event types and short-window duplicates are validated',()=>{
 const e={account,timestamp:Date.now()-1000,type:'regular',event:'Test event'};
 const state=domain.observe(configured(),'events',{events:[e,{...e,timestamp:e.timestamp+500}]});assert.equal(state.native.browser.events.length,1);
 assert.throws(()=>domain.observe(state,'events',{events:[{...e,type:'made-up'}]}));
});
test('stamp ownership survives older missing observations',()=>{
 const row={account,page:1,observedAt:Date.now()-1000,items:[{name:'Test Stamp',image:'test_stamp',position:1,owned:true}]};
 const state=domain.observe(configured(),'stamps',row);const later=domain.observe(state,'stamps',{...row,observedAt:row.observedAt+500,items:[{...row.items[0],owned:false}]});assert.equal(later.native.browser.albums['1'].items[0].owned,true);
 assert.throws(()=>domain.observe(state,'stamps',{...row,items:[...row.items,...row.items]}));
});
test('atomic storage survives reopening and stale saves cannot overwrite receipts',async t=>{
 const folder=await temporary(t),storage=new Storage(folder,domain);await storage.open();
 await storage.commit(()=>({...configured(),revision:1}));const row=receipt();const stale={...storage.state,revision:2};
 await storage.commit((s:any)=>domain.observe(s,'purchases',{purchases:[row]}));await assert.rejects(storage.commit(()=>stale),/changed/);
 const reopened=new Storage(folder,domain);await reopened.open();assert.deepEqual(reopened.state,storage.state);
 assert.equal(JSON.parse(await readFile(path.join(folder,'state.previous.json'),'utf8')).revision,1);
});
test('backup failures preserve the local save and refuse another computer overwrite',async t=>{
 const folder=await temporary(t),backup=path.join(folder,'backup'),storage=new Storage(path.join(folder,'data'),domain);await storage.open();await storage.commit(()=>({...configured(),revision:1}));await storage.chooseBackup(backup);
 const file=path.join(backup,'neopian-desk-backup.json');const external={...storage.state,revision:99};await writeFile(file,JSON.stringify(external));
 await storage.commit((s:any)=>({...s,revision:s.revision+1,legacy:{nd_account_notes:JSON.stringify('Local note')}}));assert.match(storage.backup.error,/changed elsewhere/);
 assert.equal(JSON.parse(await readFile(file,'utf8')).revision,99);assert.equal(storage.state.revision,2);
});
test('corrupt storage is preserved until explicit validated recovery',async t=>{
 const folder=await temporary(t),storage=new Storage(folder,domain);await writeFile(path.join(folder,'state.json'),'{broken');await assert.rejects(storage.open());assert.equal(await readFile(path.join(folder,'state.json'),'utf8'),'{broken');
 const backup=path.join(folder,'restore.json');await writeFile(backup,JSON.stringify(configured()));await recover(folder,backup,domain);await storage.open();assert.equal(storage.state.profile.account,account);assert.equal(await readFile(path.join(folder,'state.recovery.json'),'utf8'),'{broken');
});
test('loopback pairing authenticates, rejects wrong account and acknowledges only durable batches',async t=>{
 const folder=await temporary(t),storage=new Storage(folder,domain);await storage.open();await storage.commit(()=>({...configured(),revision:1}));const bridge=new BrowserBridge(storage,domain,()=>{},0);await bridge.start();t.after(()=>bridge.stop());
 const url='http://127.0.0.1:'+bridge.port+'/v1/';const headers={'Authorization':'Bearer '+bridge.key,'Content-Type':'application/json'};
 assert.equal((await fetch(url+'profile')).status,401);assert.deepEqual(await(await fetch(url+'profile',{headers})).json(),{account});
 const row=receipt();const post=(data:any)=>fetch(url+'purchases',{method:'POST',headers,body:JSON.stringify(data)});
 assert.equal((await post({purchases:[row]})).status,200);assert.equal((await post({purchases:[row]})).status,200);
 assert.equal((await post({purchases:[{...receipt(),account:'other_account'}]})).status,400);
 const reopened=new Storage(folder,domain);await reopened.open();assert.equal(reopened.state.native.purchases.length,1);
});
test('pairing binds the script to the app account before keeping a key',async()=>{
 const values=new Map();const key='a'.repeat(64);const shared=await readFile('userscripts/sources/desk-connection.js','utf8');let appAccount=account;const alerts:string[]=[];
 const context=vm.createContext({GM:{getValue:async(k:string,f:any)=>values.get(k)??f,setValue:async(k:string,v:any)=>values.set(k,v),xmlHttpRequest:async()=>({status:200,responseText:JSON.stringify({account:appAccount})})},prompt:()=>key,alert:(s:string)=>alerts.push(s),URL,document:{querySelectorAll:()=>[],scripts:[]}});
 const desk=await new vm.Script('(async()=>{'+shared+';return createDeskConnection();})()').runInContext(context);
 assert.equal(await desk.pair(),true);assert.equal(values.get('neopianDeskAccount'),account);appAccount='other_account';assert.equal(await desk.pair(),false);assert.match(alerts[0],/another account/);assert.equal(values.get('neopianDeskAccount'),account);
});
test('only the exact owned sales table is captured',()=>{
 const {document}=parseHTML('<a href="/browseshop.phtml?owner=test_account">Shop Front</a><table><tr><td>Date</td><td>Item</td><td>Buyer</td><td>Price</td></tr><tr><td>16/10/2026</td><td>Test Item</td><td>test_buyer</td><td>5,000 NP</td></tr><tr><td>Clear Sales History</td></tr></table>');const href='https://www.neopets.com/market.phtml?type=sales';
 assert.equal(readSalesHistory(document,href,account)?.length,1);assert.equal(readSalesHistory(document,href,'other_account'),null);assert.equal(readSalesHistory(document,href.replace('neopets.com','example.com'),account),null);
});
test('unavailable or flagged estimates never replace a dated valid price',()=>{
 const now=new Date().toISOString(),name='Test Item';const raw={[name]:{name,type:'np',price:{value:5000,addedAt:now}}};const first=mergeEstimates(readEstimates({}),raw,now,[{name}]);
 assert.equal(first.estimates.items[name].value,5000);const flagged=mergeEstimates(first.estimates,{[name]:{...raw[name],price:{value:999999,addedAt:now,inflated:true}}},now,[{name}]);assert.equal(flagged.estimates.items[name].value,5000);assert.match(flagged.estimates.items[name].error!,/flagged/);
 assert.equal(validPriorityItems([{name,slug:'',buyCeiling:500,buyAt:'500',quantity:'1',note:''}]),true);
});
test('desktop alerts deduplicate once timers and pause Snowager in hibernation',async t=>{
 const folder=await temporary(t);const delivered:any[]=[];class Notice {static isSupported(){return true;}constructor(public options:any){}on(){}show(){delivered.push(this.options);}}
 const reminders=new Reminders(folder,Notice,()=>{},()=>{});reminders.enabled=true;
 const now=new Date('2026-12-10T14:00:00Z');reminders.rows=[{id:'snowager',title:'Snowager',url:'https://www.neopets.com/winter/snowager.phtml',kind:'daily',hour:6,minute:0,skipHibernation:true},{id:'timer',title:'Timer',url:'neopian-desk://calendar',kind:'once',dueAt:now.getTime(),windowMinutes:10}];
 await reminders.tick(now);await reminders.tick(now);assert.deepEqual(delivered.map(x=>x.title),['Timer']);
});
