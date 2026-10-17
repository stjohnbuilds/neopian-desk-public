export interface HelperState {
  enabled?: boolean;
  permission?: boolean;
  available?: boolean;
  running?: boolean;
  message?: string;
  autoJump?: boolean;
  testItem?: string;
  [key: string]: unknown;
}

// ItemDB stops answering until its daily check is passed again. Background
// updates cannot pass it, so the header button offers the connection window.
function needsItemDB(helper: HelperState) {
  return (
    helper.running === true &&
    helper.priceNeedsConnection === true &&
    helper.priceCanRefresh === true
  );
}

export function helperStatus(helper: HelperState) {
  if (helper.available === false) return "Unavailable";
  if (!helper.enabled) return "Off";
  if (helper.permission === false) return "Needs permission";
  if (needsItemDB(helper)) return "Connect";
  return helper.running ? "On" : "Starting…";
}

export function helperAction(helper: HelperState) {
  if (helper.enabled && helper.permission === false)
    return { action: "permission" };
  if (needsItemDB(helper)) return { action: "refreshPrices" };
  return { action: "enabled", enabled: !helper.enabled };
}
