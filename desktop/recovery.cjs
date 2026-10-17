const fs=require('node:fs/promises');const path=require('node:path');const {atomicFile}=require('./storage.cjs');
async function readRecovery(file,domain){const text=await fs.readFile(file,'utf8');if(text.length>50000000)throw Error('The backup is too large.');const state=JSON.parse(text);domain.validateStore(state);return {text,state};}
async function recover(directory,file,domain){const source=await readRecovery(file,domain);const current=path.join(directory,'state.json');const broken=await fs.readFile(current,'utf8');await atomicFile(path.join(directory,'state.recovery.json'),broken);await atomicFile(current,source.text);return source.state;}
module.exports={readRecovery,recover};
