import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parseHTML } from "linkedom";
import {
  emptyTraining,
  syncTraining,
  validateTrainingSnapshot,
  type TrainingSnapshot,
} from "../src/core/training";
const now = 1800000000000;
const snapshot = (
  minutes = [125, 131, 362, 378],
  seen = now,
): TrainingSnapshot => ({
  account: "test_account",
  school: "academy",
  observedAt: seen,
  courses: minutes.map((m, i) => ({
    pet: "pet" + i,
    course: "Level",
    level: 10,
    dueAt: now + m * 60000,
  })),
});
test("groups use last finish, preserve manual timers and fit native identifiers", () => {
  const manual = {
    id: "manual",
    title: "Academy",
    url: "https://www.neopets.com/pirates/academy.phtml",
    dueAt: now + 60000,
  };
  const result = syncTraining(
    { ...emptyTraining(), enabled: true },
    [manual],
    [snapshot()],
    now,
  );
  assert.deepEqual(
    result.timers.map((t) => t.dueAt),
    [manual.dueAt, now + 131 * 60000, now + 378 * 60000],
  );
  assert.ok(
    result.timers.every((t) => t.id.length <= 160 && t.title.length <= 160),
  );
  const again = syncTraining(
    result.state,
    result.timers,
    [snapshot()],
    now + 10000,
  );
  assert.deepEqual(again, result);
});
test("reload corrections keep identity; removed timers stay dismissed; new course creates a timer", () => {
  const first = syncTraining(
    { ...emptyTraining(), enabled: true },
    [],
    [snapshot([120])],
    now,
  );
  const corrected = snapshot([110], now + 60000);
  const correction = syncTraining(
    first.state,
    first.timers,
    [corrected],
    now + 60000,
  );
  assert.equal(correction.timers[0].id, first.timers[0].id);
  assert.equal(correction.timers[0].dueAt, now + 110 * 60000);
  const dismissed = syncTraining(
    correction.state,
    [],
    [snapshot([110], now + 120000)],
    now + 120000,
  );
  assert.equal(dismissed.timers.length, 0);
  const later = syncTraining(
    dismissed.state,
    [],
    [snapshot([300], now + 180 * 60000)],
    now + 180 * 60000,
  );
  assert.equal(later.timers.length, 1);
  assert.notEqual(later.timers[0].id, first.timers[0].id);
});
test("older tabs cannot rewind courses; unpaid/free courses remove pending groups; schools remain independent", () => {
  const first = syncTraining(
    { ...emptyTraining(), enabled: true },
    [],
    [snapshot([120])],
    now,
  );
  const free = snapshot([120], now + 60000);
  free.courses[0].dueAt = null;
  free.courses[0].course = "";
  const other = { ...snapshot([360]), school: "island" as const };
  const result = syncTraining(
    first.state,
    first.timers,
    [free, other, snapshot([120])],
    now + 60000,
  );
  assert.equal(result.timers.length, 1);
  assert.ok(result.timers[0].url.includes("/island/"));
  const off = syncTraining(
    { ...result.state, enabled: false },
    result.timers,
    [],
    now + 60000,
  );
  assert.deepEqual(off.timers, result.timers);
  assert.equal(
    syncTraining({ ...off.state, enabled: true }, off.timers, [], now + 60000)
      .timers.length,
    1,
  );
});
test("reader selects adjusted visible countdown and refuses ambiguous training rows", () => {
  const source = readFileSync(
    new URL("../userscripts/sources/training-reader.js", import.meta.url),
    "utf8",
  );
  const read = runInNewContext(source + ";readTrainingSnapshot");
  const { document } = parseHTML(
    '<table><tr><td><b>Pet1 (Level 10) is currently studying Level</b></td></tr><tr><td>Lvl: 10</td><td>Time till course finishes:<span class="strikethrough"><b>7hrs,59minutes,59seconds</b></span><b>4 hrs, 48 minutes, 0 seconds</b></td></tr></table>',
  );
  const result = read(document, "academy", now, undefined, "test_account");
  assert.equal(result.courses[0].dueAt, now + (4 * 3600 + 48 * 60) * 1000);
  document
    .querySelector("tr:last-child td:last-child")
    ?.insertAdjacentHTML("beforeend", "<b>1 hrs, 0 minutes, 0 seconds</b>");
  assert.equal(read(document, "academy", now, undefined, "test_account"), null);
});
test("invalid snapshots and corrupt backups fail before changing saved timers", async () => {
  assert.throws(() =>
    validateTrainingSnapshot({
      ...snapshot(),
      courses: [{ ...snapshot().courses[0], dueAt: NaN }],
    }),
  );
  assert.throws(() =>
    validateTrainingSnapshot({ ...snapshot(), account: "invalid account" }),
  );
  const { createInitialState, validateStore, restoreBackup, getState } =
    await import("../src/persistence/store");
  Object.assign(globalThis, { window: {}, localStorage: { setItem() {} } });
  const result = syncTraining(
    { ...emptyTraining(), enabled: true },
    [],
    [snapshot()],
    now,
  );
  const { defaultReminders } = await import("../src/core/timers");
  const store = {
    ...createInitialState(),
    training: result.state,
    legacy: {
      nd_reminders: JSON.stringify({
        ...defaultReminders,
        timers: result.timers,
      }),
    },
  };
  validateStore(store);
  await restoreBackup(store);
  assert.deepEqual(getState().training, { ...result.state, enabled: false });
  assert.deepEqual(
    JSON.parse(getState().legacy.nd_reminders).timers,
    result.timers,
  );
  assert.throws(() =>
    validateStore({ ...store, training: { ...result.state, groups: null } }),
  );
});

test("an older tab acknowledgement cannot erase a newer failed delivery", async () => {
  const source = readFileSync(
    new URL("../userscripts/sources/training-sync.js", import.meta.url),
    "utf8",
  );
  const values: Record<string, unknown> = {};
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const context = (seen: number, request: () => Promise<void>) =>
    runInNewContext(source + ";syncTrainingPage", {
      DESK_ACCOUNT: "test_account",
      createDeskConnection: () => ({
        account: () => "test_account",
        request,
        errorMessage: () => "retry",
      }),
      performance: {
        timeOrigin: seen,
        now: () => 0,
        getEntriesByType: () => [],
      },
      document: { getElementById: () => ({ textContent: "" }) },
      getComputedStyle: () => ({}),
      getSchool: () => "academy",
      readTrainingSnapshot: () => snapshot([120], seen),
      setTimeout: () => {},
      GM: {
        getValue: async (k: string) => values[k],
        setValue: async (k: string, v: unknown) => {
          values[k] = v;
        },
        listValues: async () => Object.keys(values),
        deleteValue: async (k: string) => {
          delete values[k];
        },
        registerMenuCommand: () => {},
      },
    });
  const older = context(now, () => gate)();
  // Let the first tab take its queue snapshot and begin delivery.
  await new Promise((r) => setTimeout(r, 10));
  await context(now + 1000, async () => {
    throw Error("offline");
  })();
  release();
  await older;
  assert.equal(Object.keys(values).length, 1);
  assert.ok(Object.keys(values)[0].endsWith(String(now + 1000)));
  await context(now + 1000, async () => {})();
  assert.equal(Object.keys(values).length, 0);
});
