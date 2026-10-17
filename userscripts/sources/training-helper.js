// ==UserScript==
// @name         Neopets Training Helper V5
// @namespace    neopets-training-helper
// @version      6.0.0
// @description  Tracks training stats and codestone/dubloon inventory across Neopets training schools.
// @match        https://www.neopets.com/pirates/academy.phtml*
// @match        https://www.neopets.com/island/training.phtml*
// @match        https://www.neopets.com/island/fight_training.phtml*
// @match        https://www.neopets.com/inventory.phtml*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @connect      127.0.0.1
// @run-at       document-end
// ==/UserScript==

(async function () {
    'use strict';
    /* DESK_CONNECTION */
    /* TRAINING_READER */
    /* TRAINING_SYNC */

    // ============================================================
    // STORAGE
    // ============================================================

    // Keep your already-collected pet stats.
    const PET_STORAGE_KEY = 'npTrainingPets_V3';

    // Fresh inventory data for this version.
    const INV_STORAGE_KEY = 'npTrainingInventory_V5';


    // ============================================================
    // PAYMENT ITEMS
    // ============================================================

    const TAN_CODESTONES = [
        'Bri Codestone',
        'Eo Codestone',
        'Har Codestone',
        'Lu Codestone',
        'Main Codestone',
        'Mau Codestone',
        'Orn Codestone',
        'Tai-Kai Codestone',
        'Vo Codestone',
        'Zei Codestone'
    ];

    const RED_CODESTONES = [
        'Cui Codestone',
        'Kew Codestone',
        'Mag Codestone',
        'Sho Codestone',
        'Vux Codestone',
        'Zed Codestone'
    ];

    const DUBLOONS = [
        'One Dubloon Coin',
        'Two Dubloon Coin',
        'Five Dubloon Coin',
        'Ten Dubloon Coin',
        'Twenty Dubloon Coin',
        'Fifty Dubloon Coin',
        'One Hundred Dubloon Coin',
        'Two Hundred Dubloon Coin',
        'Five Hundred Dubloon Coin',
        'One Thousand Dubloon Coin'
    ];

    const ALL_PAYMENT_ITEMS = [
        ...TAN_CODESTONES,
        ...RED_CODESTONES,
        ...DUBLOONS
    ];


    // ============================================================
    // STORAGE HELPERS
    // ============================================================

    function loadJSON(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch {
            return {};
        }
    }

    function saveJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function loadPets() {
        return loadJSON(PET_STORAGE_KEY);
    }

    function loadInventory() {
        return loadJSON(INV_STORAGE_KEY);
    }

    function savePet(name, data) {
        const pets = loadPets();
        const key = name.toLowerCase();

        pets[key] = {
            ...(pets[key] || {}),
            ...data,
            name
        };

        saveJSON(PET_STORAGE_KEY, pets);
    }


    // ============================================================
    // GENERAL HELPERS
    // ============================================================

    function cleanText(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getNumber(text, regex) {
        const match = text.match(regex);
        return match ? Number(match[1]) : null;
    }

    function shopWizardURL(item) {
        return (
            'https://www.neopets.com/shops/wizard.phtml?string=' +
            encodeURIComponent(item)
        );
    }

    function isVisible(el) {
        if (!el) return false;

        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
        );
    }


    // ============================================================
    // DETECT SCHOOL
    // ============================================================

    function getSchool() {
        const path = location.pathname.toLowerCase();

        if (path.includes('/pirates/academy.phtml')) {
            return 'academy';
        }

        if (path.includes('/island/fight_training.phtml')) {
            return 'ninja';
        }

        if (path.includes('/island/training.phtml')) {
            return 'island';
        }

        return null;
    }


    // ============================================================
    // PET STAT SCANNER
    // ============================================================

    function scanPetStats() {
        const school = getSchool();
        if (!school) return;

        const pageText = document.body.innerText;

        const headingRegex =
            /^([A-Za-z0-9_]+)\s+\(Level\s+(\d+)\)([^\n]*)$/gmi;

        const matches = [...pageText.matchAll(headingRegex)];

        if (!matches.length) return;

        matches.forEach((match, index) => {
            const name = match[1].trim();
            const headingLevel = Number(match[2]);
            const headingExtra = cleanText(match[3]);

            const start = match.index;

            const end =
                index + 1 < matches.length
                    ? matches[index + 1].index
                    : pageText.length;

            const section = pageText.slice(start, end);

            const level =
                getNumber(section, /Lvl\s*:\s*(\d+)/i)
                ?? headingLevel;

            const strength =
                getNumber(section, /Str\s*:\s*(\d+)/i);

            const defence =
                getNumber(section, /Def\s*:\s*(\d+)/i);

            const movement =
                getNumber(section, /Mov\s*:\s*(\d+)/i);

            const hpMatch =
                section.match(/Hp\s*:\s*(\d+)\s*\/\s*(\d+)/i);

            const hpCurrent =
                hpMatch ? Number(hpMatch[1]) : null;

            const hpMax =
                hpMatch ? Number(hpMatch[2]) : null;


            // ----------------------------------------------------
            // TRAINING STATUS
            // ----------------------------------------------------

            const statusText =
                (headingExtra + ' ' + section).toLowerCase();

            let status = 'unknown';

            if (
                statusText.includes('not on a course') ||
                statusText.includes('not currently on a course')
            ) {
                status = 'free';
            }

            else if (
                statusText.includes('currently studying') ||
                statusText.includes('currently training') ||
                statusText.includes('course has not been paid') ||
                statusText.includes('course finishes') ||
                statusText.includes('time till course finishes')
            ) {
                status = 'in_course';
            }


            const old =
                loadPets()[name.toLowerCase()] || {};

            savePet(name, {
                level: level ?? old.level ?? null,
                strength: strength ?? old.strength ?? null,
                defence: defence ?? old.defence ?? null,
                movement: movement ?? old.movement ?? null,
                hpCurrent: hpCurrent ?? old.hpCurrent ?? null,
                hpMax: hpMax ?? old.hpMax ?? null,

                status:
                    status !== 'unknown'
                        ? status
                        : old.status ?? 'unknown',

                school
            });
        });
    }


    // ============================================================
    // FIND PET SELECT
    // ============================================================

    function findPetSelect() {
        return [...document.querySelectorAll('select')]
            .find(select => {
                return [...select.options].some(option => {
                    const text = cleanText(option.textContent);

                    return /^[A-Za-z0-9_]+\s+-\s+.+\(.+\)$/i.test(text);
                });
            });
    }

    function getSelectedPetName(select) {
        if (!select) return null;

        const option = select.options[select.selectedIndex];
        if (!option) return null;

        const match =
            cleanText(option.textContent)
                .match(/^(.+?)\s+-\s+/);

        return match ? match[1].trim() : null;
    }


    // ============================================================
    // PET STAT BOX
    // ============================================================

    function createPetPanel() {
        let panel =
            document.getElementById('np-training-pet-panel');

        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = 'np-training-pet-panel';

        Object.assign(panel.style, {
            position: 'absolute',
            zIndex: '99999',

            padding: '4px 7px',

            minWidth: '80px',

            background: 'rgba(255,255,255,.97)',

            border: '1px solid #bbb',
            borderRadius: '2px',

            boxShadow: '0 1px 2px rgba(0,0,0,.10)',

            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            lineHeight: '1.22',

            color: '#111'
        });

        document.body.appendChild(panel);

        return panel;
    }


    function positionPetPanel(select) {
        const panel = createPetPanel();
        const rect = select.getBoundingClientRect();

        /*
         * IMPORTANT CHANGE:
         *
         * Bottom of panel aligns with bottom of dropdown.
         * The box grows UPWARD, not down into the footer.
         */

        const panelHeight = panel.offsetHeight || 95;

        let left =
            window.scrollX +
            rect.right +
            10;

        let top =
            window.scrollY +
            rect.bottom -
            panelHeight;


        // Don't allow it off the top of the page.
        top = Math.max(
            window.scrollY + 5,
            top
        );


        // If there isn't room on the right, put it on the left.
        if (
            rect.right +
            panel.offsetWidth +
            20 >
            window.innerWidth
        ) {
            left =
                window.scrollX +
                rect.left -
                panel.offsetWidth -
                10;
        }


        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
    }


    function updatePetPanel(select) {
        const panel = createPetPanel();

        const name = getSelectedPetName(select);

        if (!name) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';

        const pet =
            loadPets()[name.toLowerCase()];

        if (!pet) {
            panel.innerHTML = `
                <div style="font-weight:bold;color:#777;">
                    NO DATA
                </div>
                <div style="font-weight:bold;">
                    ${escapeHTML(name)}
                </div>
            `;

            positionPetPanel(select);
            return;
        }


        let statusText = '?';
        let statusColour = '#777';

        if (pet.status === 'free') {
            statusText = 'FREE';
            statusColour = '#188038';
        }

        if (pet.status === 'in_course') {
            statusText = 'IN COURSE';
            statusColour = '#c5221f';
        }


        panel.innerHTML = `
            <div style="
                font-weight:bold;
                color:${statusColour};
                margin-bottom:2px;
            ">
                ${statusText}
            </div>

            <div style="
                font-weight:bold;
                margin-bottom:2px;
            ">
                ${escapeHTML(pet.name)}
            </div>

            <div>Lvl: ${pet.level ?? '?'}</div>
            <div>HP: ${pet.hpMax ?? '?'}</div>
            <div>Str: ${pet.strength ?? '?'}</div>
            <div>Def: ${pet.defence ?? '?'}</div>
            <div>Mov: ${pet.movement ?? '?'}</div>
        `;

        // Position AFTER content exists so we know real height.
        positionPetPanel(select);
    }


    function setupPetPanel() {
        const select = findPetSelect();
        if (!select) return;

        updatePetPanel(select);

        select.addEventListener(
            'change',
            () => updatePetPanel(select)
        );

        window.addEventListener(
            'resize',
            () => positionPetPanel(select)
        );

        window.addEventListener(
            'scroll',
            () => positionPetPanel(select),
            { passive: true }
        );
    }


    // ============================================================
    // INVENTORY:
    // FIND THE ELEMENT DISPLAYING AN ITEM NAME
    // ============================================================

    function findExactItemNameElements(itemName) {
        const target = itemName.toLowerCase();

        const candidates = [
            ...document.querySelectorAll(
                'div, span, p, a, b, strong, label'
            )
        ];

        return candidates.filter(el => {
            if (!isVisible(el) || el.closest('[id^="np-training-"], #nd-training-sync')) return false;

            if (
                cleanText(el.textContent).toLowerCase()
                !== target
            ) {
                return false;
            }


            /*
             * Prefer the deepest element containing exactly
             * the item name.
             */

            const childHasSameText =
                [...el.children].some(child =>
                    cleanText(child.textContent).toLowerCase()
                    === target
                );

            return !childHasSameText;
        });
    }


    // ============================================================
    // INVENTORY:
    // FIND THE INDIVIDUAL ITEM CARD
    // ============================================================

    function findInventoryCard(nameElement) {
        let node = nameElement;

        for (let i = 0; i < 8 && node; i++) {

            const images =
                node.querySelectorAll
                    ? node.querySelectorAll('img')
                    : [];

            /*
             * We want the smallest parent that looks like ONE
             * inventory item, not the entire inventory grid.
             */

            if (
                images.length >= 1 &&
                images.length <= 4
            ) {
                const rect = node.getBoundingClientRect();

                if (
                    rect.width > 50 &&
                    rect.width < 350 &&
                    rect.height > 50 &&
                    rect.height < 500
                ) {
                    return node;
                }
            }

            node = node.parentElement;
        }

        return nameElement.parentElement;
    }


    // ============================================================
    // INVENTORY:
    // READ ORANGE QUANTITY BADGE
    //
    // Screenshot example:
    //
    // One Dubloon Coin -> orange "9"
    // Two Dubloon Coin -> orange "4"
    // ============================================================

    function readCardQuantity(card, nameElement) {
        if (!card) return 1;

        const possibleNumbers =
            [...card.querySelectorAll('span, div, b, strong')]
                .filter(el => {

                    if (!isVisible(el)) return false;

                    if (el === nameElement) return false;

                    const text =
                        cleanText(el.textContent);

                    return /^\d{1,4}$/.test(text);
                })
                .map(el => ({
                    el,
                    value:
                        Number(cleanText(el.textContent)),
                    rect:
                        el.getBoundingClientRect()
                }))
                .filter(entry =>
                    entry.value > 0
                );


        if (!possibleNumbers.length) {
            return 1;
        }


        /*
         * Quantity badges on Neo inventory sit toward the
         * upper part of the individual item.
         *
         * Prefer the number nearest the top-right of the card.
         */

        const cardRect =
            card.getBoundingClientRect();

        possibleNumbers.sort((a, b) => {

            const aDistance =
                Math.abs(a.rect.top - cardRect.top) +
                Math.abs(a.rect.right - cardRect.right);

            const bDistance =
                Math.abs(b.rect.top - cardRect.top) +
                Math.abs(b.rect.right - cardRect.right);

            return aDistance - bDistance;
        });


        return possibleNumbers[0].value;
    }


    // ============================================================
    // INVENTORY SCANNER
    // ============================================================

    function scanInventory() {
        if (
            !location.pathname
                .toLowerCase()
                .includes('/inventory.phtml')
        ) {
            return;
        }


        const counts = {};

        ALL_PAYMENT_ITEMS.forEach(item => {
            // Missing from this view is unknown, not zero.
        });


        ALL_PAYMENT_ITEMS.forEach(item => {

            const nameElements =
                findExactItemNameElements(item);

            const usedCards =
                new Set();


            nameElements.forEach(nameElement => {

                const card =
                    findInventoryCard(nameElement);

                if (!card) return;

                /*
                 * Don't count duplicate HTML references to the
                 * exact same visible inventory card.
                 */

                if (usedCards.has(card)) {
                    return;
                }

                usedCards.add(card);


                const quantity =
                    readCardQuantity(
                        card,
                        nameElement
                    );

                counts[item] = (counts[item] || 0) + quantity;
            });
        });


        saveJSON(
            INV_STORAGE_KEY,
            { ...loadInventory(), ...counts }
        );


        console.log(
            '[Training Helper V5] Inventory:',
            counts
        );


        showInventoryBox(counts);
    }


    // ============================================================
    // INVENTORY RESULT BOX
    // ============================================================

    function showInventoryBox(counts) {
        let box =
            document.getElementById(
                'np-training-inventory-box'
            );

        if (!box) {
            box = document.createElement('div');

            box.id =
                'np-training-inventory-box';

            Object.assign(box.style, {
                position: 'fixed',

                right: '10px',
                bottom: '10px',

                zIndex: '99999',

                width: '180px',

                padding: '6px 8px',

                background: '#fff',

                border: '1px solid #aaa',
                borderRadius: '3px',

                boxShadow:
                    '0 1px 4px rgba(0,0,0,.15)',

                fontFamily:
                    'Arial, sans-serif',

                fontSize: '10px',
                lineHeight: '1.3',

                color: '#111'
            });

            document.body.appendChild(box);
        }


        const found =
            Object.entries(counts)
                .filter(([, count]) => count > 0);


        let html = `
            <div style="
                font-weight:bold;
                margin-bottom:4px;
            ">
                TRAINING ITEMS FOUND
            </div>
        `;


        if (!found.length) {
            html += `
                <div style="color:#c5221f;">
                    None detected in this view; saved observations retained.
                </div>
            `;
        }

        else {
            found.forEach(([item, count]) => {
                html += `
                    <div>
                        ${escapeHTML(item)}
                        × ${count}
                    </div>
                `;
            });
        }


        box.innerHTML = html;
    }


    // ============================================================
    // PAYMENT REQUIREMENTS
    // ============================================================

    function scanPaymentRequirements() {
        const needed = {};

        ALL_PAYMENT_ITEMS.forEach(item => {
            needed[item] = 0;
        });


        const unpaid = [...document.querySelectorAll('tr')].filter(row =>
            !row.querySelector('tr') && /(?:not been paid|not paid|pay for (?:this|the) course)/i.test(row.textContent)
        );
        // General fee tables and our own panels are not actual payment requests.
        const pageText = unpaid.map(row => {
            const copy = row.cloneNode(true);
            copy.querySelectorAll('[id^="np-training-"], #nd-training-sync, script, style').forEach(el => el.remove());
            return copy.textContent;
        }).join('\n');


        ALL_PAYMENT_ITEMS.forEach(item => {

            const escaped =
                item.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

            const matches =
                pageText.match(
                    new RegExp(escaped, 'gi')
                );

            if (matches) {
                needed[item] =
                    matches.length;
            }
        });


        return needed;
    }


    // ============================================================
    // PAYMENT CHECKLIST
    // ============================================================

    function showPaymentPanel() {
        const school = getSchool();
        if (!school) return;

        const needed =
            scanPaymentRequirements();

        const inventory =
            loadInventory();

        const rows = [];


        ALL_PAYMENT_ITEMS.forEach(item => {

            const need =
                needed[item] || 0;

            if (!need) return;

            const have =
                inventory[item] ?? null;

            rows.push({
                item,
                need,
                have
            });
        });


        if (!rows.length) return;


        const old =
            document.getElementById(
                'np-training-payment-panel'
            );

        if (old) old.remove();


        const panel =
            document.createElement('div');

        panel.id =
            'np-training-payment-panel';


        Object.assign(panel.style, {
            position: 'fixed',

            right: '10px',
            top: '75px',

            zIndex: '99998',

            width: '190px',

            maxHeight: '70vh',
            overflowY: 'auto',

            padding: '6px 8px',

            background:
                'rgba(255,255,255,.97)',

            border: '1px solid #aaa',
            borderRadius: '3px',

            boxShadow:
                '0 1px 4px rgba(0,0,0,.15)',

            fontFamily:
                'Arial, sans-serif',

            fontSize: '10px',
            lineHeight: '1.3',

            color: '#111'
        });


        let title =
            'TRAINING PAYMENT';

        if (school === 'academy') {
            title =
                'ACADEMY PAYMENT';
        }

        else if (school === 'ninja') {
            title =
                'NINJA PAYMENT';
        }


        let html = `
            <div style="
                font-weight:bold;
                margin-bottom:5px;
            ">
                ${title}
            </div>
        `;


        rows.forEach(row => {

            const enough =
                row.have !== null && row.have >= row.need;

            const colour =
                enough
                    ? '#188038'
                    : '#c5221f';

            const symbol =
                enough
                    ? '✓'
                    : row.have === null ? '?' : '✗';

            const missing =
                Math.max(
                    0,
                    row.need - row.have
                );


            html += `
                <div style="
                    margin-bottom:5px;
                    color:${colour};
                ">

                    <b>${symbol}</b>
                    ${escapeHTML(row.item)}

                    <div style="
                        margin-left:12px;
                        color:#333;
                    ">
                        ${row.have ?? "?"} last observed / ${row.need} needed
            `;


            if (!enough) {
                html += `
                    &nbsp;

                    <a
                        href="${shopWizardURL(row.item)}"
                        target="_blank"
                        style="font-weight:bold;"
                    >
                        ${row.have === null ? "SEARCH" : "FIND " + missing}
                    </a>
                `;
            }


            html += `
                    </div>
                </div>
            `;
        });


        if (!Object.keys(inventory).length) {
            html += `
                <div style="
                    color:#777;
                    margin-top:5px;
                ">
                    Open Inventory to scan stock.
                </div>
            `;
        }


        panel.innerHTML = html;

        document.body.appendChild(panel);
    }


    // ============================================================
    // DEBUG
    // ============================================================

    window.npTrainingDebug = function () {

        console.log(
            'PETS:',
            loadPets()
        );

        console.log(
            'INVENTORY:',
            loadInventory()
        );

        console.log(
            'NEEDED:',
            scanPaymentRequirements()
        );
    };


    // ============================================================
    // RUN
    // ============================================================

    function runTrainingPage() {
        scanPetStats();
        setupPetPanel();
        showPaymentPanel();
    }


    function runInventoryPage() {

        /*
         * New inventory loads dynamically.
         * Give Neo time to render the cards and quantity badges.
         */

        setTimeout(
            scanInventory,
            1200
        );

        setTimeout(
            scanInventory,
            2500
        );
    }


    if (
        location.pathname
            .toLowerCase()
            .includes('/inventory.phtml')
    ) {
        runInventoryPage();
    }

    else {
        runTrainingPage();
    }

})();