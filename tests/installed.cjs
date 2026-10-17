const { _electron: electron, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const {
  exerciseScriptControls,
  assertScriptsOff,
  seedOldPreferences,
} = require("./script-controls.cjs");
(async () => {
  if (
    process.platform !== "win32" ||
    process.env.CI !== "true" ||
    !process.env.DESK_INSTALLED_EXE
  )
    throw Error("Installed checks require an isolated Windows CI runner.");
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.DESK_TEST_DATA_DIR;
  const data = path.join(process.env.APPDATA, "Neopian Desk");
  if (process.argv[2] === "reopen") await seedOldPreferences(data);
  const app = await electron.launch({
    executablePath: process.env.DESK_INSTALLED_EXE,
    env,
  });
  try {
    const page = await app.firstWindow();
    await page.locator(".app-shell").waitFor();
    const packaged = await app.evaluate(({ app }) => app.isPackaged);
    if (!packaged) throw Error("This is not the installed package.");
    if (process.argv[2] === "fresh") {
      const initial = await page.evaluate(() => window.deskInitialState);
      if (initial.profile.account)
        throw Error("Fresh installation contains an account.");
      await page
        .getByRole("button", { name: "Unstar Quest Log", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Star Quest Log", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Settings & backups", exact: true })
        .click();
      await page
        .getByLabel("Neopets username", { exact: true })
        .fill("install_test");
      await page
        .getByRole("button", { name: "Save settings", exact: true })
        .click();
      await expect(
        page.getByText("Account settings saved.", { exact: true }),
      ).toBeVisible();
    } else if (process.argv[2] === "release-reopen") {
      const initial = await page.evaluate(() => window.deskInitialState);
      const expected = JSON.parse(
        await fs.readFile("test-results/reinstall-expected.json", "utf8"),
      );
      assert.deepEqual(initial, expected, "Reinstall changed saved user data");
      const folder = await app.evaluate(({ app }) => app.getPath("userData"));
      assert.equal(
        path.resolve(folder).toLowerCase(),
        path.join(process.env.APPDATA, "Neopian Desk").toLowerCase(),
      );
      assert.deepEqual(
        JSON.parse(await fs.readFile(path.join(folder, "state.json"), "utf8")),
        expected,
      );
    } else {
      const initial = await page.evaluate(() => window.deskInitialState);
      if (
        initial.profile.account !== "install_test" ||
        JSON.parse(initial.legacy.nd_daily_favorites_v1).ids.includes(
          "quest-log",
        )
      )
        throw Error("Reinstall did not retain saved data.");
    }
    const appPath = await app.evaluate(({ app }) => app.getAppPath());
    const helper = (
      await fs.stat(
        path.join(path.dirname(appPath), "overlay", "NeopianDesk.Overlay.exe"),
      )
    ).size;
    if (helper < 1000000)
      throw Error("Self-contained overlay was not included.");
    if (process.argv[2] === "fresh") {
      await page.keyboard.press("Escape");
      await exerciseScriptControls(page, data);
      const key = await fs.readFile(path.join(data, "pairing-key"), "utf8");
      const now = Date.now();
      const response = await fetch("http://127.0.0.1:47831/v1/training", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: "install_test",
          school: "academy",
          observedAt: now,
          courses: [
            {
              pet: "test_pet",
              course: "Level",
              level: 10,
              dueAt: now + 3600000,
            },
          ],
        }),
      });
      assert.equal(response.status, 200);
      const saved = JSON.parse(
        await fs.readFile(path.join(data, "state.json"), "utf8"),
      );
      assert.equal(JSON.parse(saved.legacy.nd_reminders).timers.length, 1);
      await fs.writeFile(
        "test-results/installed-session-expected.json",
        JSON.stringify(saved),
      );
    } else {
      await assertScriptsOff(page);
      if (process.argv[2] === "reopen") {
        const expected = JSON.parse(
          await fs.readFile(
            "test-results/installed-session-expected.json",
            "utf8",
          ),
        );
        expected.training.enabled = false;
        expected.revision++;
        assert.deepEqual(
          await page.evaluate(() => window.deskInitialState),
          expected,
        );
        const saved = JSON.parse(
          await fs.readFile(path.join(data, "state.json"), "utf8"),
        );
        assert.ok(saved.revision >= expected.revision);
        assert.deepEqual({ ...saved, revision: expected.revision }, expected);
      }
    }

    await page.screenshot({
      path: "test-results/installed-" + process.argv[2] + ".png",
    });
    console.log("Installed package " + process.argv[2] + " checked.");
  } finally {
    await app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
