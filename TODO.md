# To do

## Handover — 16 October 2026


Rule is: the public Windows edition starts with no account records, personal page
layouts, pet identities, private backup destination or bundled save snapshots.
Dailies use one star to add or remove a card from My dailies; the catalogue keeps
unstarred entries available, and choices persist after reopening.

Source goals: retain the existing passive companion, shared validated persistence,
manual outgoing links, daily catalogue and collection evidence distinctions.
The current private repository and its history contain personal material; a public
release must use an explicitly reviewed clean source snapshot and fresh history.
The existing private app and saved state remain the authoritative personal edition.

Feature separation:
- General: dailies/quest shortcuts; avatar, stamp and trophy tracking; purchases,
  sales and profits; shop links and estimates; timers/calendar; name-checking and
  generic page editing; wearable lists, training and passive browser trackers.
- Private content: account/pet identities, custom page layouts and character text,
  birthdays, wardrobe/dream outfits, checked names, collection marks, transactions,
  notes, favourite choices, pairing keys and the fixed private backup repository.
- Windows dependencies: native window/storage/export, notification scheduling,
  paired local server and browser reads, name scanning and the accessibility overlay.

References inspected as official documentation, not live product interactions:
- https://support.microsoft.com/en-us/todo/add-steps-importance-notes-tags-and-categories-to-your-tasks
  Star beside an entry and a dedicated list of starred entries.
- https://support.microsoft.com/en-us/accessibility/todo/use-a-screen-reader-to-add-steps-and-set-importance-to-a-task-in-to-do
  Tab/Space operation and explicit add/remove importance state labels.
- https://support.google.com/chrome/answer/188842
  Saved-entry discovery, editing and removal; star state remains distinct from opening.

Acceptance: fresh install has no private content; daily star/unstar immediately
moves the exact card without duplication, preserves keyboard focus and survives
reopening/backup restore; empty/search/error states explain recovery; opening a
link never claims game completion; no programming tools needed by Windows users;
installer/update preserves saved data. Normal and narrow rendered layouts and a
real Windows install must be checked separately from fixture/build results.

1. DONE — inventory and trace. Read source goals, daily star/save path, native bridge,
   startup seeds and hardcoded account/backup dependencies. Re-check README before
   proceeding to implementation.
2. 95% — clean public foundation. Create fresh source history from reviewed reusable
   modules, replace personal seeds with empty defaults and configurable account
   data. Verify no private data or history enters source/package. Re-check README.
3. 90% — Windows support. Port the agreed native features through the shared adapter,
   with atomic saves and recovery. Verify each complete workflow and failure path;
   do not substitute a browser preview for native behavior. Re-check README.
4. 60% — distribution. Build installer; exercise fresh install, reopen, upgrade,
   backup/restore and normal/narrow layouts on Windows; then publish the reviewed
   package. Report unavailable live checks explicitly. Re-check README; leave this
   plan open until its completion is reviewed before closing or archiving it.

Scope confirmed: all general features, including the Windows native price overlay.
Keep this plan open until completion is reviewed; ask before closing or archiving.


## Verification and next checks — 16 October 2026

The clean account foundation, Electron adapter, paired receipt/album/training/event
service, saved targets, local backups and recovery are implemented. Fourteen Node
checks exercised atomic records, replay, account isolation, backup conflicts and
recovery. Desktop journeys ran on macOS: star keyboard focus, normal/narrow layout,
account settings, every main section, page edit/save/copy/discard, saved targets
and reopening. Two issues found in these journeys were repaired: star focus after
moving a card and disappearing first-save account confirmation.

Windows compilation, actual accessibility fixtures and an installed NSIS app still
require the Windows workflow. No real-account Windows browser journey has run.
The native overlay must not be described as verified from the desktop preview.
Remaining work includes item-list editing, script fixture coverage, package audit,
Windows checks, release publication and filing the finished source in Drive.

Additional official references read (documentation, no reference product testing):
- https://www.electronjs.org/docs/latest/tutorial/security/
- https://www.electronjs.org/docs/latest/tutorial/context-isolation
- https://www.electronjs.org/docs/latest/tutorial/sandbox
- https://www.electron.build/docs/nsis/
- https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/caching-in-ui-automation-clients
- https://playwright.dev/docs/api/class-electron
- https://github.com/actions/setup-dotnet

Implementation follows isolated native capabilities, per-user installation,
explicit account pairing, UI Automation cached reads and ordinary app save/cancel
patterns. Saved targets and wardrobe records must be editable without preparing
JSON. All additions still use the shared validated store.

## Windows package verification — 17 October 2026

Public source uses fresh history at https://github.com/stjohnbuilds/neopian-desk-public.
The original private source and saved data remain separate. Fifty-six Node checks
now exercise receipts, sales, album/SDB evidence, training, events, backups, recovery
and loopback account isolation. Desktop journeys exercise star keyboard focus,
normal/narrow views, all main sections, page editing, targets, item add/edit, export,
restore and reopening. Dialog choices use fixtures; the resulting files are real.

The first Windows workflow compiled the native helper, exercised Chrome accessibility
item/cost reads and click-through badges, built NSIS and opened a fresh installed app.
Its installed-check script then failed because it used an unavailable require inside
an evaluation. The harness now reads the resource path through the host process;
full-catalogue overlay startup and reinstall are being rerun. No real signed-in
Neopets session or actual Windows toast delivery has been checked.

Pending: complete final Windows workflow, inspect screenshots and packaged contents,
publish the installer/checksum, and mirror finished source plus release to Drive.
Rule is: keep the completed plan available until its closure is explicitly reviewed.
