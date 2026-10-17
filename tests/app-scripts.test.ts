import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { EventEmitter } from "node:events";
import * as domain from "../desktop/domain";
import { emptyTraining, syncTraining } from "../src/core/training";
import { defaultReminders } from "../src/core/timers";
import { Storage } from "../desktop/storage.cjs";
import { BrowserBridge } from "../desktop/browser-bridge.cjs";

test("a paused training script keeps timers and reconciles new observations only when enabled", () => {
  assert.equal(emptyTraining().enabled, false);
  const now = Date.now();
  const snapshot = {
    account: "test_account",
    school: "academy" as const,
    observedAt: now,
    courses: [
      { pet: "test_pet", level: 10, course: "Level", dueAt: now + 3600000 },
    ],
  };
  const off = syncTraining(emptyTraining(), [], [snapshot], now);
  assert.deepEqual(off.state, emptyTraining());
  assert.deepEqual(off.timers, []);
  const on = syncTraining({ ...off.state, enabled: true }, [], [snapshot], now);
  assert.equal(on.timers.length, 1);
  const paused = syncTraining(
    { ...on.state, enabled: false },
    on.timers,
    [],
    now,
  );
  assert.deepEqual(paused.timers, on.timers);
  assert.deepEqual(paused.state.groups, on.state.groups);
});

test("startup resets only the training switch and preserves records and timers on disk", async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "desk-session-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const storage = new Storage(folder, domain);
  await storage.open();
  const saved = {
    ...domain.createInitialState(),
    revision: 1,
    training: { ...emptyTraining(), enabled: true },
    profile: { account: "test_account", pets: ["test_pet"], closetURL: "" },
    legacy: {
      nd_reminders: JSON.stringify({
        ...defaultReminders,
        timers: [
          {
            id: "training-kept",
            title: "Existing training",
            dueAt: Date.now() + 600000,
            url: "https://www.neopets.com/",
          },
        ],
      }),
    },
  };
  await storage.commit(() => saved);
  const reopened = new Storage(folder, domain);
  await reopened.open();
  await reopened.commit(domain.startSession);
  assert.deepEqual(reopened.state, {
    ...saved,
    revision: 2,
    training: { ...saved.training, enabled: false },
  });
  assert.deepEqual(
    JSON.parse(await readFile(path.join(folder, "state.json"), "utf8")),
    reopened.state,
  );
  await reopened.commit(domain.startSession);
  assert.equal(reopened.state.revision, 2);
});

test("browser connection starts off, can stop/restart and retains its pairing key", async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "desk-connection-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  await writeFile(
    path.join(folder, "bridge-settings.json"),
    '{"enabled":true}',
  );
  const storage = new Storage(folder, domain);
  await storage.open();
  const bridge = new BrowserBridge(storage, domain, () => {}, 0);
  t.after(() => bridge.stop());
  assert.equal(bridge.ready, false);
  assert.equal(bridge.server, null);
  await assert.rejects(bridge.setEnabled(true), /username/);
  assert.equal(bridge.ready, false);
  await storage.commit((s) => ({
    ...s,
    revision: s.revision + 1,
    profile: { ...s.profile, account: "test_account" },
  }));
  await bridge.setEnabled(true);
  const key = await readFile(path.join(folder, "pairing-key"), "utf8");
  const url = `http://127.0.0.1:${bridge.port}/v1/profile`;
  assert.equal(
    (await fetch(url, { headers: { Authorization: `Bearer ${key}` } })).status,
    200,
  );
  await bridge.setEnabled(false);
  assert.equal(bridge.server, null);
  await assert.rejects(fetch(url));
  await bridge.setEnabled(true);
  assert.equal(bridge.key, key);
  await bridge.setEnabled(false);
  const next = new BrowserBridge(storage, domain, () => {}, 0);
  assert.equal(next.ready, false);
  assert.equal(await readFile(path.join(folder, "pairing-key"), "utf8"), key);
});

test("overlay switch stops even when prices need connection, cancels jumping and ignores late output", async () => {
  const children: any[] = [];
  let refreshes = 0;
  const module = { exports: {} as any };
  const source = await readFile(
    new URL("../desktop/overlay.cjs", import.meta.url),
    "utf8",
  );
  vm.runInNewContext(source, {
    module,
    __dirname: "/test/desktop",
    process: { platform: "win32", resourcesPath: "/test" },
    setInterval: () => 0,
    clearInterval() {},
    setTimeout,
    clearTimeout,
    require(name: string) {
      if (name === "node:child_process")
        return {
          spawn() {
            const child: any = new EventEmitter();
            child.stdout = new EventEmitter();
            child.stderr = new EventEmitter();
            child.stdin = { writable: true, write() {} };
            child.kill = () => {
              child.killed = true;
            };
            children.push(child);
            return child;
          },
        };
      if (name === "node:path") return path;
      if (name === "node:fs") return { existsSync: () => true };
      if (name === "node:events") return { EventEmitter };
      if (name === "electron") return { app: { isPackaged: true } };
      if (name === "./domain.cjs") return domain;
      if (name === "./shop-helper-data.json") return { shops: [] };
      throw Error(name);
    },
  });
  const helper = new module.exports.Overlay(
    { state: domain.createInitialState() },
    {
      refresh: () => {
        refreshes++;
      },
      cancel() {},
    },
    () => {},
  );
  assert.equal(helper.status().enabled, false);
  assert.equal(helper.status().autoJump, false);
  await assert.rejects(
    helper.action({ action: "options", autoJump: true }),
    /Shop Helper/,
  );
  await helper.action({ action: "enabled", enabled: true });
  helper.receive({ type: "ready" });
  assert.equal(helper.status().running, true);
  await helper.action({ action: "options", autoJump: true });
  helper.needsConnection = true;
  const batch = { cancelled: false };
  helper.batch = batch;
  await helper.action({ action: "enabled", enabled: false });
  assert.equal(helper.status().running, false);
  assert.equal(helper.status().autoJump, false);
  assert.equal(batch.cancelled, true);
  assert.equal(children[0].killed, true);
  children[0].stdout.emit("data", Buffer.from('{"type":"ready"}\n'));
  assert.equal(helper.status().running, false);
  assert.equal(refreshes, 0);
  await helper.action({ action: "enabled", enabled: true });
  assert.equal(children.length, 2);
  assert.equal(helper.status().autoJump, false);
  children[0].emit("error", Error("Old process stopped"));
  assert.equal(helper.status().enabled, true);
  await helper.action({ action: "options", autoJump: true });
  children[1].emit("exit");
  assert.equal(helper.status().enabled, false);
  assert.equal(helper.status().autoJump, false);
  helper.stop();
});
