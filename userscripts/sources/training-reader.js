// Reads only the currently rendered status table. No fetch, refresh or course actions.
function readTrainingSnapshot(document, school, observedAt, getStyle, account) {
  const courses = [];
  const duration = /^\s*(\d+)\s*(?:hrs?|hours?)\s*,?\s*(\d+)\s*(?:mins?|minutes?)\s*,?\s*(\d+)\s*(?:secs?|seconds?)\s*$/i;
  for (const row of document.querySelectorAll('tr')) {
    if (row.querySelector('tr')) continue;
    const heading = row.textContent.trim().match(/^([a-z0-9_]{1,20})\s+\(Level\s+(\d+)\)\s+(is [^\n]+)$/i);
    if (!heading || heading[0].length > 200) continue;
    const details = row.nextElementSibling;
    if (!details || details.tagName !== 'TR') return null;
    const course = heading[3].match(/currently (?:studying|training)\s+(.+)/i)?.[1]?.trim() ?? '';
    let dueAt = null;
    if (course && !/not been paid|complete|finished/i.test(details.textContent)) {
      const candidates = [];
      for (const el of details.querySelectorAll('b, strong, span, td')) {
        const match = el.textContent.match(duration);
        if (!match || [...el.children].some(child => duration.test(child.textContent))) continue;
        let hidden = false;
        for (let ancestor = el; ancestor && ancestor !== details.parentElement; ancestor = ancestor.parentElement) {
          const style = getStyle ? getStyle(ancestor) : ancestor.style;
          if (['S','STRIKE','DEL'].includes(ancestor.tagName) || ancestor.classList.contains('strikethrough') || ancestor.hidden || style?.display === 'none' || style?.visibility === 'hidden' || /line-through/.test(style?.textDecorationLine || style?.textDecoration || '')) hidden = true;
        }
        if (!hidden) {
          const seconds = +match[1]*3600 + +match[2]*60 + +match[3];
          if (+match[2] >= 60 || +match[3] >= 60 || seconds > 604800) return null;
          candidates.push(seconds);
        }
      }
      const unique = [...new Set(candidates)];
      if (unique.length !== 1) return null; // ambiguous/unloaded page must not erase timers
      dueAt = observedAt + unique[0]*1000;
    } else if (!course && !/not (?:currently )?on a course/i.test(heading[3])) return null;
    courses.push({pet:heading[1], level:+heading[2], course, dueAt});
  }
  return courses.length ? {account,school,observedAt,courses} : null;
}
