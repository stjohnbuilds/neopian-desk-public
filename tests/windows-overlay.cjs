const {chromium}=require('@playwright/test');const {spawn}=require('node:child_process');const path=require('node:path');const fs=require('node:fs');const {EventEmitter}=require('node:events');
(async()=>{
 if(process.platform!=='win32')throw Error('Run the accessibility test on Windows.');
 const candidates=[path.join(process.env.PROGRAMFILES||'C:/Program Files','Google/Chrome/Application/chrome.exe'),path.join(process.env['PROGRAMFILES(X86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe')];const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw Error('Chrome or Edge is required for the fixture.');
 const browser=await chromium.launch({executablePath,headless:false,args:['--force-renderer-accessibility']});const child=spawn('windows/publish/NeopianDesk.Overlay.exe',[],{stdio:['pipe','pipe','pipe']});const events=new EventEmitter();let output='';let latest;
 child.stdout.on('data',chunk=>{output+=chunk;let at;while((at=output.indexOf('\n'))>=0){const row=JSON.parse(output.slice(0,at));output=output.slice(at+1);latest=row;events.emit('row',row);}});
 const send=data=>child.stdin.write(JSON.stringify(data)+'\n');
 const wait=match=>new Promise((resolve,reject)=>{let timer;const receive=row=>{if(match(row)){clearTimeout(timer);events.off('row',receive);resolve(row);}};events.on('row',receive);timer=setTimeout(()=>{events.off('row',receive);reject(Error('Accessibility fixture timed out; latest response: '+JSON.stringify(latest)));},30000);if(latest)receive(latest);});
 try{
  await wait(m=>m.type==='ready');send({action:'prices',items:[{name:'Test Item',estimatedValue:200000,priceDate:'2026-10-01',flags:[]}]});send({action:'start'});
  const context=await browser.newContext();const page=await context.newPage();
  const art='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="purple"/></svg>');
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<title>Neopets shop fixture</title><main style="margin:80px"><div style="width:140px;text-align:center"><img alt="Test Item" src="${art}" width="80" height="80"><p>Test Item</p><p>Cost: 12,345 NP</p></div></main>`}));
  await page.goto('https://www.neopets.com/objects.phtml?type=shop&obj_type=1');await page.bringToFront();
  const found=await wait(m=>m.type==='observation'&&m.data.items.some(i=>i.name==='Test Item'&&i.cost===12345));
  if(found.tags<1)throw Error('An item was read but no native badge was displayed.');if(!found.clickThrough)throw Error('Price tags must not intercept clicks.');
  await page.screenshot({path:'test-results/windows-browser-fixture.png'});
  await page.goto('https://example.com/');await wait(m=>m.type==='observation'&&m.data.items.length===0&&m.tags===0);
  console.log('Windows accessibility: exact item + cost, native badge, click-through style, and stale-tag clearing exercised with a browser fixture.');
 }finally{send({action:'close'});child.kill();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
