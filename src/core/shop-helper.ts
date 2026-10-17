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

// ItemDB connection is separate from the script's on/off control.
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
