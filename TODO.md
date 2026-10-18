# To do

## App script switches and default-off sessions — 17 October 2026

Rule is: all built-in script controls live in App scripts, take effect immediately,
and start off every time Desk opens. Preserve saved work and keep Tampermonkey separate.
Source goals re-read: all general tools, clean personal defaults, shared validated
storage, optional browser observations and manual game actions.

1. DONE — trace App scripts, overlay process, browser bridge, training reconciliation,
   startup and restore; compare public/private feature modules and release status.
   Verify the current Drive installer checksum. Re-check README before continuing.
2. DONE — use shared accessible switches for Shop Helper, Jump to expensive finds,
   Browser connection and Automatic training timers; remove the top-bar price action.
   Make startup ignore old enabled preferences and preserve data when paused. Verify
   off/on/off, failures, keyboard, restart, backup restore and narrow layouts. Re-check README.
3. DONE — build and exercise the installed Windows update, publish the checked package,
   replace the single Drive installer and document included versus private content.
   Verify checksums and retained records. Re-check source goals; keep the plan open
   until closure or archiving is reviewed.

References inspected as official documentation and pictured patterns, not live apps:
- https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/toggles —
  immediate binary action, stable feature label and visible On/Off state.
- https://www.w3.org/WAI/ARIA/apg/patterns/switch/ — stable accessible name, checked
  state, Space operation and grouped descriptions.

Acceptance: all four controls are discoverable in App scripts; Tampermonkey remains
on its separate tab; switches show actual acknowledged state and report errors;
turn-off always stops instead of opening a price connection window; all start off
even with old saved enabled values; existing timers, notes, records and pairing keys
survive; restoring a backup does not turn a paused script on. No horizontal overflow
or unreachable controls at narrow width. Installed Windows checks distinguish native
process/port behaviour from mocked game observations. Drive sharing needs live access
verification; the earlier browser permission denial does not establish share access.

Local evidence: 66 checks completed without reported failures. Real desktop journeys
exercise all four controls' initial off states, keyboard focus, live loopback start/stop, pairing-key
retention, normal/narrow layouts, full saved-state reopening and old enabled-setting
fixtures. Native Windows helper behaviour was then exercised by the installed run below.
Keyboard focus during a pending save was repaired using the existing button's
focusable-disabled behaviour. Local test connections use an ephemeral port so another
running desk is not interrupted. Restart comparison uses initial saved data before
navigation writes its own revision counter. No personal app or data was changed.

Windows run 39080868306 on runtime commit faa5985 completed every step: type check,
66 checks, native parser/accessibility fixtures, desktop journeys, NSIS packaging,
fresh installed switches and reinstall. Actual helper processes and loopback sockets
started/stopped. All scripts were left on before closing; reopening with old enabled
preference files still started them off. Complete saved-state comparisons retained
records and a synthetic training timer, apart from the required enabled flag and
save revision. Normal/narrow Windows screenshots and the reopened timer were inspected.
The packaged beta.2 archive contains no matched private paths, state files, keys or
bespoke private-page modules. Drive's single installer was overwritten and its SHA256
verified: 2b3ec6c5fec9418213d5e1229ab4fcc1a266a6f8d962d26794bf36fce3f62fe4.
Browser access to Drive's website is still denied by a saved permission; local filing
and byte verification succeeded, but sharing permissions and cloud download remain
unverified. Consumer security prompts, live account pages and screen readers remain
untested. Public-download run 39081153137 downloaded beta.2 without authentication,
verified the same SHA256 and exercised fresh installed journeys, script controls,
local saving, backup/restore, reopening and reinstall. The installed app reported
version 1.0.0-beta.2 and its own Windows AppData folder; the full saved-state comparison
completed without differences beyond the expected session flag/revision. README
goals were re-checked. Published source and the Drive mirror include the final
verification record; temporary builds and duplicate downloads are removed at handover.
The plan remains open for closure review.


## Released installer and local saving — 16 October 2026

Rule is: verify a new player's first launch, local saves, returning later and setup
clarity against the exact public Windows download. No cloud folder is required.
Source goals re-read: all general tools, empty personal defaults, ordinary manual
game actions, shared validated storage and optional browser trackers.

