// Shared stock-ticker-style strip showing current NASCAR Cup Series points
// standings (the 36 chartered drivers), shown on the report page only. This
// is a static snapshot baked into data/current_standings.json at build time -
// GitHub Pages has no backend to poll NASCAR.com live, so it does not update
// itself; the "as of" race is shown in the ticker's own label. Car numbers
// and teams come from data/current_lineup.json (the most recent race
// weekend's lineup); the car-number badge images are NASCAR's own official
// badge art (data/logos/cars/), downloaded from nascar.com ahead of time
// since GitHub Pages can't proxy a live fetch to their CDN.
(function () {
  "use strict";
  const ACCENTS = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)', 'var(--cat-5)', 'var(--cat-7)', 'var(--cat-8)'];

  function fmtPoints(n) { return n.toLocaleString('en-US'); }

  function normalizeName(n) {
    return n.toLowerCase().replace(/[.,]/g, '').replace(/\s+jr\b/, ' jr').replace(/\s+/g, ' ').trim();
  }

  function buildItemsHtml(drivers, lineupByName) {
    return drivers.map((d, i) => {
      const lineup = lineupByName.get(normalizeName(d.name));
      const carHtml = lineup
        ? '<span class="ticker-car"><img src="data/logos/cars/' + lineup.number + '.png" alt="Car #' + lineup.number + '" loading="lazy"></span>'
        : '<span class="ticker-car-empty"></span>';
      const teamHtml = lineup ? '<span class="ticker-team">' + lineup.team + '</span>' : '';
      return (
        '<span class="ticker-item">' +
          carHtml +
          '<span class="ticker-pos" style="background:' + ACCENTS[i % ACCENTS.length] + '">' + d.pos + '</span>' +
          '<span class="ticker-info">' +
            '<span class="ticker-name">' + d.name.toUpperCase() + '</span>' +
            teamHtml +
          '</span>' +
          '<span class="ticker-points">' + fmtPoints(d.points) + '</span>' +
          (d.chase ? '<span class="ticker-chase">CHASE</span>' : '') +
        '</span>'
      );
    }).join('');
  }

  async function init() {
    const mount = document.getElementById('pointsTicker');
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
    const lineupByName = new Map(lineup.drivers.map(d => [normalizeName(d.name), d]));
    const itemsHtml = buildItemsHtml(data.drivers, lineupByName);
    mount.innerHTML =
      '<div class="ticker-label"><span class="ticker-label-main">' + data.season + ' POINTS</span><span class="ticker-label-sub">36 chartered drivers</span></div>' +
      '<div class="ticker-track-wrap">' +
        '<div class="ticker-track">' +
          '<span class="ticker-seq">' + itemsHtml + '</span>' +
          '<span class="ticker-seq" aria-hidden="true">' + itemsHtml + '</span>' +
        '</div>' +
      '</div>';
    mount.title = 'Standings snapshot: ' + data.asOf + ' — source: ' + data.source + ' — cars/teams: ' + lineup.asOf;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
