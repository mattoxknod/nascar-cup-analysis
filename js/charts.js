// Minimal shared chart renderers - a ranked horizontal bar list and an SVG
// line chart - used by the report, the dashboard, and nowhere else, so every
// chart on the site looks and behaves the same way.
window.NASCARCharts = (function () {
  "use strict";

  // data: [{name, value}], opts: {fmt, color, max, iconFn}. iconFn(name), if
  // given, may return a logo image URL to show beside the bar's label (used
  // for manufacturer/team breakdowns) - rows with no match just get the text.
  function renderBarList(el, data, opts) {
    opts = opts || {};
    const fmt = opts.fmt || (v => v);
    const max = opts.max || Math.max(1, ...data.map(d => d.value));
    const colorFn = opts.colorFn || (() => opts.color || 'var(--accent)');
    el.innerHTML = data.map((d, i) => {
      const pct = Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0);
      const iconUrl = opts.iconFn && opts.iconFn(d.name);
      const icon = iconUrl ? '<img class="bar-icon" src="' + iconUrl + '" alt="" loading="lazy">' : '';
      return '<div class="bar-row"><div class="rank">' + (i + 1) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + colorFn(d.name) + '"></div>' +
        '<div class="bar-label">' + icon + '<span>' + d.name + '</span></div></div>' +
        '<div class="bar-value">' + fmt(d.value) + '</div></div>';
    }).join('') || '<p class="empty-note">No rows match the current filters.</p>';
  }

  // series: [{name, color, points:[{x,y}]}], opts: {width,height,yFmt,xFmt}
  function renderLineChart(el, series, opts) {
    opts = opts || {};
    const w = opts.width || el.clientWidth || 560;
    const h = opts.height || 260;
    const pad = { l: 52, r: 16, t: 16, b: 28 };
    const allPoints = series.flatMap(s => s.points);
    if (!allPoints.length) { el.innerHTML = '<p class="empty-note">No rows match the current filters.</p>'; return; }
    const xs = allPoints.map(p => p.x), ys = allPoints.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(0, Math.min(...ys)), y1 = Math.max(...ys) * 1.08 || 1;
    const xScale = x => pad.l + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (w - pad.l - pad.r);
    const yScale = y => h - pad.b - (y1 === y0 ? 0 : (y - y0) / (y1 - y0)) * (h - pad.t - pad.b);

    const yTicks = 4;
    let gridSvg = '';
    for (let i = 0; i <= yTicks; i++) {
      const val = y0 + ((y1 - y0) * i) / yTicks;
      const yy = yScale(val);
      gridSvg += '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + yy + '" y2="' + yy + '" class="grid-line"/>';
      gridSvg += '<text x="' + (pad.l - 8) + '" y="' + (yy + 4) + '" class="axis-label" text-anchor="end">' + (opts.yFmt ? opts.yFmt(val) : Math.round(val)) + '</text>';
    }
    const xTickCount = Math.min(6, new Set(xs).size);
    const xVals = [...new Set(xs)].sort((a, b) => a - b);
    const step = Math.max(1, Math.round(xVals.length / xTickCount));
    let xAxisSvg = '';
    xVals.forEach((xv, i) => {
      if (i % step !== 0 && i !== xVals.length - 1) return;
      xAxisSvg += '<text x="' + xScale(xv) + '" y="' + (h - 6) + '" class="axis-label" text-anchor="middle">' + (opts.xFmt ? opts.xFmt(xv) : xv) + '</text>';
    });

    let linesSvg = '';
    for (const s of series) {
      const pts = s.points.slice().sort((a, b) => a.x - b.x);
      const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + xScale(p.x) + ',' + yScale(p.y)).join(' ');
      linesSvg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      const last = pts[pts.length - 1];
      linesSvg += '<circle cx="' + xScale(last.x) + '" cy="' + yScale(last.y) + '" r="4" fill="' + s.color + '"/>';
    }
    // The color swatch is what ties a legend entry back to its line on the
    // chart, so it always shows - s.icon (a manufacturer/team logo), when a
    // series provides one, sits inside it as a bonus, not a replacement;
    // dropping the swatch for the logo alone left no way to match a brand
    // to its color once two logos were hard to tell apart at a glance.
    const legend = series.length > 1 ? '<div class="line-legend">' + series.map(s =>
      '<span><i style="background:' + s.color + '">' + (s.icon ? '<img class="line-legend-icon" src="' + s.icon + '" alt="">' : '') + '</i>' + s.name + '</span>'
    ).join('') + '</div>' : '';

    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="line-chart-svg" preserveAspectRatio="xMidYMid meet">' +
      gridSvg + xAxisSvg + linesSvg + '</svg>' + legend;
  }

  return { renderBarList, renderLineChart };
})();