1. DONE — inspect release evidence, startup, saves and personal-data entry
   point. Verify local path selection and failure handling. Re-check README.
2. DONE — exercise the published installer on isolated Windows: empty first launch,
   representative saves in each area, avatar import, actual files, close/reopen,
   backup restore and reinstall. Capture normal/narrow screenshots. Re-check README.
3. DONE — review setup usability, fix demonstrated issues in the existing architecture,
   document the evidence and limitations, publish and mirror the results. Re-check
   source goals; leave the plan open until closure or archiving is reviewed.

Observed setup friction: unsigned installer warning; account username is
fixed after first save; optional trackers require extension and pairing setup.

Evidence: public-download run 38999060355 downloaded beta.1 without authentication,
verified its published SHA256 and installed it under the test user's LocalAppData.
The installed app reported packaged=true, version 1.0.0-beta.1 and its own userData
folder under AppData/Roaming/Neopian Desk. The profile started empty. Stars and
account settings saved before any backup folder was chosen. The following were
saved, exported/restored, reopened and retained through reinstall: daily stars,
account/pets, custom quick links, imported and manually changed avatar marks,
account notes, calendar entry, timer, name note, page HTML, buy target and wardrobe
quantity. The saved state file was compared after reinstall, including every field.
An invalid backup was rejected without changing the previous file. No renderer
error was reported. Native file chooser choices were test fixtures; the exports,
backups, working files, installation and process restarts were real.

The Windows environment was GitHub's Windows Server 2025 runner with a fresh app
profile, not a consumer Windows 10/11 PC. Silent installation does not exercise the
normal browser download warning or installer wizard. No live signed-in game source,
screen-reader use, physical phone or actual toast delivery was checked. The installer
is unsigned: SmartScreen can warn and Smart App Control or managed policy can block
it. Official reference inspected as documentation:
https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation .
No security protections were changed. The public installer itself was not modified.

The extended local desktop test initially needed to wait for the durable checkbox
save before asserting its new state. Screenshot inspection also found a navigation
transition captured before Dailies finished loading; the harness now waits for the
destination heading. These were verification timing issues, not runtime changes.
Run 38999320067 stopped at a test assertion that incorrectly expected a main heading
in Personalization; that section deliberately uses its tabs without the heading.
The check now uses its actual navigation label. Final run 38999489076 completed the
same download, installed journeys and whole-state reinstall comparison successfully.
Its settled Dailies, avatar import, settings and reopened Windows screenshots were
inspected at normal and narrow widths. Source goals were re-checked; the runtime
and published installer remain unchanged. Results and current proof images are
filed in the Drive mirror. The plan remains open for review.

Usability review — current first-run and saving workflow:
Sections inspected: sidebar, top search/tools/quick links, Dailies tabs and star
cards, My dailies/More dailies, avatar import, item/page editors, and Settings panels
for account/pets, notifications, backup folder and export/restore. No orphaned control
was observed in settled views. The most confusing detail for a newcomer is that
Settings discusses a backup folder without explicitly describing the local save.

- Pass — main flow: empty profile, star changes and editable personal records saved.
- Pass — expected behaviour: manual collection changes survived reopening.
- Pass — close/Escape: dialogs close; page editor offers Keep editing for a draft.
- Pass — data safety: actual save files, invalid restore rejection and reinstall compared.
- Minor — accidental actions: a username typo becomes locked after the first save.
- Pass — errors: invalid backup feedback leaves the existing file unchanged.
- Pass — empty states: blank Items, account notes and personal records invite entry.
- Pass — loading/waiting: save feedback is visible; tests wait for acknowledged writes.
- Pass — returning later: every tested saved field remained after reopening/reinstall.
- Pass — keyboard: star Space/focus, dialog controls and avatar checks exercised.
- Uncertain — phone use: narrow desktop layout inspected; no phone app is shipped.
- Pass — app match: each editor uses the shared controls and validated store.
- Pass — first impression: Dailies starts with three editable general suggestions.
- Pass — space: sidebar, toolbar, daily groups and settings panels remain distinct.
- Pass — cramped areas: fields/buttons wrap at the narrow width inspected.
- Pass — alignment: card stars and dialog form controls share consistent edges.
- Pass — priority: My dailies and save/import actions have clear placement.
- Minor — text/labels: Trophy and HTML/source terms need the README route and steps.
- Pass — long content: source textarea scrolls and notes wrap within their editors.
- Pass — small screens: inspected narrow daily and avatar layouts stay within the window.
- Uncertain — contrast: visually inspected, no measured full-interface or screen-reader audit.
- Pass — consistency: shared stars, checkboxes and save/cancel controls retain their roles.
- Pass — tooltips/layering: labelled icon actions and modal background separation inspected.
- Pass — scrolling: settings, long preview and final dialog actions remain reachable.
- Minor — reading effort: backup/cloud and optional tracker setup need plain instructions.

