import './userscripts.mjs';
import {build} from 'esbuild';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');
await build({entryPoints:['src/main.tsx'],bundle:true,outfile:'dist/app.js',format:'iife',target:['chrome120'],jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
await build({entryPoints:['desktop/domain.ts'],bundle:true,outfile:'desktop/domain.cjs',platform:'node',format:'cjs',target:['node22'],minify:false});
execFileSync(process.execPath,['node_modules/@tailwindcss/cli/dist/index.mjs','-i','src/styles.css','-o','dist/app.css','--minify'],{stdio:'inherit'});
fs.writeFileSync('dist/index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'none'; object-src 'none'; frame-src 'self' about:; base-uri 'none'"><title>Neopian Desk</title><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>`);
for(const name of ['dailies','catalogues','stamp-collection'])fs.copyFileSync('src/data/'+name+'.json','desktop/'+name+'.json');
