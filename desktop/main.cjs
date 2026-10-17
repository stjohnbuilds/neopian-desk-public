const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  shell,
  clipboard,
  dialog,
  Notification,
  Menu,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const domain = require("./domain.cjs");
const { Storage, atomicFile } = require("./storage.cjs");
const { BrowserBridge } = require("./browser-bridge.cjs");
const { Reminders } = require("./reminders.cjs");
const { Prices } = require("./prices.cjs");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "desk",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
app.setName("Neopian Desk");
app.setAppUserModelId("org.neopiandesk.public");
if (process.env.DESK_TEST_DATA_DIR && !app.isPackaged)
  app.setPath("userData", process.env.DESK_TEST_DATA_DIR);
if (!app.requestSingleInstanceLock()) {
  app.exit(0);
} else {
  app.on("second-instance", () => {
    window?.show();
    window?.focus();
  });
}
let window, storage, bridge, reminders, prices, overlay;
const publish = (name, data) => {
  if (window && !window.isDestroyed())
    window.webContents.send("desk-event", name, data);
};
function trusted(event) {
  if (
    !window ||
    event.sender !== window.webContents ||
    event.senderFrame !== window.webContents.mainFrame ||
    event.senderFrame.url !== "desk://app/index.html"
  )
    throw Error("Untrusted app request.");
}
function external(value) {
  if (typeof value !== "string" || value.length > 3000)
    throw Error("Invalid link.");
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw Error("Use an ordinary website link.");
  return url.href;
}
async function open(value) {
  if (value === "neopian-desk://calendar") {
    window.show();
    publish("desk-open-calendar", {});
    return;
  }
  await shell.openExternal(external(value));
}
async function openMany(urls) {
  if (
    !Array.isArray(urls) ||
    urls.length < 1 ||
    urls.length > 20 ||
    new Set(urls).size !== urls.length
  )
    throw Error("Choose between 1 and 20 different pages.");
  const valid = urls.map(external);
  for (const url of valid) await open(url);
}
ipcMain.on("desk-initial", (event) => {
  try {
    trusted(event);
    event.returnValue = storage.state;
  } catch {
    event.returnValue = null;
  }
});
ipcMain.handle("desk-request", async (event, action, payload = {}) => {
  trusted(event);
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Error("Invalid request.");
  switch (action) {
    case "save": {
      if (typeof payload.text !== "string" || payload.text.length > 50000000)
        throw Error("Invalid save.");
      const next = JSON.parse(payload.text);
      return storage.commit(() => next);
    }
    case "copy":
      if (typeof payload.text !== "string" || payload.text.length > 20000000)
        throw Error("Invalid copy.");
      clipboard.writeText(payload.text);
      return;
    case "export": {
      if (
        typeof payload.text !== "string" ||
        payload.text.length > 50000000 ||
        typeof payload.filename !== "string" ||
        !/^[-\w .]{1,100}$/.test(payload.filename)
      )
        throw Error("Invalid export.");
      const result = await dialog.showSaveDialog(window, {
        defaultPath: payload.filename,
      });
      if (result.canceled || !result.filePath) throw Error("Export cancelled.");
      await atomicFile(result.filePath, payload.text);
      return;
    }
    case "openDailyPages": {
      const data = require("./dailies.json");
      const allowed = new Set(
        data.flatMap((d) =>
          [...d.links, ...(d.shortcuts || [])].map((l) => l.url),
        ),
      );
      if (
        !Array.isArray(payload.urls) ||
        !payload.urls.every((u) => allowed.has(u))
      )
        throw Error("Unknown daily link.");
      return openMany(payload.urls);
    }
    case "openMarketSearches": {
      if (
        !Array.isArray(payload.searches) ||
        payload.searches.length < 1 ||
        payload.searches.length > 10
      )
        throw Error("Choose at most ten items.");
      const urls = payload.searches.map((s) => {
        if (
          typeof s.name !== "string" ||
          !s.name.trim() ||
          s.name.length > 200 ||
          !["wizard", "super-wizard", "trading"].includes(s.market)
        )
          throw Error("Invalid search.");
        return s.market === "trading"
          ? "https://www.neopets.com/island/tradingpost.phtml#/?" +
              new URLSearchParams({
                type: "browse",
                criteria: "item_phrase",
                sort: "newest",
                page: "1",
                search_string: s.name,
              })
          : "https://www.neopets.com/shops/wizard.phtml?" +
              new URLSearchParams({ string: s.name });
      });
      if (
        payload.copyName &&
        payload.searches.length === 1 &&
        payload.copyName === payload.searches[0].name
      )
        clipboard.writeText(payload.copyName);
      return openMany(urls);
    }
    case "openShops": {
      const ids = payload.shopIDs;
      const shops = require("./catalogues.json").ND_SHOP_NAMES;
      if (
        !Array.isArray(ids) ||
        !ids.every(
          (n) => Number.isInteger(n) && Object.hasOwn(shops, String(n)),
        )
      )
        throw Error("Unknown shop.");
      if (ids.length < 1 || ids.length > 20 || new Set(ids).size !== ids.length)
        throw Error("Choose 1–20 different shops.");
      await overlay.openShops(ids, open);
      return;
    }
    case "stopShopBatch":
      overlay?.stopBatch();
      return;
    case "backupStatus":
      return storage.backup;
    case "chooseBackupFolder": {
      const result = await dialog.showOpenDialog(window, {
        properties: ["openDirectory", "createDirectory"],
      });
      if (result.canceled) return storage.backup;
      return storage.chooseBackup(result.filePaths[0]);
    }
    case "backupNow":
      return storage.backupNow();
    case "refreshTradeEstimates":
      return prices.refresh(payload.names);
    case "cancelTradeEstimates":
      prices.cancel();
      return;
    default:
      throw Error("Unknown app action.");
  }
});
ipcMain.handle("desk-channel", async (event, channel, body = {}) => {
  trusted(event);
  if (!body || typeof body !== "object") throw Error("Invalid request.");
  if (channel === "deskBrowser") {
    if (body.action === "connect") await bridge.setEnabled(true);
    else if (body.action === "disconnect") await bridge.setEnabled(false);
    else if (body.action === "copyKey") {
      await bridge.setEnabled(true);
      clipboard.writeText(bridge.key);
    } else if (body.action !== "status" && body.action !== "importAlbum")
      throw Error("Unknown connection action.");
    publish("desk-browser-state", bridge.status());
  } else if (channel === "deskReminders") await reminders.action(body);
  else if (channel === "deskShopHelper") await overlay.action(body);
  else if (channel === "deskPetNames") {
    if (body.action === "openPetpages") {
      if (
        !Array.isArray(body.names) ||
        body.names.length > 10 ||
        !body.names.every(
          (n) => typeof n === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(n),
        )
      )
        throw Error("Choose at most ten valid names.");
      await openMany(body.names.map((n) => "https://www.neopets.com/~" + n));
      publish("desk-petpages-opened", { message: "Petpages opened." });
    } else throw Error("Unknown name action.");
  } else throw Error("Unknown channel.");
});
app
  .whenReady()
  .then(async () => {
    protocol.handle("desk", (request) => {
      const u = new URL(request.url);
      if (
        u.host !== "app" ||
        !["/index.html", "/app.js", "/app.css"].includes(u.pathname)
      )
        return new Response("Not found", { status: 404 });
      return net.fetch(
        pathToFileURL(path.join(__dirname, "../dist", u.pathname.slice(1)))
          .href,
      );
    });
    storage = new Storage(app.getPath("userData"), domain);
    storage.onBackup = (data) => publish("desk-backup-state", data);
    try {
      await storage.open();
    } catch (e) {
      const { readRecovery, recover } = require("./recovery.cjs");
      const previous = path.join(storage.directory, "state.previous.json");
      let hasPrevious = false;
      try {
        await readRecovery(previous, domain);
        hasPrevious = true;
      } catch {}
      const buttons = hasPrevious
        ? ["Restore previous save", "Choose backup…", "Quit"]
        : ["Choose backup…", "Quit"];
      const choice = await dialog.showMessageBox({
        type: "error",
        title: "Saved data needs recovery",
        message: e.message,
        detail:
          "The unreadable file will be retained separately. Choose a verified backup to continue.",
        buttons,
        cancelId: buttons.length - 1,
        defaultId: buttons.length - 1,
      });
      if (choice.response === buttons.length - 1) {
        app.quit();
        return;
      }
      let file = hasPrevious && choice.response === 0 ? previous : null;
      if (!file) {
        const selected = await dialog.showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "Desk backup", extensions: ["json"] }],
        });
        if (selected.canceled) {
          app.quit();
          return;
        }
        file = selected.filePaths[0];
      }
      try {
        await recover(storage.directory, file, domain);
        await storage.open();
      } catch (error) {
        dialog.showErrorBox("Backup could not be restored", error.message);
        app.quit();
        return;
      }
    }
    window = new BrowserWindow({
      title: "Neopian Desk",
      width: 1180,
      height: 840,
      minWidth: 390,
      minHeight: 500,
      backgroundColor: "#f6f7fb",
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "File",
          submenu: [
            {
              label: "Settings & backups",
              click: () => publish("desk-open-settings", {}),
            },
            { type: "separator" },
            { role: "quit" },
          ],
        },
        {
          label: "Edit",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "selectAll" },
          ],
        },
        {
          label: "View",
          submenu: [
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
          ],
        },
      ]),
    );
    window.webContents.session.setPermissionRequestHandler((_w, _p, cb) =>
      cb(false),
    );
    window.webContents.on("will-navigate", (event, url) => {
      if (url !== "desk://app/index.html") {
        event.preventDefault();
        void open(url).catch((e) =>
          publish("desk-shops-opened", { message: e.message }),
        );
      }
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      void open(url).catch((e) =>
        publish("desk-shops-opened", { message: e.message }),
      );
      return { action: "deny" };
    });
    bridge = new BrowserBridge(storage, domain, publish);
    reminders = new Reminders(storage.directory, Notification, publish, open);
    await reminders.start();
    prices = new Prices();
    const { Overlay } = require("./overlay.cjs");
    overlay = new Overlay(storage, prices, publish);
    await window.loadURL("desk://app/index.html");
    window.show();
    await bridge.restore();
    await overlay.restore();
    reminders.status();
    overlay.status();
  })
  .catch((e) => {
    dialog.showErrorBox("Neopian Desk could not open", e.message);
    app.quit();
  });
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  bridge?.stop();
  reminders?.stop();
  prices?.cancel();
  overlay?.stop();
});
