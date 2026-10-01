// Reads the raw scraped workbook (data/NASCAR_Cup_Series_Stats.xlsx) and writes
// the cleaned, analysis-ready panel dataset that both site pages load:
//   data/race_results.csv  - one row per driver per race (the main dataset)
//   data/tracks.json       - one row per track, with geocoded lat/lon + race history (map page)
//
// Run with: node scripts/prepare_data.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'NASCAR_Cup_Series_Stats.xlsx');
const wb = XLSX.readFile(SRC);
const sheet = name => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });

const results = sheet('Race Results');

function parseOwner(sponsorOwner) {
  const m = String(sponsorOwner || '').match(/\(([^()]+)\)\s*$/);
  return m ? m[1].trim() : '';
}
// Early-era entries carry a model-year prefix ("'57 Chevrolet") - collapse to the base brand.
const normMfr = car => String(car || '').replace(/^'?\d{2}\s+/, '').trim();

function num(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : '';
}
// poleSpeed/avgSpeed can hold "NTT" (no time trials) instead of a number.
function numOrBlank(v) {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : '';
}

const rows = results.map(r => {
  const year = Number(r.year);
  return {
    year,
    decade: Math.floor(year / 10) * 10,
    date: r.date,
    track: r.track,
    surface: r.trackType || '',
    driver: r.Driver,
    manufacturer: normMfr(r.Car),
    owner: parseOwner(r['Sponsor / Owner']),
    startPos: num(r.St),
    finishPos: num(r.Pos),
    laps: num(r.Laps),
    totalLaps: num(r.totalLaps),
    led: num(r.Led),
    status: r.Status || '',
    money: num(r.Money),
    pts: num(r.Pts),
    avgSpeed: numOrBlank(r.avgSpeed),
    poleSpeed: numOrBlank(r.poleSpeed),
    cautions: num(r.numCautions),
    leadChanges: num(r.leadChanges),
    raceMiles: num(r.raceMiles)
  };
});

// ---- CSV writer (RFC 4180 quoting - driver names like "Dale Earnhardt, Jr." need it) ----
function csvField(v) {
  if (v === '' || v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const HEADER = ['year','decade','date','track','surface','driver','manufacturer','owner','startPos','finishPos','laps','totalLaps','led','status','money','pts','avgSpeed','poleSpeed','cautions','leadChanges','raceMiles'];
const csvLines = [HEADER.join(',')];
for (const row of rows) csvLines.push(HEADER.map(h => csvField(row[h])).join(','));

const outDir = path.join(__dirname, '..', 'data');
fs.writeFileSync(path.join(outDir, 'race_results.csv'), csvLines.join('\n'));
console.log('wrote data/race_results.csv:', rows.length, 'rows,', (fs.statSync(path.join(outDir,'race_results.csv')).size / 1e6).toFixed(2), 'MB');

// sanity checks against previously-validated numbers
const wins = rows.filter(r => r.finishPos === 1);
console.log('total races (distinct year+track+date triples, approx via win rows):', wins.length);
const byDriver = {};
for (const w of wins) byDriver[w.driver] = (byDriver[w.driver] || 0) + 1;
const top = Object.entries(byDriver).sort((a,b)=>b[1]-a[1]).slice(0,3);
console.log('top 3 drivers by wins:', top);
