import { prepareShortcuts, type Shortcut } from "../core/shortcuts";
import { updateStore } from "./store";

/** Drafts compare their original value, while unrelated queued saves are preserved. */
export async function saveShortcuts(draft: Shortcut[], original: string | undefined) {
  const prepared = prepareShortcuts(draft);
  await updateStore(s => {
    if(s.legacy.nd_header_shortcuts !== original) throw Error("Your shortcuts changed while this editor was open. Cancel and reopen it to keep the latest changes.");
    return {...s,legacy:{...s.legacy,nd_header_shortcuts:JSON.stringify(prepared)}};
  });
}
