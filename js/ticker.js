// Shared stock-ticker-style strip showing current NASCAR Cup Series points
// standings (the 36 chartered drivers), used on all three pages. This is a
// static snapshot baked into data/current_standings.json at build time -
// GitHub Pages has no backend to poll NASCAR.com live, so it does not
// update itself; the "as of" race is shown in the ticker's own label.
(function () {
  "use strict";
  const ACCENTS = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)', 'var(--cat-5)', 'var(--cat-7)', 'var(--cat-8)'];

  function fmtPoints(n) { return n.toLocaleString('en-US'); }

  function buildItemsHtml(drivers) {
    return drivers.map((d, i) => (
      '<span class="ticker-item">' +
        '<span class="ticker-pos" style="background:' + ACCENTS[i % ACCENTS.length] + '">' + d.pos + '</span>' +
        '<span class="ticker-name">' + d.name.toUpperCase() + '</span>' +
        '<span class="ticker-points">' + fmtPoints(d.points) + '</span>' +
        (d.chase ? '<span class="ticker-chase">CHASE</span>' : '') +
      '</span>'
    )).join('');
  }

  async function init() {
    const mount = document.getElementById('pointsTicker');
    if (!mount) return;
    let data;
    try {
      data = await fetch('data/current_standings.json').then(r => r.json());
    } catch (e) {
      mount.remove();
      return;
    }
    const itemsHtml = buildItemsHtml(data.drivers);
    mount.innerHTML =
      '<div class="ticker-label"><span class="ticker-label-main">' + data.season + ' POINTS</span><span class="ticker-label-sub">36 chartered drivers</span></div>' +
      '<div class="ticker-track-wrap">' +
        '<div class="ticker-track">' +
          '<span class="ticker-seq">' + itemsHtml + '</span>' +
          '<span class="ticker-seq" aria-hidden="true">' + itemsHtml + '</span>' +
        '</div>' +
      '</div>';
    mount.title = 'Standings snapshot: ' + data.asOf + ' — source: ' + data.source;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
