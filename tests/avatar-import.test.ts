import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  parseAvatarPicker,
  reviewAvatarImport,
  mergeAvatarImport,
  undoAvatarImport,
} from "../src/core/avatar-import";
import {
  findAvatar,
  isCollected,
  withAvatarCollected,
} from "../src/core/avatars";
import {
  createInitialState,
  validateStore,
  restoreBackup,
} from "../src/persistence/store";
import { Storage } from "../desktop/storage.cjs";
import * as domain from "../desktop/domain";

// Synthetic picker markup; no saved player source is bundled.
const row = (code: string, name = code) =>
  `<div class="settings-av" id="${code}Avvie" onclick="throw Error('executed')"><img src="//images.neopets.com/neoboards/avatars/${code}.gif" alt="${name}"></div>`;
const picker = (secret = row("pet_rock", "I Love My Rock")) =>
  `<div id="SelectAvatarPopup"><div class="settings-avatars">${row("default")}</div><p><b>Secret Avatars:</b></p><div class="settings-avatars">${secret}</div></div>`;
const rock = findAvatar("nd_concerts", "rock")!;

test("fresh player can review, import, uncheck and check avatars through shared collection state", () => {
  const initial = createInitialState();
  assert.equal(isCollected(initial.legacy, rock), false);
  const incoming = parseAvatarPicker(picker());
  assert.equal(reviewAvatarImport(initial.legacy, incoming).added.length, 1);
  const imported = mergeAvatarImport(initial.legacy, incoming);
  assert.equal(isCollected(imported.legacy, rock), true);
  const unchecked = withAvatarCollected(imported.legacy, rock, false);
  assert.equal(isCollected(unchecked, rock), false);
  const checked = withAvatarCollected(unchecked, rock, true);
  assert.equal(isCollected(checked, rock), true);
  validateStore({ ...initial, legacy: checked });
});

test("source is inert, duplicates collapse, defaults are excluded and unknown identities stay reviewable", () => {
  const incoming = parseAvatarPicker(
    `<script>globalThis.avatarImportExecuted=true</script>` +
      picker(
        row("pet_rock", "Rock &amp; Roll") +
          row("pet_rock", "Rock &amp; Roll") +
          row("ncmall", "Goggles") +
          row("future_avatar", "Future Avatar"),
      ),
  );
  assert.equal((globalThis as any).avatarImportExecuted, undefined);
  assert.equal(incoming.length, 4);
  assert.equal(incoming[1].name, "Rock & Roll");
  const imported = mergeAvatarImport({}, incoming);
  assert.equal(imported.review.standard.length, 1);
  assert.equal(imported.review.nonCounting.length, 1);
  assert.equal(imported.review.unmatched[0].code, "future_avatar");
  assert.deepEqual(JSON.parse(imported.legacy.nd_avatar_catalogue), [
    "pet_rock",
  ]);
  assert.equal(JSON.parse(imported.legacy.nd_avatar_import).entries.length, 4);
});

test("invalid or incomplete input rejects; forum and signature avatars are never mistaken for owned avatars", () => {
  for (const source of [
    "",
    "just avatar names",
    "x".repeat(2_000_001),
    picker().replace("Secret Avatars:", "Other:"),
    picker().slice(0, -25),
    picker().replace("pet_rockAvvie", "wrongAvvie"),
    picker(row("pet_rock", "a") + row("pet_rock", "b")),
    picker().replace("//images.neopets.com/", "//example.invalid/"),
  ])
    assert.throws(() => parseAvatarPicker(source));
  const post =
    '<article>New avatar!<aside><img src="//images.neopets.com/neoboards/avatars/kadoatery.gif" alt="Kadoatery"></aside></article>';
  assert.throws(() => parseAvatarPicker(post));
  assert.deepEqual(
    parseAvatarPicker(post + picker() + post).map((r) => r.code),
    ["default", "pet_rock"],
  );
});

test("repeat imports do not duplicate or erase other marks, attempt dates, tickets or the entered account total", () => {
  const before = {
    nd_avatar_tasks: '{"kad":{"done":false,"tried":"2026-01-01"}}',
    nd_avatar_catalogue: '["windyharris"]',
    nd_concerts: '{"tickets":["rock","groovy"],"avatars":["groovy"]}',
    nd_goals: '{"avatars":25}',
  };
  const incoming = parseAvatarPicker(
    picker(row("pet_rock") + row("kadoatery")),
  );
  const first = mergeAvatarImport(before, incoming);
  assert.equal(first.legacy.nd_goals, before.nd_goals);
  assert.equal(
    JSON.parse(first.legacy.nd_avatar_tasks).kad.tried,
    "2026-01-01",
  );
  assert.ok(
    JSON.parse(first.legacy.nd_avatar_catalogue).includes("windyharris"),
  );
  assert.deepEqual(JSON.parse(first.legacy.nd_concerts), {
    tickets: ["rock", "groovy"],
    avatars: ["groovy", "rock"],
  });
  const second = mergeAvatarImport(first.legacy, incoming);
  assert.equal(second.review.added.length, 0);
  assert.deepEqual(second.legacy, first.legacy);
});

test("undo restores the previous collection and refuses to erase a subsequent checklist edit", () => {
  const before = { nd_goals: '{"avatars":25}' };
  const after = mergeAvatarImport(before, parseAvatarPicker(picker())).legacy;
  assert.deepEqual(undoAvatarImport(after, { before, after }), before);
  assert.throws(
    () =>
      undoAvatarImport(withAvatarCollected(after, rock, false), {
        before,
        after,
      }),
    /newer changes/,
  );
  assert.deepEqual(
    undoAvatarImport(
      { ...after, nd_goals: '{"avatars":26}' },
      { before, after },
    ),
    { nd_goals: '{"avatars":26}' },
  );
});

test("avatar marks survive native saving, reopening and backup restore; malformed saved imports reject", async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "desk-avatar-import-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const storage = new Storage(folder, domain);
  const initial = await storage.open();
  const imported = {
    ...initial,
    revision: initial.revision + 1,
    legacy: mergeAvatarImport(initial.legacy, parseAvatarPicker(picker()))
      .legacy,
  };
  await storage.commit(() => imported);
  const reopened = await new Storage(folder, domain).open();
  assert.equal(isCollected(reopened.legacy, rock), true);
  const portable = JSON.parse(JSON.stringify(reopened));
  validateStore(portable);
  const restoredStorage = new Storage(path.join(folder, "restored"), domain);
  await restoredStorage.open();
  Object.assign(globalThis, {
    window: {
      deskDesktop: {
        request: async (action: string, payload: { text: string }) => {
          assert.equal(action, "save");
          return restoredStorage.commit(() => JSON.parse(payload.text));
        },
      },
    },
  });
  t.after(() => {
    delete (globalThis as any).window;
  });
  await restoreBackup(portable);
  assert.equal(isCollected((await restoredStorage.open()).legacy, rock), true);
  assert.throws(() =>
    validateStore({
      ...portable,
      legacy: {
        ...portable.legacy,
        nd_avatar_import: '{"version":1,"entries":[{"code":12}]}',
      },
    }),
  );
});
