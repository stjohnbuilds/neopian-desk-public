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
