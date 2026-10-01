// Generates data/track_shapes.json. Every shape here is traced from ONE
// source: a single blueprint-style reference graphic showing 28 NASCAR
// track silhouettes (not the tracks' real-world geometry - e.g. that
// reference draws Daytona and Talladega as plain smooth ovals, not true
// tri-ovals, so that's what's reproduced here too). Tracks not shown in
// that reference get no entry - most of the 181 tracks on the map
// intentionally have none.
const fs = require('fs');
const path = require('path');

const CX = 100, CY = 50; // normalized 200x100 viewBox, centered
function fmt(n) { return Math.round(n * 100) / 100; }

// Plain stadium/pill oval - two straight sides + full semicircle ends. This
// is the dominant shape in the reference: most "ordinary" ovals are drawn
// as exactly this, with no egg asymmetry or tri-oval point.
function pillPath(width, height) {
  const r = height / 2;
  const halfStraight = Math.max(width / 2 - r, 1);
  const left = CX - halfStraight, right = CX + halfStraight;
  const top = CY - r, bottom = CY + r;
  return `M ${fmt(left)},${fmt(top)} L ${fmt(right)},${fmt(top)} A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(right)},${fmt(bottom)} L ${fmt(left)},${fmt(bottom)} A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(left)},${fmt(top)} Z`;
}

// Oval with a flattened, angled-corner bottom (reads as a rounded hexagon):
// a full round top half, like a pill, then straight diagonal cuts from the
// widest point in to a flat bottom edge instead of a bottom semicircle.
function flatBottomOvalPath(width, height, flatHalfWidth) {
  const r = height / 2;
  const halfStraight = Math.max(width / 2 - r, 1);
  const left = CX - width / 2, right = CX + width / 2;
  const top = CY - r, bottom = CY + r;
  const topLeftX = CX - halfStraight, topRightX = CX + halfStraight;
  return `M ${fmt(topLeftX)},${fmt(top)} L ${fmt(topRightX)},${fmt(top)} ` +
    `A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(right)},${fmt(CY)} ` +
    `L ${fmt(CX + flatHalfWidth)},${fmt(bottom)} L ${fmt(CX - flatHalfWidth)},${fmt(bottom)} ` +
    `L ${fmt(left)},${fmt(CY)} ` +
    `A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(topLeftX)},${fmt(top)} Z`;
}

function roundedRectPath(width, height, r) {
  const x0 = CX - width / 2, x1 = CX + width / 2, y0 = CY - height / 2, y1 = CY + height / 2;
  return `M ${fmt(x0 + r)},${fmt(y0)} L ${fmt(x1 - r)},${fmt(y0)} A ${r},${r} 0 0 1 ${fmt(x1)},${fmt(y0 + r)} ` +
    `L ${fmt(x1)},${fmt(y1 - r)} A ${r},${r} 0 0 1 ${fmt(x1 - r)},${fmt(y1)} ` +
    `L ${fmt(x0 + r)},${fmt(y1)} A ${r},${r} 0 0 1 ${fmt(x0)},${fmt(y1 - r)} ` +
    `L ${fmt(x0)},${fmt(y0 + r)} A ${r},${r} 0 0 1 ${fmt(x0 + r)},${fmt(y0)} Z`;
}

const shapes = {};
const PLAIN = 'oval';

// ---------------- Plain ovals (all drawn as the same simple pill in the reference) ----------------
for (const [name, w, h] of [
  ['Auto Club Speedway', 168, 48],
  ['Darlington Raceway', 166, 50],
  ['Daytona International Speedway', 168, 46],
  ['Dover Motor Speedway', 168, 50],
  ['Homestead-Miami Speedway', 168, 50],
  ['Michigan International Speedway', 164, 52],
  ['Nashville Superspeedway', 164, 52],
  ['Talladega Superspeedway', 168, 46],
  ['Texas Motor Speedway', 166, 50],
  ['World Wide Technology Raceway at Gateway', 170, 48],
  ['New Hampshire Motor Speedway', 162, 54],
  ['North Wilkesboro Speedway', 150, 56],
  ['Richmond Raceway', 160, 52],
  ['Charlotte Motor Speedway', 168, 50],
  ['Las Vegas Motor Speedway', 166, 50]
]) shapes[name] = { category: PLAIN, path: pillPath(w, h) };

