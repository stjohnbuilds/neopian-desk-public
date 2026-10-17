const { _electron: electron, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const {
  exerciseScriptControls,
  assertScriptsOff,
  seedOldPreferences,
} = require("./script-controls.cjs");
(async () => {
  const installed = process.env.DESK_INSTALLED_EXE;
  if (installed && (process.platform !== "win32" || process.env.CI !== "true"))
    throw Error("Installed journeys require an isolated Windows CI runner.");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "desk-desktop-test-"));
  const data = installed
    ? path.join(process.env.APPDATA, "Neopian Desk")
    : path.join(root, "data");
  await fs.mkdir("test-results", { recursive: true });
  const env = { ...process.env, DESK_TEST_DATA_DIR: data };
  if (installed) {
    delete env.DESK_TEST_DATA_DIR;
    await assert.rejects(fs.access(path.join(data, "state.json")), {
      code: "ENOENT",
    });
  }
  delete env.ELECTRON_RUN_AS_NODE;
  const errors = [];
  let app;
  async function launch() {
    app = await electron.launch(
      installed ? { executablePath: installed, env } : { args: ["."], env },
    );
    if (installed) {
      const runtime = await app.evaluate(({ app }) => ({
        packaged: app.isPackaged,
        folder: app.getPath("userData"),
        version: app.getVersion(),
      }));
      assert.equal(runtime.packaged, true);
      assert.equal(
        path.resolve(runtime.folder).toLowerCase(),
        path.resolve(data).toLowerCase(),
      );
      console.log("Installed runtime: " + JSON.stringify(runtime));
    }
    const page = await app.firstWindow();
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(15000);
    await page.locator(".app-shell").waitFor();
    return page;
  }
  async function state() {
    return JSON.parse(await fs.readFile(path.join(data, "state.json"), "utf8"));
  }
  try {
    let page = await launch();
    const initial = await page.evaluate(() => window.deskInitialState);
    assert.equal(initial.profile.account, "");
    assert.deepEqual(initial.profile.pets, []);
    assert.deepEqual(initial.legacy, {});
    await expect(
      page.getByRole("button", { name: "Unstar Quest Log", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Unstar Quest Log", exact: true })
      .focus();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("button", { name: "Star Quest Log", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Star Quest Log", exact: true }),
    ).toBeFocused();
    await expect
      .poll(async () =>
        JSON.parse((await state()).legacy.nd_daily_favorites_v1).ids.includes(
          "quest-log",
        ),
      )
      .toBe(false);
    await page
      .getByRole("button", { name: "Star Quest Log", exact: true })
      .press("Space");
    await expect(
      page.getByRole("button", { name: "Unstar Quest Log", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Settings & backups", exact: true })
      .click();
    const settings = page.getByRole("dialog", { name: "Settings & backups" });
    await expect(settings).toBeVisible();
    await settings
      .getByLabel("Neopets username", { exact: true })
      .fill("test_account");
    await settings.getByLabel("Pet names, one per line").fill("test_pet");
    await settings
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(
      settings.getByText("Account settings saved.", { exact: true }),
    ).toBeVisible();
    await expect(
      settings.getByLabel("Neopets username", { exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(settings).not.toBeVisible();
    // No backup folder is chosen until the ordinary local-save journeys finish.
    await assert.rejects(fs.access(path.join(data, "backup-location.json")), {
      code: "ENOENT",
    });
    assert.equal((await state()).profile.account, "test_account");
    for (const name of [
      "Profits",
      "Trophy",
      "Items",
      "Personalization",
      "Tools",
      "Dailies",
    ]) {
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name, exact: true })
        .click();
      await expect(page.locator("main")).toBeVisible();
      if (name === "Personalization")
        await expect(
          page.getByRole("navigation", { name: "Personalization sections" }),
        ).toBeVisible();
      else
        await expect(
          page.getByRole("heading", { name, exact: true, level: 1 }),
        ).toBeVisible();
    }
    await page.screenshot({ path: "test-results/dailies-wide.png" });
    await page.setViewportSize({ width: 430, height: 850 });
    await page.screenshot({ path: "test-results/dailies-narrow.png" });
    assertWidth(
      await page.evaluate(() => ({
        w: innerWidth,
        scroll: document.documentElement.scrollWidth,
      })),
    );
    await page.setViewportSize({ width: 1180, height: 840 });
    await page
      .getByRole("button", { name: "Edit quick links", exact: true })
      .click();
    const shortcuts = page.getByRole("dialog", {
      name: "Quick links",
      exact: true,
    });
    await shortcuts
      .getByRole("button", { name: "Add shortcut", exact: true })
      .click();
    await shortcuts
      .getByLabel("Shortcut destination", { exact: true })
      .selectOption("custom");
    await shortcuts
      .getByLabel("Shortcut name", { exact: true })
      .fill("My test link");
    await shortcuts
      .getByLabel("Shortcut link", { exact: true })
      .fill("https://www.neopets.com/");
    await shortcuts.getByRole("button", { name: "Save", exact: true }).click();
    await expect(shortcuts).not.toBeVisible();

    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Trophy", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Paste avatar source", exact: true })
      .click();
    const avatarImport = page.getByRole("dialog", {
      name: "Import collected avatars",
      exact: true,
    });
    const source =
      '<div id="SelectAvatarPopup"><div class="settings-avatars"><div class="settings-av" id="defaultAvvie"><img src="//images.neopets.com/neoboards/avatars/default.gif" alt="Default"></div></div><p>Secret Avatars:</p><div class="settings-avatars"><div class="settings-av" id="pet_rockAvvie"><img src="//images.neopets.com/neoboards/avatars/pet_rock.gif" alt="I Love My Rock"></div></div></div>';
    await avatarImport
      .getByLabel("Neoboard Settings HTML", { exact: true })
      .fill(source);
    await avatarImport
      .getByRole("button", { name: "Review avatars", exact: true })
      .click();
    await expect(
      avatarImport.getByText("1 to add · 0 already collected", { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: "test-results/avatar-import-wide.png" });
    await page.setViewportSize({ width: 430, height: 850 });
    await page.screenshot({ path: "test-results/avatar-import-narrow.png" });
    await avatarImport
      .getByRole("button", { name: "Import collected avatars", exact: true })
      .click();
    await expect(avatarImport).not.toBeVisible();
    await page.getByLabel("Show collected", { exact: true }).check();
    await page
      .getByRole("searchbox", { name: "Find an avatar", exact: true })
      .fill("I Love My Rock");
    const collected = page.getByRole("checkbox", {
      name: "Collected I Love My Rock",
      exact: true,
    });
    await expect(collected).toBeChecked();
    await collected.click();
    await expect(collected).not.toBeChecked();
    await collected.click();
    await expect(collected).toBeChecked();
    await page.setViewportSize({ width: 1180, height: 840 });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Personalization", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit code", exact: true })
      .first()
      .click();
    const editor = page.getByRole("dialog", {
      name: "User lookup",
      exact: true,
    });
    await editor
      .getByLabel("Page HTML", { exact: true })
      .fill("<h1>Test page</h1>");
    await page.keyboard.press("Escape");
    await expect(
      editor.getByText("Discard the unsaved changes?", { exact: true }),
    ).toBeVisible();
    await editor
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    await editor
      .getByRole("button", { name: "Save code", exact: true })
      .click();
    await expect(
      editor.getByText("Code saved.", { exact: true }),
    ).toBeVisible();
    await editor
      .getByRole("button", { name: "Copy saved code", exact: true })
      .click();
    const copied = await app.evaluate(({ clipboard }) => clipboard.readText());
    if (copied !== "<h1>Test page</h1>")
      throw Error("Copied page differs from saved code");
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Account information", exact: true })
      .click();
    await page.getByRole("button", { name: "Add notes", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Account notes", exact: true })
      .fill("My local test note");
    await page.getByRole("button", { name: "Save notes", exact: true }).click();
    await expect(
      page.getByText("Account notes saved.", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Open calendar", exact: true })
      .click();
    const calendar = page.getByRole("dialog", {
      name: "Calendar",
      exact: true,
    });
    await calendar
      .getByLabel("Add your own date to this day", { exact: true })
      .fill("My test date");
    await calendar.getByRole("button", { name: /^Add to / }).click();
    await expect(
      calendar.getByText("Date saved", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Tools", exact: true })
      .click();
    await page.getByRole("button", { name: "Pet Hunt", exact: true }).click();
    await page
      .getByLabel("Try your own name", { exact: true })
      .fill("testcandidate");
    await page.getByRole("button", { name: "Use", exact: true }).click();
    const nameEditor = page.getByRole("dialog", {
      name: "Edit Testcandidate",
      exact: true,
    });
    await nameEditor
      .getByLabel("Name notes", { exact: true })
      .fill("My saved name note");
    await nameEditor
      .getByRole("button", { name: "Save note", exact: true })
      .click();
    await expect(nameEditor).not.toBeVisible();
    await page.getByRole("button", { name: "Timers", exact: true }).click();
    const timers = page.getByRole("dialog", {
      name: "Your timers",
      exact: true,
    });
    await timers.getByLabel("Minutes", { exact: true }).fill("120");
    await timers
      .getByRole("button", { name: "Start timer", exact: true })
      .click();
    await expect(
      timers.getByRole("button", { name: "Restart timer", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Profits", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Shop Restocks", exact: true })
      .click();
    await page.getByRole("button", { name: "Add item", exact: true }).click();
    const target = page.getByRole("dialog", { name: "Add priority item" });
    await target
      .getByLabel("Exact item name", { exact: true })
      .fill("Test Item");
    await target
      .getByLabel("Maximum buy price (NP)", { exact: true })
      .fill("1234");
    await target
      .getByRole("button", { name: "Save item", exact: true })
      .click();
    await expect(target).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Test Item", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Items", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Items", exact: true, level: 1 }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add item", exact: true }).click();
    const item = page.getByRole("dialog", { name: "Add collection item" });
    await item.getByLabel("Item name", { exact: true }).fill("Test wearable");
    await item.getByLabel("Quantity", { exact: true }).fill("2");
    await item.getByRole("button", { name: "Save item", exact: true }).click();
    await expect(item).not.toBeVisible();
    await page
      .getByRole("button", {
        name: "Edit collection item Test wearable",
        exact: true,
      })
      .click();
    const editing = page.getByRole("dialog", { name: "Edit collection item" });
    await editing.getByLabel("Quantity", { exact: true }).fill("3");
    await editing
      .getByRole("button", { name: "Save item", exact: true })
      .click();
    await expect(editing).not.toBeVisible();
    await page
      .getByRole("button", { name: "Settings & backups", exact: true })
      .click();
    const backupFolder = path.join(root, "backup"),
      exportFile = path.join(root, "export.json");
    await page.screenshot({ path: "test-results/settings-wide.png" });
    const invalidBackup = path.join(root, "invalid.json");
    await fs.writeFile(invalidBackup, "{}");
    const beforeInvalid = await state();
    await page
      .getByRole("dialog", { name: "Settings & backups" })
      .locator("input[type=file]")
      .setInputFiles(invalidBackup);
    await expect(
      page.getByText("This is not a valid Neopian Desk backup.", {
        exact: true,
      }),
    ).toBeVisible();
    assert.deepEqual(await state(), beforeInvalid);
    await app.evaluate(({ dialog }, folder) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [folder],
      });
    }, backupFolder);
    await page
      .getByRole("button", { name: "Choose folder", exact: true })
      .click();
    await expect(
      page.getByText("Backup folder updated.", { exact: true }),
    ).toBeVisible();
    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
    }, exportFile);
    await page
      .getByRole("button", { name: "Export full backup", exact: true })
      .click();
    await expect(
      page.getByText("Backup exported.", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Dailies", exact: true })
      .click();
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
      .getByRole("dialog", { name: "Settings & backups" })
      .locator("input[type=file]")
      .setInputFiles(exportFile);
    await expect(
      page.getByText("Backup restored.", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Dailies", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Unstar Quest Log", exact: true }),
    ).toBeVisible();
    const backup = JSON.parse(
      await fs.readFile(
        path.join(backupFolder, "neopian-desk-backup.json"),
        "utf8",
      ),
    );
    if (backup.profile.account !== "test_account")
      throw Error("Automatic backup did not use the configured account");
    await exerciseScriptControls(page, data);
    const beforeRestart = await state();
    await app.close();
    app = null;
    await seedOldPreferences(data);
    page = await launch();
    await assertScriptsOff(page);
    assert.deepEqual(await page.evaluate(() => window.deskInitialState), {
      ...beforeRestart,
      revision: beforeRestart.revision + 1,
      training: { ...beforeRestart.training, enabled: false },
    });
    await expect(page.getByText("test_account", { exact: true })).toBeVisible();
    const saved = await state();
    if (
      saved.profile.account !== "test_account" ||
      saved.pageCodes["user-lookup"] !== "<h1>Test page</h1>"
    )
      throw Error("Reopened state differs");
    if (
      !JSON.parse(saved.legacy.nd_daily_favorites_v1).ids.includes("quest-log")
    )
      throw Error("Star was not retained");
    if (JSON.parse(saved.legacy.nd_priority_items)[0].name !== "Test Item")
      throw Error("Priority item was not retained");
    if (JSON.parse(saved.legacy.nd_items_v2)[0].q !== 3)
      throw Error("Item edit was not retained");
    assert.deepEqual(saved.profile.pets, ["test_pet"]);
    assert.equal(
      JSON.parse(saved.legacy.nd_account_notes),
      "My local test note",
    );
    assert.ok(
      JSON.parse(saved.legacy.nd_calendar).events.some(
        (e) => e.title === "My test date",
      ),
    );
    assert.ok(
      JSON.parse(saved.legacy.nd_avatar_catalogue).includes("pet_rock"),
    );
    assert.ok(
      JSON.parse(saved.legacy.nd_header_shortcuts).some(
        (s) => s.label === "My test link",
      ),
    );
    assert.ok(JSON.stringify(saved.names).includes("My saved name note"));
    assert.equal(JSON.parse(saved.legacy.nd_reminders).timers.length, 1);
    if (installed)
      await fs.writeFile(
        "test-results/reinstall-expected.json",
        JSON.stringify(saved),
      );
    if (errors.length) throw Error("Renderer errors: " + errors.join("; "));
    console.log(
      "Desktop journeys: local save path, stars and keyboard, account/pets, custom shortcuts, avatar import/checks, notes, calendar, timers, names, page save/copy/discard, buy targets, item editing, invalid backup rejection, backup/export/restore with dialog fixtures, normal/narrow layout, and reopening exercised.",
    );
  } catch (error) {
    if (app) {
      const page = await app.firstWindow();
      await page.screenshot({ path: "test-results/desktop-failure.png" });
      await fs.writeFile(
        "test-results/desktop-failure.txt",
        await page.locator("body").innerText(),
      );
    }
    throw error;
  } finally {
    if (app) await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
function assertWidth(size) {
  if (size.scroll > size.w + 1)
    throw Error(
      "The narrow app overflows horizontally: " + JSON.stringify(size),
    );
}
