declare global {
  interface Window {
    deskInitialState?: unknown;
    deskDesktop?: {
      request(action:string,payload:Record<string,unknown>):Promise<unknown>;
      channel(channel:string,payload:Record<string,unknown>):Promise<void>;
      onEvent(callback:(name:string,data:unknown)=>void):()=>void;
    };
  }
}
if(typeof window!=="undefined" && window.deskDesktop) {
  window.deskDesktop.onEvent((name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail})));
}
export const isNative=()=>typeof window!=="undefined" && !!window.deskDesktop;
export async function request(action:string,payload:Record<string,unknown>={}):Promise<unknown>{
  if(!window.deskDesktop)throw Error("Open the desktop app to use this feature.");
  return window.deskDesktop.request(action,payload);
}
export function nativeMessage(channel:string,payload:Record<string,unknown>){
  if(!window.deskDesktop)throw Error("Open the desktop app to use this feature.");
  const pending = window.deskDesktop.channel(channel,payload);
  void pending.catch(error=>window.dispatchEvent(new CustomEvent("desk-shops-opened",{detail:{message:String(error.message||error)}})));
  return pending;
}
export async function copyText(text:string){if(isNative())await request("copy",{text});else await navigator.clipboard.writeText(text);}
export async function exportText(text:string,filename:string,mimeType="application/json"){
  if(isNative()){await request("export",{text,filename});return;}
  const url=URL.createObjectURL(new Blob([text],{type:mimeType}));const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
