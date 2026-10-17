// ==UserScript==
// @name         Neopian Desk - Stamp Tracker
// @namespace    neopian-desk-public-stamp-tracker
// @version      1.0.0
// @description  Tracks confirmed album ownership, including checked SDB batches, and syncs to Neopian Desk.
// @match        https://www.neopets.com/*
// @connect      127.0.0.1
// @connect      itemdb.com.br
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
(async function () {
  "use strict";
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

  const stampIdentities = [{"page":1,"position":1,"name":"Mystery Island Kougra Stamp","image":"stamp_mys_kou"},{"page":1,"position":2,"name":"Mystery Island Aishas Stamp","image":"stamp_mys_ais"},{"page":1,"position":3,"name":"Coco Stamp","image":"stamp_mys_coc"},{"page":1,"position":4,"name":"Jhuidah Stamp","image":"stamp_jhuidah1"},{"page":1,"position":5,"name":"Island Native Stamp","image":"stamp_mys_nat"},{"page":1,"position":6,"name":"Mystery Island Hut Stamp","image":"stamp_mys_mys"},{"page":1,"position":7,"name":"Assorted Fruits Stamp","image":"stamp_mys_fru"},{"page":1,"position":8,"name":"Triangular Flotsam Stamp","image":"stamp_island_flotsam"},{"page":1,"position":9,"name":"Zeenana Stamp","image":"stamp_island_fruit"},{"page":1,"position":10,"name":"Mystery Island Grarrl Stamp","image":"stamp_island_grarrl"},{"page":1,"position":11,"name":"Island Acara Stamp","image":"stamp_island_acara"},{"page":1,"position":12,"name":"Haiku Stamp","image":"stamp_island_haiku"},{"page":1,"position":13,"name":"Mystery Island Heads Stamp","image":"stamp_island_heads"},{"page":1,"position":14,"name":"Bottle of Sand Stamp","image":"stamp_island_sand"},{"page":1,"position":15,"name":"Island Uni Stamp","image":"stamp_island_uni"},{"page":1,"position":16,"name":"Mystery Island Chef Stamp","image":"stamp_island_chef"},{"page":1,"position":17,"name":"Tombola Stamp","image":"stamp_island_tombola"},{"page":1,"position":18,"name":"Mystery Island Kiko Stamp","image":"stamp_island_kiko"},{"page":1,"position":19,"name":"Island Mystic Stamp","image":"stamp_mys_mystic"},{"page":1,"position":20,"name":"Ryshu Stamp","image":"stamp_mys_ryshu"},{"page":1,"position":21,"name":"Need a Better Printer Stamp","image":"stamp_misprint1"},{"page":1,"position":22,"name":"Upside Down Island Acara Stamp","image":"stamp_misprint2"},{"page":1,"position":23,"name":"One Hundred Million Neopoint Stamp","image":"stamp_misprint3"},{"page":1,"position":24,"name":"Misaligned Printer Stamp","image":"stamp_misprint4"},{"page":1,"position":25,"name":"Nibbled Cooking Pot Stamp","image":"stamp_mys_pongo"},{"page":2,"position":1,"name":"Grimilix Stamp","image":"stamp_spa_better"},{"page":2,"position":2,"name":"Neopet Version 2 Stamp","image":"stamp_spa_npv2"},{"page":2,"position":3,"name":"Gormball Stamp","image":"stamp_spa_gorm"},{"page":2,"position":4,"name":"Splat-A-Sloth Stamp","image":"stamp_spa_splat"},{"page":2,"position":5,"name":"Dr. Sloth Stamp","image":"stamp_spa_sloth"},{"page":2,"position":6,"name":"Space Faerie Stamp","image":"stamp_spa_faerie2"},{"page":2,"position":7,"name":"Grinning Sloth Stamp","image":"stamp_space_sloth2"},{"page":2,"position":8,"name":"Zygorax Stamp","image":"stamp_space_zygorax"},{"page":2,"position":9,"name":"Purple Grundo Stamp","image":"stamp_space_grundo"},{"page":2,"position":10,"name":"Commander Garoo Stamp","image":"stamp_space_garoo"},{"page":2,"position":11,"name":"Roast Gargapple Stamp","image":"stamp_space_food"},{"page":2,"position":12,"name":"N4 Bot Stamp","image":"stamp_space_n4bot"},{"page":2,"position":13,"name":"Blarthrox Stamp","image":"stamp_blarthrox"},{"page":2,"position":14,"name":"Tazzalor Stamp","image":"stamp_zyrolon"},{"page":2,"position":15,"name":"Zyrolon Stamp","image":"stamp_tazzalor"},{"page":2,"position":16,"name":"Advert Attack Stamp","image":"stamp_advert_attack"},{"page":2,"position":17,"name":"Evil Fuzzles Stamp","image":"sta_space_evilfuzzles"},{"page":2,"position":18,"name":"Gargarox Isafuhlarg Stamp","image":"sta_space_grundochef"},{"page":2,"position":19,"name":"Mutant Grundo Stamp","image":"sta_space_mutantgrundo"},{"page":2,"position":20,"name":"Zurroball Stamp","image":"sta_space_zurroball"},{"page":2,"position":21,"name":"Double Printed Evil Fuzzle Stamp","image":"stamp_spa_evil"},{"page":2,"position":22,"name":"Inverted Space Faerie Stamp","image":"stamp_spa_faerie"},{"page":2,"position":23,"name":"Grundo Warehouse Stamp","image":"sta_grundo"},{"page":2,"position":24,"name":"Virtupets Space Station Stamp","image":"sta_space"},{"page":2,"position":25,"name":"Holographic Virtupets Stamp","image":"sta_logo"},{"page":3,"position":1,"name":"Chomby Stamp","image":"stamp_tyrannia_chomby"},{"page":3,"position":2,"name":"Tyrannian Elephante Stamp","image":"stamp_tyrannia_elephante"},{"page":3,"position":3,"name":"Grarrg Stamp","image":"stamp_tyrannia_grarrl"},{"page":3,"position":4,"name":"Tyrannian Kougra Stamp","image":"stamp_tyrannia_kougra"},{"page":3,"position":5,"name":"Tyrannia Stamp","image":"stamp_tyrannia_landscape"},{"page":3,"position":6,"name":"Omelette Stamp","image":"stamp_tyrannia_omelette"},{"page":3,"position":7,"name":"Tar Pit Stamp","image":"stamp_tyrannia_tarpit"},{"page":3,"position":8,"name":"Wock Til You Drop Stamp","image":"stamp_tyrannia_wock"},{"page":3,"position":9,"name":"Tyrannian Grarrl Stamp","image":"stamp_tyrannia_night"},{"page":3,"position":10,"name":"Chunk of Meat Stamp","image":"stamp_tyrannia_meat"},{"page":3,"position":11,"name":"Tyrannian Kyrii Stamp","image":"stamp_tyrannia_kyrii"},{"page":3,"position":12,"name":"Tyrannian JubJub Stamp","image":"stamp_tyrannia_jubjub"},{"page":3,"position":13,"name":"Tyrannian Korbat Stamp","image":"stamp_tyrannia_korbat"},{"page":3,"position":14,"name":"Tyrannian Blumaroo Stamp","image":"stamp_tyrannia_blum"},{"page":3,"position":15,"name":"Tyrannian Plateau Stamp","image":"stamp_tyr_plateau"},{"page":3,"position":16,"name":"Flying Korbats Stamp","image":"stamp_tyr_korbat"},{"page":3,"position":17,"name":"Stone Armchair Stamp","image":"stamp_tyrannia_furn1"},{"page":3,"position":18,"name":"Giant Leaf Curtains Stamp","image":"stamp_tyrannia_furn2"},{"page":3,"position":19,"name":"Bone Chair Stamp","image":"stamp_tyrannia_furn3"},{"page":3,"position":20,"name":"Tyrannian Usul Stamp","image":"stamp_tyrannia_usul"},{"page":3,"position":21,"name":"Monocerous Stamp","image":"stamp_tyrannia_monocerous"},{"page":3,"position":22,"name":"Kyruggi Stamp","image":"stamp_tyrannia_kyruggi"},{"page":3,"position":23,"name":"Discovery of Fire Stamp","image":"stamp_tyrannia_fire"},{"page":3,"position":24,"name":"Shiny Monoceraptor Stamp","image":"stamp_tyrannia_mono"},{"page":3,"position":25,"name":"Stone Stamp","image":"stamp_tyr_stone"},{"page":4,"position":1,"name":"Brain Tree Stamp","image":"stamp_hal_brain"},{"page":4,"position":2,"name":"Esophagor Stamp","image":"stamp_hal_esoph"},{"page":4,"position":3,"name":"Fetch! Stamp","image":"stamp_hal_fetch"},{"page":4,"position":4,"name":"Haunted Mansion Stamp","image":"stamp_hal_house"},{"page":4,"position":5,"name":"Spyder Stamp","image":"stamp_hal_spyder"},{"page":4,"position":6,"name":"Scary Tree Stamp","image":"stamp_hal_trees"},{"page":4,"position":7,"name":"Hubrid Nox Stamp","image":"stamp_haunted_hubrid"},{"page":4,"position":8,"name":"Mutant Usul Stamp","image":"stamp_haunted_mutantusul"},{"page":4,"position":9,"name":"Rock Stamp","image":"stamp_haunted_petrock"},{"page":4,"position":10,"name":"Carnival of Terror Stamp","image":"stamp_haunted_carnival"},{"page":4,"position":11,"name":"Korbats Lab Stamp","image":"stamp_hal_korbatslab"},{"page":4,"position":12,"name":"Luperus Left Head Stamp","image":"stamp_haunted_cerbekusleft"},{"page":4,"position":13,"name":"Luperus Centre Head Stamp","image":"stamp_haunted_cerbekuscenter"},{"page":4,"position":14,"name":"Luperus Right Head Stamp","image":"stamp_haunted_cerbekusright"},{"page":4,"position":15,"name":"Halloween Aisha Stamp","image":"stamp_hal_aishahal"},{"page":4,"position":16,"name":"Spooky Gravestone Stamp","image":"stamp_hal_rip"},{"page":4,"position":17,"name":"Moonlit Werelupe Stamp","image":"stamp_hal_were"},{"page":4,"position":18,"name":"Moonlit Esophagor Stamp","image":"stamp_hal_eso"},{"page":4,"position":19,"name":"Edna the Zafara Stamp","image":"stamp_edna"},{"page":4,"position":20,"name":"Glowing Brain Tree Stamp","image":"stamp_hal_tree"},{"page":4,"position":21,"name":"ARGH!!!! DONNA STAMP","image":"stamp_hal_scary"},{"page":4,"position":22,"name":"Count Von Roo Stamp","image":"stamp_haunted_vonroo"},{"page":4,"position":23,"name":"Misprint Meuka Stamp","image":"stamp_hal_meucapound"},{"page":4,"position":24,"name":"Holographic Magax Stamp","image":"stamp_hal_magax"},{"page":4,"position":25,"name":"Foil Slorg Stamp","image":"stamp_hal_slorg"},{"page":5,"position":1,"name":"Alien Aisha Vending Stamp","image":"stamp_neo_alienvend"},{"page":5,"position":2,"name":"Orange Skeith Stamp","image":"stamp_skeith_orange"},{"page":5,"position":3,"name":"Skeith Bank Manager Stamp","image":"stamp_skeith_bank"},{"page":5,"position":4,"name":"Robot Skeith Stamp","image":"stamp_skeith_robot"},{"page":5,"position":5,"name":"Huberts Hot Dogs Stamp","image":"stamp_neo_hotdog"},{"page":5,"position":6,"name":"Wishing Well Stamp","image":"stamp_neo_well"},{"page":5,"position":7,"name":"Money Tree Stamp","image":"stamp_neo_money"},{"page":5,"position":8,"name":"Rainbow Pool Stamp","image":"stamp_neo_rainbow"},{"page":5,"position":9,"name":"Kauvara Stamp","image":"stamp_neo_kauvara"},{"page":5,"position":10,"name":"Shop Wizard Stamp","image":"stamp_neo_shopwiz"},{"page":5,"position":11,"name":"Book Shop Nimmo Stamp","image":"stamp_neo_book"},{"page":5,"position":12,"name":"Petpets Stamp","image":"stamp_neo_petpets"},{"page":5,"position":13,"name":"Seasonal Stamp","image":"ad_seasonalstamp"},{"page":5,"position":14,"name":"Neolodge Stamp","image":"stamp_nc_lodge"},{"page":5,"position":15,"name":"Year 5 Stamp","image":"ad_year5stamp"},{"page":5,"position":16,"name":"Deluxe Money Tree Stamp","image":"stamp_nc_tree"},{"page":5,"position":17,"name":"Neopian Hospital Stamp","image":"sta_gelert_doctor"},{"page":5,"position":18,"name":"Jelly Pop Stamp","image":"stamp_jelly_pop"},{"page":5,"position":19,"name":"Jelly World Stamp","image":"stamp_jelly_world"},{"page":5,"position":20,"name":"Usukiland Stamp","image":"sta_usukiland"},{"page":5,"position":21,"name":"Super Bright Rainbow Pool Stamp","image":"stamp_nc_rain"},{"page":5,"position":22,"name":"Foil Food Shop Stamp","image":"stamp_neo_food_foil"},{"page":5,"position":23,"name":"Chocolate Factory Stamp","image":"sta_chocfactory"},{"page":5,"position":24,"name":"Midnight Jelly World Stamp","image":"stamp_jelly_night"},{"page":5,"position":25,"name":"Neopia Central Scene Stamp","image":"sta_aerial"},{"page":6,"position":1,"name":"NeoQuest Logo Stamp","image":"stamp_nq_logo"},{"page":6,"position":2,"name":"NeoQuest Hero Stamp","image":"stamp_nq_hero"},{"page":6,"position":3,"name":"Jahbal Stamp","image":"stamp_nq_jahbal"},{"page":6,"position":4,"name":"Rotting Skeleton Stamp","image":"stamp_neoquest_skeleton"},{"page":6,"position":5,"name":"Mist Kougra Stamp","image":"stamp_neoquest_mistkougra"},{"page":6,"position":6,"name":"Plains Aisha Stamp","image":"stamp_neoquest_aisha"},{"page":6,"position":7,"name":"Two Rings Archmagus Stamp","image":"stamp_neoquest_archmagus"},{"page":6,"position":8,"name":"Boraxis the Healer Stamp","image":"stamp_neoquest_boraxis"},{"page":6,"position":9,"name":"Two Rings Crusader Stamp","image":"stamp_neoquest_crusader"},{"page":6,"position":10,"name":"Pomanna Stamp","image":"stamp_neoquest_pomanna"},{"page":6,"position":11,"name":"Mokti and Rikti Stamp","image":"stamp_mokti_rikti"},{"page":6,"position":12,"name":"Mr Irgo Stamp","image":"stamp_neoquest_irgo"},{"page":6,"position":13,"name":"Black Bearog Stamp","image":"stamp_neoquest_bearog"},{"page":6,"position":14,"name":"Gatekeeper Stamp","image":"stamp_gatekeeper"},{"page":6,"position":15,"name":"Leirobas Stamp","image":"stamp_leirobas"},{"page":6,"position":16,"name":"Archmagus of Roo Stamp","image":"stamp_neoquest_archmagusroo"},{"page":6,"position":17,"name":"Golden Mr Irgo Stamp","image":"stamp_mr_irgo"},{"page":6,"position":18,"name":"Zombie Faleinn Stamp","image":"sta_faleinn"},{"page":6,"position":19,"name":"Kreai Stamp","image":"sta_kreai"},{"page":6,"position":20,"name":"Morax Dorangis Stamp","image":"sta_morgaxdorangis"},{"page":6,"position":21,"name":"Guardian Of Spectral Magic Stamp","image":"sta_spectralmagic"},{"page":6,"position":22,"name":"Tylix Stamp","image":"sta_tylix"},{"page":6,"position":23,"name":"Eleus Stamp","image":"sta_eleus"},{"page":6,"position":24,"name":"Gors The Mighty Stamp","image":"sta_gors"},{"page":6,"position":25,"name":"Xantan Stamp","image":"sta_xantan"},{"page":7,"position":1,"name":"Snow Wars Catapult Stamp","image":"stamp_snowy_snowwars"},{"page":7,"position":2,"name":"Rainbow Slushie Stamp","image":"stamp_snowy_slushie"},{"page":7,"position":3,"name":"Frosty Snowman Stamp","image":"stamp_snowy_man"},{"page":7,"position":4,"name":"Wintery Petpet Shop Stamp","image":"stamp_snowy_ginger"},{"page":7,"position":5,"name":"Wintery Bruce Stamp","image":"stamp_snowy_bruce"},{"page":7,"position":6,"name":"Christmas Meerca Stamp","image":"stamp_snowy_meerca"},{"page":7,"position":7,"name":"Terror Mountain Scene Stamp","image":"stamp_snowy_valley"},{"page":7,"position":8,"name":"Igloo Garage Sale Stamp","image":"stamp_snowy_igloo"},{"page":7,"position":9,"name":"Rink Runner Stamp","image":"stamp_snowy_rink"},{"page":7,"position":10,"name":"Christmas Kougra Stamp","image":"stamp_snowy_kougra"},{"page":7,"position":11,"name":"Christmas Uni Stamp","image":"sta_christmasuni"},{"page":7,"position":12,"name":"Christmas Zafara Stamp","image":"stamp_snowy_zafara"},{"page":7,"position":13,"name":"Scratchcard Kiosk Stamp","image":"stamp_snowy_wocky"},{"page":7,"position":14,"name":"Candychan Stamp","image":"stamp_snowy_candychan"},{"page":7,"position":15,"name":"Grundo Snow Throw Stamp","image":"sta_grundothrow"},{"page":7,"position":16,"name":"Stocking Stamp","image":"sta_stocking"},{"page":7,"position":17,"name":"Cliffhanger Stamp","image":"sta_cliffhanger"},{"page":7,"position":18,"name":"Christmas Scene Stamp","image":"sta_winter_christmas_kougra"},{"page":7,"position":19,"name":"SHFISS Stamp","image":"sta_winter_snow_shop"},{"page":7,"position":20,"name":"Negg Faerie Stamp","image":"stamp_snowy_neggfaerie"},{"page":7,"position":21,"name":"Snow Faerie Stamp","image":"stamp_snowy_faerie"},{"page":7,"position":22,"name":"Ski Lodge Stamp","image":"sta_winter_ski_lodge"},{"page":7,"position":23,"name":"Snowager Stamp","image":"stamp_snowy_snowager"},{"page":7,"position":24,"name":"Snowbunny Stamp","image":"sta_winter_snowbunny"},{"page":7,"position":25,"name":"Sticky Snowflake Stamp","image":"sta_winter_sticky_snowflake"},{"page":8,"position":1,"name":"Meridell Heroes Stamp","image":"stamp_destruct_fight"},{"page":8,"position":2,"name":"Darigan Citadel Stamp","image":"stamp_destruct_castle3"},{"page":8,"position":3,"name":"Meridell Castle Stamp","image":"stamp_destruct_castle2"},{"page":8,"position":4,"name":"Green Knight Stamp","image":"stamp_destruct_greenknight"},{"page":8,"position":5,"name":"Lisha vs Zombie Lisha Stamp","image":"stamp_destruct_aisha"},{"page":8,"position":6,"name":"Morris Stamp","image":"stamp_meridell_morris"},{"page":8,"position":7,"name":"Skeith Defender Stamp","image":"stamp_meridell_skeithdefender"},{"page":8,"position":8,"name":"Darigan Moehog Stamp","image":"stamp_meridell_darmoehog"},{"page":8,"position":9,"name":"Boris Stamp","image":"sta_bfm_lastone"},{"page":8,"position":10,"name":"Draik Guard Stamp","image":"sta_meridell_draikguard"},{"page":8,"position":11,"name":"Yellow Knight Stamp","image":"sta_meridell_yellowknight"},{"page":8,"position":12,"name":"Meridell Shield Stamp","image":"sta_meridell_shield"},{"page":8,"position":13,"name":"Drackonack Stamp","image":"sta_meridell_drackonack"},{"page":8,"position":14,"name":"Darigan Shield Stamp","image":"stamp_darigan_shield"},{"page":8,"position":15,"name":"Darigan Eyrie Stamp","image":"stamp_meridell_dareyrie"},{"page":8,"position":16,"name":"Turmaculus Stamp","image":"stamp_meridell_turmaculus"},{"page":8,"position":17,"name":"Darigan Elemental Stamp","image":"stamp_darigan_elemental"},{"page":8,"position":18,"name":"Illusen Stamp","image":"stamp_meridell_illusen"},{"page":8,"position":19,"name":"Jeran Stamp","image":"stamp_darigan_jeran"},{"page":8,"position":20,"name":"Golden Orb Stamp","image":"stamp_orb"},{"page":8,"position":21,"name":"Zombified Heroes Stamp","image":"stamp_darigan_zombies"},{"page":8,"position":22,"name":"Lord Darigan Stamp","image":"stamp_darigan"},{"page":8,"position":23,"name":"King Skarl Stamp","image":"stamp_meridell_skarl"},{"page":8,"position":24,"name":"Master Vex Stamp","image":"stamp_vex"},{"page":8,"position":25,"name":"Darigan Spectre Stamp","image":"sta_meridell_dariganspect"},{"page":9,"position":1,"name":"Golden Khamette Stamp","image":"stamp_desert6"},{"page":9,"position":2,"name":"Desert Petpet Stamp","image":"stamp_desert5"},{"page":9,"position":3,"name":"Pyramid Sun Rise Stamp","image":"stamp_desert4"},{"page":9,"position":4,"name":"Lost Desert Grarrl Stamp","image":"stamp_desert3"},{"page":9,"position":5,"name":"Advisor Wessle Stamp","image":"stamp_desert_wessle"},{"page":9,"position":6,"name":"Senator Palpus Stamp","image":"stamp_desert_palpus"},{"page":9,"position":7,"name":"Midnight Desert Lupe Stamp","image":"stamp_desert2"},{"page":9,"position":8,"name":"Ummagine Stamp","image":"stamp_desert_ummagine"},{"page":9,"position":9,"name":"Osiris Pottery Stamp","image":"stamp_desert_pottery"},{"page":9,"position":10,"name":"Senator Barca Stamp","image":"stamp_desert_barca"},{"page":9,"position":11,"name":"Desert Paintbrush Stamp","image":"stamp_desert_pb"},{"page":9,"position":12,"name":"Peopatra Stamp","image":"stamp_desert_peopatra"},{"page":9,"position":13,"name":"Grackle Bug Stamp","image":"sta_gracklebug"},{"page":9,"position":14,"name":"Princess Sankara Stamp","image":"stamp_desert_sankara"},{"page":9,"position":15,"name":"Lost Desert Scroll Stamp","image":"stamp_desert1"},{"page":9,"position":16,"name":"Lost Desert Sphinx Stamp","image":"sta_kacheeksphinx"},{"page":9,"position":17,"name":"Tug Of War Stamp","image":"sta_tugowar"},{"page":9,"position":18,"name":"Fruit Machine Stamp","image":"sta_fruitmachine"},{"page":9,"position":19,"name":"Sakhmet Palace Stamp","image":"stamp_desert_sakhmet"},{"page":9,"position":20,"name":"Holographic Sakhmet City Stamp","image":"sta_sakhmet"},{"page":9,"position":21,"name":"Geb Stamp","image":"stamp_desert_geb"},{"page":9,"position":22,"name":"Coltzan Stamp","image":"stamp_desert_coltzan"},{"page":9,"position":23,"name":"Scarab Stamp","image":"stamp_desert_scarab"},{"page":9,"position":24,"name":"Lucky Coin Stamp","image":"stamp_desert_coin"},{"page":9,"position":25,"name":"Holographic Coltzans Shrine Stamp","image":"stamp_desert_shrine"},{"page":10,"position":1,"name":"Sword of Skardsen Stamp","image":"sta_bd_swordofscardsen"},{"page":10,"position":2,"name":"Attack Pea Stamp","image":"sta_bd_attackpea"},{"page":10,"position":3,"name":"Slorg Flakes Stamp","image":"sta_bd_slorgflakes"},{"page":10,"position":4,"name":"Faerie Slingshot Stamp","image":"sta_bd_slingshot"},{"page":10,"position":5,"name":"Hubrids Puzzle Box Stamp","image":"sta_bd_puzzlebox"},{"page":10,"position":6,"name":"Eraser of the Dark Faerie Stamp","image":"sta_bd_darkfaerieeraser"},{"page":10,"position":7,"name":"Jhudoras Bewitched Ring Stamp","image":"sta_jhudoraring"},{"page":10,"position":8,"name":"Everlasting Crystal Apple Stamp","image":"sta_crystalapple"},{"page":10,"position":9,"name":"Sword of the Air Faerie Stamp","image":"sta_airsword"},{"page":10,"position":10,"name":"Jewelled Scarab Stamp","image":"stamp_jeweledscarab"},{"page":10,"position":11,"name":"Rod of Dark Nova Stamp","image":"stamp_rodofdarknova"},{"page":10,"position":12,"name":"Jade Scorchstone Stamp","image":"stamp_jadescorchstone"},{"page":10,"position":13,"name":"Thyoras Tear Stamp","image":"sta_thyoras_tear"},{"page":10,"position":14,"name":"Exploding Space Bugs Stamp","image":"sta_exploding_space_bugs"},{"page":10,"position":15,"name":"Monoceraptor Claw Stamp","image":"sta_monoceraptor_claw"},{"page":10,"position":16,"name":"Wand Of The Dark Faerie Stamp","image":"sta_bd_darkwand"},{"page":10,"position":17,"name":"Alien Aisha Myriad Stamp","image":"sta_myriad"},{"page":10,"position":18,"name":"Alien Aisha Ray Gun Stamp","image":"sta_bd_alienaishagun"},{"page":10,"position":19,"name":"Kings Lens Stamp","image":"sta_bd_kings_lens"},{"page":10,"position":20,"name":"Ring of Sloth Stamp","image":"sta_bd_sloth_ring"},{"page":10,"position":21,"name":"Illusens Staff Stamp","image":"sta_bd_staff_illusen"},{"page":10,"position":22,"name":"Shield Of Pion Troect Stamp","image":"sta_bd_pion_shield"},{"page":10,"position":23,"name":"Rainbow Sticky Hand Stamp","image":"sta_rainbowhand"},{"page":10,"position":24,"name":"Dark Battle Duck Stamp","image":"sta_darkduck"},{"page":10,"position":25,"name":"Battle Slices Stamp","image":"sta_bd_slices"},{"page":11,"position":1,"name":"Silver Babaa Coin","image":"coin_babaa"},{"page":11,"position":2,"name":"Book Coin","image":"coin_book"},{"page":11,"position":3,"name":"Brass Usuki Coin","image":"coin_usuki"},{"page":11,"position":4,"name":"Money Tree Coin","image":"coin_tree"},{"page":11,"position":5,"name":"Rainbow Pool Coin","image":"coin_pool"},{"page":11,"position":6,"name":"Eliv Thade Coin","image":"coin_elivthade"},{"page":11,"position":7,"name":"Turtum Coin","image":"coin_turtum"},{"page":11,"position":8,"name":"Silver Buzzer Coin","image":"coin_buzzer"},{"page":11,"position":9,"name":"Snow PaintBrush Coin","image":"coin_snow_petpet_pb"},{"page":11,"position":10,"name":"Frozen Snowflake Coin","image":"coi_icy"},{"page":11,"position":11,"name":"Silver Concert Hall Coin","image":"coi_tyrannian"},{"page":11,"position":12,"name":"Hasee Coin","image":"coin_hasee"},{"page":11,"position":13,"name":"Bronze Mystery Island Coin","image":"coi_mystery"},{"page":11,"position":14,"name":"Golden Scarab Coin","image":"coi_desert"},{"page":11,"position":15,"name":"Giant Ghostkerchief Coin","image":"coin_gaintghostkerchief"},{"page":11,"position":16,"name":"Defenders Of Neopia Coin","image":"coin_defenders"},{"page":11,"position":17,"name":"Goo Blaster Coin","image":"coin_gooblaster"},{"page":11,"position":18,"name":"Larnikin Coin","image":"coin_larnikin"},{"page":11,"position":19,"name":"PaintBrush Coin","image":"coin_paintbrush"},{"page":11,"position":20,"name":"Chocolate Factory Coin","image":"coi_chocfactory"},{"page":11,"position":21,"name":"Battledome Coin","image":"coi_battledome"},{"page":11,"position":22,"name":"Dr Sloth Coin","image":"coi_sloth"},{"page":11,"position":23,"name":"Crystal Kauvara Coin","image":"coin_kauvara"},{"page":11,"position":24,"name":"Neopian Times Coin","image":"coi_quill"},{"page":11,"position":25,"name":"Emerald Eyrie Coin","image":"coin_emerald_eyrie"},{"page":12,"position":1,"name":"Dark Graspberry Stamp","image":"sta_darkgraspberry"},{"page":12,"position":2,"name":"Gelert Prince Stamp","image":"sta_gelertprince"},{"page":12,"position":3,"name":"Sunblade Stamp","image":"sta_sunblade"},{"page":12,"position":4,"name":"Meridell Gardens Stamp","image":"sta_meridellgardens"},{"page":12,"position":5,"name":"Petpet Growth Syrup Stamp","image":"sta_growth_syrup"},{"page":12,"position":6,"name":"Zafara Princess Stamp","image":"sta_zafara_princess"},{"page":12,"position":7,"name":"Gallion Stamp","image":"sta_gallion"},{"page":12,"position":8,"name":"Quiggle Scout Stamp","image":"sta_quiggle_scout"},{"page":12,"position":9,"name":"Blugthak Stamp","image":"sta_bfm_blugthak"},{"page":12,"position":10,"name":"Castle Defender Stamp","image":"sta_bfm_defender"},{"page":12,"position":11,"name":"Usul-in-waiting Stamp","image":"sta_bfm_usul"},{"page":12,"position":12,"name":"Blumaroo Court Jester Stamp","image":"sta_bfm_jester"},{"page":12,"position":13,"name":"King Skarl Plushie Stamp","image":"sta_bfm_skarlplush"},{"page":12,"position":14,"name":"Nova Storm Stamp","image":"sta_bfm_nova"},{"page":12,"position":15,"name":"105 Castle Secrets Stamp","image":"sta_bfm_secrets"},{"page":12,"position":16,"name":"Exploding Acorns Stamp","image":"sta_bfm_acorns"},{"page":12,"position":17,"name":"Zafara Double Agent Stamp","image":"sta_bfm_zafara_agent"},{"page":12,"position":18,"name":"Battle Uni Stamp","image":"sta_bfm_battle_uni"},{"page":12,"position":19,"name":"Court Dancer Stamp","image":"sta_bfm_court_dancer"},{"page":12,"position":20,"name":"Hadrak Stamp","image":"sta_bfm_hadrak"},{"page":12,"position":21,"name":"Morguss Stamp","image":"sta_morguss"},{"page":12,"position":22,"name":"Meerca Spy Stamp","image":"sta_meerca_spy"},{"page":12,"position":23,"name":"The Great Battle Stamp","image":"sta_great_battle"},{"page":12,"position":24,"name":"Lord Kass Stamp","image":"sta_kass"},{"page":12,"position":25,"name":"The Three Stamp","image":"sta_three"},{"page":13,"position":1,"name":"Trestin Stamp","image":"sta_nq2_trestin"},{"page":13,"position":2,"name":"Librarian Stamp","image":"sta_nq2_librarian"},{"page":13,"position":3,"name":"Rohanes Mother Stamp","image":"sta_nq2_rohanes_mother"},{"page":13,"position":4,"name":"Temple Of The Sky Stamp","image":"sta_nq2_temple"},{"page":13,"position":5,"name":"Hubrid Noxs Mountain Fortress Stamp","image":"sta_nq2_hubrid_fortress"},{"page":13,"position":6,"name":"NeoQuest II Logo Stamp","image":"sta_nq2_logo"},{"page":13,"position":7,"name":"Devilpuss Stamp","image":"sta_nq2_devilpuss"},{"page":13,"position":8,"name":"Celestial Talisman Stamp","image":"sta_nq2_talisman"},{"page":13,"position":9,"name":"Slime Titan Stamp","image":"sta_nq2slimemonster"},{"page":13,"position":10,"name":"Kolvars Stamp","image":"sta_nq2spyder"},{"page":13,"position":11,"name":"Rampaging Grundonoil Stamp","image":"sta_nq2grundonoil"},{"page":13,"position":12,"name":"Northern Watch Tower Stamp","image":"sta_neoquest2_ntower"},{"page":13,"position":13,"name":"Lost City of Phorofor Stamp","image":"sta_neoquest2_phorofor"},{"page":13,"position":14,"name":"Shadow Gulch Stamp","image":"sta_neoquest2_gultch"},{"page":13,"position":15,"name":"Von Roos Castle Stamp","image":"sta_neoquest2_vonroo"},{"page":13,"position":16,"name":"Velm Stamp","image":"sta_nq_velm"},{"page":13,"position":17,"name":"Talinia Stamp","image":"sta_nq_talinia"},{"page":13,"position":18,"name":"Rohane Stamp","image":"sta_nq_rohane"},{"page":13,"position":19,"name":"Mipsy Stamp","image":"sta_nq_mipsy"},{"page":13,"position":20,"name":"Sword Of Apocalypse Stamp","image":"sta_sword_of_apocalypse"},{"page":13,"position":21,"name":"NeoQuest II Esophagor Stamp","image":"sta_nq2_esophagor"},{"page":13,"position":22,"name":"Scuzzy Stamp","image":"sta_nq2_scuzzy"},{"page":13,"position":23,"name":"Anubits Stamp","image":"sta_nq2_anubits"},{"page":13,"position":24,"name":"Ramtor Stamp","image":"sta_nq2_ramtor"},{"page":13,"position":25,"name":"Terask Stamp","image":"sta_nq2_terask"},{"page":14,"position":1,"name":"Golden Coco Stamp","image":"sta_coconut_golden"},{"page":14,"position":2,"name":"Dice-A-Roo Stamp","image":"sta_dicearoo"},{"page":14,"position":3,"name":"Lutari Uni Stamp","image":"sta_lut_uni"},{"page":14,"position":4,"name":"Commemorative Defenders Stamp #1","image":"sta_defenders_kacheek"},{"page":14,"position":5,"name":"Destruct-O-Match Stamp","image":"sta_destructo"},{"page":14,"position":6,"name":"Commemorative Defenders Stamp #2","image":"sta_defenders_wocky"},{"page":14,"position":7,"name":"Grand Theft Ummagine Stamp","image":"sta_grandtheft"},{"page":14,"position":8,"name":"Shenkuu Bridge Stamp","image":"sta_shenkuubridge"},{"page":14,"position":9,"name":"Suteks Tomb Stamp","image":"sta_sutekstomb"},{"page":14,"position":10,"name":"Attack of the Slorgs Stamp","image":"sta_attack_slorgs"},{"page":14,"position":11,"name":"Pile of Dung Stamp","image":"sta_pile_of_dung"},{"page":14,"position":12,"name":"Faerie Bubbles Stamp","image":"sta_faerie_bubbles"},{"page":14,"position":13,"name":"Commemorative Defenders Stamp #3","image":"sta_defenders_korbat"},{"page":14,"position":14,"name":"Happy Lutari Stamp","image":"sta_lut_lutari"},{"page":14,"position":15,"name":"Bottled Faerie Stamp","image":"sta_other_bottledfaerie"},{"page":14,"position":16,"name":"Mystery Island Travel Stamp","image":"stamp_travel_jubjub"},{"page":14,"position":17,"name":"Shenkuu Mask Stamp","image":"sta_shenkuumask"},{"page":14,"position":18,"name":"Hot Dog Hero Stamp","image":"sta_hotdoghero"},{"page":14,"position":19,"name":"Rainbow Pteri Feather Stamp","image":"sta_holo_rainbowpterifeather"},{"page":14,"position":20,"name":"Commemorative Defenders Stamp #4","image":"sta_defenders_scorchio"},{"page":14,"position":21,"name":"Altador Travel Stamp","image":"stamp_travel_altador"},{"page":14,"position":22,"name":"Gold Mote Stamp","image":"sta_other_goldmote"},{"page":14,"position":23,"name":"Count Von Roo Plushie Stamp","image":"sta_other_vonrooplush"},{"page":14,"position":24,"name":"Ready to Roll Stamp","image":"sta_readytoroll"},{"page":14,"position":25,"name":"Lab Ray Stamp","image":"sta_other_labray"},{"page":15,"position":1,"name":"Grundo Veggieballs Coin","image":"coi_spa_veggieballs"},{"page":15,"position":2,"name":"Grobleen Salad Coin","image":"coi_spa_grobleen"},{"page":15,"position":3,"name":"Cosmic Cheese Stars Coin","image":"coi_spa_cosmic"},{"page":15,"position":4,"name":"Roast Gargapple Coin","image":"coi_spa_gargapple"},{"page":15,"position":5,"name":"Zoomik Coin","image":"coi_spa_zoomik"},{"page":15,"position":6,"name":"Vacumatic 9000 Coin","image":"coi_spa_vacumatic"},{"page":15,"position":7,"name":"N-4 Information Retrieval Bot Coin","image":"coi_spa_n4info"},{"page":15,"position":8,"name":"GX-4 Oscillabot Coin","image":"coi_spa_oscillabot"},{"page":15,"position":9,"name":"Gargaroxs Recipe Book Coin","image":"coi_space_recipes"},{"page":15,"position":10,"name":"Gormball Coin","image":"coi_space_gormball"},{"page":15,"position":11,"name":"Electro Shield Coin","image":"coi_space_electroshield"},{"page":15,"position":12,"name":"H4000 Helmet Coin","image":"coi_space_helmet"},{"page":15,"position":13,"name":"Grundo Warehouse Coin","image":"coi_spa_warehouse"},{"page":15,"position":14,"name":"Adopt A Grundo Coin","image":"coi_spa_adoptgrundo"},{"page":15,"position":15,"name":"Evil Fuzzle Coin","image":"coi_spa_evilfuzzle"},{"page":15,"position":16,"name":"Splat A Sloth Coin","image":"coi_spa_splatsloth"},{"page":15,"position":17,"name":"Astral Blade Coin","image":"coi_astral_blade"},{"page":15,"position":18,"name":"Lever of Doom Coin","image":"coi_leverofdoom"},{"page":15,"position":19,"name":"Super Nova Coin","image":"coi_super_nova"},{"page":15,"position":20,"name":"Mallow Coin","image":"coi_mallow_grundo"},{"page":15,"position":21,"name":"Bzzt Blaster Coin","image":"coi_space_bzztblaster"},{"page":15,"position":22,"name":"Gorix and Cylara Coin","image":"coi_space_gorixcylara"},{"page":15,"position":23,"name":"Neopet V2 Coin","image":"coi_space_npv2"},{"page":15,"position":24,"name":"Smiling Space Faerie Coin","image":"coi_spacefaerie_smile"},{"page":15,"position":25,"name":"Scowling Sloth Coin","image":"coi_sloth_scowl"},{"page":16,"position":1,"name":"Angry Evil Coconut","image":"spo_coconut_1"},{"page":16,"position":2,"name":"Sinister Evil Coconut","image":"spo_coconut_2"},{"page":16,"position":3,"name":"Ugly Evil Coconut","image":"spo_coconut_3"},{"page":16,"position":4,"name":"Screaming Evil Coconut","image":"spo_coconut_4"},{"page":16,"position":5,"name":"Horned Evil Coconut","image":"spo_coconut_5"},{"page":16,"position":6,"name":"Infernal Evil Coconut","image":"spo_coconut_6"},{"page":16,"position":7,"name":"Burning Evil Coconut","image":"spo_coconut_7"},{"page":16,"position":8,"name":"Mini Evil Coconut","image":"spo_coconut_8"},{"page":16,"position":9,"name":"Silent Evil Coconut","image":"spo_coconut_9"},{"page":16,"position":10,"name":"Monstrous Evil Coconut","image":"spo_coconut_10"},{"page":16,"position":11,"name":"Tusked Evil Coconut","image":"spo_coconut_11"},{"page":16,"position":12,"name":"Hairy Evil Coconut","image":"spo_coconut_12"},{"page":16,"position":13,"name":"Painted Evil Coconut","image":"spo_coconut_13"},{"page":16,"position":14,"name":"Stitched Evil Coconut","image":"spo_coconut_14"},{"page":16,"position":15,"name":"Wailing Evil Coconut","image":"spo_coconut_18"},{"page":16,"position":16,"name":"Light Brown Evil Coconut","image":"spo_coconut_17"},{"page":16,"position":17,"name":"Damaged Evil Coconut","image":"spo_coconut_23"},{"page":16,"position":18,"name":"Flaming Evil Coconut","image":"spo_coconut_16"},{"page":16,"position":19,"name":"Seasonal Evil Coconut","image":"spo_coconut_xmas"},{"page":16,"position":20,"name":"One Eyed Evil Coconut","image":"spo_coconut_19"},{"page":16,"position":21,"name":"Vicious Evil Coconut","image":"spo_coconut_20"},{"page":16,"position":22,"name":"Moaning Evil Coconut","image":"spo_coconut_21"},{"page":16,"position":23,"name":"Sliced Evil Coconut","image":"spo_coconut_24"},{"page":16,"position":24,"name":"Scorched Evil Coconut","image":"spo_coconut_15"},{"page":16,"position":25,"name":"Golden Evil Coconut","image":"spo_coconut_25"},{"page":17,"position":1,"name":"Green Clam Shell","image":"she_giantclam"},{"page":17,"position":2,"name":"Purple Scallop Shell","image":"she_scallop2"},{"page":17,"position":3,"name":"Glossy Blue Shell","image":"she_scallop1"},{"page":17,"position":4,"name":"Green Smooth Shell","image":"she_snail"},{"page":17,"position":5,"name":"Tangerine Trumpet Shell","image":"she_trumpet"},{"page":17,"position":6,"name":"Brown Spotted Shell","image":"she_dwivitt"},{"page":17,"position":7,"name":"Rainbow Coloured Shell","image":"she_candycane"},{"page":17,"position":8,"name":"Spiky Shell","image":"she_shell_spiky"},{"page":17,"position":9,"name":"Crimson Spotted Shell","image":"she_conch1"},{"page":17,"position":10,"name":"Camouflage Scallop Shell","image":"she_shell_camo"},{"page":17,"position":11,"name":"Pink Curly Shell","image":"she_chamber"},{"page":17,"position":12,"name":"Shiny Purple Cowry Shell","image":"she_purple_tortoisecowry"},{"page":17,"position":13,"name":"Blue Spiral Seashell","image":"she_spiral1"},{"page":17,"position":14,"name":"Faerie Wings Shell","image":"she_faeriewings"},{"page":17,"position":15,"name":"Spiky Orange Murex Shell","image":"she_orange_murex"},{"page":17,"position":16,"name":"Sparkly Green Scallop Shell","image":"she_green_lionspaw"},{"page":17,"position":17,"name":"Dazzling Blue Mussel Shell","image":"she_blue_mussel"},{"page":17,"position":18,"name":"Deep Seashell","image":"she_glow_bright"},{"page":17,"position":19,"name":"Purple Spiral Shell","image":"she_pinkrope"},{"page":17,"position":20,"name":"Blue and Gold Tube Shell","image":"she_shell_bluetube"},{"page":17,"position":21,"name":"Tiny Golden Shell","image":"she_shell_tiny"},{"page":17,"position":22,"name":"Matching Pastel Shells","image":"she_clams"},{"page":17,"position":23,"name":"Royal Orange Cowry Shell","image":"she_orangulous"},{"page":17,"position":24,"name":"Purple Twirly Shell","image":"she_purple_twirl"},{"page":17,"position":25,"name":"Golden Shell","image":"she_goldback"},{"page":18,"position":1,"name":"Maractite Dagger Stamp","image":"sta_maracititedagger"},{"page":18,"position":2,"name":"Piraket Stamp","image":"sta_piraket"},{"page":18,"position":3,"name":"Seaweed Necklace Stamp","image":"sta_seaweednecklace"},{"page":18,"position":4,"name":"Petty Crewmate Stamp","image":"sta_wave1pirate"},{"page":18,"position":5,"name":"Maraquan Defenders Stamp","image":"sta_mar_3maraquan"},{"page":18,"position":6,"name":"Pirate Attack Stamp","image":"sta_mar_4pirate"},{"page":18,"position":7,"name":"Goregas Stamp","image":"sta_mar_goregas"},{"page":18,"position":8,"name":"The Black Pawkeet Stamp","image":"sta_mar_pawkeet"},{"page":18,"position":9,"name":"Scurvy Island Stamp","image":"sta_mar_scurvyisland"},{"page":18,"position":10,"name":"New Maraqua Stamp","image":"sta_mar_newmaraqua"},{"page":18,"position":11,"name":"Pirate Troops Stamp","image":"sta_mar_pirates2"},{"page":18,"position":12,"name":"Maraquan Troops Stamp","image":"sta_mar_maraquans2"},{"page":18,"position":13,"name":"Chasm Beast Stamp","image":"stamp_chasmbeast"},{"page":18,"position":14,"name":"The Drenched Stamp","image":"stamp_drenched"},{"page":18,"position":15,"name":"Maraquan Charger Stamp","image":"stamp_maraquawave_3"},{"page":18,"position":16,"name":"Maraquan Blade Specialist Stamp","image":"stamp_maraquawave_2"},{"page":18,"position":17,"name":"Garin To The Rescue Stamp","image":"sta_mar_wave4"},{"page":18,"position":18,"name":"Caylis Stamp","image":"sta_mar_caylis"},{"page":18,"position":19,"name":"Swordsmaster Talek Stamp","image":"sta_mar_talek"},{"page":18,"position":20,"name":"The Revenge Stamp","image":"sta_mar_revenge"},{"page":18,"position":21,"name":"Jacques Stamp","image":"sta_mar_jacques"},{"page":18,"position":22,"name":"Garin Stamp","image":"sta_mar_garin"},{"page":18,"position":23,"name":"Isca Stamp","image":"sta_mar_isca"},{"page":18,"position":24,"name":"Captain Scarblade Stamp","image":"sta_mar_scarblade"},{"page":18,"position":25,"name":"King Kelpbeard Stamp","image":"sta_mar_kelpbeard"},{"page":19,"position":1,"name":"Siyana Stamp","image":"sta_altador_siyana"},{"page":19,"position":2,"name":"First Edition Altador Petpet Stamp","image":"sta_altador_petpet1"},{"page":19,"position":3,"name":"Fauna Stamp","image":"sta_altador_fauna"},{"page":19,"position":4,"name":"Jerdana Stamp","image":"sta_altador_jerdana"},{"page":19,"position":5,"name":"The Wave Stamp","image":"sta_alt_constellation"},{"page":19,"position":6,"name":"Marak Stamp","image":"sta_altador_marak"},{"page":19,"position":7,"name":"Altadorian Farmer Stamp","image":"sta_alt_moehogfarmer"},{"page":19,"position":8,"name":"Gordos Stamp","image":"sta_altador_gordos"},{"page":19,"position":9,"name":"Psellia Stamp","image":"sta_altador_psellia"},{"page":19,"position":10,"name":"Second Edition Altador Petpet Stamp","image":"sta_altador_petpet2"},{"page":19,"position":11,"name":"Perfectly Flat Rock Stamp","image":"sta_alt_perfectlyflatrock"},{"page":19,"position":12,"name":"Kelland Stamp","image":"sta_altador_kelland"},{"page":19,"position":13,"name":"Altador Food Stamp","image":"sta_altador_food"},{"page":19,"position":14,"name":"Florin Stamp","image":"sta_altador_florin"},{"page":19,"position":15,"name":"Astronomy Club Stamp","image":"sta_alt_astroclub"},{"page":19,"position":16,"name":"Finneus Stamp","image":"sta_alt_finneus"},{"page":19,"position":17,"name":"Altador Magic Stamp","image":"sta_altador_magic"},{"page":19,"position":18,"name":"The Sleeper Constellation Stamp","image":"sta_alt_sleeper"},{"page":19,"position":19,"name":"Torakor Stamp","image":"sta_altador_torakor"},{"page":19,"position":20,"name":"Angry Janitor Stamp","image":"sta_alt_janitor"},{"page":19,"position":21,"name":"Darkest Faerie Stamp","image":"sta_altador_darkfaerie"},{"page":19,"position":22,"name":"Sasha Stamp","image":"sta_altador_sasha"},{"page":19,"position":23,"name":"Yooyu Celebration Stamp","image":"altcp2_sta_yooyuball"},{"page":19,"position":24,"name":"King Altador Stamp","image":"sta_altador_kingaltador"},{"page":19,"position":25,"name":"Altador Colosseum Stamp","image":"altcp_colusseum_stamp"},{"page":20,"position":1,"name":"Shenkuu City Stamp","image":"sta_shenku"},{"page":20,"position":2,"name":"Kentari Stamp","image":"sta_kentarifly"},{"page":20,"position":3,"name":"Negg Noodles Stamp","image":"sta_neggnoodles"},{"page":20,"position":4,"name":"Linae Stamp","image":"sta_linae"},{"page":20,"position":5,"name":"Shenkuu Lunar Temple Stamp","image":"sta_shenkuu"},{"page":20,"position":6,"name":"Orange Draik Stamp","image":"sta_orange_draik"},{"page":20,"position":7,"name":"Captain Tuan Stamp","image":"sta_captain"},{"page":20,"position":8,"name":"Anshu Stamp","image":"sta_ancient_ruki"},{"page":20,"position":9,"name":"Enchanted Pudao Stamp","image":"sta_shen_pudao"},{"page":20,"position":10,"name":"Kazeriu Stamp","image":"sta_kazeriu"},{"page":20,"position":11,"name":"Bonju Stamp","image":"sta_bonju"},{"page":20,"position":12,"name":"Pineapple Dessert Stamp","image":"sta_pinapple_dessert"},{"page":20,"position":13,"name":"Cyodrakes Gaze Logo Stamp","image":"sta_cyodrake"},{"page":20,"position":14,"name":"Kou-Jong Tile Stamp","image":"sta_shen_koujong"},{"page":20,"position":15,"name":"Kentari Spyglass Stamp","image":"sta_kentari"},{"page":20,"position":16,"name":"Hoban Stamp","image":"sta_hoban"},{"page":20,"position":17,"name":"Thoughtful Linae Stamp","image":"sta_linaedoubt"},{"page":20,"position":18,"name":"Orrin Stamp","image":"sta_shen_exoticfoods"},{"page":20,"position":19,"name":"Shumi Telescope Stamp","image":"sta_shumitelescope"},{"page":20,"position":20,"name":"Biyako Stamp","image":"sta_white_kougra"},{"page":20,"position":21,"name":"The Cyodrakes Gaze Stamp","image":"sta_ship"},{"page":20,"position":22,"name":"Anshu Fishing Stamp","image":"sta_anshu"},{"page":20,"position":23,"name":"Wise Gnorbu Stamp","image":"sta_shen_wisegnorbu"},{"page":20,"position":24,"name":"Quilin Stamp","image":"sta_quilin"},{"page":20,"position":25,"name":"Shenkuu Stamp","image":"sta_shenkustamp"},{"page":21,"position":1,"name":"Nimmo Gnome Collectable Charm","image":"zip_gnome_nimmodreaming"},{"page":21,"position":2,"name":"Chia Gnome Collectable Charm","image":"zip_gnome_redchia"},{"page":21,"position":3,"name":"Yellow PaintBrush Collectable Charm","image":"zip_pb_yellow"},{"page":21,"position":4,"name":"Bika Collectable Charm","image":"toy_bika_charm"},{"page":21,"position":5,"name":"Chomby Gnome Collectable Charm","image":"zip_gnome_yellowchomby"},{"page":21,"position":6,"name":"Snowager Collectable Charm","image":"toy_snowager_charm"},{"page":21,"position":7,"name":"Green PaintBrush Collectable Charm","image":"zip_pb_green"},{"page":21,"position":8,"name":"Flower Trumpet Collectable Charm","image":"toy_flowertrumpet_charm"},{"page":21,"position":9,"name":"Tagobo Potion Collectable Charm","image":"toy_tagobo_potion_charm"},{"page":21,"position":10,"name":"Bori Gnome Collectable Charm","image":"zip_gnome_borileaf"},{"page":21,"position":11,"name":"Glyme Collectable Charm","image":"toy_glyme_charm"},{"page":21,"position":12,"name":"Faerie Techo Plushie Collectable Charm","image":"toy_techo_faerieplu_charm"},{"page":21,"position":13,"name":"Schnelly Collectable Charm","image":"toy_schnelly_charm"},{"page":21,"position":14,"name":"Red PaintBrush Collectable Charm","image":"zip_pb_red"},{"page":21,"position":15,"name":"Pinchit Collectable Charm","image":"toy_pinchit_charm"},{"page":21,"position":16,"name":"Faerie Buzz Plushie Collectable Charm","image":"toy_buzz_faerieplu_charm"},{"page":21,"position":17,"name":"Tigerfruit Collectable Charm","image":"toy_tigerfruit_charm"},{"page":21,"position":18,"name":"Skarl Collectable Charm","image":"toy_skarl_charm"},{"page":21,"position":19,"name":"Blue PaintBrush Collectable Charm","image":"zip_pb_blue"},{"page":21,"position":20,"name":"Festival Negg Collectable Charm","image":"toy_fony14_festival_negg_cc"},{"page":21,"position":21,"name":"Cyodrake Collectable Charm","image":"toy_cyodrake_collect_charm"},{"page":21,"position":22,"name":"Gallion Collectable Charm","image":"toy_gallion_collect_charm"},{"page":21,"position":23,"name":"Techo Statue Collectable Charm","image":"toy_techo_statue_charm"},{"page":21,"position":24,"name":"Taiko Standing Drum Collectable Charm","image":"toy_taikostandingdrum_charm"},{"page":21,"position":25,"name":"Elephante Lamp Collectable Charm","image":"toy_elephante_lamp_charm"},{"page":22,"position":1,"name":"Veggie Pizza Stamp","image":"sta_other_veggiepizza"},{"page":22,"position":2,"name":"Plesio Stamp","image":"sta_plesio_stamp"},{"page":22,"position":3,"name":"Hannah Stamp","image":"sta_hannah"},{"page":22,"position":4,"name":"Shenkuu Draik Stamp","image":"sta_shenkuudraik"},{"page":22,"position":5,"name":"Altador Cup IX Commemorative Stamp","image":"sta_ac2014_alupeime"},{"page":22,"position":6,"name":"3D Camp AAA Stamp","image":"sta_ddy15_3dcampaaasta"},{"page":22,"position":7,"name":"Mutant Techo Plushie Stamp","image":"sta_techo_mutantplushie"},{"page":22,"position":8,"name":"Fruit Bomb Stamp","image":"sta_other_fruitbomb"},{"page":22,"position":9,"name":"Altador Cup VIII Commemorative Stamp","image":"sta_acy15vii_acviiicomstamp"},{"page":22,"position":10,"name":"Underwater Chef Stamp","image":"sta_underwater_chef"},{"page":22,"position":11,"name":"Mysterious Obelisk Stamp","image":"sta_tyweof2013_myobalstmp"},{"page":22,"position":12,"name":"Halloween Ona Stamp","image":"sta_halloween_ona"},{"page":22,"position":13,"name":"Threelegs vs. Techo Master Stamp","image":"sta_gmc_threevstechm"},{"page":22,"position":14,"name":"Games Master Challenge Stamp","image":"sta_gmc_challenge"},{"page":22,"position":15,"name":"Tasu Stamp","image":"sta_other_tasu"},{"page":22,"position":16,"name":"Plushie Slorg Stamp","image":"sta_plushie_slorg"},{"page":22,"position":17,"name":"Charms Stamp","image":"sta_other_charms"},{"page":22,"position":18,"name":"Altador Cup VII Commemorative Stamp","image":"sta_acy14vii_comm_acvii"},{"page":22,"position":19,"name":"AAA vs. Abigail Stamp","image":"sta_ddy14_aaavsabistamp"},{"page":22,"position":20,"name":"Shenkuu Helmet Stamp","image":"sta_shenkuuhelmet"},{"page":22,"position":21,"name":"Altador Cup V Commemorative Stamp","image":"sta_altcp_comm_acv"},{"page":22,"position":22,"name":"Captain of the Guard Stamp","image":"sta_captainguardbrynn"},{"page":22,"position":23,"name":"Geraptiku Stamp","image":"sta_geraptiku"},{"page":22,"position":24,"name":"Altador Cup VI Commemorative Stamp","image":"sta_altcp_comm_acvi"},{"page":22,"position":25,"name":"Brains vs. Brawn Stamp","image":"sta_gmc_grainvbrawn"},{"page":23,"position":1,"name":"Library Faerie Stamp","image":"sta_library_faerie"},{"page":23,"position":2,"name":"Captain of Fyoras Guards Stamp","image":"sta_fyoras_guards"},{"page":23,"position":3,"name":"Healing Springs Stamp","image":"sta_faerie_statue"},{"page":23,"position":4,"name":"Faerie Techo Plushie Stamp","image":"sta_techo_faerieplushie"},{"page":23,"position":5,"name":"The Discarded Magical Blue Grundo Plushie of Prosperity Stamp","image":"sta_tdmbgpop"},{"page":23,"position":6,"name":"Delina Stamp","image":"sta_faerie_delina"},{"page":23,"position":7,"name":"Ruins of Faerieland Stamp","image":"sta_faerieland_ruins"},{"page":23,"position":8,"name":"Faerieland Petpet Shopkeeper Stamp","image":"sta_faerie_petpetshop"},{"page":23,"position":9,"name":"Faerie City Stamp","image":"sta_faerie_castle"},{"page":23,"position":10,"name":"Faerieland Justice Stamp","image":"sta_faerieland_justice"},{"page":23,"position":11,"name":"Snowglobe Faerie Stamp","image":"sta_faerie_snow"},{"page":23,"position":12,"name":"Faerie Foods Stamp","image":"sta_faerie_foods"},{"page":23,"position":13,"name":"Faerie Furniture Shopkeeper Stamp","image":"sta_faerie_furniture"},{"page":23,"position":14,"name":"Hubrid Nox Commemorative Stamp","image":"sta_commem_hubrid_nox"},{"page":23,"position":15,"name":"Fountain Faerie Stamp","image":"sta_rainbow_faerie"},{"page":23,"position":16,"name":"Fyora Faerie Doll Stamp","image":"sta_fyora_faerie_doll"},{"page":23,"position":17,"name":"Destruction of Faerieland Stamp","image":"sta_faerieland_destruct"},{"page":23,"position":18,"name":"Dark Faerie Stamp","image":"sta_faerie_dark"},{"page":23,"position":19,"name":"Faerie Slorg Stamp","image":"sta_faerie_slorg"},{"page":23,"position":20,"name":"Fyoras Castle Stamp","image":"sta_faerieland_castle"},{"page":23,"position":21,"name":"Aethia Stamp","image":"sta_faerie_aethia"},{"page":23,"position":22,"name":"Wheel of Excitement Stamp","image":"sta_stw_wheelofexcitement"},{"page":23,"position":23,"name":"Faerie Caverns Stamp","image":"sta_faerie_caverns"},{"page":23,"position":24,"name":"Jhudoras Cloud Stamp","image":"sta_jhudora_castle"},{"page":23,"position":25,"name":"Queen Fyora Stamp","image":"sta_queen_fyora"},{"page":24,"position":1,"name":"Basic Yellow Collectable Scarab","image":"coi_scarab_yellowbas"},{"page":24,"position":2,"name":"Polkadot Collectable Scarab","image":"coi_scarab_polkadot"},{"page":24,"position":3,"name":"Orange Spotted Collectable Scarab","image":"coi_scarab_orangespotted"},{"page":24,"position":4,"name":"Common Desert Collectable Scarab","image":"coi_desertscarab_slim"},{"page":24,"position":5,"name":"Bushy Antennae Collectable Scarab","image":"coi_scarab_fancyant"},{"page":24,"position":6,"name":"Striped Blue Collectable Scarab","image":"coi_striblu_scarabs"},{"page":24,"position":7,"name":"Basic Fringed Collectable Scarab","image":"coi_scarab_4"},{"page":24,"position":8,"name":"Flashy Winged Collectable Scarab","image":"coi_scarab_flashywinged"},{"page":24,"position":9,"name":"Large Black and White Collectable Scarab","image":"coi_scarab_blacknwhite"},{"page":24,"position":10,"name":"Simple Red Collectable Scarab","image":"coi_red_scarabs"},{"page":24,"position":11,"name":"Long Headed Collectable Scarab","image":"coi_scarab_longhead"},{"page":24,"position":12,"name":"Day and Night Collectable Scarab","image":"coi_gmc2013_daynightscar"},{"page":24,"position":13,"name":"Purple Collectable Scarab","image":"coi_scarab_purple"},{"page":24,"position":14,"name":"Speckled Collectable Scarab","image":"coi_scarab_speckled"},{"page":24,"position":15,"name":"Uncommon Blue Collectable Scarab","image":"coi_scarab_3"},{"page":24,"position":16,"name":"Horned Collectable Scarab","image":"coi_scarab_horned"},{"page":24,"position":17,"name":"Greater Green Collectable Scarab","image":"coi_desertscarab_green"},{"page":24,"position":18,"name":"Rainbow Collectable Scarab","image":"coi_scarab_rainbow"},{"page":24,"position":19,"name":"Dazzling Verdant Collectable Scarab","image":"coi_verdant_scarab"},{"page":24,"position":20,"name":"Black and Yellow Collectable Scarab","image":"coi_scarab_blackandyellow"},{"page":24,"position":21,"name":"Spotted Red Collectable Scarab","image":"coi_dotted_scarabs"},{"page":24,"position":22,"name":"Greater Yellow Collectable Scarab","image":"coi_scarab_yellowgre"},{"page":24,"position":23,"name":"Sparkleback Collectable Scarab","image":"coi_scarab_sparkleb"},{"page":24,"position":24,"name":"Spotted Blue Collectable Scarab","image":"coi_spotblu_scarabs"},{"page":24,"position":25,"name":"Large Black Collectable Scarab","image":"coi_large_black_scarab"},{"page":25,"position":1,"name":"Entrance to Moltara Stamp","image":"sta_moltaraentrance"},{"page":25,"position":2,"name":"Monty McTaggart Stamp","image":"st_mctaggart_monty"},{"page":25,"position":5,"name":"The Arcanium Stamp","image":"sta_thearcanium"},{"page":25,"position":6,"name":"Magma Pool Stamp","image":"sta_moltara_magmapool"},{"page":25,"position":7,"name":"Magma Pool Guard Stamp","image":"sta_magpool_guard"},{"page":25,"position":9,"name":"Molten Morsels Stamp","image":"sta_molten_morsels"},{"page":25,"position":12,"name":"Mayor of Moltara Stamp","image":"sta_moltara_mayor"},{"page":25,"position":16,"name":"Cogs Togs Stamp","image":"sta_cogs_togs"},{"page":25,"position":17,"name":"Petpetorium Stamp","image":"st_petpetorium"},{"page":25,"position":18,"name":"Tangor Stamp","image":"sta_tangor"},{"page":25,"position":19,"name":"Moltara Town Hall Stamp","image":"sta_moltara_townhall"},{"page":25,"position":20,"name":"Abandoned Water Tower Stamp","image":"sta_reu2014_abanwattowstaalb"},{"page":25,"position":21,"name":"Lampwyck Stamp","image":"sta_lampwyck"},{"page":25,"position":23,"name":"Igneots Cavern Stamp","image":"sta_moltara_igneot"},{"page":25,"position":24,"name":"Lava Monster Stamp","image":"sta_lava_monster"},{"page":25,"position":25,"name":"Igneot Stamp","image":"sta_igneot"},{"page":26,"position":1,"name":"Squared Maractite Coin","image":"coi_maractite_squared"},{"page":26,"position":2,"name":"Half Maractite Coin","image":"coi_maractite_half"},{"page":26,"position":3,"name":"Triangular Maractite Coin","image":"coi_maractite_triangular"},{"page":26,"position":4,"name":"Maractite Koi Maractite Coin","image":"coi_maraquan_koi"},{"page":26,"position":5,"name":"Seaweed Design Maractite Coin","image":"coi_maractite_seaweed"},{"page":26,"position":6,"name":"Deformed Maractite Coin","image":"coi_dot_maractite"},{"page":26,"position":7,"name":"Dual Tone Maractite Coin","image":"coi_maractite_dual_tone"},{"page":26,"position":8,"name":"Maractite Waves Coin","image":"coi_maractite_waves"},{"page":26,"position":9,"name":"Worn Maractite Coin","image":"coi_maractite_worn"},{"page":26,"position":10,"name":"Simple Maractite Coin","image":"coin_koi_maractite"},{"page":26,"position":11,"name":"Maraquan Kau Maractite Coin","image":"coi_maraquan_kau"},{"page":26,"position":12,"name":"Runed Maractite Coin","image":"coi_maractite_runed"},{"page":26,"position":13,"name":"Isca Maractite Coin","image":"coin_isca"},{"page":26,"position":14,"name":"Rusty Sloth Clone Maractite Coin","image":"sea_rusty_clone_maractite_coin"},{"page":26,"position":15,"name":"Quiggle Maractite Coin","image":"coi_maractite_quiggle"},{"page":26,"position":16,"name":"Ancient Seaweed Maractite Coin","image":"coi_maractite_seaweaweed"},{"page":26,"position":17,"name":"Nimmo Maractite Coin","image":"coi_maractite_nimmo"},{"page":26,"position":18,"name":"Maraquan Skeith Maractite Coin","image":"coi_maraquan_skeith"},{"page":26,"position":19,"name":"Maraquan Draik Maractite Coin","image":"coi_maractite_draik_mara"},{"page":26,"position":20,"name":"Large Maractite Coin","image":"coi_maractite_large"},{"page":26,"position":21,"name":"Acara Maractite Coin","image":"coi_acara_maractite"},{"page":26,"position":22,"name":"Streaked Maractite Coin","image":"coi_maractite_streaked"},{"page":26,"position":23,"name":"Round Maractite Coin","image":"coi_maractite_round"},{"page":26,"position":24,"name":"Ancient Peophin Maractite Coin","image":"coi_maractite_ancient_peo"},{"page":26,"position":25,"name":"Floral Maractite Coin","image":"coi_maractite_floral"},{"page":27,"position":1,"name":"Words of Antiquity Stamp","image":"sta_antiquity_words"},{"page":27,"position":2,"name":"Qasalan Delights Stamp","image":"sta_delight_qasalan"},{"page":27,"position":3,"name":"Ancient Contract Stamp","image":"sta_ancient_contract"},{"page":27,"position":4,"name":"Mystical Surroundings Stamp","image":"wea_y18gmc_sta_qasala_mystical"},{"page":27,"position":5,"name":"Nabile & Tomos Stamp","image":"sta_nabile_tomos"},{"page":27,"position":6,"name":"Qasalan Coffee Set Stamp","image":"sta_qasalan_coffeeset"},{"page":27,"position":7,"name":"Horace Stamp","image":"st_horace"},{"page":27,"position":8,"name":"Siliclast Stamp","image":"sta_siliclast"},{"page":27,"position":9,"name":"Qasalan Tablet Stamp","image":"sta_qasalan_tablet"},{"page":27,"position":10,"name":"Trapped Tomos Stamp","image":"sta_trapped_tomos"},{"page":27,"position":11,"name":"Ruins of Qasala Stamp","image":"sta_desert_qasalaruin"},{"page":27,"position":12,"name":"Qasalan Mummy Stamp","image":"sta_mummy_qasalan"},{"page":27,"position":13,"name":"The Ruins of Thanyros Stamp","image":"stamp_tge_ruinsthan"},{"page":27,"position":14,"name":"Scorchio Mummy Stamp","image":"sta_ld_scorch_mummy"},{"page":27,"position":15,"name":"Desert Arms Stamp","image":"sta_desert_armsshop"},{"page":27,"position":16,"name":"Bledynn Stamp","image":"sta_bledynn"},{"page":27,"position":17,"name":"Lupe Shopkeeper Stamp","image":"sta_qasala_lupe_shop"},{"page":27,"position":18,"name":"Razul Stamp","image":"sta_ld_razul"},{"page":27,"position":19,"name":"Dark Qasala Stamp","image":"sta_dark_qasala"},{"page":27,"position":20,"name":"Scordrax Stamp","image":"sta_scordrax"},{"page":27,"position":21,"name":"Tomos Stamp","image":"sta_tomos"},{"page":27,"position":22,"name":"Nabile Stamp","image":"sta_nabile"},{"page":27,"position":23,"name":"Nightsteed Stamp","image":"sta_nightsteed"},{"page":27,"position":24,"name":"King Jazan Stamp","image":"sta_king_jazan"},{"page":27,"position":25,"name":"Wheel of Extravagance Stamp","image":"sta_wheel_of_extravagance"},{"page":28,"position":1,"name":"Circlet of the Deep","image":"she_circlet_thedeep"},{"page":28,"position":2,"name":"Shell Comb","image":"gif_shell_groom"},{"page":28,"position":3,"name":"Golden Koi of the Deep","image":"she_koi_thedeep"},{"page":28,"position":4,"name":"Tiara of the Deep","image":"she_tiara_thedeep"},{"page":28,"position":5,"name":"Shell Clutch","image":"gif_shell_clasp"},{"page":28,"position":6,"name":"Siren Harp of the Deep","image":"she_siren_harp"},{"page":28,"position":7,"name":"Hair Clip of the Deep","image":"she_hairclip_thedeep"},{"page":28,"position":9,"name":"Hairpin of the Deep","image":"she_thedeep_hairpin"},{"page":28,"position":10,"name":"Bangles of the Deep","image":"she_bangles_thedeep"},{"page":28,"position":12,"name":"Brilliant Negg Crown","image":"she_fony15_brilliantcrown"},{"page":28,"position":13,"name":"Armlet of the Deep","image":"she_armlet_thedeep"},{"page":28,"position":14,"name":"Diadem of the Deep","image":"she_diadem_thedeep"},{"page":28,"position":16,"name":"Enameled Peophin Brooch of the Deep","image":"she_peobrooch_thedeep"},{"page":28,"position":17,"name":"Coronet of the Deep","image":"she_coronet_thedeep"},{"page":28,"position":20,"name":"Earrings of the Deep","image":"she_earrings_thedeep"},{"page":28,"position":21,"name":"Exquisite Peophin Ring of the Deep","image":"she_peoring_thedeep"},{"page":28,"position":22,"name":"Necklace of the Deep","image":"she_necklace_thedeep"},{"page":28,"position":24,"name":"Anklet of the Deep","image":"she_anklet_thedeep"},{"page":28,"position":25,"name":"Choker of the Deep","image":"she_thedeep_choker"},{"page":29,"position":1,"name":"Krawk Island Governor Stamp","image":"sta_kwark_island"},{"page":29,"position":2,"name":"Riches of Krawk Island Stamp","image":"sta_krawkisle_riches"},{"page":29,"position":3,"name":"Mellow Marauders Plushie Stamp","image":"mellow-marauders-plushie"},{"page":29,"position":4,"name":"Drooling Quadrapus Stamp","image":"sta_quadrapus_drool"},{"page":29,"position":5,"name":"Petpet Cannonball Stamp","image":"sta_petpet_cannonball"},{"page":29,"position":6,"name":"Captain Bloodhook Stamp","image":"stamp_capt_bloodhook"},{"page":29,"position":7,"name":"The Lighthouse Stamp","image":"sta_lighthouse"},{"page":29,"position":8,"name":"Buried Treasure Stamp","image":"sta_krawk_island"},{"page":29,"position":9,"name":"Bug Eye McGee Stamp","image":"sta_mcgee_bugeye"},{"page":29,"position":10,"name":"Docked Ship Stamp","image":"sta_docked_ship"},{"page":29,"position":11,"name":"Smugglers Cove Stamp","image":"sta_smugglers_cove"},{"page":29,"position":12,"name":"Feldon Dinksy Collibridge Stamp","image":"stamp_feldon_dinksy"},{"page":29,"position":13,"name":"Fred the Tuskaninny Sailor Stamp","image":"sta_tuskaninny_sailor"},{"page":29,"position":14,"name":"Benny the Blade Stamp","image":"stamp_benny_the_blade"},{"page":29,"position":15,"name":"Dubloon-O-Matic Stamp","image":"stamp_dubloon_o_matic"},{"page":29,"position":16,"name":"Barf Boat Stamp","image":"sta_ddy21_barf_boat_stamp"},{"page":29,"position":17,"name":"Dorak Stamp","image":"sta_dorak"},{"page":29,"position":18,"name":"The Krawken Stamp","image":"sta_krawken"},{"page":29,"position":19,"name":"The Academy Stamp","image":"sta_academy"},{"page":29,"position":20,"name":"Forgotten Shore Stamp","image":"sta_forgotten_shore"},{"page":29,"position":21,"name":"Capn Threelegs Stamp","image":"sta_capn_threelegs"},{"page":29,"position":22,"name":"Golden Dubloon Stamp","image":"sta_dubloon_golden"},{"page":29,"position":23,"name":"Limited Edition Scurvy Island Stamp","image":"sta_y16haltot_scurvisle"},{"page":29,"position":24,"name":"Grimtooth Stamp","image":"sta_grimtooth"},{"page":29,"position":25,"name":"Governor Mansion Stamp","image":"sta_governormansion"},{"page":30,"position":1,"name":"Young Sophie Stamp","image":"sta_young_sophie"},{"page":30,"position":2,"name":"Rusty Door Stamp","image":"sta_rustydoor"},{"page":30,"position":3,"name":"Crumpetmonger Stamp","image":"sta_crumpetmonger"},{"page":30,"position":4,"name":"Hilda the Hedgewitch Stamp","image":"st_hilda_hedgewitch"},{"page":30,"position":5,"name":"Neovia Stamp","image":"sta_land_neovia"},{"page":30,"position":6,"name":"Guard Zomutt Stamp","image":"sta_guardzomutt"},{"page":30,"position":7,"name":"Bruno Stamp","image":"sta_bruno_stamp"},{"page":30,"position":8,"name":"Neovian Printing Press Shopkeeper Stamp","image":"sta_printing_press"},{"page":30,"position":9,"name":"Family Portrait Stamp","image":"sta_family_portrait"},{"page":30,"position":10,"name":"Moloch Stamp","image":"stamp_moloch"},{"page":30,"position":11,"name":"Orion Stamp","image":"sta_orion"},{"page":30,"position":12,"name":"The Crumpetmonger Shop Stamp","image":"sta_y20haltot_neovianshop"},{"page":30,"position":13,"name":"Spirit of Slumber Stamp","image":"sta_spirit_slumber"},{"page":30,"position":14,"name":"Teatime in Neovia Stamp","image":"fon_sta_teatime_in_neovia"},{"page":30,"position":15,"name":"Oscar Stamp","image":"st_oscar"},{"page":30,"position":16,"name":"Sentient Headstones Stamp","image":"sta_headstone_sentient"},{"page":30,"position":17,"name":"RIP Lucy Stamp","image":"sta_rip_lucy"},{"page":30,"position":19,"name":"Mr. Krawley Stamp","image":"sta_krawley_stamp"},{"page":30,"position":20,"name":"Dark Ilere Stamp","image":"sta_dark_illere"},{"page":30,"position":21,"name":"Grave Danger Petpet Stamp","image":"stamp_grave-danger-petpet"},{"page":30,"position":25,"name":"Grave Danger Stamp","image":"sta_gd_grave_danger"},{"page":31,"position":1,"name":"Space Faerie Kari Charm","image":"fon_spacefaeriekari_charm"},{"page":31,"position":2,"name":"Imposter Apple Collectable Charm","image":"toy_imp_apple_charm"},{"page":31,"position":3,"name":"Detective Kari Charm","image":"fon_charm_det_kari"},{"page":31,"position":4,"name":"Voided Lost Desert Amulet","image":"ci0d2n9ef0"},{"page":31,"position":5,"name":"Neopets 24th Cake Charm","image":"y24_cake_charm"},{"page":31,"position":6,"name":"Astronaut Kari Charm","image":"fon_astronautkari_charm"},{"page":31,"position":7,"name":"Princess Terrana Collectable Charm","image":"sta_gnorbu_charm"},{"page":31,"position":8,"name":"Moon Rock Albert Collectable Charm","image":"sta_albert_moonrock"},{"page":31,"position":9,"name":"AAA Collectable Charm","image":"sta_aaa_collectable"},{"page":31,"position":10,"name":"Chia Clown Collectible Charm","image":"sta_ddy21_chiaclown_charm"},{"page":31,"position":11,"name":"Zaira Charm","image":"8a98809bbb"},{"page":31,"position":12,"name":"Hagan Collectable Charm","image":"toy_hagan_charm"},{"page":31,"position":13,"name":"Recovered Shoyru Collectable Charm","image":"sta_twr_shoyrucollcharm"},{"page":31,"position":14,"name":"Negg-Gazer Charm","image":"charm_negggazer"},{"page":31,"position":15,"name":"Malum Collectable Charm","image":"twr_sta_malum_collcharm"},{"page":31,"position":16,"name":"Recovered Jetsam Collectable Charm","image":"sta_twr_recoveredjetsam"},{"page":31,"position":17,"name":"Recovered Meerca Collectable Charm","image":"sta_twr_recoveredmeerca"},{"page":31,"position":18,"name":"Fyora Collectable Charm","image":"twr_sta_fyora_charm"},{"page":31,"position":19,"name":"Wherfy Collectable Charm","image":"toy_wherfy_charm"},{"page":31,"position":20,"name":"Recovered Skeith Collectable Charm","image":"twr_sta_skeith_collcharm"},{"page":31,"position":21,"name":"Sloth Collectable Charm","image":"sta_sloth_charm"},{"page":31,"position":22,"name":"Governor McGill Collectable Charm","image":"toy_y19haltot_mcgill_charm"},{"page":31,"position":23,"name":"The Darkest Faerie Collectible Charm","image":"twr_sta_tdf_collcharm"},{"page":31,"position":24,"name":"Baelia Charm","image":"baelia_charm"},{"page":31,"position":25,"name":"Game Controller Collectable Charm","image":"toy_ddy18_gamecontr_charm"},{"page":32,"position":1,"name":"Official Ghoul Catchers Stamp","image":"sta_gcm_gctriostamp"},{"page":32,"position":2,"name":"Haunted Brightvale Amulet","image":"coi_gc_amuletobright"},{"page":32,"position":3,"name":"Haunted Terror Mountain Amulet","image":"coi_gc_amuletotm"},{"page":32,"position":4,"name":"Haunted Lost Desert Amulet","image":"coi_gc_amuletold"},{"page":32,"position":5,"name":"Haunted Shenkuu Amulet","image":"coi_gc_amuletsh"},{"page":32,"position":6,"name":"Haunted Altador Amulet","image":"coi_gc_amuletalt"},{"page":32,"position":7,"name":"Master of the Tower Stamp","image":"cf8df6792l"},{"page":32,"position":8,"name":"Haunted Faerieland Amulet","image":"coi_gc_amuletofaerie"},{"page":32,"position":9,"name":"Varia Stamp","image":"42cb3b8209"},{"page":32,"position":10,"name":"Tia Stamp","image":"h25bc4b20f"},{"page":32,"position":12,"name":"Jorett Stamp","image":"5k309e7a39"},{"page":32,"position":13,"name":"Aurrick vs Claymaker Stamp","image":"sta_aurrick_claymaker"},{"page":32,"position":14,"name":"Ascor Stamp","image":"c9f2mk2i62"},{"page":32,"position":16,"name":"Magnus Byte Stamp","image":"87hd89qdh9"},{"page":32,"position":21,"name":"Team Dacardia Stamp","image":"sta_team_dacardia"},{"page":32,"position":22,"name":"New Faerieland Stamp","image":"sta_new_faerieland_home"},{"page":32,"position":24,"name":"Ariel Stamp","image":"stamp_ariel"},{"page":33,"position":1,"name":"Battle Eyrie Stamp","image":"sta_battle_eyrie"},{"page":33,"position":2,"name":"Mumbo Pango Stamp","image":"sta_mumbo_pango"},{"page":33,"position":3,"name":"Hanso Stamp","image":"sta_hanso"},{"page":33,"position":4,"name":"Usuki Doll Stamp","image":"sta_usuki_doll"},{"page":33,"position":5,"name":"Ruler of the Five Seas Stamp","image":"captain-scarblade"},{"page":33,"position":6,"name":"Bringer of Night Stamp","image":"sta_night_bringer"},{"page":33,"position":7,"name":"Easter Treats Stamp","image":"sta_fony18_eastertreats"},{"page":33,"position":8,"name":"Lady Frostbite Stamp","image":"sta_lady_frostbite"},{"page":33,"position":9,"name":"AC XIV Commemorative Stamp","image":"sta_acy21_commemorative_stamp"},{"page":33,"position":10,"name":"Altador Cup XI Commemorative Stamp","image":"sta_acy18_acxicomstamp"},{"page":33,"position":11,"name":"Hanso and Brynn Stamp","image":"sta_knights_raiders"},{"page":33,"position":12,"name":"Yiko Stamp","image":"sta_yiko_stamp"},{"page":33,"position":13,"name":"Lost City Lanes Stamp","image":"sta_lostcity_lanes"},{"page":33,"position":14,"name":"AC XIII Commemorative Stamp","image":"sta_acy20_acxiiicomstamp"},{"page":33,"position":15,"name":"Hulking Wraith Stamp","image":"sta_twr_hulkingwraith"},{"page":33,"position":16,"name":"Altador Cup XII Commemorative Stamp","image":"sta_acy19_acxiicomstamp"},{"page":33,"position":17,"name":"The Wraith Resurgence Stamp","image":"sta_twrstamp"},{"page":33,"position":18,"name":"Decorative Negg Stamp","image":"coi_decorative_negg"},{"page":33,"position":19,"name":"Magax Vs. Nox Stamp","image":"sta_y19gmc_noxvsmagax"},{"page":33,"position":20,"name":"Spyders Stamp","image":"sta_spyder_stamp"},{"page":33,"position":21,"name":"Altador Cup X Commemorative Stamp","image":"sta_altador_cup_collectible"},{"page":33,"position":22,"name":"Taelia Vs. Ember Stamp","image":"sta_y17gmc_taeliavember"},{"page":33,"position":23,"name":"Fire Breathing Scorchio Stamp","image":"sta_fire_scorchio"},{"page":33,"position":24,"name":"Preoccupied AAA Stamp","image":"sta_ddy18_preoccupiedaaa"},{"page":33,"position":25,"name":"Chadley Stamp","image":"sta_ddy19_chadley"},{"page":34,"position":1,"name":"Star Fish Shell","image":"she_star_fish"},{"page":34,"position":3,"name":"Red Lined Shell","image":"she_redlined_shell"},{"page":34,"position":5,"name":"Squiggles Shell","image":"she_squiggles"},{"page":34,"position":6,"name":"Cream Heart Sea Shell","image":"she_shell_heart"},{"page":34,"position":8,"name":"Lavender Cowry Shell","image":"she_cauree_shell"},{"page":34,"position":9,"name":"Brown Striped Murex Shell","image":"she_brown_murex_shell"},{"page":34,"position":12,"name":"Maractite Seashell","image":"ak2igfcnm3"},{"page":34,"position":13,"name":"Charybdis Seashell","image":"she_charybdis_seashell"},{"page":34,"position":14,"name":"So Blue Shell","image":"she_so_blue"},{"page":34,"position":21,"name":"Void Seashell","image":"680f3l02al"},{"page":35,"position":1,"name":"Soup Faerie Stamp","image":"sta_advc2019_soupfaerie"},{"page":35,"position":2,"name":"25th Anniversary Kougra Stamp","image":"cgjl745cli"},{"page":35,"position":4,"name":"Overstamped Stamp","image":"a7774ccde3"},{"page":35,"position":5,"name":"25th Anniversary Aisha Stamp","image":"stamp_25thanni_aisha"},{"page":35,"position":6,"name":"25th Anniversary Kacheek Stamp","image":"hmac2e9n8f"},{"page":35,"position":8,"name":"25th Anniversary Faellie Stamp","image":"9i6j5bal2h"},{"page":35,"position":9,"name":"Second Hand Stamp","image":"st_secondhand"},{"page":35,"position":10,"name":"25th Anniversary Acara Stamp","image":"h1l5h55jil"},{"page":35,"position":11,"name":"Red Shoyru Stamp","image":"stamp_neo_shoyru"},{"page":35,"position":12,"name":"25th Anniversary Shoyru Stamp","image":"stamp_25thanni_shoyru"},{"page":35,"position":13,"name":"Neggnapper Stamp","image":"stamp_neggnapper"},{"page":35,"position":15,"name":"Warm Hearty Soup Stamp","image":"g4mg11lkd1"},{"page":35,"position":17,"name":"25th Anniversary Doglefox Stamp","image":"c83b3b3379"},{"page":36,"position":1,"name":"Yes-Boy Ice Cream Stamp","image":"sta_tyrannia2_yesboy"},{"page":36,"position":2,"name":"Pacha Stamp","image":"st_pacha"},{"page":36,"position":3,"name":"Singed Tyrannian Volcano Stamp","image":"sta_sing_tyr_vol"},{"page":36,"position":4,"name":"Magnus Stamp","image":"stamp_tyrannian_magnus"},{"page":36,"position":5,"name":"Tyrannian Fossil Stamp","image":"stamp_tyrannian_fossil"},{"page":36,"position":17,"name":"Tyrannian Victory Day Stamp","image":"sta_tyrannian_victory_day"},{"page":36,"position":19,"name":"Wheel of Monotony Stamp","image":"sta_wheel_monotony"},{"page":37,"position":1,"name":"Mika Stamp","image":"sta_mika_stamp"},{"page":37,"position":3,"name":"Snowball Fight Stamp","image":"sta_snowball_fight"},{"page":37,"position":4,"name":"Sliding Darblat Stamp","image":"sta_sliding_darblat"},{"page":37,"position":5,"name":"Reina Stamp","image":"stamp_reina"},{"page":37,"position":6,"name":"Plump Petpets Stamp","image":"sta_plump_petpets"},{"page":37,"position":7,"name":"Merry Mistletoe Stamp","image":"st_mistletoe_merry"},{"page":37,"position":8,"name":"Winter Wonderland Stamp","image":"sta_winter_wonderland"},{"page":37,"position":10,"name":"Cybunny on a Cycle Stamp","image":"sta_cybunny_cycle"},{"page":37,"position":13,"name":"Baby Aisha Stamp","image":"sta_baby_aisha"},{"page":37,"position":15,"name":"Snowman Slushie Stamp","image":"sta_snowman_slushie"},{"page":37,"position":18,"name":"Santa Skarl Stamp","image":"sta_santa_skarl"},{"page":37,"position":19,"name":"Powtry Stamp","image":"sta_powtry"},{"page":37,"position":21,"name":"Kari and Topsi Stamp","image":"sta_kari_topsi"},{"page":37,"position":22,"name":"Christmas Bruce Stamp","image":"sta_christmas_bruce"},{"page":37,"position":23,"name":"Holiday King Altador Stamp","image":"sta_holiday_altador"},{"page":38,"position":1,"name":"Sloth Evil Coconut","image":"spo_coconut_sloth"},{"page":38,"position":2,"name":"Negg Evil Coconut","image":"spo_negg_evil_coconut"},{"page":38,"position":16,"name":"Evil Evil Coconut","image":"spo_coconut_evilevil"},{"page":38,"position":21,"name":"Ghostly Evil Coconut","image":"spo_y17haltot_coconutghostly"},{"page":39,"position":1,"name":"Green Patterned Collectable Scarab","image":"coi_scarab_green"},{"page":39,"position":2,"name":"Yellow and Black Collectable Scarab","image":"coi_scarab_yellowblack"},{"page":39,"position":3,"name":"Shiny Cocoa Collectable Scarab","image":"coi_scarab_shinycocoa"},{"page":39,"position":6,"name":"Red Striped Collectable Scarab","image":"coi_scarab_redstripe"},{"page":39,"position":11,"name":"Orange Patterned Collectable Scarab","image":"coi_scarab_orangepattern"},{"page":39,"position":21,"name":"Void Collectable Scarab","image":"b9e3c7a052"},{"page":39,"position":22,"name":"Fiery Golden Collectable Scarab","image":"coi_y18gmc_scarab_fierygold"},{"page":39,"position":24,"name":"Mysterious Vibrant Collectable Scarab","image":"coi_acxii_scarab_colspot"},{"page":40,"position":1,"name":"Altador Cup X Collectible Gold Coin","image":"gif_altador_cup_gold_coin"},{"page":40,"position":2,"name":"King Coltzan Coin","image":"coi_king_coltzan"},{"page":40,"position":3,"name":"Birthday Coin","image":"birthday_coin"},{"page":40,"position":4,"name":"Coltzans Shrine Coin","image":"coi_coltzans_shrine"},{"page":40,"position":5,"name":"Negg Coin","image":"3cf37a7ee6"},{"page":40,"position":6,"name":"Golden Altador Cup Coin","image":"golden_altadorcup_coin"},{"page":40,"position":7,"name":"Snowager Coin","image":"coi_snowager"},{"page":40,"position":8,"name":"AAA Coin","image":"spe_ddy21_aaa_coin"},{"page":40,"position":10,"name":"Jorett Coin","image":"7b770e2d991149"},{"page":40,"position":11,"name":"Gingerbread House Coin","image":"col_gingerbread_house_coin"},{"page":40,"position":12,"name":"Illusens Coin","image":"2d8772a87f"},{"page":40,"position":13,"name":"Jhudoras Coin","image":"c0391cbb35"},{"page":40,"position":14,"name":"Queen Fyora Coin","image":"m5a9b7e18"},{"page":40,"position":15,"name":"Taelia Coin","image":"coi_taelia"},{"page":40,"position":16,"name":"Fiendish Formations Coin","image":"coin_twr_fiendish_formations"},{"page":40,"position":17,"name":"Snowickle Coin","image":"snowickle_coin"},{"page":40,"position":19,"name":"Luxinia Coin","image":"916e9hcfb3"},{"page":40,"position":20,"name":"Void Neocola Token","image":"d4h1p7s9"},{"page":40,"position":21,"name":"Collectible Abyss Crystal Coin","image":"a9f3k2d1"},{"page":40,"position":23,"name":"Void Coin","image":"stamp_voidcoin"},{"page":41,"position":1,"name":"Champions of Meridell Stamp","image":"sta_champ_ofmeridell"},{"page":41,"position":2,"name":"Stamp of Spring Charm","image":"stamp_charm"},{"page":41,"position":3,"name":"Tuskaninny Day Stamp","image":"sta_tuskanniny_day"},{"page":41,"position":4,"name":"Peaceful Coexistence Stamp","image":"sta_peaceful_coexistence"},{"page":41,"position":5,"name":"Cancelled Stamp","image":"sta_lack_of_interest_day"},{"page":41,"position":6,"name":"Reginald Christmas Stamp","image":"stamp_reginald_christmas"},{"page":41,"position":7,"name":"Lady Blurg Stamp","image":"fon_stamp_ladyblurg"},{"page":41,"position":8,"name":"Arcade Stamp","image":"sta_8bit_arcade"},{"page":41,"position":9,"name":"Altador Cup XV Commemorative Stamp","image":"xv_stamp_commemorativeac"},{"page":41,"position":10,"name":"Rebuilding Dacardia Stamp","image":"cc_rebuilddacar_stamp"},{"page":41,"position":11,"name":"AC XVI Commemorative Stamp","image":"stamp_commemorat_acxvi"},{"page":41,"position":12,"name":"Techo Fanatic Stamp","image":"stamp_techofanatic"},{"page":41,"position":13,"name":"Kiko Carpenter Stamp","image":"sta_y20haltot_kikocarpenter"},{"page":41,"position":14,"name":"Altador Cup XVII Stamp","image":"stamp_ac_xvii"},{"page":41,"position":15,"name":"Chairman with Way Too Long a Title Stamp","image":"ac_stamp_chairman"},{"page":41,"position":16,"name":"Mirsha Grelinek Stamp","image":"ac_stamp_mirsha"},{"page":41,"position":17,"name":"Altador Cup XVIII Stamp","image":"stamp_ac_xviii"},{"page":41,"position":18,"name":"Baelia Stamp","image":"sta_baelia"},{"page":41,"position":19,"name":"Neopets 22nd Birthday Stamp","image":"sta_22_bday"},{"page":41,"position":20,"name":"Christmas Fir Stamp","image":"stamp_christmas_fir"},{"page":41,"position":21,"name":"25th Anniversary Celebration Stamp","image":"44f4ea2977"},{"page":41,"position":22,"name":"Valentine Stamp","image":"stamp_valentine"},{"page":41,"position":23,"name":"End Voided Stamp","image":"dkld7da7gf"},{"page":41,"position":24,"name":"Void Tendril Stamp","image":"7k7kk5ii6n"},{"page":41,"position":25,"name":"AC XIX Commemorative Stamp","image":"stamp_acxix_comm"},{"page":42,"position":1,"name":"Yooyu Trading Card","image":"yooyu_tradiingcard"},{"page":42,"position":2,"name":"Altador Cup Collectable Card","image":"ac_collectible_card"},{"page":42,"position":3,"name":"Reina Collectable Card","image":"reina_collectable_card"},{"page":42,"position":4,"name":"Jelly Chia Goalie Card","image":"card_jellychia_goalie"},{"page":42,"position":21,"name":"Wan Dirx Graded Altador Cup I Rookie Card","image":"gif_wandirx_graded_card"},{"page":42,"position":25,"name":"Layton Vickles Graded Altador Cup I Rookie Card","image":"gif_laytonvickles_graded_card"},{"page":43,"position":1,"name":"Stamp of Neopia","image":"stamp_neopia"},{"page":43,"position":2,"name":"Gruntharxx Stamp","image":"st_gruntharxx"},{"page":43,"position":15,"name":"Space Code Stamp","image":"stamp_space_code"},{"page":44,"position":1,"name":"Faerie Fragments Baby Tiles Stamp","image":"g6l13af5dc"},{"page":44,"position":2,"name":"Luxinia Stamp","image":"d3cf0h2ki5"},{"page":44,"position":3,"name":"Big Bang Varia Stamp","image":"o91c7a532"},{"page":44,"position":5,"name":"Fire Faerie Slingshot Stamp","image":"n3d82f14c"},{"page":44,"position":6,"name":"Jhudora Stamp","image":"stamp_jhudora"},{"page":44,"position":11,"name":"Queen Fyora Metallic Stamp","image":"stamp_382"},{"page":44,"position":14,"name":"Nephrite Stamp","image":"6i56fkfl0a"},{"page":44,"position":17,"name":"The Darkest Faerie Stamp","image":"stamp_386"},{"page":44,"position":20,"name":"Blushing Jhudora Stamp","image":"stamp_blushing_jhudora"},{"page":45,"position":1,"name":"Nostalgic Grey Draik Stamp","image":"stamp_grey_draik"},{"page":45,"position":2,"name":"Grey Kari Charm","image":"fon_greykari_charm"},{"page":45,"position":3,"name":"Grey Tsunami Coin","image":"8ic7c8374m"},{"page":45,"position":4,"name":"Sera Nero Stamp","image":"st_sera_nero"},{"page":45,"position":5,"name":"Vocivus of the Void Stamp","image":"st_vocivus_void"},{"page":45,"position":21,"name":"Terrible Two Stamp","image":"30nia3mf0d"},{"page":45,"position":22,"name":"Nyx and Ozzy Stamp","image":"st_nyx_ozzy"},{"page":47,"position":1,"name":"Cloudy Meridell Stamp","image":"stamp_368"},{"page":47,"position":2,"name":"Doglefox Fetch Stamp","image":"f2a74kb582"},{"page":47,"position":3,"name":"Tea Time Stamp","image":"ch61kbg6ih"},{"page":47,"position":4,"name":"Jerans Defence Stamp","image":"stamp_destruct_lupe2"},{"page":47,"position":5,"name":"Colouring Book Stamp","image":"08f9a4nmk3"},{"page":47,"position":6,"name":"Malevolent Being Stamp","image":"st_being_malevolent"},{"page":47,"position":7,"name":"Cheerleader Usuki Stamp","image":"stamp_neopia_usukicheer"},{"page":47,"position":8,"name":"Magical Kayla Stamp","image":"stamp_destruct_zafara"},{"page":47,"position":9,"name":"Cherry Blossom Ixi Stamp","image":"stamp_destruct_ixi"},{"page":47,"position":10,"name":"Council of Leaders Stamp","image":"stamp_councilleaders"},{"page":47,"position":11,"name":"Fashionista Stamp","image":"stamp_neo_shoes"},{"page":47,"position":12,"name":"Dr. Landelbrot Stamp","image":"df21ljk2le"},{"page":47,"position":13,"name":"Swirling Void Stamp","image":"stamp_swirlingvoid"},{"page":47,"position":14,"name":"Baseball Kacheek Stamp","image":"7e1d8a4b9523"},{"page":47,"position":15,"name":"Bank Manager Stamp","image":"stamp_mono"},{"page":47,"position":16,"name":"Musical Stamp","image":"8e2f4a9c53"},{"page":47,"position":19,"name":"Flaming Meerca Stamp","image":"st_flaming_meerca"},{"page":47,"position":20,"name":"Bank Clerk Stamp","image":"79594ehnee"},{"page":47,"position":21,"name":"Holographic Usukicon Stamp","image":"stamp_neo_usukiholo"},{"page":47,"position":22,"name":"Kiss the Mortog Stamp","image":"st_mortog_kiss"},{"page":47,"position":23,"name":"Mutant Whalein Stamp","image":"stamp_mys_whaleinmutant"},{"page":47,"position":24,"name":"The Grey Year Stamp","image":"stamp_acxx_grey_year"},{"page":48,"position":1,"name":"Barely Legible Business Card","image":"gif_wraith_business_card"},{"page":48,"position":2,"name":"Scored Stone Business Card","image":"gif_scordrax_business_card"},{"page":48,"position":3,"name":"Monstrous Business Card","image":"7762f5ggj6"},{"page":48,"position":4,"name":"Knightly Business Card","image":"gif_jeran_business_card"},{"page":48,"position":6,"name":"Trampled Business Card","image":"gif_horde_business_card"},{"page":48,"position":7,"name":"Wooden Business Card","image":"gif_elm_business_card"},{"page":48,"position":21,"name":"Vocivus the Ceaseless Gormandizer Card","image":"b7m4x9q21"},{"page":49,"position":10,"name":"Neo York Collectable Charm","image":"a9d3c7e842"},{"page":49,"position":19,"name":"Ghostly Varwolf Charm","image":"charm_ghost_varwolf"},{"page":49,"position":21,"name":"Doglefox Collectible Charm","image":"st_doglefox_collectible"},{"page":50,"position":1,"name":"Nerkmid Coin","image":"a4f9d2c803"}];
  function createStampSdbTools(identities, document, imageID) {
  const key = (item) => `${item.page}:${item.position}`;
  const byKey = new Map(identities.map((item) => [key(item), item]));
  const byImage = new Map();
  for (const item of identities) {
    const matches = byImage.get(item.image) || [];
    matches.push(item);
    byImage.set(item.image, matches);
  }
  const checkboxID = (node) =>
    node.id?.match(/^sdb-chk-(?:mobile-)?(\d+)$/)?.[1];
  function row(node) {
    for (
      let parent = node.parentElement, depth = 0;
      parent && depth < 9;
      parent = parent.parentElement, depth++
    ) {
      const ids = new Set(
        [...parent.querySelectorAll('input[type="checkbox"]')]
          .map(checkboxID)
          .filter(Boolean),
      );
      if (ids.size > 1) return null;
      if (ids.size !== 1) continue;
      const items = new Map();
      for (const img of parent.querySelectorAll("img[src]")) {
        const matches = byImage.get(imageID(img.getAttribute("src"))) || [];
        if (
          matches.length === 1 &&
          parent.textContent.includes(matches[0].name)
        )
          items.set(key(matches[0]), matches[0]);
      }
      if (items.size === 1)
        return { id: [...ids][0], item: { ...items.values().next().value } };
    }
    return null;
  }
  function rows() {
    const found = new Map();
    for (const checkbox of document.querySelectorAll(
      'input[type="checkbox"][id^="sdb-chk-"]',
    )) {
      const id = checkboxID(checkbox);
      if (!id) continue;
      const identified = row(checkbox),
        old = found.get(id);
      found.set(id, {
        id,
        item: identified?.item || old?.item || null,
        selected: !!checkbox.checked || !!old?.selected,
      });
    }
    return [...found.values()];
  }
  function validatePending(value) {
    if (!Array.isArray(value) || value.length > identities.length)
      throw Error(
        "Pending stamp checks could not be read; they were left untouched.",
      );
    const result = new Map();
    for (const item of value) {
      const known = item && byKey.get(key(item));
      if (!known || known.name !== item.name || known.image !== item.image)
        throw Error(
          "A pending stamp identity differs from the catalogue; nothing changed.",
        );
      result.set(key(known), { ...known });
    }
    return [...result.values()];
  }
  function parseAlbum(source, page) {
    if (
      typeof source !== "string" ||
      !source.trim() ||
      source.length > 2_000_000
    )
      throw Error("The album page could not be read. Try checking again.");
    const template = document.createElement("template");
    template.innerHTML = source;
    const eligible = (img) =>
      img.getAttribute("alt") === "No Stamp" ||
      !!imageID(img.getAttribute("src"));
    const parents = new Set();
    for (const img of template.content.querySelectorAll("img")) {
      if (!eligible(img)) continue;
      for (
        let parent = img.parentElement, depth = 0;
        parent && depth < 6;
        parent = parent.parentElement, depth++
      )
        parents.add(parent);
    }
    const grids = [...parents]
      .map((parent) => [...parent.querySelectorAll("img")].filter(eligible))
      .filter((slots) => slots.length === 25);
    const signatures = new Set(
      grids.map((slots) =>
        slots
          .map((img) => `${img.getAttribute("src")}|${img.getAttribute("alt")}`)
          .join("\n"),
      ),
    );
    if (signatures.size !== 1)
      throw Error(
        "A complete, unambiguous album page was not found. Nothing was guessed.",
      );
    const items = [];
    for (let position = 1; position <= 25; position++) {
      const img = grids[0][position - 1],
        image = imageID(img.getAttribute("src"));
      const empty =
        img.getAttribute("alt") === "No Stamp" || image === "stamp_blank";
      const item = byKey.get(`${page}:${position}`);
      if (!empty && (!item || image !== item.image))
        throw Error(
          "Album pictures differ from the known positions. Nothing was guessed.",
        );
      if (item) items.push({ ...item, owned: !empty });
    }
    if (!items.length)
      throw Error("This album page has no known stamp identities.");
    return items;
  }
  function resultText() {
    for (const node of document.querySelectorAll("p, div, span")) {
      if (
        node.closest("#nd-stamp-status, script, style") ||
        !node.getClientRects().length
      )
        continue;
      const text = (node.innerText || node.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 1600) continue;
      if (
        /^.+ added to your (?:(?:stamp|coin|sea shell) )?album\.$/i.test(text) ||
        /^Moved \d+ of \d+ items\.(?: .*)?$/.test(text)
      )
        return text;
    }
    return "";
  }
  return { key, row, rows, validatePending, parseAlbum, resultText };
}

async function startStampSdbCheck({
  document,
  location,
  identities,
  imageID,
  account,
  storage,
  lock,
  fetchPage,
  saveAlbum,
  sync,
  parent,
}) {
  if (location.pathname !== "/safetydeposit.phtml" || account() !== DESK_ACCOUNT)
    return null;
  const tools = createStampSdbTools(identities, document, imageID);
  const pendingKey = "deskStampSdbPendingPublicV1";
  let pending = tools.validatePending(await storage.get(pendingKey, []));
  let selected = new Map(),
    single = null,
    armed = null,
    captureJob = Promise.resolve();
  const capturedItems = new Map();
  const unidentified = new Set();
  let checking = false,
    controller = null,
    stopped = false,
    message = "";
  const status = document.createElement("div");
  status.setAttribute("role", "status");
  const check = document.createElement("button");
  check.type = "button";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear pending check";
  parent.append(status, check, clear);
  function render() {
    const count = new Set(
      [...pending, ...capturedItems.values()].map(tools.key),
    ).size;
    status.textContent =
      message ||
      (count
        ? `${count} selected album items waiting to be checked. Selection alone does not mark them owned.`
        : "");
    if (unidentified.size)
      status.textContent += ` ${unidentified.size} selected items could not be identified. Check those album pages directly; they have not been marked owned.`;
    check.hidden = clear.hidden = !count && !checking;
    check.textContent = checking
      ? "Stop checking"
      : `Check ${count} in my album`;
    clear.disabled = checking;
    if (pending.length || message) parent.hidden = false;
  }
  async function updatePending(change) {
    await lock(pendingKey, async () => {
      const current = tools.validatePending(await storage.get(pendingKey, []));
      const next = tools.validatePending(change(current));
      await storage.set(pendingKey, next);
      pending = next;
    });
    render();
  }
  async function saveCaptured() {
    const captured = [...capturedItems.values()];
    if (!captured.length) return;
    await updatePending((current) => [
      ...new Map(
        [...current, ...captured].map((item) => [tools.key(item), item]),
      ).values(),
    ]);
    for (const item of captured) capturedItems.delete(tools.key(item));
  }
  function remember() {
    for (const row of tools.rows()) {
      if (row.selected && row.item) selected.set(row.id, row.item);
      else selected.delete(row.id);
      if (row.selected && !row.item) unidentified.add(row.id);
      else unidentified.delete(row.id);
    }
  }
  function changed(event) {
    if (event.isTrusted !== true) return;
    remember();
    if (event.target?.matches("select") && event.target.value === "stamp_album")
      single = tools.row(event.target)?.item || null;
    // The page updates its checked bindings in its own event handler.
    queueMicrotask(remember);
  }
  function clicked(event) {
    if (event.isTrusted !== true || event.target?.closest("#nd-stamp-status"))
      return;
    const button = event.target?.closest('button, input[type="submit"]');
    const label = (button?.textContent || button?.value || "").trim();
    if (/^Cancel$/i.test(label)) {
      armed = null;
      single = null;
      return;
    }
    if (!/^Confirm(?: action)?$/i.test(label)) return;
    remember();
    const albumAction = [...document.querySelectorAll("select")].some(
      (select) => select.value === "stamp_album",
    );
    if (!albumAction && !single) return;
    const items = single ? [single] : [...selected.values()];
    if (unidentified.size) {
      parent.hidden = false;
      render();
    }
    if (!items.length) return;
    // Capture before the site's handler clears selections or removes the last SDB copy.
    armed = { until: Date.now() + 120_000, previous: tools.resultText() };
    for (const item of items) capturedItems.set(tools.key(item), item);
    captureJob = captureJob.catch(() => {}).then(saveCaptured);
    captureJob.catch((error) => {
      armed = null;
      message = error.message;
      render();
    });
  }
  async function verify() {
    if (checking || account() !== DESK_ACCOUNT) return;
    checking = true;
    stopped = false;
    armed = null;
    single = null;
    selected.clear();
    try {
      await captureJob.catch(() => {});
      await saveCaptured();
      pending = tools.validatePending(await storage.get(pendingKey, []));
      // Read each relevant known page once; Stop cancels the remaining batch.
      const pages = [...new Set(pending.map((item) => item.page))];
      let confirmed = 0;
      for (let index = 0; index < pages.length && !stopped; index++) {
        if (account() !== DESK_ACCOUNT)
          throw Error("Account changed. Pending items are retained.");
        const page = pages[index],
          targets = pending.filter((item) => item.page === page);
        message = `Checking album ${index + 1} of ${pages.length}…`;
        render();
        controller = new AbortController();
        const timeout = setTimeout(() => controller?.abort(), 10_000);
        let items;
        try {
          const url = new URL("https://www.neopets.com/stamps.phtml");
          url.search = new URLSearchParams({
            type: "album",
            page_id: String(page),
            owner: DESK_ACCOUNT,
          }).toString();
          const response = await fetchPage(url.href, {
            method: "GET",
            credentials: "same-origin",
            redirect: "error",
            signal: controller.signal,
          });
          if (!response.ok || response.url !== url.href)
            throw Error(
              "The album could not be checked. Keep this list and try again.",
            );
          items = tools
            .parseAlbum(await response.text(), page)
            .filter((item) =>
              targets.some((target) => tools.key(target) === tools.key(item)),
            );
          if (items.length !== targets.length)
            throw Error("Some selected stamp identities could not be checked.");
          if (stopped || account() !== DESK_ACCOUNT)
            throw Error("Album check stopped. Pending items are retained.");
          await saveAlbum({
            account: DESK_ACCOUNT,
            page,
            observedAt: Date.now(),
            items: items.map(({ name, image, position, owned }) => ({
              name,
              image,
              position,
              owned,
            })),
          });
        } finally {
          clearTimeout(timeout);
          controller = null;
        }
        const owned = new Set(
          items.filter((item) => item.owned).map(tools.key),
        );
        confirmed += owned.size;
        await updatePending((current) =>
          current.filter((item) => !owned.has(tools.key(item))),
        );
      }
      message = stopped
        ? "Check stopped. Pending items are retained."
        : `${confirmed} confirmed in your album.${pending.length ? ` ${pending.length} still need checking. You can retry after adding them.` : " All identified selected items are recorded."}`;
      await sync();
    } catch (error) {
      message = stopped
        ? "Check stopped. Pending items are retained."
        : `${error.message || "Album check failed."} Pending items are retained.`;
    } finally {
      checking = false;
      render();
    }
  }
  check.addEventListener("click", () => {
    if (checking) {
      stopped = true;
      controller?.abort();
    } else void verify();
  });
  clear.addEventListener("click", () => {
    armed = null;
    message = "";
    capturedItems.clear();
    unidentified.clear();
    void captureJob
      .catch(() => {})
      .then(() => updatePending(() => []))
      .catch((error) => {
        message = error.message;
        render();
      });
  });
  document.addEventListener("change", changed, true);
  document.addEventListener("click", clicked, true);
  remember();
  render();
  return {
    observe() {
      remember();
      if (!armed || checking || Date.now() > armed.until) return;
      const result = tools.resultText();
      if (result && result !== armed.previous) {
        armed = null;
        void verify();
      }
    },
  };
}

  async function startStampInventoryCheck({
  document, location, identities, imageID, account, fetchPage, saveAlbum, sync, parent, storage, lock,
}) {
  if (location.pathname !== '/inventory.phtml') return null;
  const tools = createStampSdbTools(identities, document, imageID);
  const pendingKey = 'deskStampInventoryPendingPublicV1';
  let pendingItems = tools.validatePending(await storage.get(pendingKey, []));
  const text = node => (node?.innerText || node?.textContent || '').replace(/\s+/g, ' ').trim();
  const visible = node => !!node?.getClientRects().length;
  let selected = null, frame = null, frameDocument = null, observer = null;
  let controller = null, checking = false, stopped = false, saving = Promise.resolve();
  const handled = new WeakSet();
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  const check = document.createElement('button');
  check.type = 'button'; check.hidden = !pendingItems.length; check.textContent = 'Check in my album';
  parent.append(status, check);
  if (pendingItems.length) {
    parent.hidden = false;
    status.textContent = pendingItems.length + ' inventory album checks are waiting. Use Check in my album to retry.';
  }
  async function updatePending(change) {
    await lock(pendingKey, async () => {
      const current = tools.validatePending(await storage.get(pendingKey, []));
      const next = tools.validatePending(change(current));
      await storage.set(pendingKey, next); pendingItems = next;
    });
  }

  function readFrame() {
    try {
      const doc = frame?.contentDocument;
      if (!doc || new URL(doc.URL).origin !== 'https://www.neopets.com') return null;
      return doc;
    } catch (_) { return null; }
  }
  function readResult() {
    const body = document.querySelector('#invResult .popup-body__2020');
    const doc = readFrame();
    const root = doc?.body || (body && !body.querySelector('iframe') ? body : null);
    return root && {root, token:root.firstElementChild || root, text:text(root)};
  }
  function identify(name, image) {
    const matches = identities.filter(item => item.name === name && item.image === image);
    return matches.length === 1 ? matches[0] : null;
  }
  function popupItem() {
    const popup = document.getElementById('invDesc');
    const picture = popup?.querySelector('#invItemImg');
    const raw = picture?.getAttribute('src') || picture?.getAttribute('data-image') ||
      picture?.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
    return identify(text(popup?.querySelector('#invItemName')), imageID(raw));
  }
  document.addEventListener('click', event => {
    if (event.isTrusted !== true) return;
    const node = event.target?.closest('[data-itemname][data-image]');
    if (node) {
      const item = identify(node.getAttribute('data-itemname'), imageID(node.getAttribute('data-image')));
      const previous = readResult();
      selected = item && account() === DESK_ACCOUNT
        ? { item, until: Date.now() + 120000, previous, confirmed: false }
        : null;
    }
    const popup = popupItem();
    if (selected && popup?.image === selected.item.image && visible(document.getElementById('invDesc')))
      selected.confirmed = true;
    if (event.target?.closest('#invDesc .popup-exit, #invResult .popup-exit, #invResult .inv-close')) selected = null;
  }, true);

  async function verify() {
    if (checking || !pendingItems.length || account() !== DESK_ACCOUNT) return;
    const item = pendingItems[0];
    let completed = false;
    checking = true; stopped = false;
    parent.hidden = false; check.hidden = false; check.textContent = 'Stop checking';
    status.textContent = 'Checking ' + item.name + ' in your album…';
    controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 10000);
    try {
      const url = new URL('https://www.neopets.com/stamps.phtml');
      url.search = new URLSearchParams({type:'album',page_id:String(item.page),owner:DESK_ACCOUNT}).toString();
      const response = await fetchPage(url.href, {
        method:'GET', credentials:'same-origin', redirect:'error', signal:controller.signal,
      });
      if (!response.ok || response.url !== url.href) throw Error('The album could not be read.');
      const items = tools.parseAlbum(await response.text(), item.page);
      const found = items.find(entry => entry.position === item.position && entry.image === item.image && entry.name === item.name);
      if (stopped || account() !== DESK_ACCOUNT) throw Error('Check stopped.');
      if (!found?.owned) throw Error('That item is not confirmed in the album yet.');
      await saveAlbum({account:DESK_ACCOUNT,page:item.page,observedAt:Date.now(),items:[{
        name:item.name,image:item.image,position:item.position,owned:true,
      }]});
      await updatePending(current => current.filter(entry => tools.key(entry) !== tools.key(item)));
      completed = true;
      status.textContent = item.name + ' is confirmed in your album.';
      await sync();
    } catch (error) {
      status.textContent = (stopped ? 'Check stopped.' : error.message) + ' Use Check in my album to retry.';
    } finally {
      clearTimeout(timeout); controller = null; checking = false;
      check.textContent = 'Check in my album'; check.hidden = !pendingItems.length;
      if (completed && !stopped && pendingItems.length) void verify();
    }
  }
  check.addEventListener('click', () => {
    if (checking) { stopped = true; controller?.abort(); }
    else void verify();
  });
  function inspect() {
    if (account() !== DESK_ACCOUNT) { selected = null; return; }
    const popup = popupItem();
    if (selected && popup && popup.image === selected.item.image && visible(document.getElementById('invDesc')))
      selected.confirmed = true;
    if (!selected?.confirmed || Date.now() > selected.until || !visible(document.getElementById('invResult'))) return;
    const observation = readResult();
    if (!observation || handled.has(observation.token)) return;
    const result = observation.text;
    if (!result || result.length > 5000 || (observation.token === selected.previous?.token && result === selected.previous?.text)) return;
    const success = result.match(/You have added (.+?) into your (?:Stamp|Coin|Sea Shell) Album!/i);
    const alreadyOwned = /Sorry, you already have that (?:stamp|coin|sea shell) in your collection!/i.test(result);
    if ((!success || success[1] !== selected.item.name) && !alreadyOwned) return;
    if (success && success[1] !== selected.item.name) return;
    handled.add(observation.token);
    const item = selected.item; selected = null;
    saving = saving.catch(() => {}).then(async () => {
      await updatePending(current => [...current, item]);
      if (!checking) void verify();
    });
    saving.catch(error => {
      parent.hidden = false;
      status.textContent = error.message + ' Revisit this stamp’s album page to record it.';
    });
  }
  function observe() {
    const current = document.getElementById('invResultsFrame');
    if (current !== frame) {
      frame?.removeEventListener('load', observe);
      frame = current; frame?.addEventListener('load', observe);
    }
    const doc = readFrame();
    if (doc !== frameDocument) {
      observer?.disconnect(); observer = null; frameDocument = doc;
      if (doc?.body) {
        observer = new MutationObserver(inspect);
        observer.observe(doc.body, {childList:true,subtree:true,characterData:true});
      }
    }
    inspect();
  }
  observe();
  return { observe };
}

  const desk = createDeskConnection(),
    KEY = "deskStampAlbumsPublic";
  let albums = await GM.getValue(KEY, {}),
    busy = false,
    syncAgain = false,
    scanTimer,
    albumMessage = "",
    sdbCheck = null,
    inventoryCheck = null;
  if (!albums || typeof albums !== "object" || Array.isArray(albums)) {
    alert("Saved stamp data could not be read. It has been left untouched.");
    return;
  }
  const style = document.createElement("style");
  style.textContent =
    ".nd-stamp-mark.nd-stamp-owned{color:#247444!important;font-size:17px!important}.nd-stamp-mark{color:#b52f73!important;font:bold 23px Arial!important;margin-left:3px!important;pointer-events:none}#nd-stamp-status{position:fixed;bottom:62px;left:12px;z-index:99999;max-width:290px;padding:8px 12px;border:1px solid #dfa9c2;border-radius:10px;background:#fff0f6;color:#71314e;font:12px Arial}#nd-stamp-status button{margin:4px;padding:4px 8px;cursor:pointer}";
  document.head.append(style);
  const panel = document.createElement("div");
  panel.id = "nd-stamp-status";
  panel.dataset.version = "1.0.9";
  // Stay quiet on every page; controls are available from the Tampermonkey menu.
  panel.hidden = true;
  const status = document.createElement("div");
  panel.append(status);
  const guide = document.createElement("a");
  guide.href = "https://www.jellyneo.net/?go=stamps&id=album_listing";
  guide.target = "_blank";
  guide.rel = "noopener";
  guide.textContent = "Stamp guide";
  panel.append(guide);
  const albumLink = document.createElement('a');
  albumLink.href = 'https://www.neopets.com/stamps.phtml?type=album&page_id=1&owner=' + encodeURIComponent(DESK_ACCOUNT);
  albumLink.textContent = 'Open my album'; albumLink.target = '_blank'; albumLink.rel='noopener';
  albumLink.style.marginLeft='10px'; panel.append(albumLink);
  function button(label, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", fn);
    panel.append(b);
  }
  button("Connect", async () => {
    if (await desk.pair()) sync();
  });
  button("Sync", sync);
  button("Hide", () => {
    panel.hidden = true;
  });
  document.body.append(panel);
  GM.registerMenuCommand("Show stamp tracker", () => {
    panel.hidden = false;
  });
  GM.registerMenuCommand("Connect stamp tracker to Desk", async () => {
    if (await desk.pair()) sync();
  });
  function imageID(url) {
    try {
      const u = new URL(url, location.href);
      return u.hostname === "images.neopets.com"
        ? u.pathname.match(/^\/items\/([\w-]+)\.(?:gif|png|webp)$/i)?.[1] ||
            null
        : null;
    } catch (_) {
      return null;
    }
  }
  function validAlbum(page) {
    return (
      page &&
      page.account === DESK_ACCOUNT &&
      Number.isInteger(page.page) &&
      page.page > 0 &&
      page.page <= 100 &&
      Number.isFinite(page.observedAt) &&
      Array.isArray(page.items) &&
      page.items.length > 0 &&
      page.items.length <= 25 &&
      page.items.every(
        (item) =>
          item &&
          typeof item.name === "string" &&
          /^[\w-]+$/.test(item.image) &&
          typeof item.owned === "boolean",
      )
    );
  }
  function index() {
    const images = new Map();
    Object.values(albums)
      .filter(validAlbum)
      .sort((a, b) => a.observedAt - b.observedAt)
      .forEach((page) =>
        page.items.forEach((item) =>
          images.set(item.image, { ...item, observedAt: page.observedAt }),
        ),
      );
    return images;
  }
  function markItems() {
    const known = index();
    // Actual image identity is used, including for coins/shells/coconuts; names alone can be ambiguous.
    document
      .querySelectorAll("img[src], [data-image], .item-img, .shop-item")
      .forEach((node) => {
        if (node.closest("#nd-stamp-status")) return;
        const raw =
          node.getAttribute("src") ||
          node.getAttribute("data-image") ||
          node.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
        const item = known.get(imageID(raw));
        let marker = node.nextElementSibling?.classList.contains(
          "nd-stamp-mark",
        )
          ? node.nextElementSibling
          : null;
        if (!item) {
          if (marker) marker.remove();
          return;
        }
        if (!marker) {
          marker = document.createElement("span");
          marker.className = "nd-stamp-mark";

          // A sibling marker leaves the original image, link and purchase handlers intact.
          node.after(marker);
        }
        marker.textContent = item.owned ? "✓" : "*";
        marker.classList.toggle("nd-stamp-owned", item.owned);
        marker.title =
          item.name +
          (item.owned ? " — owned in your album when checked " : " — missing from your album when checked ") +
          new Date(item.observedAt).toLocaleDateString() +
          ". Revisit the album after adding it.";
        marker.setAttribute("aria-label", marker.title);
      });
  }
  function summary(suffix = "") {
    const pages = Object.values(albums).filter(validAlbum);
    status.textContent =
      pages.length +
      " album pages checked · * = missing from album. " +
      albumMessage +
      " " +
      suffix;
  }
  async function sync() {
    if (busy) { syncAgain = true; return; }
    busy = true;
    try {
      if (!(await GM.getValue('neopianDeskPairingKey',''))) {
        summary(Object.keys(albums).length ? 'Stamps checked in this browser. App sync is optional.' : 'Open your album to start checking stamps.');
        return;
      }
      const remote = await desk.request("stamps");
      const merge = async () => {
        const local = await GM.getValue(KEY, {});
        if (!local || typeof local !== "object" || Array.isArray(local))
          throw Error(
            "Saved album data could not be read; it was left untouched.",
          );
        for (const page of Object.values(remote.albums || {}))
          if (validAlbum(page)) local[page.page] = mergeAlbum(local[page.page], page);
        await GM.setValue(KEY, local);
        albums = local;
      };
      if (navigator.locks)
        await navigator.locks.request("neopian-desk-stamp-save", merge);
      else await merge();
      // Send only newer observations; no timer repeatedly uploads every page.
      for (const page of Object.values(albums).filter(validAlbum)) {
        if (
          !remote.albums?.[page.page] ||
          remote.albums[page.page].observedAt < page.observedAt ||
          JSON.stringify(remote.albums[page.page].items) !== JSON.stringify(page.items)
        )
          await desk.request("stamps", page);
      }
      summary("Saved in Neopian Desk.");
      markItems();
    } catch (error) {
      summary(
        desk.errorMessage(error),
      );
    } finally {
      busy = false;
      if (syncAgain) { syncAgain = false; void sync(); }
    }
  }
  async function observeAlbum() {
    const params = new URLSearchParams(location.search);
    if (location.pathname !== "/stamps.phtml" || params.get("type") !== "album")
      return;
    const page = Number(params.get("page_id"));
    const owner = (params.get("owner") || desk.account() || "").toLowerCase();
    if (owner !== DESK_ACCOUNT) {
      summary("Only the paired account’s album is recorded.");
      return;
    }
    if (!Number.isInteger(page) || page < 1 || page > 100) return;
    // Snapshot before another helper can substitute pictures for empty slots.
    const eligible = img => img.alt === 'No Stamp' || !!imageID(img.src);
    const candidates = new Set();
    document.querySelectorAll('img').forEach(img => {
      if (!eligible(img)) return;
      let parent = img.parentElement;
      for (let depth=0; parent && depth<6; depth++, parent=parent.parentElement) candidates.add(parent);
    });
    // Current albums use divs; older albums used tables. Keep exact 25-slot
    // and per-position image checks before accepting either layout.
    const slots = [...candidates].map(parent => [...parent.querySelectorAll('img')].filter(eligible)).find(images=>images.length===25);
    if (!slots) {
      albumMessage = 'Album layout not recognised; nothing changed.'; summary(); return;
    }
    const snapshot = slots.map((img) => ({
      image: imageID(img.src),
      empty:
        img.alt === "No Stamp" ||
        imageID(img.src) === "stamp_blank" ||
        img.classList.contains("fake-stamp"),
    }));
    try {
      const result = await GM.xmlHttpRequest({
        method: "GET",
        url: "https://itemdb.com.br/api/v1/tools/album-helper?album_id=" + page,
        timeout: 10000,
      });
      if (result.status !== 200)
        throw Error(
          "Visit itemdb.com.br, then reload this album page to identify its stamps.",
        );
      const catalog = JSON.parse(result.responseText),
        items = [];
      for (let position = 1; position <= 25; position++) {
        const entry = catalog[position];
        if (!entry) {
          if (!snapshot[position - 1].empty)
            throw Error("Album list differs from the page; nothing changed.");
          continue;
        }
        const item = entry.itemData,
          image = imageID(item?.image);
        if (
          !image ||
          typeof item.name !== "string" ||
          !item.name ||
          Number(entry.position) !== position
        )
          throw Error("Album data not recognised; nothing changed.");
        const slot = snapshot[position - 1];
        if (!slot.empty && slot.image !== image)
          throw Error("Album pictures differ from the list; nothing changed.");
        items.push({ name: item.name, image, position, owned: !slot.empty });
      }
      if (!items.length)
        throw Error("No released stamps identified on this page.");
      const observed = {
        account: DESK_ACCOUNT,
        page,
        observedAt: Date.now(),
        items,
      };
      const save = async () => {
        const current = await GM.getValue(KEY, {});
        current[page] = mergeAlbum(current[page], observed);
        await GM.setValue(KEY, current);
        albums = current;
      };
      if (navigator.locks)
        await navigator.locks.request("neopian-desk-stamp-save", save);
      else await save();
      summary("This page saved. Visit the other album pages to check them.");
      markItems();
    } catch (error) {
      albumMessage = error.message;
      summary();
    }
  }
  // Album additions are irreversible: combine observations without losing known ownership.
  function mergeAlbum(old, incoming) {
    if (!old) return incoming;
    if (!validAlbum(old)) throw Error('Saved album data is invalid; nothing changed.');
    const items = new Map(old.items.map(item => [item.position, {...item}]));
    for (const item of incoming.items) {
      const previous = items.get(item.position);
      if (previous && (previous.image !== item.image || previous.name !== item.name)) throw Error('Album identities differ; recheck this page.');
      items.set(item.position, {...item,owned:!!(previous?.owned || item.owned)});
    }
    return {...incoming,observedAt:Math.max(old.observedAt,incoming.observedAt),items:[...items.values()].sort((a,b)=>a.position-b.position)};
  }
  async function saveAlbum(observed) {
    const save = async () => {
      const current = await GM.getValue(KEY, {});
      if (!current || typeof current !== 'object' || Array.isArray(current)) throw Error('Saved album data could not be read; nothing changed.');
      current[observed.page] = mergeAlbum(current[observed.page], observed);
      await GM.setValue(KEY, current); albums = current;
    };
    if (navigator.locks) await navigator.locks.request('neopian-desk-stamp-save', save);
    else await save();
    markItems();
  }
  let capturing = false;
  const captured = new Set();
  async function observeAddition() {
    if (capturing || location.pathname !== '/inventory.phtml' || desk.account() !== DESK_ACCOUNT) return;
    capturing = true;
    try {
      const nodes = [...document.querySelectorAll('p, div, span, b, strong')];
      for (const node of nodes) {
        if (node.closest('#nd-stamp-status') || !node.getClientRects().length) continue;
        const match = (node.innerText || '').trim().match(/^You have added (.+?) into your Stamp Album!$/);
        if (!match) continue;
        const candidates = stampIdentities.filter(item => item.name === match[1]);
        if (candidates.length !== 1) continue;
        const item = candidates[0];
        let container = node, picture = false;
        for (let depth=0; container && depth<4; depth++,container=container.parentElement) {
          if ([...container.querySelectorAll('img')].some(img=>imageID(img.src)===item.image)) {picture=true;break;}
        }
        if (!picture || captured.has(item.image)) continue;
        await saveAlbum({account:DESK_ACCOUNT,page:item.page,observedAt:Date.now(),items:[{name:item.name,image:item.image,position:item.position,owned:true}]});
        captured.add(item.image); markItems(); summary('Added '+item.name+'.');
        await sync();
      }
    } catch(error) { summary(error.message); }
    finally { capturing=false; }
  }
  // Read only the album page the user chose to visit; never crawl or buy/add stamps.
  await observeAlbum();
  await observeAddition();
  markItems();
  sync();
  try {
    sdbCheck = await startStampSdbCheck({
      document, location, identities: stampIdentities, imageID,
      account: desk.account,
      storage: {get: (key, fallback) => GM.getValue(key, fallback), set: (key, value) => GM.setValue(key, value)},
      lock: (name, work) => navigator.locks ? navigator.locks.request(name, work) : work(),
      fetchPage: (url, options) => fetch(url, options),
      parent: panel,
      sync,
      saveAlbum,
    });
    inventoryCheck = await startStampInventoryCheck({
      document, location, identities:stampIdentities, imageID, account:desk.account,
      fetchPage:(url, options) => fetch(url, options), saveAlbum, sync, parent:panel,
      storage: {get:(key, fallback) => GM.getValue(key, fallback), set:(key, value) => GM.setValue(key, value)},
      lock:(name, work) => navigator.locks ? navigator.locks.request(name, work) : work(),
    });
  } catch (error) { panel.hidden = false; summary(error.message); }
  const observer = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          !m.target.closest?.("#nd-stamp-status") &&
          !m.target.classList?.contains("nd-stamp-mark") &&
          (m.type === "attributes" || m.type === "characterData" ||
            [...m.addedNodes].some(
              (n) =>
                (n.nodeType === 1 || n.nodeType === 3) && !n.classList?.contains("nd-stamp-mark"),
            )),
      )
    ) {
      // Capture the result before a fast Close and Refresh removes the popup.
      inventoryCheck?.observe();
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => { markItems(); observeAddition(); sdbCheck?.observe(); }, 250);
    }
  });
  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "data-image", "style"],
  });
  window.addEventListener("focus", sync);
  setInterval(sync, 60000);
})();
