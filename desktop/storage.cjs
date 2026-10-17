const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID,createHash} = require('node:crypto');
const digest = text => createHash('sha256').update(text).digest('hex');
async function atomicFile(file,text) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  const temporary=file+'.'+randomUUID()+'.tmp';
  try {
    const handle=await fs.open(temporary,'wx',0o600);
    try {await handle.writeFile(text);await handle.sync();} finally {await handle.close();}
    await fs.rename(temporary,file);
    if(await fs.readFile(file,'utf8')!==text)throw Error('The written file could not be verified.');
  } finally {await fs.rm(temporary,{force:true});}
}
class Storage {
  constructor(directory,domain) {this.directory=directory;this.domain=domain;this.queue=Promise.resolve();this.state=null;this.backup={};}
  async open() {
    try {this.state=JSON.parse(await fs.readFile(path.join(this.directory,'state.json'),'utf8'));this.domain.validateStore(this.state);}
    catch(e) {if(e.code==='ENOENT')this.state=this.domain.createInitialState();else throw Error('Saved data could not be read. It has been left untouched. '+e.message);}
    try {
      const saved=JSON.parse(await fs.readFile(path.join(this.directory,'backup-location.json'),'utf8'));
      if(!saved || typeof saved.folder!=='string' || !path.isAbsolute(saved.folder))throw Error('Invalid backup folder.');
      this.backup=saved;
    } catch(e) {if(e.code!=='ENOENT')this.backup={error:'The backup location settings could not be read. Choose your folder again.'};}
    return this.state;
  }
  serialize(action) {const job=this.queue.then(action);this.queue=job.catch(()=>{});return job;}
  commit(change) {return this.serialize(async()=>{
    const next=change(structuredClone(this.state));this.domain.validateStore(next);
    if(this.state.profile.account && next.profile.account!==this.state.profile.account)throw Error('This desk belongs to a different account.');
    if(JSON.stringify(next)===JSON.stringify(this.state))return this.state;
    if(next.revision!==this.state.revision+1)throw Error('The saved records changed. Retry using the latest screen.');
    const current=path.join(this.directory,'state.json');let old;
    try {old=await fs.readFile(current,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
    if(old!==undefined)await atomicFile(path.join(this.directory,'state.previous.json'),old);
    await atomicFile(current,JSON.stringify(next));this.state=next;
    if(this.backup.folder)await this.writeBackup(this.backup).catch(e=>{this.backup.error=e.message;});
    this.onBackup?.(this.backup);
    return next;
  });}
  chooseBackup(folder) {return this.serialize(async()=>{
    if(typeof folder!=='string'||!path.isAbsolute(folder))throw Error('Choose an absolute folder location.');
    const candidate=this.backup.folder===folder?{...this.backup}:{folder};
    await this.writeBackup(candidate);this.backup=candidate;this.onBackup?.(this.backup);return this.backup;
  });}
  backupNow() {return this.serialize(async()=>{
    try {await this.writeBackup(this.backup);return this.backup;}
    catch(e){this.backup.error=e.message;throw e;}
    finally{this.onBackup?.(this.backup);}
  });}
  async writeBackup(settings) {
    if(!settings.folder)throw Error('Choose a backup folder first.');
    const file=path.join(settings.folder,'neopian-desk-backup.json');let old;
    try {
      old=await fs.readFile(file,'utf8');const existing=JSON.parse(old);this.domain.validateStore(existing);
      if(existing.profile.account!==this.state.profile.account)throw Error('This folder contains a different account. Choose another folder.');
      if(JSON.stringify(existing)!==JSON.stringify(this.state) && (!settings.lastHash || digest(old)!==settings.lastHash))
        throw Error('This backup changed elsewhere. Export your local records, restore the other backup to merge records, then choose a new backup folder.');
    } catch(e) {if(e.code!=='ENOENT')throw e;}
    const text=JSON.stringify(this.state,null,2);
    if(old!==undefined && old!==text)await atomicFile(path.join(settings.folder,'neopian-desk-backup.previous.json'),old);
    await atomicFile(file,text);
    settings.lastHash=digest(text);settings.lastBackup=new Date().toISOString();delete settings.error;
    await atomicFile(path.join(this.directory,'backup-location.json'),JSON.stringify(settings));
  }
}
module.exports={Storage,atomicFile};
