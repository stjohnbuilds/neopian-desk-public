const {_electron:electron,expect}=require('@playwright/test');const fs=require('node:fs/promises');const path=require('node:path');
(async()=>{
 if(process.platform!=='win32'||process.env.CI!=='true'||!process.env.DESK_INSTALLED_EXE)throw Error('Installed checks require an isolated Windows CI runner.');
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;delete env.DESK_TEST_DATA_DIR;
 const app=await electron.launch({executablePath:process.env.DESK_INSTALLED_EXE,env});
 try{const page=await app.firstWindow();await page.locator('.app-shell').waitFor();
  const packaged=await app.evaluate(({app})=>app.isPackaged);if(!packaged)throw Error('This is not the installed package.');
  if(process.argv[2]==='fresh'){
   const initial=await page.evaluate(()=>window.deskInitialState);if(initial.profile.account)throw Error('Fresh installation contains an account.');
   await page.getByRole('button',{name:'Unstar Quest Log',exact:true}).click();await expect(page.getByRole('button',{name:'Star Quest Log',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Settings & backups',exact:true}).click();await page.getByLabel('Neopets username',{exact:true}).fill('install_test');await page.getByRole('button',{name:'Save settings',exact:true}).click();await expect(page.getByText('Account settings saved.',{exact:true})).toBeVisible();
  }else{
   const initial=await page.evaluate(()=>window.deskInitialState);if(initial.profile.account!=='install_test'||JSON.parse(initial.legacy.nd_daily_favorites_v1).ids.includes('quest-log'))throw Error('Reinstall did not retain saved data.');
  }
  const helper=await app.evaluate(async()=>{const path=require('node:path'),fs=require('node:fs/promises');return (await fs.stat(path.join(process.resourcesPath,'overlay','NeopianDesk.Overlay.exe'))).size;});if(helper<1000000)throw Error('Self-contained overlay was not included.');
  await page.screenshot({path:'test-results/installed-'+process.argv[2]+'.png'});console.log('Installed package '+process.argv[2]+' checked.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
