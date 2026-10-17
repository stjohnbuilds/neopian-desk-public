import { useState } from "react";
import { Modal } from "../components/Modal";
import { Button, Feedback, useAction } from "../components/shared";
import { useStore, updateStore } from "../persistence/store";
import { readPriorityItems, priorityKey, validPriorityItems, type PriorityItem } from "../core/trade-estimates";
const empty: PriorityItem = {name:"",slug:"",buyCeiling:0,buyAt:"",sellAt:"",quantity:"",note:""};
export function PriorityEditor({name,onClose}:{name:string;onClose:()=>void}) {
  const store=useStore();
  const [original] = useState(()=>readPriorityItems(store.legacy).find(i=>i.name===name));
  const [draft,setDraft]=useState(original ?? empty);
  const [confirm,setConfirm]=useState(false),[discard,setDiscard]=useState(false);
  const {run,busy,message}=useAction();
  const changed=JSON.stringify(draft)!==JSON.stringify(original??empty);
  const close=()=>{if(!busy){if(changed)setDiscard(true);else onClose();}};
  async function save(remove=false){await updateStore(s=>{
    const rows=readPriorityItems(s.legacy);
    if(JSON.stringify(rows.find(i=>i.name===name))!==JSON.stringify(original))throw Error("This item changed elsewhere. Reopen its editor before saving.");
    const next=rows.filter(i=>i.name!==name);
    if(!remove)next.push({...draft,name:draft.name.trim(),buyAt:draft.buyAt.trim()||draft.buyCeiling.toLocaleString()+" NP"});
    if(!validPriorityItems(next))throw Error("Enter a unique item name and a valid target between 0 and 2 billion NP.");
    return {...s,legacy:{...s.legacy,[priorityKey]:JSON.stringify(next)}};
  });onClose();}
  return <Modal title={original?"Edit priority item":"Add priority item"} onClose={close}>
    <form className="feature-stack" onSubmit={e=>{e.preventDefault();void run(()=>save());}}>
      <label>Exact item name<input required maxLength={200} disabled={busy} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label>Maximum buy price (NP)<input type="number" min={0} max={2000000000} required disabled={busy} value={draft.buyCeiling} onChange={e=>setDraft({...draft,buyCeiling:e.target.valueAsNumber})}/></label>
      <label>Buy target note<input maxLength={2000} value={draft.buyAt} onChange={e=>setDraft({...draft,buyAt:e.target.value})} placeholder="Optional range or reminder"/></label>
      <label>Sell target<input maxLength={2000} value={draft.sellAt??""} onChange={e=>setDraft({...draft,sellAt:e.target.value})}/></label>
      <label>Quantity target<input maxLength={2000} value={draft.quantity} onChange={e=>setDraft({...draft,quantity:e.target.value})}/></label>
      <label>Notes<textarea maxLength={2000} rows={3} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})}/></label>
      <label>ItemDB address ending (optional)<input pattern="[a-z0-9-]*" maxLength={200} value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value})} placeholder="The part after /item/"/></label>
      <div className="actions"><Button type="submit" disabled={busy}>Save item</Button><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>{original&&<Button type="button" variant="outline" disabled={busy} onClick={()=>setConfirm(true)}>Remove item</Button>}</div>
      {confirm&&<div role="alert"><p>Remove this target? Purchase and sale records stay saved.</p><Button type="button" disabled={busy} onClick={()=>void run(()=>save(true))}>Confirm removal</Button><Button type="button" variant="outline" onClick={()=>setConfirm(false)}>Keep item</Button></div>}
      {discard&&<div role="alert"><p>Discard your unsaved changes?</p><Button type="button" onClick={onClose}>Discard changes</Button><Button type="button" variant="outline" onClick={()=>setDiscard(false)}>Keep editing</Button></div>}
      <Feedback message={message}/>
    </form>
  </Modal>;
}
