// Shared stock-ticker-style strip at the top of the report page. By default
// it shows the current NASCAR Cup Series points standings (a static snapshot
// in data/current_standings.json + data/current_lineup.json for each
// driver's car number/team - GitHub Pages has no backend to poll NASCAR.com
// live). On the report page specifically, index.html's own script drives it
// through different content as each finding scrolls into view (top drivers
// by wins, leading manufacturer by decade, and so on) via the showRanked/
// showTimeline/showStandings API below, then calls showStandings() again
// once the reader scrolls past the findings that have something more
// specific to show.
window.NASCARTicker = (function () {
  "use strict";
  const ACCENTS = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)', 'var(--cat-5)', 'var(--cat-7)', 'var(--cat-8)'];
  const SECONDS_PER_ITEM = 2.3; // scroll speed is tuned per item count, not a fixed duration, so an 8-item decade list and a 77-item year list both feel like the same reading pace

  let mount = null;
  let standingsCache = null; // {data, lineupByName}

  function fmtPoints(n) { return Number(n).toLocaleString('en-US'); }

  function normalizeName(n) {
    return n.toLowerCase().replace(/[.,]/g, '').replace(/\s+jr\b/, ' jr').replace(/\s+/g, ' ').trim();
  }

  // it: {pos, icon, name, sub, value, tag} - every mode (standings, a ranked
  // list, a chronological timeline) renders through this one item shape, so
  // only the label box and the specific fields populated change per mode.
  function itemHtml(it, accent) {
    const iconHtml = it.icon
      ? '<span class="ticker-car"><img src="' + it.icon + '" alt="" loading="lazy"></span>'
      : '<span class="ticker-car-empty"></span>';
    const subHtml = it.sub ? '<span class="ticker-team">' + it.sub + '</span>' : '';
    const tagHtml = it.tag ? '<span class="ticker-chase">' + it.tag + '</span>' : '';
    return (
      '<span class="ticker-item">' + iconHtml +
        '<span class="ticker-pos" style="background:' + accent + '">' + it.pos + '</span>' +
        '<span class="ticker-info"><span class="ticker-name">' + it.name + '</span>' + subHtml + '</span>' +
        '<span class="ticker-points">' + it.value + '</span>' + tagHtml +
      '</span>'
    );
  }

  function render(labelMain, labelSub, items) {
    if (!mount) return;
    const itemsHtml = items.map((it, i) => itemHtml(it, ACCENTS[i % ACCENTS.length])).join('');
    const duration = Math.max(items.length * SECONDS_PER_ITEM, 18);
    mount.innerHTML =
      '<div class="ticker-label"><span class="ticker-label-main">' + labelMain + '</span><span class="ticker-label-sub">' + labelSub + '</span></div>' +
      '<div class="ticker-track-wrap">' +
        '<div class="ticker-track" style="animation-duration:' + duration + 's">' +
          '<span class="ticker-seq">' + itemsHtml + '</span>' +
          '<span class="ticker-seq" aria-hidden="true">' + itemsHtml + '</span>' +
        '</div>' +
      '</div>';
  }

  function showStandings() {
    if (!standingsCache || !mount) return;
    const { data, lineupByName } = standingsCache;
    const items = data.drivers.map(d => {
      const lineup = lineupByName.get(normalizeName(d.name));
      return {
        pos: d.pos,
        icon: lineup ? 'data/logos/cars/' + lineup.number + '.png' : null,
        name: d.name.toUpperCase(),
        sub: lineup ? lineup.team : null,
        value: fmtPoints(d.points),
        tag: d.chase ? 'CHASE' : null
      };
    });
    render(data.season + ' POINTS', '36 chartered drivers', items);
    mount.title = 'Standings snapshot: ' + data.asOf + ' — source: ' + data.source;
  }

  // items: [{name, value, icon?}] already ranked/ordered by the caller.
  function showRanked(labelMain, labelSub, items) {
    if (!mount) return;
    render(labelMain, labelSub, items.map((it, i) => ({
      pos: i + 1, icon: it.icon || null, name: it.name, sub: null, value: it.value, tag: null
    })));
  }

  // items: [{period, name?, icon?, value}] already in chronological order.
  function showTimeline(labelMain, labelSub, items) {
    if (!mount) return;
    render(labelMain, labelSub, items.map(it => ({
      pos: it.period, icon: it.icon || null, name: it.name || labelSub, sub: null, value: it.value, tag: null
    })));
  }

  async function init() {
    mount = document.getElementById('pointsTicker');
    if (!mount) return;
    let data, lineup;
    try {
      [data, lineup] = await Promise.all([
        fetch('data/current_standings.json').then(r => r.json()),
        fetch('data/current_lineup.json').then(r => r.json())
      ]);
    } catch (e) {
      mount.remove();
      return;
    }
    standingsCache = { data, lineupByName: new Map(lineup.drivers.map(d => [normalizeName(d.name), d])) };
    showStandings();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { showStandings, showRanked, showTimeline };
})();
