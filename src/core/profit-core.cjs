/* Pure receipt/sales accounting. No requests, DOM or storage. */
(function (root) {
  'use strict';
  const officialShops = new Set([1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 112, 113, 114, 116, 117]);
  const money = n => Number.isSafeInteger(n) && n >= 0 && n <= 2000000000;
  function validDate(s) { return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s>='1999-01-01' && !isNaN(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s; }
  function day(ms) { const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ms));return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-'); }
  function validPurchase(p) { return p && typeof p.id==='string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(p.id) && typeof p.account==='string' && /^[a-z0-9_]{1,50}$/.test(p.account) && typeof p.name==='string' && p.name.trim().length>0 && p.name.length<=200 && Number.isInteger(p.shopId) && ((p.source===undefined && officialShops.has(p.shopId)) || (p.source==='manual' && p.shopId===0) || (p.source==='player-shop' && p.shopId===-1 && typeof p.seller==='string' && /^[a-z0-9_]{1,50}$/.test(p.seller) && p.seller!==p.account && p.cost<=999999)) && money(p.cost) && p.cost>0 && Number.isFinite(p.boughtAt) && p.boughtAt>0 && p.boughtAt<=Date.now()+300000; }
  function validSale(s) { return s && typeof s.id==='string' && s.id.length<=1000 && validDate(s.date) && typeof s.name==='string' && s.name.trim().length>0 && s.name.length<=200 && typeof s.buyer==='string' && /^[a-zA-Z0-9_]{1,50}$/.test(s.buyer) && money(s.price) && s.price>0 && Number.isFinite(s.importedAt) && s.importedAt>0 && ['history','manual','trading-post','auction'].includes(s.source); }
  function validLedger(s) { return s && s.version===1 && Array.isArray(s.sales) && s.sales.length<=100000 && s.sales.every(validSale) && new Set(s.sales.map(r=>r.id)).size===s.sales.length && Array.isArray(s.restoredPurchases) && s.restoredPurchases.length<=100000 && s.restoredPurchases.every(validPurchase) && new Set(s.restoredPurchases.map(r=>r.id)).size===s.restoredPurchases.length; }
  function signature(s) { return JSON.stringify([s.date,s.name.trim().toLowerCase(),s.buyer.toLowerCase(),s.price]); }
  function parseSales(text,order='DMY',now=Date.now()) {
    if (typeof text!=='string' || text.length>2000000) throw Error('Paste at most 2 MB of sales history.');
    const matches=[...text.replace(/\r/g,'').matchAll(/(?:^|\n)\s*(\d{1,2})\/(\d{1,2})\/(\d{4})[\t ]*([^\n]*)/g)];
    if (!matches.length) throw Error('No dated sales found. Copy the Date, Item, Buyer and Price rows from Sales History.');
    const counts=new Map();
    return matches.map((m,i)=>{
      const block=text.replace(/\r/g,'').slice(m.index+(m[0].startsWith('\n')?1:0),i+1<matches.length?matches[i+1].index:undefined);
      const date=m[3]+'-'+String(order==='DMY'?m[2]:m[1]).padStart(2,'0')+'-'+String(order==='DMY'?m[1]:m[2]).padStart(2,'0');
      const name=(m[4].split('\t')[0].trim() || block.split('\n').slice(1).find(l=>l.trim()) || '').trim();
      const buyers=[...block.matchAll(/(?:^|\n|\t)([a-zA-Z0-9_]+)[ \t]*(?:\t|\n)[ \t]*((?:\d{1,3}(?:,\d{3})+)|\d+)[ \t]+NP\b/g)];
      if (buyers.length!==1 || !name || !validDate(date) || date>day(now)) throw Error('Could not safely read sale '+(i+1)+'. Check the date format and include all four columns.');
      const sale={date,name,buyer:buyers[0][1],price:Number(buyers[0][2].replace(/,/g,'')),source:'history',importedAt:now};
      const key=signature(sale),n=(counts.get(key)||0)+1;counts.set(key,n);sale.id='history:'+key+':'+n;
      if (!validSale(sale) || sale.price<1000) throw Error('Invalid history price on sale '+(i+1)+'.');
      return sale;
    });
  }
  function mergeSales(old,rows) {
    const map=new Map(old.map(s=>[s.id,s]));
    for(const sale of rows){
      const previous=map.get(sale.id);
      if(previous && ['date','name','buyer','price','source'].some(k=>previous[k]!==sale[k])) throw Error('Conflicting sale records; nothing changed.');
      if(!previous)map.set(sale.id,sale);
    }
    return [...map.values()];
  }
  function mergePurchases(a,b) {
    const map=new Map();
    for (const row of a.concat(b)) {
      if (!validPurchase(row)) throw Error('Invalid purchase data; nothing changed.');
      const old=map.get(row.id);
      if(old && ['name','cost','boughtAt','shopId','account','source','seller'].some(k=>old[k]!==row[k])) throw Error('Conflicting receipt IDs; nothing changed.');
      map.set(row.id,row);
    }
    return [...map.values()];
  }
  function account(purchases,sales) {
    const rows=purchases.map(p=>({...p,day:day(p.boughtAt),sale:null,profit:null})).sort((a,b)=>a.boughtAt-b.boughtAt||a.id.localeCompare(b.id));
    const queues=new Map();for(const r of rows){const key=r.name.trim().toLowerCase();if(!queues.has(key))queues.set(key,[]);queues.get(key).push(r);}
    const unmatched=[];
    for(const sale of [...sales].sort((a,b)=>a.date.localeCompare(b.date)||a.importedAt-b.importedAt||a.id.localeCompare(b.id))){
      const q=queues.get(sale.name.trim().toLowerCase())||[];
      const index=q.findIndex(p=>p.day<=sale.date && p.boughtAt<=sale.importedAt);
      if(index<0){unmatched.push(sale);continue;}
      const p=q.splice(index,1)[0];p.sale=sale;p.profit=sale.price-p.cost;
    }
    const byDay={};for(const p of rows)if(p.sale)byDay[p.day]=(byDay[p.day]||0)+p.profit;
    return {rows,unmatched,byDay};
  }
  root.ProfitCore={validDate,validPurchase,validSale,validLedger,day,parseSales,mergeSales,mergePurchases,account};
})(typeof module!=='undefined'?module.exports:window);
