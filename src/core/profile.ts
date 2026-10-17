export interface Profile { account: string; pets: string[]; closetURL: string }
export const emptyProfile = (): Profile => ({account:"",pets:[],closetURL:""});
export function validAccount(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9_]{1,50}$/.test(value);
}
export function validateProfile(value: unknown): asserts value is Profile {
  const p=value as Profile;
  if (!p || (p.account!=="" && !validAccount(p.account)) || !Array.isArray(p.pets) || p.pets.length>100 ||
      !p.pets.every(n=>typeof n==="string" && /^[a-zA-Z0-9_]{1,20}$/.test(n)) || new Set(p.pets.map(n=>n.toLowerCase())).size!==p.pets.length ||
      typeof p.closetURL!=="string" || p.closetURL.length>500) throw Error("Check the account name and pet names.");
  if(p.closetURL) { const u=new URL(p.closetURL); if(u.protocol!=="https:" || !["impress.openneo.net","impress-2020.openneo.net"].includes(u.hostname) || u.username || u.password) throw Error("Use your Dress to Impress HTTPS address."); }
}
