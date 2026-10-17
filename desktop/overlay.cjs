const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const { app } = require("electron");
const domain = require("./domain.cjs");
class Overlay extends EventEmitter {
  constructor(storage, prices, publish) {
    super();
    this.storage = storage;
    this.prices = prices;
    this.publish = publish;
    this.enabled = false;
    this.running = false;
    this.available = process.platform === "win32";
    this.message = this.available
      ? "Price tags are off."
      : "The native price overlay requires Windows.";
    this.rows = [];
    this.options = { autoJump: false, testItem: "" };
    this.catalogue = new Map();
    this.attempted = new Map();
    const source = require("./shop-helper-data.json");
    for (const item of [
      ...source.shops.flatMap((s) => s.items),
      ...(source.extraItems || []),
    ]) {
      const old = this.catalogue.get(item.name);
      if (!old || old.priceDate < item.priceDate)
        this.catalogue.set(item.name, item);
    }
  }
  status() {
    const state = {
      available: this.available,
      enabled: this.enabled,
      running: this.running,
      permission: true,
      message: this.message,
      ...this.options,
      priceNeedsConnection: this.needsConnection === true,
      priceCanRefresh: this.running && !this.priceBusy,
      priceBusy: !!this.priceBusy,
      priceMessage:
        this.priceMessage ||
        "Saved estimates are dated. Open an item page to refresh.",
      batchRunning: !!this.batch,
      batchMessage: this.batchMessage || "",
    };
    this.publish("desk-shop-helper-state", state);
    return state;
  }
  async action(body) {
    if (body.action === "status") return this.status();
    if (body.action === "enabled") {
      if (body.enabled) await this.start();
      else this.stop();
    } else if (body.action === "refreshPrices") await this.refresh(true);
    else if (body.action === "permission")
      this.message =
        "Windows accessibility reads supported pages in Chrome or Edge while Prices is on. No extra permission is needed.";
    else if (body.action === "options") {
      if (body.autoJump && !this.enabled)
        throw Error(
          "Turn Shop Helper on before enabling Jump to expensive finds.",
        );
      this.options.autoJump = body.autoJump === true;
      if (!this.options.autoJump) this.stopBatch();
      this.send({ action: "options", ...this.options });
    } else if (body.action === "setTestItem") {
      if (typeof body.name !== "string" || body.name.length > 200)
        throw Error("Use an exact item name below 200 characters.");
      this.options.testItem = body.name.trim();
      this.send({ action: "options", ...this.options });
    } else throw Error("Unknown price helper action.");
    return this.status();
  }
  async start() {
    if (!this.available)
      throw Error("The native price overlay requires Windows.");
    if (this.child) return;
    const file = app.isPackaged
      ? path.join(process.resourcesPath, "overlay/NeopianDesk.Overlay.exe")
      : path.join(__dirname, "../windows/publish/NeopianDesk.Overlay.exe");
    if (!fs.existsSync(file))
      throw Error("The Windows overlay is missing from this installation.");
    const child = spawn(file, [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.child = child;
    this.enabled = true;
    this.message = "Starting Windows price tags…";
    let buffer = "";
    child.stdout.on("data", (chunk) => {
      if (this.child !== child) return;
      buffer += chunk.toString();
      if (buffer.length > 2000000) {
        this.message = "Overlay response was too large.";
        this.stop();
        return;
      }
      let at;
      while ((at = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, at);
        buffer = buffer.slice(at + 1);
        try {
          this.receive(JSON.parse(line));
        } catch (e) {
          this.message = "The overlay returned an unreadable response.";
          this.status();
        }
      }
    });
    child.on("error", (e) => {
      if (this.child !== child) return;
      this.message = e.message;
      this.stop();
    });
    child.on("exit", () => {
      if (this.child !== child) return;
      this.child = null;
      this.stop();
    });
    child.stderr.on("data", () => {});
    this.lastResponse = Date.now();
    this.watchdog = setInterval(() => {
      if (Date.now() - this.lastResponse > 12000) {
        this.message =
          "Browser accessibility stopped responding. Turn Prices on again to retry.";
        this.stop();
      }
    }, 2000);
    this.status();
  }
  send(command) {
    if (this.child?.stdin.writable)
      this.child.stdin.write(JSON.stringify(command) + "\n");
  }
  priceRows() {
    const estimates = domain.readEstimates(this.storage.state.legacy);
    const rows = new Map(this.catalogue);
    for (const [name, value] of Object.entries(estimates.items)) {
      if (value.value)
        rows.set(name, {
          name,
          estimatedValue: value.value,
          priceDate: value.priceDate,
          flags: value.error ? [value.error] : [],
          watched: !value.error,
        });
    }
    return [...rows.values()];
  }
  syncPrices() {
    this.send({ action: "prices", items: this.priceRows() });
  }
  receive(message) {
    if (!this.enabled) return;
    this.lastResponse = Date.now();
    if (message.type === "ready") {
      this.running = true;
      this.syncPrices();
      this.send({ action: "options", ...this.options });
      this.send({ action: "start" });
    } else if (message.type === "observation") {
      this.rows = message.data.items;
      this.message = message.data.message;
      this.latest = message.data;
      this.emit("observation", message.data);
      if (this.rows.length && !this.priceBusy && !this.prices.pending)
        void this.refresh(false).catch(() => {});
    } else if (message.type === "error") this.message = message.message;
    this.status();
  }
  async refresh(interactive) {
    if (!this.enabled) {
      if (interactive)
        throw Error("Turn Shop Helper on before refreshing prices.");
      return;
    }
    if (this.priceBusy) return;
    const child = this.child;
    const names = [...new Set(this.rows.map((r) => r.name))]
      .filter(
        (n) =>
          interactive || Date.now() - (this.attempted.get(n) || 0) > 600000,
      )
      .slice(0, 40);
    if (!names.length) {
      if (interactive)
        throw Error("Open a supported page with visible items first.");
      return;
    }
    this.priceBusy = true;
    names.forEach((n) => this.attempted.set(n, Date.now()));
    this.status();
    try {
      const raw = await this.prices.refresh(names, interactive);
      if (!this.enabled || this.child !== child) return;
      const now = new Date().toISOString();
      let report;
      const state = await this.storage.commit((old) => {
        if (!this.enabled || this.child !== child) return old;
        report = domain.mergeEstimates(
          domain.readEstimates(old.legacy),
          raw,
          now,
          names.map((name) => ({ name })),
        );
        return {
          ...old,
          revision: old.revision + 1,
          legacy: {
            ...old.legacy,
            [domain.estimateKey]: JSON.stringify(report.estimates),
          },
        };
      });
      if (!report) return;
      this.publish("desk-state", state);
      this.syncPrices();
      this.needsConnection = false;
      this.priceMessage = `${report.updated} estimates updated; ${report.failed} unavailable. Previous valid estimates retained.`;
    } catch (e) {
      this.needsConnection = e.code === "CONNECTION";
      this.priceMessage = e.message;
      if (interactive) throw e;
    } finally {
      this.priceBusy = false;
      this.status();
    }
  }
  async openShops(ids, open) {
    if (this.batch)
      throw Error("Stop the current shop check before opening another group.");
    const token = { cancelled: false, input: undefined };
    const checking = this.running && this.options.autoJump;
    this.batch = token;
    this.batchMessage = "Opening shops…";
    this.status();
    let opened = 0,
      selected;
    const deadline = Date.now() + 45000;
    try {
      for (const id of ids) {
        if (token.cancelled) break;
        const url =
          "https://www.neopets.com/objects.phtml?type=shop&obj_type=" + id;
        await open(url);
        opened++;
        if (checking && !selected && Date.now() < deadline) {
          const observation = await this.waitForShop(
            id,
            token,
            Math.min(3500, deadline - Date.now()),
          );
          if (observation?.find) selected = observation;
        }
      }
      if (selected && !token.cancelled)
        this.send({
          action: "select",
          url: selected.url,
          window: selected.window,
          tab: selected.tab,
          lastInput: selected.lastInput,
        });
      this.batchMessage = token.cancelled
        ? `Stopped after opening ${opened} shops. Existing tabs stay open.`
        : selected
          ? `Opened ${opened} shops. Returning to ${selected.find}.`
          : `Opened ${opened} shops.${checking ? " No qualifying find confirmed during this check." : ""}`;
    } finally {
      if (this.batch === token) this.batch = null;
      this.status();
    }
  }
  waitForShop(id, token, timeout) {
    return new Promise((resolve) => {
      let timer;
      const finish = (value) => {
        clearTimeout(timer);
        this.off("observation", receive);
        resolve(value);
      };
      const receive = (data) => {
        if (token.cancelled) return finish(null);
        if (token.input === undefined) token.input = data.lastInput;
        if (token.input !== undefined && data.lastInput !== token.input) {
          token.cancelled = true;
          return finish(null);
        }
        try {
          const url = new URL(data.url);
          if (
            url.pathname === "/objects.phtml" &&
            url.searchParams.get("obj_type") === String(id) &&
            data.items.length
          )
            finish(data);
        } catch {}
      };
      this.on("observation", receive);
      timer = setTimeout(() => finish(null), timeout);
    });
  }
  stopBatch() {
    if (this.batch) this.batch.cancelled = true;
    this.emit("observation", this.latest || {});
    this.batchMessage = "Batch check stopped. Opened tabs remain open.";
    this.status();
  }
  stop() {
    this.stopBatch();
    this.enabled = false;
    this.running = false;
    this.options.autoJump = false;
    if (this.priceBusy) this.prices.cancel();
    this.send({ action: "close" });
    const child = this.child;
    this.child = null;
    child?.kill();
    clearInterval(this.watchdog);
    this.status();
  }
}
module.exports = { Overlay };
