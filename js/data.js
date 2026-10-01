// Shared data loading + aggregation for the whole site. Both index.html (the
// static report) and dashboard.html (the interactive dashboard) call these
// exact same functions on the exact same CSV, so their numbers can never
// drift apart from each other - they are, by construction, the same
// computation run on the same rows.
window.NASCAR = (function () {
  "use strict";

  const NUMERIC_FIELDS = ['year','decade','startPos','finishPos','laps','totalLaps','led','money','pts','avgSpeed','poleSpeed','cautions','leadChanges','raceMiles'];

  function loadData() {
    return new Promise((resolve, reject) => {
      Papa.parse('data/race_results.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = res.data.map(r => {
            const out = Object.assign({}, r);
            for (const f of NUMERIC_FIELDS) {
              out[f] = r[f] === '' || r[f] === undefined ? null : Number(r[f]);
            }
            return out;
          });
          resolve(rows);
        },
        error: reject
      });
    });
  }

  function median(nums) {
    const a = nums.filter(v => v !== null && !Number.isNaN(v)).slice().sort((x, y) => x - y);
    if (!a.length) return null;
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }
  function mean(nums) {
    const a = nums.filter(v => v !== null && !Number.isNaN(v));
    if (!a.length) return null;
    return a.reduce((s, v) => s + v, 0) / a.length;
  }
  function sum(nums) {
    return nums.filter(v => v !== null && !Number.isNaN(v)).reduce((s, v) => s + v, 0);
  }

  // filters: { yearMin, yearMax, driver, manufacturers:[], track, surface, status }
  function applyFilters(rows, f) {
    f = f || {};
    return rows.filter(r => {
      if (f.yearMin != null && r.year < f.yearMin) return false;
      if (f.yearMax != null && r.year > f.yearMax) return false;
      if (f.driver && r.driver !== f.driver) return false;
      if (f.manufacturers && f.manufacturers.length && !f.manufacturers.includes(r.manufacturer)) return false;
      if (f.track && r.track !== f.track) return false;
      if (f.surface && r.surface !== f.surface) return false;
      if (f.status && r.status !== f.status) return false;
      return true;
    });
  }

  const MEASURES = {
    count:       { label: 'Entries',          calc: g => g.length },
    wins:        { label: 'Wins',             calc: g => g.filter(r => r.finishPos === 1).length },
    winRate:     { label: 'Win rate',         calc: g => g.length ? g.filter(r => r.finishPos === 1).length / g.length : 0, isRate: true },
    totalMoney:  { label: 'Total winnings',   calc: g => sum(g.map(r => r.money)), isMoney: true },
    medianFinish:{ label: 'Median finish',    calc: g => median(g.map(r => r.finishPos)) },
    avgFinish:   { label: 'Average finish',   calc: g => mean(g.map(r => r.finishPos)) },
    totalLed:    { label: 'Laps led',         calc: g => sum(g.map(r => r.led)) }
  };

  const BREAKDOWNS = {
    driver:       { label: 'Driver',       key: r => r.driver },
    manufacturer: { label: 'Manufacturer', key: r => r.manufacturer },
    owner:        { label: 'Owner',        key: r => r.owner },
    track:        { label: 'Track',        key: r => r.track },
    decade:       { label: 'Decade',       key: r => r.decade + 's' },
    surface:      { label: 'Surface',      key: r => r.surface },
    status:       { label: 'Finish status',key: r => r.status }
  };

  // Groups rows by `breakdownKey` (a key in BREAKDOWNS), computes `measure`
  // (a key in MEASURES) per group, returns sorted array {name, value}.
  function aggregate(rows, breakdownKey, measureKey, opts) {
    opts = opts || {};
    const bd = BREAKDOWNS[breakdownKey];
    const ms = MEASURES[measureKey];
    const groups = new Map();
    for (const r of rows) {
      const k = bd.key(r);
      if (k === '' || k == null) continue;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    let out = [...groups.entries()].map(([name, g]) => ({ name, value: ms.calc(g), n: g.length }));
    out = out.filter(d => d.value !== null && !Number.isNaN(d.value));
    if (opts.minN) out = out.filter(d => d.n >= opts.minN);
    out.sort((a, b) => b.value - a.value);
    if (opts.limit) out = out.slice(0, opts.limit);
    return out;
  }

  function fmtMoney(v) {
    if (v === null || v === undefined || Number.isNaN(v) || v === 0) return '—';
    return '$' + Math.round(v).toLocaleString('en-US');
  }
  function fmtPct(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return (v * 100).toFixed(1) + '%';
  }
  function fmtNum(v, digits) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: digits == null ? 1 : digits });
  }

  return { loadData, applyFilters, aggregate, median, mean, sum, MEASURES, BREAKDOWNS, fmtMoney, fmtPct, fmtNum };
})();
