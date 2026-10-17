import trainingRelease from "../data/training-script.json";
import { TrainingHelper } from "./TrainingHelper";
import { useEffect, useRef, useState } from "react";
import catalogues from "../data/catalogues.json";
import { isNative, nativeMessage } from "../core/bridge";
import { useStore } from "../persistence/store";
import {
  Button,
  Panel,
  Disclosure,
  CopyButton,
  Feedback,
  useAction,
} from "../components/shared";
import { InfoHelp } from "../components/InfoHelp";
import { TrackerConnectionHelp } from "./TrackerConnectionHelp";
import { SavedScripts } from "./SavedScripts";
import type { HelperState } from "../core/shop-helper";
import { helperAction, helperStatus } from "../core/shop-helper";

export function ScriptsAndLogs({
  helper,
  section,
}: {
  helper: HelperState;
  section: "app" | "tampermonkey";
}) {
  const store = useStore();
  const [connection, setConnection] = useState({ ready: false, error: "" });
  const { run, message } = useAction();
  const [testName, setTestName] = useState(helper.testItem ?? "");
  const editingTest = useRef(false);
  useEffect(() => {
    if (!editingTest.current) setTestName(helper.testItem ?? "");
  }, [helper.testItem]);
  useEffect(() => {
    const receive = (event: Event) => {
      const state = (event as CustomEvent).detail;
      setConnection({
        ready: state.ready === true,
        error: String(state.error || ""),
      });
    };
    window.addEventListener("desk-browser-state", receive);
    if (isNative()) nativeMessage("deskBrowser", { action: "status" });
    return () => window.removeEventListener("desk-browser-state", receive);
  }, []);
  return (
    <div className="feature-stack">
      {section === "app" && (
        <Panel title="App scripts">
          <div className="tool-row">
            <strong>Purchase and sales logging</strong>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.dispatchEvent(new Event("desk-open-settings"))
              }
            >
              Account settings
            </Button>
          </div>
          <div className="tool-row">
            <div>
              <strong>Shop Helper</strong>
              <p className="muted text-small" role="status">
                {helperStatus(helper)} ·{" "}
                {helper.enabled
                  ? helper.message
                  : "Price tags in Chrome and Edge"}
              </p>
            </div>
            <InfoHelp title="About Shop Helper">
              <p>
                Built into this computer app. It shows price previews in Neopets
                shops, other players’ shops, your inventory, SDB and shop stock.
                It does not buy, move items or change shop prices.
              </p>
              <p>
                {String(
                  helper.message ||
                    "Turn on Shop Helper, then open a supported Neopets page in Chrome or Edge.",
                )}
              </p>
              <p>
                ItemDB estimates update automatically for identified visible
                items and are shared across shops, inventory and SDB. They are
                dated market estimates.
              </p>
              <p role="status">
                {String(
                  helper.priceMessage || "Open an item page to check prices.",
                )}
              </p>
              <Button
                variant="outline"
                disabled={!isNative() || helper.priceCanRefresh !== true}
                onClick={() =>
                  nativeMessage("deskShopHelper", { action: "refreshPrices" })
                }
              >
                {helper.priceBusy === true
                  ? "Updating prices…"
                  : helper.priceNeedsConnection === true
                    ? "Connect to ItemDB"
                    : "Refresh item prices"}
              </Button>
              {helper.lastPriorityCheck ? (
                <p className="muted text-small">
                  Last search reminder: {String(helper.lastPriorityCheck)}
                </p>
              ) : null}
              <p className="muted text-small">
                Last shop check:{" "}
                {String(
                  helper.lastShopCheck || "No shop read since Desk opened.",
                )}
              </p>
              <p className="muted text-small">
                Last alert:{" "}
                {String(
                  helper.lastAlert || "No alert displayed since Desk opened.",
                )}
              </p>
              <Button
                variant="outline"
                disabled={!isNative()}
                onClick={() =>
                  void run(async () =>
                    nativeMessage("deskShopHelper", { action: "permission" }),
                  )
                }
              >
                About Windows access
              </Button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={helper.autoJump === true}
                  disabled={!isNative()}
                  onChange={(e) =>
                    void run(async () =>
                      nativeMessage("deskShopHelper", {
                        action: "options",
                        autoJump: e.target.checked,
                      }),
                    )
                  }
                />
                Jump to expensive finds
              </label>
              <label>
                Test item
                <input
                  aria-label="Item name for jump test"
                  placeholder="Paste the exact item name…"
                  value={testName}
                  maxLength={200}
                  disabled={!isNative()}
                  onFocus={() => {
                    editingTest.current = true;
                  }}
                  onBlur={() => {
                    editingTest.current = false;
                  }}
                  onChange={(event) => {
                    const name = event.target.value;
                    setTestName(name);
                    nativeMessage("deskShopHelper", {
                      action: "setTestItem",
                      name,
                    });
                  }}
                />
              </label>
              <p className="muted text-small">
                This item uses the normal watchlist while its name is here.
                Clear the field to stop testing.
              </p>
            </InfoHelp>
            <Button
              size="sm"
              variant="outline"
              disabled={!isNative()}
              onClick={() =>
                void run(async () =>
                  nativeMessage("deskShopHelper", helperAction(helper)),
                )
              }
            >
              {helper.enabled && helper.permission === false
                ? "Allow access"
                : helper.enabled
                  ? "Turn off"
                  : "Turn on"}
            </Button>
            {helper.enabled && helper.permission === false && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void run(async () =>
                    nativeMessage("deskShopHelper", {
                      action: "enabled",
                      enabled: false,
                    }),
                  )
                }
              >
                Turn off
              </Button>
            )}
          </div>
          <div className="tool-row">
            <div>
              <strong>Browser connection</strong>
              <p className="muted text-small" role="status">
                {connection.error ||
                  (connection.ready
                    ? "Ready to receive paired trackers"
                    : "Off · enable to receive browser updates")}
              </p>
            </div>
            <TrackerConnectionHelp />
            {connection.ready && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(() =>
                    nativeMessage("deskBrowser", { action: "disconnect" }),
                  )
                }
              >
                Turn connection off
              </Button>
            )}
            {!connection.ready && (
              <Button
                size="sm"
                disabled={!isNative()}
                onClick={() =>
                  void run(async () =>
                    nativeMessage("deskBrowser", { action: "connect" }),
                  )
                }
              >
                Enable connection
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!isNative()}
              onClick={() =>
                void run(
                  async () =>
                    nativeMessage("deskBrowser", { action: "copyKey" }),
                  "Connection key copied",
                )
              }
            >
              Copy connection key
            </Button>
          </div>
          <div className="panel-note muted text-small">
            In Desk: {store.native.purchases.length} purchases ·{" "}
            {Object.keys(store.native.browser.albums).length} album pages ·{" "}
            {store.native.browser.events.length} events
          </div>
        </Panel>
      )}
      {section === "app" && <TrainingHelper />}
      {section === "tampermonkey" && (
        <Panel
          title="Tampermonkey scripts"
          actions={
            <InfoHelp title="Installing browser scripts">
              <p>
                These run in Tampermonkey in Chrome or Edge. Copy a script, open
                Tampermonkey’s Dashboard, edit the existing script with the same
                name, replace its code and save. Create a new script only if it
                is not already installed.
              </p>
              <p>
                Purchase Tracker, Stamp Tracker, Training Helper and Random
                Events Logger also need the Desk connection key once. Search
                Helper adds browser shortcuts and does not need pairing.
              </p>
              <p>
                Copying a release does not update the installed browser script.
              </p>
            </InfoHelp>
          }
        >
          {[...catalogues.DESK_SCRIPT_RELEASES, trainingRelease].map((s) => (
            <div className="tool-row" key={s.id}>
              <div>
                <strong>{s.name}</strong>
                <span className="muted text-small script-version">
                  v{s.version}
                </span>
              </div>
              <InfoHelp title={s.name}>
                <p>{s.changes[0]}</p>
              </InfoHelp>
              <CopyButton
                text={s.code}
                label={`Copy ${s.name} script`}
                visibleLabel="Copy script"
              />
            </div>
          ))}
        </Panel>
      )}
      {section === "tampermonkey" && (
        <Disclosure title={`Event log · ${store.native.browser.events.length}`}>
          <div className="checklist">
            {store.native.browser.events.length ? (
              [...store.native.browser.events]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((e, i) => (
                  <div className="checklist-row" key={`${e.timestamp}-${i}`}>
                    <div>
                      <p>{e.event}</p>
                      <small>{new Date(e.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                ))
            ) : (
              <p className="empty">No events received yet.</p>
            )}
          </div>
        </Disclosure>
      )}
      {section === "tampermonkey" && <SavedScripts />}
      <Feedback message={message} />
    </div>
  );
}
