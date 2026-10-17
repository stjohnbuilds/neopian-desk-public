import { useEffect, useState } from "react";
import { useStore, getState, restoreBackup } from "../persistence/store";
import { exportText, request, isNative } from "../core/bridge";
import { Panel, Button, Feedback, useAction } from "../components/shared";
import { NotificationPreferences, type NotificationState } from "./NotificationPreferences";
import { ProfileSettings } from "./ProfileSettings";
export function Settings({notifications}:{notifications:NotificationState}) {
  const store=useStore(), {run,busy,message}=useAction();
  const [backup,setBackup]=useState<{folder?:string;lastBackup?:string;error?:string}>({});
  useEffect(()=>{if(isNative())void request("backupStatus").then(v=>setBackup(v as typeof backup)).catch(e=>setBackup({error:String(e)}));;const receive=(e:Event)=>setBackup((e as CustomEvent).detail);window.addEventListener("desk-backup-state",receive);return()=>window.removeEventListener("desk-backup-state",receive);},[]);
  return <div className="feature-stack"><ProfileSettings/><NotificationPreferences state={notifications}/>
    <Panel title="Backup folder"><p className="panel-note">Choose a folder in Google Drive or another synced drive to keep a backup away from this computer. Desk writes there after saves; it never connects to someone else's account.</p>
      <p className="panel-note">{backup.folder || "No automatic backup folder selected."}</p>
      <div className="actions panel-note"><Button disabled={busy || !isNative()} onClick={()=>void run(async()=>setBackup(await request("chooseBackupFolder") as typeof backup),"Backup folder updated.")}>Choose folder</Button>
      <Button variant="outline" disabled={busy || !backup.folder} onClick={()=>void run(async()=>setBackup(await request("backupNow") as typeof backup),"Backup verified.")}>Back up now</Button></div>
      {backup.lastBackup && <p className="panel-note">Last verified backup: {new Date(backup.lastBackup).toLocaleString()}</p>}{backup.error && <p role="alert">{backup.error}</p>}
    </Panel>
    <Panel title="Export and restore"><p className="panel-note">Export a copy before restoring. Receipts, name results and confirmed album records merge; saved preferences come from the backup. A different account's backup is rejected.</p>
      <div className="actions panel-note"><Button disabled={busy} onClick={()=>void run(()=>exportText(JSON.stringify(getState(),null,2),"neopian-desk-backup.json"),"Backup exported.")}>Export full backup</Button>
      <label className="file-button">Restore backup<input type="file" accept=".json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void run(async()=>{if(f.size>50000000)throw Error("Choose a backup below 50 MB.");const source=await f.text();await restoreBackup(JSON.parse(source),source);},"Backup restored.");}}/></label></div>
      <p className="panel-note muted">{Object.keys(store.names.records).length} name results · {store.native.purchases.length} purchases · {Object.keys(store.native.browser.albums).length} album pages</p>
    </Panel><Feedback message={message}/><p className="muted text-small">Interface controls include AdminCN by shadcn/studio, MIT license.</p>
  </div>;
}
