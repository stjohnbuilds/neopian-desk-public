/* Date-aware dashboard series. Profit always belongs to purchase dates. */
(function(root){
  'use strict';
  function range(period,today,from,to){
    let start='',end=today;
    if(period==='week') {const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);start=d.toISOString().slice(0,10);}
    if(period==='month')start=today.slice(0,7)+'-01';
    if(period==='year')start=today.slice(0,4)+'-01-01';
    if(period==='custom'){start=from;end=to;}
    return {start,end};
  }
  function series(rows,sales,range,metric){
    const entries=metric==='profit' ? rows.filter(p=>p.sale).map(p=>({date:p.day,value:p.profit})) : sales.map(s=>({date:s.date,value:metric==='count'?1:s.price}));
    const dates=entries.map(e=>e.date).sort();
    const start=range.start||dates[0]||range.end,end=range.end;
    const span=(Date.parse(end+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000;
    const unit=span<=62?'day':span<=730?'month':'year';
    const key=date=>date.slice(0,unit==='day'?10:unit==='month'?7:4);
    const bins=new Map();
    const d=new Date(start+'T12:00:00Z');
    if(unit!=='day')d.setUTCDate(1);
    if(unit==='year')d.setUTCMonth(0);
    while(d.toISOString().slice(0,10)<=end){
      bins.set(key(d.toISOString().slice(0,10)),0);
      if(unit==='day')d.setUTCDate(d.getUTCDate()+1);
      else if(unit==='month')d.setUTCMonth(d.getUTCMonth()+1);
      else d.setUTCFullYear(d.getUTCFullYear()+1);
    }
    let records=0;
    for(const entry of entries)if(entry.date>=start&&entry.date<=end){const k=key(entry.date);bins.set(k,(bins.get(k)||0)+entry.value);records++;}
    return {unit,records,points:[...bins].map(([date,value])=>({date,value}))};
  }
  root.ProfitReport={range,series};
})(typeof module!=='undefined'?module.exports:window);
