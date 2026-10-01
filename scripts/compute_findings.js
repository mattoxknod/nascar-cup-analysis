// Computes the exact numbers used in index.html's prose, using the SAME
// field definitions as js/data.js, so the report text can be written by hand
// but still be verifiably correct. Not shipped to the site - a verification
// tool only. Run with: node scripts/compute_findings.js
const fs = require('fs');
const path = require('path');

const csv = fs.readFileSync(path.join(__dirname, '..', 'data', 'race_results.csv'), 'utf8');
const lines = csv.split('\n').filter(Boolean);
const header = lines[0].split(',');
function parseCsvLine(line) {
  // simple RFC4180 parse (good enough here; driver names are the only quoted field)
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
const rows = lines.slice(1).map(l => {
  const cells = parseCsvLine(l);
  const o = {};
  header.forEach((h, i) => o[h] = cells[i]);
  ['year','decade','raceNum','startPos','finishPos','laps','totalLaps','led','money','pts','avgSpeed','poleSpeed','cautions','leadChanges','raceMiles'].forEach(f => {
    o[f] = o[f] === '' ? null : Number(o[f]);
  });
  return o;
});

const mean = a => { const v = a.filter(x => x !== null && !Number.isNaN(x)); return v.length ? v.reduce((s,x)=>s+x,0)/v.length : null; };
const sum = a => a.filter(x => x !== null && !Number.isNaN(x)).reduce((s,x)=>s+x,0);

console.log('=== HEADLINE ===');
console.log('total rows:', rows.length);
const years = rows.map(r=>r.year);
console.log('year span:', Math.min(...years), '-', Math.max(...years));
const wins = rows.filter(r => r.finishPos === 1);
console.log('total races (win rows):', wins.length);
console.log('distinct drivers (any entry):', new Set(rows.map(r=>r.driver)).size);
console.log('distinct winning drivers:', new Set(wins.map(r=>r.driver)).size);
console.log('distinct tracks (win rows):', new Set(wins.map(r=>r.track)).size);

function topBy(subset, keyFn, measureFn, limit) {
  const g = new Map();
  for (const r of subset) { const k = keyFn(r); if (!k) continue; if (!g.has(k)) g.set(k, []); g.get(k).push(r); }
  return [...g.entries()].map(([name, rs]) => ({ name, value: measureFn(rs), n: rs.length }))
    .sort((a,b)=>b.value-a.value).slice(0, limit);
}

console.log('\n=== FINDING 1: top win leaders all-time ===');
console.log(topBy(rows, r=>r.driver, g=>g.filter(r=>r.finishPos===1).length, 10));

console.log('\n=== FINDING 2: manufacturer wins by decade (top 5 brands) ===');
const mfrAllTime = topBy(rows, r=>r.manufacturer, g=>g.filter(r=>r.finishPos===1).length, 5).map(d=>d.name);
console.log('top 5 brands all-time:', mfrAllTime);
const decades = [...new Set(rows.map(r=>r.decade))].sort((a,b)=>a-b);
for (const d of decades) {
  const dRows = wins.filter(r=>r.decade===d);
  const line = mfrAllTime.map(m => m + '=' + dRows.filter(r=>r.manufacturer===m).length).join(' ');
  console.log(d+'s:', line, '(total races:', dRows.length+')');
}

console.log('\n=== FINDING 3: top owners all-time ===');
console.log(topBy(rows, r=>r.owner, g=>g.filter(r=>r.finishPos===1).length, 10));

console.log('\n=== FINDING 4: avg winning speed by decade ===');
for (const d of decades) {
  const dWins = wins.filter(r=>r.decade===d);
  console.log(d+'s:', 'avgSpeed(mean of winners)=', mean(dWins.map(r=>r.avgSpeed))?.toFixed(1), 'n=', dWins.length);
}

console.log('\n=== FINDING 5: total driver winnings by year (sum of money, all entrants) ===');
const byYearMoney = {};
for (const r of rows) { if (r.money) { byYearMoney[r.year] = (byYearMoney[r.year]||0) + r.money; } }
const moneyYears = Object.keys(byYearMoney).map(Number).sort((a,b)=>a-b);
console.log('years with money data:', moneyYears[0], '-', moneyYears[moneyYears.length-1]);
console.log('peak year:', Object.entries(byYearMoney).sort((a,b)=>b[1]-a[1])[0]);
console.log('1972 total:', byYearMoney[1972], '2015 total:', byYearMoney[2015]);

console.log('\n=== FINDING 6: top tracks by races hosted ===');
console.log(topBy(wins, r=>r.track, g=>g.length, 15));

console.log('\n=== FINDING 7: cautions & lead changes by decade (race-level, win rows) ===');
for (const d of decades) {
  const dWins = wins.filter(r=>r.decade===d);
  console.log(d+'s: avgCautions=', mean(dWins.map(r=>r.cautions))?.toFixed(1), 'avgLeadChanges=', mean(dWins.map(r=>r.leadChanges))?.toFixed(1));
}

console.log('\n=== FINDING 8: finish rate by decade (all entrants) ===');
for (const d of decades) {
  const dRows = rows.filter(r=>r.decade===d);
  const finished = dRows.filter(r=>r.status==='running').length;
  console.log(d+'s: finishRate=', (100*finished/dRows.length).toFixed(1)+'%', 'n=', dRows.length);
}

console.log('\n=== CLOSING: status value breakdown (top 10) ===');
console.log(topBy(rows, r=>r.status, g=>g.length, 10).map(d=>d.name+': '+d.value));
