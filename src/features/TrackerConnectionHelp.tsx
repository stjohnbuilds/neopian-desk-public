import { InfoHelp } from "../components/InfoHelp";
export function TrackerConnectionHelp() {
  return <InfoHelp title="Connect browser trackers">
    <p>Optional trackers send receipts, album observations, training and events from pages you open. They require Tampermonkey in Chrome or Edge.</p>
    <ol>
      <li>Save your Neopets username in Settings. No password is needed.</li>
      <li>Copy the chosen script from Tools → Tampermonkey scripts. Paste into Tampermonkey’s new-script editor and save. Replace an existing copy when updating.</li>
      <li>In Tools → App scripts, enable the connection and copy its key.</li>
      <li>Open a supported Neopets page. In the script’s Tampermonkey menu, choose Connect and paste the key. Pair each tracker once.</li>
    </ol>
    <p>Keep Desk open for updates. Offline observations remain in the browser until Desk confirms saving them. Use the script’s Retry or Sync menu after a connection error.</p>
    <p>The key pairs this computer and account; it is not a Neopets password. For a different account, use a separate Windows and browser profile. Search Helper needs no pairing.</p>
  </InfoHelp>;
}
