# Neopian Desk

An unofficial Windows desktop companion for Neopets. All general tools are included;
each installation starts without an account, pets, transactions, page designs or
collection marks. Game actions stay manual.

## Get started

**[Download the Windows installer](https://github.com/stjohnbuilds/neopian-desk-public/releases/download/v1.0.0-beta.1/Neopian-Desk-Setup.exe)** ·
[Release notes and checksum](https://github.com/stjohnbuilds/neopian-desk-public/releases/tag/v1.0.0-beta.1)

Version 1.0.0-beta.1 is an early public release.

1. Download **Neopian-Desk-Setup.exe** from the release and open it. The x64 package
   is intended for Windows 10 or 11; it includes its runtime. No coding tools are needed.
2. Open **Neopian Desk** from the desktop shortcut or Start menu.
3. In Dailies, click a star to add a card to **My dailies**. Click it again to move
   the card back to **More dailies**. Choices save automatically.
4. In **Settings & backups**, save a Neopets username when ready to use account
   tools. Check the spelling: the account is fixed after saving to prevent mixed
   records. No Neopets password is requested. Pet names and a closet link are optional.
5. **Optional:** choose a backup folder, preferably in Google Drive or another
   synced drive. Your changes already save on your computer without this step.

This beta is unsigned. Windows may display an unknown-publisher warning or block
it under Smart App Control or a managed-device policy. A successful test installation
does not guarantee that every Windows security configuration will allow it. See
[Microsoft's explanation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).
Download only from this repository's release page. Updates replace the app in place and
retain saved data; install the newer release using the same destination.

## Bring your own avatar progress

No browser tracker is needed. Start in **Trophy → Avatars → Paste avatar source**.

1. Open the linked **Neoboard Settings** page while signed into your own Neopets
   account. In Chrome on Windows, press **Ctrl+U** to view the page source, then
   **Ctrl+A** and **Ctrl+C** to copy it all. You do not need to understand the code.
2. Return to Desk, click the **Neoboard Settings HTML** box and press **Ctrl+V**.
   This needs the whole page source, rather than a typed list of avatar names.
3. Choose **Review avatars**. Expand **Review secret avatars** if you want to leave
   any out, then choose **Import collected avatars**.
4. Tick avatars as you earn them. Turn on **Show collected** to see or untick
   ones you already own. Search by name to find an avatar quickly.

Imports add matched avatars without removing existing checks. Repeating an import
does not create duplicates. **Undo last avatar import** is available in the current
session; later checklist changes are protected. Unmatched codes are kept for review.
**Total from account** is a separate number you enter from Neopets; imports and
individual checks do not change it. Your progress saves automatically.

The copy-source approach is also documented by
[Jellyneo's avatar checklist](https://www.jellyneo.net/?go=avatar_checklist_tool);
Windows shortcuts are listed in [Chrome Help](https://support.google.com/chrome/answer/157179).
Desk uses Neopets page source directly and does not require a SunnyNeo account.

Your daily stars, quick links, item lists, buy targets, timers, notes, pet details
and collection marks are yours to change. The built-in game catalogue and guide
requirements are reference information. A new installation contains none of another
player's personal progress.

## Included tools

- **Dailies:** searchable catalogue, star/unstar favourites, visit checks and links.
- **Collections:** avatar, stamp, trophy and other collection checklists, with manual
  marks kept distinct from confirmed browser observations.
- **Shopping:** shop groups, editable buy targets, dated item estimates and a Windows
  price overlay for supported Chrome and Edge pages. Optional Auto-jump scrolls to
  a qualifying visible item; Stop ends a batch. It never clicks Buy.
- **Records:** purchases, shop and trading sales, costs, profit views and exports.
- **Planning:** calendar, birthdays, timers, training groups and desktop reminders
  while Desk is open.
- **Names and pages:** name lists, notes, history, manual checking, page HTML editor,
  preview/copy, signatures and colour presets. Publishing stays manual.
- **Items:** editable wardrobe lists, quantities, personal value estimates, dream
  outfits and a Dress to Impress closet link.
- **Browser tools:** optional purchase/sales, stamp, random-event and training
  trackers, plus the search helper.

Opening a link or checking a visit does not claim a game action was completed.
Prices are dated estimates, not guaranteed sale prices. Refresh uses ItemDB; if it
asks for a connection, let its window load, complete any browser verification, then
choose **Prices → Refresh prices after connecting** in that window. ItemDB requires
a recent visit periodically; saved estimates remain available if the connection fails.
The overlay needs a supported foreground Chrome or Edge window and accessible item
text. Pages that do not expose it may have no badges. Firefox is not supported by
the native overlay.

## App script switches

Open **Tools → App scripts**. Every built-in script starts **Off** each time Desk
opens, even if it was on when Desk last closed. Use the switches to turn on only
what you need for this session:

- **Shop Helper:** floating price estimates for supported Chrome and Edge pages.
- **Jump to expensive finds:** optional scrolling during shop checks. Shop Helper
  must be on; switching it off also switches jumping off.
- **Browser connection:** receives observations from paired browser trackers.
  Turn it on before copying the connection key. The pairing key stays saved.
- **Automatic training timers:** creates and updates timers from received courses.
  Turning it off leaves existing timers and course records intact.

Switches take effect immediately. Turning a script off or restarting Desk does not
erase saved records. Restoring a backup does not turn a paused script on.
Tampermonkey scripts remain in their own tab and are managed in Tampermonkey;
the app switches do not enable or disable those browser installations.

## What the public edition leaves out

General feature groups listed above are included. Personal account and pet details,
collection progress, transaction history, favourite choices, wardrobe/outfits, notes,
page designs, birthday dates and private backup locations are not bundled.
The bespoke personal page-draft editor and its custom styles are replaced by generic
user-lookup, petpage and pet-lookup code editors. The Mac-only built-in receipt and
shop-sales readers are replaced by the optional paired browser scripts on Windows;
the source libraries and platform mechanisms are different. The Windows price
overlay is included. No Neopets login or browser session is bundled.

## Optional browser trackers

Dailies and manual lists work without a browser extension. For automatic observations:

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome or Edge. Enable
   **Allow user scripts** in its browser extension details, and allow Neopets site
   access. See the [official setup help](https://www.tampermonkey.net/faq.php#Q209).
2. Save the account in Desk settings. In **Tools → Tampermonkey scripts**, copy a
   tracker into Tampermonkey's new-script editor and save it. Replace an existing
   copy when updating.
3. In **Tools → App scripts**, turn **Browser connection** on and copy its pairing key.
4. On a supported Neopets page, open the tracker's Tampermonkey menu, choose
   **Connect**, and paste the key. Pair each tracker once; Search Helper needs no key.
5. Turn Browser connection on each time Desk opens. If delivery fails, use the
   tracker's Retry or Sync command. Pairing only needs to be done once.

The pairing key connects only to this computer's loopback service. A tracker binds
to the configured account and refuses another account. Use separate Windows and
browser profiles for different accounts. Pending observations remain in the browser
until saving is acknowledged; reopening/retrying does not create duplicate receipts.

## Saved data, backup and recovery

Windows keeps working data under `%APPDATA%\Neopian Desk`. Settings can write an
additional verified backup to a folder chosen by the current player. No developer
account or fixed cloud destination is used. Keep Desk open until pending browser
records arrive before exporting a full backup.

Stars and collection checkboxes save automatically. In an editing form, choose its
**Save** button and wait for the confirmation before closing the app. Saved pets,
notes, item lists, targets, page code, calendar dates, timers and name records stay
on this computer when the app closes. Unsaved drafts and temporary search filters
are not saved records. Timers remain saved, but Desk must be open to show alerts.
The app does not automatically record every action on Neopets; the optional paired
browser trackers only capture the supported observations described above.

**Export full backup** creates a portable JSON file. **Restore backup** restores
preferences and merges receipts, name history and collection evidence; it retains
newer event and training observations. A different account's data is rejected.
A synced backup changed by another computer is reported instead of overwritten.
If the working save becomes unreadable, startup offers the previous valid save or
a chosen backup and preserves the unreadable file for recovery. Uninstalling retains
saved data. A full backup does not include the machine's pairing key or browser logins.

## Development and verification

Source: `~/Dev/neopian-desk-public`, mirrored to the configured Drive GitHub folder.
The React feature/core/persistence modules share validation with the desktop adapter.
Electron capabilities are in `desktop/`; the Windows UI Automation helper is in
`windows/`. Builds clear their output instead of accumulating app copies.

Use Node.js 24 and .NET 10 SDK on Windows:

```sh
npm ci
npm run check
npm run build
npm test
npm run test:desktop
dotnet publish windows/NeopianDesk.Overlay.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o windows/publish
npm run dist:win
```

`npm start` opens the built desktop app. The
[Windows verification run](https://github.com/stjohnbuilds/neopian-desk-public/actions/runs/38997112568)
completed 56 data/observation checks, desktop journeys at normal and narrow sizes,
native Chrome accessibility fixtures, fresh installation, overlay startup and
same-version reinstall with saved choices retained. The packaged files were checked
for private identifiers and saved records. A live ItemDB request returned item data
after its connection page loaded in an isolated macOS desktop session. These fixtures do not establish
compatibility with every current Neopets page. Real signed-in Windows gameplay and
Windows toast delivery have not been checked. See TODO.md and LOG.md for the current
verification record.

The [public-download verification](https://github.com/stjohnbuilds/neopian-desk-public/actions/runs/38999489076)
also installed the exact published beta.1 file, verified its checksum and checked
local saves, avatar import/manual checks, notes, calendar, timers, custom links,
names, items, page code, backup rejection/restore, reopening and reinstall. It used
a fresh app profile on Windows Server 2025 with a silent installer. Consumer Windows
10/11 download warnings, the interactive installer wizard and live gameplay were
not exercised by that run.

## Notices

This project is not affiliated with Neopets. Neopets and Pokémon names and artwork
belong to their respective owners. Item and game reference links retain their sources
and dates. Search Helper retains its userscript attribution. Shared interface controls
include the MIT-licensed AdminCN foundation; see ADMINCN-LICENSE.md. Public source
visibility does not grant an additional licence to third-party content.
