import { useStore } from "../persistence/store";
import { RefreshCw } from "lucide-react";
import { isNative } from "../core/bridge";
import { estimateTargets } from "../core/trade-estimates";
import {
  refreshTradeEstimates,
  cancelTradeRefresh,
  useTradeRefresh,
} from "../core/trade-refresh";
import { Button, Feedback } from "../components/shared";
export function RefreshTradeEstimates() {
  const targets = estimateTargets(useStore().legacy);
  const { busy, message } = useTradeRefresh();
  return (
    <div className="panel-note">
      <div className="actions">
        <Button
          variant="outline"
          disabled={busy || !isNative()}
          onClick={() => void refreshTradeEstimates()}
        >
          <RefreshCw size={14} />
          {busy ? "Refreshing…" : "Refresh estimates"}
        </Button>
        {busy && (
          <Button variant="outline" onClick={() => void cancelTradeRefresh()}>
            Cancel refresh
          </Button>
        )}
        <span className="muted text-small">
          All {targets.length} priority and shortlist items · ItemDB
        </span>
      </div>
      {!isNative() && (
        <p className="muted text-small">Open the desktop app to refresh prices.</p>
      )}
      <Feedback message={message} />
    </div>
  );
}
