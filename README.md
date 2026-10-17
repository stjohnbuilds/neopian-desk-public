# Neopian Desk

A Windows desktop companion for Neopets: dailies, collection checklists, purchases
and sales, shop price estimates, name research, pet-page editing, wardrobe lists,
training timers and reminders. All game actions remain manual.

The public edition starts with no account, pets, transactions or collection marks.
Star a daily to add it to My dailies; unstar it to return it to More dailies.
The same saved choices return after restarting.

## Status

The Windows edition is under construction. There is no verified installer yet.
All general features are in scope, including the native shop-price overlay.

## Source and saved data

Source lives in `~/Dev/neopian-desk-public`, with a mirror in the configured Drive
GitHub folder. Windows saves belong in the app's user-data directory; a chosen
backup folder may be inside Google Drive or another synced location. No private
repository or developer account is used by a public installation.

## Development

The React interface retains its existing feature, core and persistence modules.
Desktop integrations belong in `desktop/`; Windows accessibility belongs in
`windows/`. Build and verification commands will be recorded when implemented.

## Notices

This is an unofficial companion. Neopets names and assets belong to their respective
owners. The shared controls include the MIT-licensed AdminCN interface foundation;
see ADMINCN-LICENSE.md. Game and item references retain their source links and dates.
