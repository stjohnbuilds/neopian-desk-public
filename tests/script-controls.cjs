const { expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const labels = [
  "Shop Helper",
  "Jump to expensive finds",
  "Browser connection",
  "Automatic training timers",
];
async function openScripts(page) {
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Tools", exact: true })
    .click();
  await page.getByRole("button", { name: "App scripts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "App scripts", exact: true }),
  ).toBeVisible();
}
async function scriptState(page, channel) {
  return page.evaluate(
    async (channel) =>
      new Promise((resolve, reject) => {
        const event =
          channel === "deskBrowser"
            ? "desk-browser-state"
            : "desk-shop-helper-state";
        const stop = window.deskDesktop.onEvent((name, data) => {
          if (name === event) {
            stop();
            resolve(data);
          }
        });
        window.deskDesktop.channel(channel, { action: "status" }).catch(reject);
      }),
    channel,
  );
}
async function assertScriptsOff(page) {
  await openScripts(page);
  for (const name of labels)
    await expect(
      page.getByRole("switch", { name, exact: true }),
    ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Copy connection key", exact: true }),
  ).toBeDisabled();
  assert.equal((await scriptState(page, "deskBrowser")).ready, false);
  const helper = await scriptState(page, "deskShopHelper");
  assert.equal(helper.enabled, false);
  assert.equal(helper.running, false);
  assert.equal(helper.autoJump, false);
  await expect(page.locator(".helper-toggle")).toHaveCount(0);
}
async function exerciseScriptControls(page, data) {
  await assertScriptsOff(page);
  await page.screenshot({ path: "test-results/app-scripts-wide.png" });
  const size = page.viewportSize();
  await page.setViewportSize({ width: 430, height: 850 });
  await page.screenshot({
    path: "test-results/app-scripts-narrow.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  await page.setViewportSize(size || { width: 1180, height: 840 });
  const training = page.getByRole("switch", {
    name: "Automatic training timers",
    exact: true,
  });
  const saved = JSON.parse(
    await fs.readFile(path.join(data, "state.json"), "utf8"),
  );
  const timers = saved.legacy.nd_reminders;
  await training.focus();
  await page.keyboard.press("Space");
  await expect(training).toBeChecked();
  await expect(training).toBeFocused();
  await training.click();
  await expect(training).not.toBeChecked();
  assert.deepEqual(
    JSON.parse(
      JSON.parse(await fs.readFile(path.join(data, "state.json"), "utf8"))
        .legacy.nd_reminders,
    ).timers,
    timers ? JSON.parse(timers).timers : [],
  );
  const connection = page.getByRole("switch", {
    name: "Browser connection",
    exact: true,
  });
  await connection.click();
  await expect(connection).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Copy connection key", exact: true }),
  ).toBeEnabled();
  const key = await fs.readFile(path.join(data, "pairing-key"), "utf8");
  const port = (await scriptState(page, "deskBrowser")).port;
  await connection.click();
  await expect(connection).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Copy connection key", exact: true }),
  ).toBeDisabled();
  await assert.rejects(
    fetch(`http://127.0.0.1:${port}/v1/profile`, {
      headers: { Authorization: `Bearer ${key}` },
    }),
  );
  // Leave all available scripts enabled. The next launch must still be off.
  await connection.click();
  await expect(connection).toBeChecked();
  assert.equal(await fs.readFile(path.join(data, "pairing-key"), "utf8"), key);
  await training.click();
  await expect(training).toBeChecked();
  if (process.platform === "win32") {
    const helper = page.getByRole("switch", {
      name: "Shop Helper",
      exact: true,
    });
    const jump = page.getByRole("switch", {
      name: "Jump to expensive finds",
      exact: true,
    });
    await helper.click();
    await expect(helper).toBeChecked();
    await expect
      .poll(async () => (await scriptState(page, "deskShopHelper")).running, {
        timeout: 30000,
      })
      .toBe(true);
    await jump.click();
    await expect(jump).toBeChecked();
    await helper.click();
    await expect(helper).not.toBeChecked();
    await expect(jump).not.toBeChecked();
    await expect(jump).toBeDisabled();
    assert.equal((await scriptState(page, "deskShopHelper")).running, false);
    await helper.click();
    await expect(helper).toBeChecked();
    await expect
      .poll(async () => (await scriptState(page, "deskShopHelper")).running, {
        timeout: 30000,
      })
      .toBe(true);
    await jump.click();
    await expect(jump).toBeChecked();
  }
  await page
    .getByRole("button", { name: "Tampermonkey scripts", exact: true })
    .click();
  await expect(page.getByRole("switch")).toHaveCount(0);
  await openScripts(page);
}
async function seedOldPreferences(data) {
  await fs.writeFile(
    path.join(data, "overlay-settings.json"),
    '{"enabled":true,"autoJump":true}',
  );
  await fs.writeFile(
    path.join(data, "bridge-settings.json"),
    '{"enabled":true}',
  );
}
module.exports = {
  assertScriptsOff,
  exerciseScriptControls,
  seedOldPreferences,
  scriptState,
};
