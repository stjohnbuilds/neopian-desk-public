const { _electron: electron, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "desk-desktop-test-"));
  const data = path.join(root, "data");
  await fs.mkdir("test-results", { recursive: true });
  const env = { ...process.env, DESK_TEST_DATA_DIR: data };
  delete env.ELECTRON_RUN_AS_NODE;
  const errors = [];
  let app;
  async function launch() {
    app = await electron.launch({ args: ["."], env });
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
    await app.close();
    app = null;
    page = await launch();
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
    if (errors.length) throw Error("Renderer errors: " + errors.join("; "));
    console.log(
      "Desktop journeys: stars + keyboard focus, account settings, all sections, wide/narrow layout, page save/copy/discard, priority targets, item add/edit, backup/export/restore with dialog fixtures, and reopening exercised.",
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
