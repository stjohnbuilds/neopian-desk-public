// Included inside each userscript scope by the release builder.
let DESK_ACCOUNT = await GM.getValue("neopianDeskAccount", "");
if (!/^[a-z0-9_]{1,50}$/.test(DESK_ACCOUNT)) DESK_ACCOUNT = "";
function createDeskConnection() {
  const KEY = "neopianDeskPairingKey";
  async function pair() {
    const key = prompt(
      "Open Neopian Desk → Tools → App scripts → Enable connection, then Copy connection key. Paste the key here.",
    );
    if (key === null) return false;
    if (!/^[a-f0-9]{64}$/.test(key.trim())) {
      alert("That is not a Neopian Desk connection key.");
      return false;
    }
    try {
      const profile = await request("profile", undefined, key.trim());
      if (!/^[a-z0-9_]{1,50}$/.test(profile.account || "")) throw Error("Save your username in Desk Settings first.");
      if (DESK_ACCOUNT && DESK_ACCOUNT !== profile.account) throw Error("This script already belongs to another account. Use a separate browser profile for another account.");
      await GM.setValue("neopianDeskAccount", profile.account);
      await GM.setValue(KEY, key.trim());
      DESK_ACCOUNT = profile.account;
      return true;
    } catch (error) { alert(errorMessage(error)); return false; }
  }
  function errorMessage(error) {
    if (typeof error?.message === "string" && error.message.trim()) return error.message;
    return "Cannot reach Desk. Open Neopian Desk → Tools → App scripts and enable the browser connection. If it is already enabled, check the browser’s local-network permission.";
  }
  async function request(path, body, pairingKey) {
    let key;
    try { key = pairingKey || await GM.getValue(KEY, ""); }
    catch (_) { throw new Error("Tampermonkey could not read the saved connection key. Retry from the script menu."); }
    if (!key) throw new Error("Connect this script first: copy the key from Desk → Tools → App scripts, then use this script’s Connect menu.");
    let response;
    try {
      response = await GM.xmlHttpRequest({
        method: body === undefined ? "GET" : "POST",
        url: "http://127.0.0.1:47831/v1/" + path,
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        data: body === undefined ? undefined : JSON.stringify(body),
        timeout: 5000,
        anonymous: true,
      });
    } catch (_) { throw new Error(errorMessage(null)); }
    if (!response || !response.status) throw new Error(errorMessage(null));
    if (response.status === 401)
      throw new Error("Connection key rejected. Copy the key from Neopian Desk → Tools → App scripts and reconnect this script from its Tampermonkey menu.");
    if (response.status !== 200)
      throw new Error("Desk could not save this update (" + response.status + "). Your browser copy is retained. Retry after checking Desk’s connection status.");
    let parsed;
    try { parsed = JSON.parse(response.responseText); }
    catch (_) { throw new Error("Desk returned an unreadable response. Your browser copy is retained; nothing was marked synced."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        (body === undefined ? (path === "profile" ? !/^[a-z0-9_]{1,50}$/.test(parsed.account || "") : !parsed.albums || typeof parsed.albums !== "object") : parsed.ok !== true))
      throw new Error("Desk did not confirm this update. Your browser copy is retained; retry from the script menu.");
    return parsed;
  }
  function account() {
    // Read existing account markup only; never fetch an account page or execute page code.
    const links = document.querySelectorAll(
      '#header a[href*="userlookup.phtml"], .nav-top a[href*="userlookup.phtml"], #navprofiledropdown a[href*="userlookup.phtml"], #navprofiledropdown__2020 a[href*="userlookup.phtml"]',
    );
    for (const link of links) {
      const user = new URL(link.href).searchParams.get("user");
      if (user && link.textContent.trim().toLowerCase() === user.toLowerCase())
        return user.toLowerCase();
    }
    for (const script of document.scripts) {
      const match = script.textContent.match(
        /\b(?:var|let|const)\s+appInsightsUserName\s*=\s*["']([a-zA-Z0-9_]+)["']/,
      );
      if (match) return match[1].toLowerCase();
    }
    return null;
  }
  return { pair, request, account, errorMessage };
}
