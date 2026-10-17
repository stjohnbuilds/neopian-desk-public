const {contextBridge,ipcRenderer}=require('electron');
const actions=new Set(['save','copy','export','openDailyPages','openMarketSearches','openShops','stopShopBatch','backupStatus','chooseBackupFolder','backupNow','refreshTradeEstimates','cancelTradeEstimates']);
const channels=new Set(['deskBrowser','deskShopHelper','deskReminders','deskPetNames']);
contextBridge.exposeInMainWorld('deskInitialState',ipcRenderer.sendSync('desk-initial'));
contextBridge.exposeInMainWorld('deskDesktop',{
 request:(action,payload)=>actions.has(action)?ipcRenderer.invoke('desk-request',action,payload):Promise.reject(Error('Unknown action.')),
 channel:(channel,payload)=>channels.has(channel)?ipcRenderer.invoke('desk-channel',channel,payload):Promise.reject(Error('Unknown channel.')),
 onEvent:callback=>{const receive=(_event,name,data)=>{if(typeof name==='string'&&name.startsWith('desk-'))callback(name,data);};ipcRenderer.on('desk-event',receive);return()=>ipcRenderer.removeListener('desk-event',receive);}
});
