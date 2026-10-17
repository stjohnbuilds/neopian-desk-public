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