Counts: 20 pass, 3 minor, 0 broken, 2 uncertain across all 25 named checks in the
master's nominal 24-point list. Highest-priority clarity work: distinguish local
save from optional backup (README updated); make the username lock explicit before
entry (existing form warning verified); separate ordinary use from optional tracker
setup (README clarified). Consumer Windows security prompts remain an installation
limitation outside these interface observations. No promise of universal compatibility.

## New-player avatar journey — 17 October 2026

Rule is: a fresh player can import their own avatar page source, review matches,
then check and uncheck collected avatars without editing files or installing a
browser tracker. Imports must preserve existing progress and remain reversible.

Source goals re-read: empty personal defaults, all general tools, shared validated
persistence, manual game actions and optional browser trackers. The existing
AvatarImport, avatar checklist and shared store already implement this journey.

References inspected: Jellyneo's documented source-copy instructions and checklist
filters at https://www.jellyneo.net/?go=avatar_checklist_tool ; SunnyNeo's public
account page at https://my.sunnyneo.com/login.php lists avatar logging but requires
sign-in to inspect it. Neither site's signed-in importer was exercised. Follow
the established copy-source, review, collected/missing checklist pattern.

Acceptance: an empty profile can paste a complete picker; review excludes defaults
and preserves unknown codes; import marks exact matches; manual check/uncheck and
Show collected work; repeat import does not duplicate; malformed input/cancel
preserve data; undo, reopening and backup/restore retain the intended progress.
Inspect the actual desktop at normal and narrow sizes and keyboard focus.

1. DONE — trace current implementation and inspect the comparable references.
   Re-check README before proceeding.
2. DONE — exercise the fresh-player journey and add focused import regression
   coverage. Fix any demonstrated failure in the shared implementation. Re-check
   README before proceeding.
3. DONE — add plain Windows instructions, record evidence, publish and mirror the
   resulting source. Rebuild the installer only if runtime code changes. Re-check
   README; keep the plan open for review before closing or archiving.

Evidence: a separate empty desktop profile on macOS exercised paste, preview,
excluding a row, keyboard import, Show collected, manual uncheck/check, malformed
input and recovery, repeated review, additive import, undo, Escape cancellation,
empty search result and actual quit/reopen. The earlier collected mark survived.
The page and modal were inspected at 1180 and approximately 430 logical pixels wide.
Keyboard focus returned to Paste avatar source after import and Escape; Space
toggled a collection checkbox. Six synthetic import tests cover inert HTML parsing,
default/unknown codes, duplicate imports, retained progress, undo conflicts, native
atomic save/reopen and restore through the shared backup function with a test bridge.
The full 62-test suite and TypeScript check completed without reported failures.
No runtime changes were needed; beta.1 already contains the observed workflow.

Limitations: this session used synthetic Neopets picker markup, not a fresh signed-in
account export. SunnyNeo's importer requires login and was not exercised. The new
avatar-specific walkthrough ran on macOS; previous Windows installer verification
remains as recorded below. Real signed-in Windows gameplay remains untested.

New-player review: the screen contains the main sidebar, global tools/quick links,
Trophy tabs, account-total/search card, import action, filters and category lists;
the modal contains source instructions, source input/file choice, review and save.
No orphaned element was observed. The least obvious detail is that the account
total does not change when individual avatars are checked; README now explains it.

