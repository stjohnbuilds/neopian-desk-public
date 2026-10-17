# Neopian Desk

An unofficial Windows desktop companion for Neopets. All general tools are included;
each installation starts without an account, pets, transactions, page designs or
collection marks. Game actions stay manual.

## Get started

The first Windows beta is being verified. Its installer will appear on the
[releases page](https://github.com/stjohnbuilds/neopian-desk-public/releases).

1. Download **Neopian-Desk-Setup.exe** from the release and open it. The x64 package
   is intended for Windows 10 or 11; it includes its runtime. No coding tools are needed.
2. Open **Neopian Desk** from the desktop shortcut or Start menu.
3. In Dailies, click a star to add a card to **My dailies**. Click it again to move
   the card back to **More dailies**. Choices save automatically.
4. In **Settings & backups**, save a Neopets username when ready to use account
   tools. Check the spelling: the account is fixed after saving to prevent mixed
   records. No Neopets password is requested. Pet names and a closet link are optional.
5. Choose a backup folder, preferably in Google Drive or another synced drive.

This beta is unsigned. Windows may display an unknown-publisher warning. Download
only from this repository's release page. Updates replace the app in place and
retain saved data; install the newer release using the same destination.

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
asks for a browser verification, complete that in its window and click Refresh again.
The overlay needs a supported foreground Chrome or Edge window and accessible item
text. Pages that do not expose it may have no badges. Firefox is not supported by
the native overlay.

## Optional browser trackers

Dailies and manual lists work without a browser extension. For automatic observations:

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome or Edge. Enable
   **Allow user scripts** in its browser extension details, and allow Neopets site
   access. See the [official setup help](https://www.tampermonkey.net/faq.php#Q209).
2. Save the account in Desk settings. In **Tools → Tampermonkey scripts**, copy a
   tracker into Tampermonkey's new-script editor and save it. Replace an existing
   copy when updating.
3. In **Tools → App scripts**, enable the connection and copy its pairing key.
4. On a supported Neopets page, open the tracker's Tampermonkey menu, choose
   **Connect**, and paste the key. Pair each tracker once; Search Helper needs no key.
5. Keep Desk open. If delivery fails, use the tracker's Retry or Sync command.

The pairing key connects only to this computer's loopback service. A tracker binds
to the configured account and refuses another account. Use separate Windows and
browser profiles for different accounts. Pending observations remain in the browser
until saving is acknowledged; reopening/retrying does not create duplicate receipts.

## Saved data, backup and recovery

Windows keeps working data under `%APPDATA%\Neopian Desk`. Settings can write an
additional verified backup to a folder chosen by the current player. No developer
account or fixed cloud destination is used. Keep Desk open until pending browser
records arrive before exporting a full backup.

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

`npm start` opens the built desktop app. The Windows workflow exercises native
accessibility against controlled Chrome pages, builds the installer, installs it,
and checks reopening and same-version reinstall. These fixtures do not establish
compatibility with every current Neopets page. Real signed-in Windows gameplay and
Windows toast delivery have not been checked. See TODO.md and LOG.md for the current
verification record.

## Notices

This project is not affiliated with Neopets. Neopets and Pokémon names and artwork
belong to their respective owners. Item and game reference links retain their sources
and dates. Search Helper retains its userscript attribution. Shared interface controls
include the MIT-licensed AdminCN foundation; see ADMINCN-LICENSE.md. Public source
visibility does not grant an additional licence to third-party content.
