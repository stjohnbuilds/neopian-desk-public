const {BrowserWindow,Menu,session}=require('electron');
class Prices{
 constructor(){this.pending=null;this.window=null;this.session=session.fromPartition('persist:itemdb');this.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));}
 async refresh(names,interactive=true){if(this.pending)throw Error('A price refresh is already running.');if(!Array.isArray(names)||names.length<1||names.length>500||new Set(names).size!==names.length||!names.every(n=>typeof n==='string'&&n.length>0&&n.length<=200&&!/[\x00-\x1f]/.test(n)))throw Error('Invalid item names.');
  return new Promise((resolve,reject)=>{this.pending={names,interactive,resolve,reject,timer:setTimeout(()=>this.finish(Error('Price refresh timed out. Previous estimates were kept.')),540000)};void this.fetch();});}
 async fetch(){if(!this.pending||this.fetching)return;this.fetching=true;const pending=this.pending;
  try{const data={};for(let offset=0;offset<pending.names.length;offset+=40){const response=await this.session.fetch('https://itemdb.com.br/api/v1/items/many',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:pending.names.slice(offset,offset+40)}),signal:AbortSignal.timeout(20000)});
   if([401,403].includes(response.status)){if(pending.interactive)this.connect();else this.finish(Object.assign(Error('Connect to ItemDB to update prices.'),{code:'CONNECTION'}));return;}
   if(!response.ok)throw Error(response.status===429?'ItemDB has limited requests. Try again later.':'ItemDB could not return prices.');const raw=await response.text();if(raw.length>2000000)throw Error('ItemDB response was too large.');Object.assign(data,JSON.parse(raw));}
   if(this.pending===pending)this.finish(null,data);
  }catch(e){if(this.pending===pending)this.finish(e);}finally{this.fetching=false;}}
 connect(){if(this.window&&!this.window.isDestroyed()){this.window.show();return;}this.window=new BrowserWindow({title:'Connect to ItemDB — then choose Refresh prices',width:960,height:720,webPreferences:{partition:'persist:itemdb',nodeIntegration:false,contextIsolation:true,sandbox:true}});
  const menu=Menu.buildFromTemplate([{label:'Prices',submenu:[{label:'Refresh prices after connecting',click:()=>void this.fetch()},{label:'Reload ItemDB',click:()=>this.window.loadURL('https://itemdb.com.br/')},{label:'Cancel',click:()=>this.finish(Error('Price refresh cancelled.'))}]}]);this.window.setMenu(menu);
  this.window.webContents.setWindowOpenHandler(()=>({action:'deny'}));this.window.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('https://itemdb.com.br/'))e.preventDefault();});this.window.on('closed',()=>{this.window=null;if(this.pending)this.finish(Error('Price refresh cancelled.'));});void this.window.loadURL('https://itemdb.com.br/');}
 finish(error,data){const p=this.pending;if(!p)return;this.pending=null;clearTimeout(p.timer);if(this.window&&!this.window.isDestroyed())this.window.close();if(error)p.reject(error);else p.resolve(data);}
 cancel(){this.finish(Error('Price refresh cancelled.'));}
}
module.exports={Prices};