Usability observations under the test conditions above:
- Pass — main flow: paste, review, select and import completed.
- Pass — expected behaviour: imported marks remained manually editable.
- Pass — close/Escape: review cancelled and focus returned to the trigger.
- Pass — data safety: earlier marks survived import, undo and reopening.
- Pass — accidental actions: review preceded saving; later edits block unsafe undo.
- Pass — errors: a name-only paste explained how to obtain the required source.
- Pass — empty state: hidden collected search result said no avatars matched.
- Pass — loading: shared save feedback and disabled duplicate submit inspected.
- Pass — returning later: the checked avatar was still checked after reopening.
- Pass — keyboard: textarea focus, Tab/Return import and Space check exercised.
- Uncertain — phone use: only a narrow desktop window was exercised.
- Pass — app consistency: existing shared dialog, controls and store were reused.

Interface observations (the master list names thirteen despite its twelve label):
- Minor — first impression: the route through Trophy is not obvious to newcomers.
- Pass — space: toolbar, filters and category groups remain separated.
- Pass — crowding: controls wrap inside the narrow window.
- Pass — alignment: source field, review and save share the dialog column.
- Pass — priority: review counts precede the final import button.
- Minor — labels: HTML/source terminology needs Windows copy instructions.
- Pass — long content: pasted source scrolls within its labelled textarea.
- Pass — small screens: narrow dialog and checklist controls remain reachable.
- Uncertain — contrast: inspected visually; no measured contrast or screen-reader run.
- Pass — consistency: collection checkbox matches the other collection surfaces.
- Pass — layering: modal background is blocked and source link stays labelled.
- Pass — scrolling: dialog content and final action remain accessible.
- Minor — reading effort: the separate manual Total from account needs explanation.

Counts: 20 pass, 3 minor, 0 broken, 2 uncertain. The three clarity improvements are
documented in README: Trophy navigation, Windows copy-source steps and the separate
account total. These are observations of the existing workflow, not a guarantee
for untested live pages. Source and instructions are published and mirrored in
Drive; the existing installer remains current. Plan remains open for review.

## Current handover — 17 October 2026

DONE — public Windows beta delivered. All general feature groups are included, with
empty personal defaults and saved star/unstar choices. The original private app and
records remain separate. Public source, setup instructions and the installer are at
https://github.com/stjohnbuilds/neopian-desk-public .

Plan stays open for review; ask before closing or archiving it. Live signed-in Windows
gameplay and actual Windows toast delivery are not yet verified. Detailed completed
steps, references and evidence remain below.

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
2. DONE — clean public foundation. Create fresh source history from reviewed reusable
   modules, replace personal seeds with empty defaults and configurable account
   data. Verify no private data or history enters source/package. Re-check README.
3. DONE — Windows support. Port the agreed native features through the shared adapter,
   with atomic saves and recovery. Verify each complete workflow and failure path;
   do not substitute a browser preview for native behavior. Re-check README.
4. DONE — distribution. Build installer; exercise fresh install, reopen, upgrade,
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

Completed by the release handover below: final Windows workflow, screenshot/package
inspection, public installer/checksum and the Drive mirror.
Rule is: keep the completed plan available until its closure is explicitly reviewed.

## Release handover — 17 October 2026

Windows run 38997112568 completed all steps on runtime commit c8bb987: type check,
build, 56 data/observation tests, desktop journeys, native parser, Chrome UI Automation
fixtures, NSIS packaging, fresh installed startup and same-version reinstall. The
installed helper returned observations after loading the full item catalogue; saved
account and star choices survived reinstall. Windows normal/narrow and installed
screenshots were inspected. A separate live macOS ItemDB check returned 200 with item
data after visiting its site; the initial unconnected request correctly returned 401.
Official connection reference: https://docs.itemdb.com.br/api-access-2263939m0 .

The extracted packaged app contains no matched private account/pet identifiers, local
private paths, pairing key or saved-state files. Its installer SHA256 is
48c96f06a2567ea99032106e9cf59543c8d8172102858958a50d9814cba22b54.

Public release: https://github.com/stjohnbuilds/neopian-desk-public/releases/tag/v1.0.0-beta.1 .
The installer and checksum are uploaded; unauthenticated downloads and the published
SHA256 were verified. Current source and the single installer are filed in the Drive
GitHub mirror. Temporary downloaded/extracted packages and test builds are removed.
Real signed-in Windows gameplay and actual Windows toast delivery remain untested;
this is documented in the beta release. The plan remains open for review.
