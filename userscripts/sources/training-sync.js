const trainingDesk = createDeskConnection();
const trainingPageTime = performance.timeOrigin + (performance.getEntriesByType('navigation')[0]?.responseEnd || performance.now());
let trainingSyncBusy = false;
function trainingNotice(text) {
  let panel = document.getElementById('nd-training-sync');
  if (!panel) {
    panel = document.createElement('div'); panel.id = 'nd-training-sync'; panel.setAttribute('role','status');
    Object.assign(panel.style,{padding:'8px 12px',margin:'8px 0',border:'1px solid #d8ccd5',borderRadius:'6px',background:'#faf7fa',font:'12px Arial',color:'#543b4e'});
    const row = [...document.querySelectorAll('tr')].find(r => !r.querySelector('tr') && /^[a-z0-9_]+\s+\(Level /i.test(r.textContent.trim()));
    const table = row?.closest('table');
    if (table) table.before(panel); else return;
  }
  panel.textContent = text;
}
async function syncTrainingPage() {
  if (trainingSyncBusy || trainingDesk.account() !== DESK_ACCOUNT) return;
  trainingSyncBusy = true;
  try {
    const school = getSchool();
    const snapshot = school && readTrainingSnapshot(document, school, trainingPageTime, getComputedStyle, DESK_ACCOUNT);
    const prefix = 'deskTrainingPending:';
    if (snapshot) await GM.setValue(prefix + school + ':' + snapshot.observedAt, snapshot);
    if (school && !snapshot) trainingNotice('Training timers: open Status to read the current courses. No timers changed.');
    // Each page owns one immutable queue entry. An older tab cannot erase a
    // newer tab's unsent data while waiting for its own acknowledgement.
    const queued = [];
    for (const key of await GM.listValues()) if (key.startsWith(prefix)) queued.push({key, value:await GM.getValue(key)});
    for (const school of ['academy','island','ninja']) {
      const entries = queued.filter(entry => entry.value?.school === school && entry.value?.account === DESK_ACCOUNT).sort((a,b) => b.value.observedAt-a.value.observedAt);
      if (!entries.length) continue;
      await trainingDesk.request('training', entries[0].value);
      for (const entry of entries) await GM.deleteValue(entry.key);
    }
    if (snapshot) trainingNotice('Training sent to Desk. Grouped timers appear in Tools → App scripts and the timer bar. Keep Desk open for alerts.');
  } catch (error) { trainingNotice(trainingDesk.errorMessage(error) + ' Use Tampermonkey → Training Helper → Retry training sync.'); }
  finally { trainingSyncBusy = false; }
}
GM.registerMenuCommand('Connect Training Helper to Neopian Desk', async () => { if (await trainingDesk.pair()) await syncTrainingPage(); });
GM.registerMenuCommand('Retry training sync', syncTrainingPage);
// One current-page read; retry is explicit. No background browsing or restock loop.
setTimeout(syncTrainingPage, 500);