// ---------------- Flattened-bottom ovals (hexagon-ish in the reference) ----------------
shapes['Atlanta Motor Speedway'] = { category: 'flat-oval', path: flatBottomOvalPath(166, 52, 42) };
shapes['Phoenix Raceway'] = { category: 'flat-oval', path: flatBottomOvalPath(160, 56, 36) };
shapes['Kansas Speedway'] = { category: 'flat-oval', path: flatBottomOvalPath(158, 58, 40) };

// ---------------- Compact oval (Bristol - small, tight, rounder) ----------------
shapes['Bristol Motor Speedway'] = { category: 'compact-oval', path: pillPath(120, 76) };

// ---------------- Rectangular paperclip (Martinsville - tighter corners, flatter sides) ----------------
shapes['Martinsville Speedway'] = { category: 'paperclip', path: roundedRectPath(170, 56, 24) };

// ---------------- Triangle (Pocono) ----------------
shapes['Pocono Raceway'] = {
  category: 'triangle',
  path: 'M 100,10 C 130,10 150,22 165,42 C 172,52 172,58 162,68 L 95,88 C 70,92 50,86 38,68 C 28,53 30,38 44,26 C 58,14 78,10 100,10 Z'
};

// ---------------- Roval (Charlotte - oval with an infield loop breaking off the side) ----------------
shapes['Charlotte Motor Speedway Road Course'] = {
  category: 'roval',
  path: pillPath(168, 50) + ' M 150,26 C 162,20 176,26 176,38 C 176,48 166,52 158,48 C 150,44 146,34 150,26 Z'
};

// ---------------- Road courses (bespoke, traced from the reference) ----------------
shapes['Circuit of the Americas'] = {
  category: 'road',
  path: 'M 30,80 L 55,42 C 58,36 56,30 60,26 C 64,22 70,24 68,30 C 66,36 72,34 74,28 C 76,22 82,22 82,28 C 82,34 90,30 92,24 C 94,18 102,16 108,20 C 114,24 110,32 116,30 C 124,27 136,14 144,10 C 150,8 152,13 148,18 C 140,28 120,42 100,48 C 80,54 60,62 44,72 C 38,76 34,78 30,80 Z'
};
shapes['Sonoma Raceway'] = {
  category: 'road',
  path: 'M 70,14 C 92,10 112,14 118,26 C 122,34 114,40 104,38 C 96,36 92,44 100,50 C 110,57 126,52 136,58 C 148,65 146,78 132,82 C 110,88 80,88 58,82 C 38,76 24,64 26,50 C 28,38 40,34 38,24 C 37,16 46,10 56,12 C 61,13 65,15 70,14 Z'
};
shapes['Watkins Glen International'] = {
  category: 'road',
  path: 'M 70,12 C 80,8 92,10 90,18 C 88,24 78,22 76,28 C 74,34 82,36 90,34 C 100,32 108,36 106,44 L 100,78 C 98,86 90,90 80,88 L 54,82 C 44,80 38,74 40,64 L 46,34 C 48,22 58,14 70,12 Z'
};
shapes['Chicago Street Course'] = {
  category: 'road',
  path: 'M 70,15 L 95,15 L 95,30 L 115,30 L 115,45 L 90,85 L 65,42 L 65,25 Z'
};
shapes['Indianapolis Grand Prix Circuit'] = {
  category: 'road',
  path: 'M 70,10 L 164,10 A 20,20 0 0 1 184,30 L 184,70 A 20,20 0 0 1 164,90 L 70,90 A 20,20 0 0 1 50,70 L 60,70 L 60,58 L 46,58 L 46,46 L 60,46 L 60,38 L 50,38 L 50,28 A 20,20 0 0 1 70,10 Z'
};

const outPath = path.join(__dirname, '..', 'data', 'track_shapes.json');
fs.writeFileSync(outPath, JSON.stringify(shapes, null, 1));
console.log('wrote', outPath, '-', Object.keys(shapes).length, 'track shapes');
console.log(Object.keys(shapes).sort());
