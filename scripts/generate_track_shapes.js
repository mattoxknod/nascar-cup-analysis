// Generates data/track_shapes.json: simplified, recognizable (not
// survey-accurate) outline silhouettes for a subset of well-known NASCAR
// tracks, inspired by the shapes in the blueprint reference images. Most
// tracks (the other ~150) intentionally have no entry here - the map page
// only shows an outline for the ones that do.
const fs = require('fs');
const path = require('path');

const CX = 100, CY = 50; // normalized 200x100 viewBox, centered

function fmt(n) { return Math.round(n * 100) / 100; }

// A generalized "superellipse" oval: n=2 is a true ellipse, higher n pushes
// toward a rounded rectangle. aLeft/aRight let the left and right halves
// have different horizontal radii, for egg/D-shaped asymmetric ovals.
function ovalPath({ aLeft, aRight, b, n = 2.6, points = 90, rotate = 0, bulge }) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const a = ct >= 0 ? aRight : aLeft;
    let x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * a;
    let y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * b;
    // optional tri-oval bulge: push points outward near t=0 (right side / frontstretch)
    if (bulge) {
      const d = Math.atan2(st, ct);
      const k = Math.exp(-Math.pow(d / bulge.width, 2)) * bulge.amount;
      x += k;
    }
    if (rotate) {
      const rad = (rotate * Math.PI) / 180;
      const rx = x * Math.cos(rad) - y * Math.sin(rad);
      const ry = x * Math.sin(rad) + y * Math.cos(rad);
      x = rx; y = ry;
    }
    pts.push([CX + x, CY + y]);
  }
  return 'M ' + pts.map(p => fmt(p[0]) + ',' + fmt(p[1])).join(' L ') + ' Z';
}

// A "pill" / stadium shape: two straight sides joined by full semicircles -
// the tight flat short-track look (Martinsville, Bristol, North Wilkesboro).
function pillPath(width, height) {
  const r = height / 2;
  const halfStraight = Math.max(width / 2 - r, 2);
  const left = CX - halfStraight, right = CX + halfStraight;
  const top = CY - r, bottom = CY + r;
  return `M ${fmt(left)},${fmt(top)} L ${fmt(right)},${fmt(top)} A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(right)},${fmt(bottom)} L ${fmt(left)},${fmt(bottom)} A ${fmt(r)},${fmt(r)} 0 0 1 ${fmt(left)},${fmt(top)} Z`;
}

// A rounded rectangle with a small corner radius relative to its size -
// reads as "almost a rectangle" (Indianapolis).
function roundedRectPath(width, height, r) {
  const x0 = CX - width / 2, x1 = CX + width / 2, y0 = CY - height / 2, y1 = CY + height / 2;
  return `M ${fmt(x0 + r)},${fmt(y0)} L ${fmt(x1 - r)},${fmt(y0)} A ${r},${r} 0 0 1 ${fmt(x1)},${fmt(y0 + r)} ` +
    `L ${fmt(x1)},${fmt(y1 - r)} A ${r},${r} 0 0 1 ${fmt(x1 - r)},${fmt(y1)} ` +
    `L ${fmt(x0 + r)},${fmt(y1)} A ${r},${r} 0 0 1 ${fmt(x0)},${fmt(y1 - r)} ` +
    `L ${fmt(x0)},${fmt(y0 + r)} A ${r},${r} 0 0 1 ${fmt(x0 + r)},${fmt(y0)} Z`;
}

const shapes = {};

// ---------------- Standard ovals (quad-ovals) ----------------
for (const [name, aLeft, aRight, b, n] of [
  ['Atlanta Motor Speedway', 85, 85, 40, 2.8],
  ['Las Vegas Motor Speedway', 85, 85, 42, 2.6],
  ['Kansas Speedway', 85, 85, 41, 2.7],
  ['Texas Motor Speedway', 85, 83, 42, 2.6],
  ['Charlotte Motor Speedway', 85, 85, 41, 2.7],
  ['Nashville Superspeedway', 82, 82, 44, 3.0],
  ['Chicagoland Speedway', 85, 85, 41, 2.7],
  ['Iowa Speedway', 78, 78, 46, 3.2],
  ['Homestead-Miami Speedway', 85, 85, 41, 2.6],
  ['World Wide Technology Raceway at Gateway', 80, 80, 44, 2.9],
  ['New Hampshire Motor Speedway', 82, 82, 43, 3.1]
]) shapes[name] = { category: 'oval', path: ovalPath({ aLeft, aRight, b, n }) };

// ---------------- D-shaped / egg ovals (asymmetric) ----------------
shapes['Michigan International Speedway'] = { category: 'd-oval', path: ovalPath({ aLeft: 88, aRight: 78, b: 42, n: 2.8 }) };
shapes['Richmond Raceway'] = { category: 'd-oval', path: ovalPath({ aLeft: 84, aRight: 76, b: 40, n: 3.0 }) };
shapes['Darlington Raceway'] = { category: 'egg', path: ovalPath({ aLeft: 90, aRight: 64, b: 40, n: 2.4 }) };
shapes['Dover Motor Speedway'] = { category: 'egg', path: ovalPath({ aLeft: 80, aRight: 68, b: 47, n: 2.6 }) };

// ---------------- Tri-ovals ----------------
shapes['Daytona International Speedway'] = { category: 'trioval', path: ovalPath({ aLeft: 82, aRight: 82, b: 38, n: 2.6, bulge: { width: 0.32, amount: 26 } }) };
shapes['Talladega Superspeedway'] = { category: 'trioval', path: ovalPath({ aLeft: 83, aRight: 83, b: 39, n: 2.5, bulge: { width: 0.3, amount: 22 } }) };

// ---------------- Paperclip short tracks ----------------
shapes['Martinsville Speedway'] = { category: 'paperclip', path: pillPath(168, 54) };
shapes['North Wilkesboro Speedway'] = { category: 'paperclip', path: pillPath(160, 62) };
shapes['Bristol Motor Speedway'] = { category: 'paperclip', path: pillPath(140, 80) };
shapes['Bowman Gray Stadium'] = { category: 'paperclip', path: pillPath(110, 76) };

// ---------------- Rectangle ----------------
shapes['Indianapolis Motor Speedway'] = { category: 'rectangle', path: roundedRectPath(168, 94, 20) };

// ---------------- Bespoke: triangle (Pocono) ----------------
// Three distinctly different corner radii - the "Tricky Triangle": a tight
// Tunnel Turn, a medium Turn 2, and a long sweeping Turn 1.
shapes['Pocono Raceway'] = {
  category: 'triangle',
  path: 'M 100,10 C 130,10 150,22 165,42 C 172,52 172,58 162,68 L 95,88 C 70,92 50,86 38,68 C 28,53 30,38 44,26 C 58,14 78,10 100,10 Z'
};

// ---------------- Bespoke: dogleg (Phoenix) ----------------
// A pinched, uneven oval - tight dogleg Turn 2 and a wider sweeping Turn 3-4.
shapes['Phoenix Raceway'] = {
  category: 'dogleg',
  path: 'M 70,14 C 110,10 150,18 168,36 C 178,46 176,56 162,64 C 150,70 136,62 128,52 C 120,42 108,40 98,48 C 86,58 90,72 78,82 C 60,90 36,86 22,70 C 10,56 12,38 28,26 C 40,17 55,15 70,14 Z'
};

// ---------------- Bespoke: road courses ----------------
shapes['Circuit of the Americas'] = {
  category: 'road',
  path: 'M 112,12 C 120,10 126,16 122,24 C 118,32 104,30 100,38 C 96,46 108,50 116,46 C 126,42 136,48 132,58 C 128,66 114,64 108,70 C 116,78 132,76 142,82 C 150,87 148,94 138,92 C 100,92 70,90 48,82 C 30,75 20,62 24,48 C 27,37 38,34 36,24 C 34,15 44,9 54,13 C 62,16 60,26 68,28 C 78,30 82,20 92,15 C 98,12 106,13 112,12 Z'
};
shapes['Watkins Glen International'] = {
  category: 'road',
  path: 'M 50,16 C 90,10 140,10 165,20 C 178,25 180,34 170,40 C 160,46 148,38 138,42 C 130,45 132,54 142,56 C 156,58 160,50 170,52 C 182,54 184,64 174,70 C 160,78 130,80 100,82 C 70,84 42,80 28,68 C 16,58 16,42 28,30 C 34,24 42,20 50,16 Z'
};
shapes['Sonoma Raceway'] = {
  category: 'road',
  path: 'M 70,14 C 92,10 112,14 118,26 C 122,34 114,40 104,38 C 96,36 92,44 100,50 C 110,57 126,52 136,58 C 148,65 146,78 132,82 C 110,88 80,88 58,82 C 38,76 24,64 26,50 C 28,38 40,34 38,24 C 37,16 46,10 56,12 C 61,13 65,15 70,14 Z'
};
shapes['Chicago Street Course'] = {
  category: 'road',
  path: 'M 46,34 L 128,22 C 148,19 164,28 162,42 C 160,54 146,56 138,50 C 130,44 118,46 118,56 L 118,68 C 118,78 108,84 94,82 L 54,76 C 40,74 32,66 34,56 L 38,48 C 40,43 36,40 46,34 Z'
};
shapes['Charlotte Motor Speedway Road Course'] = {
  category: 'road',
  path: ovalPath({ aLeft: 85, aRight: 85, b: 41, n: 2.7 }).replace(' Z', '') +
    ' M 60,30 C 50,24 36,28 36,40 C 36,50 48,52 56,46 C 64,40 70,34 60,30 Z'
};
shapes['Daytona Intl. Speedway Road Course'] = {
  category: 'road',
  path: ovalPath({ aLeft: 82, aRight: 82, b: 38, n: 2.6, bulge: { width: 0.32, amount: 26 } }).replace(' Z', '') +
    ' M 70,20 C 56,14 40,22 42,36 C 44,48 60,50 68,42 C 76,34 82,26 70,20 Z'
};

const outPath = path.join(__dirname, '..', 'data', 'track_shapes.json');
fs.writeFileSync(outPath, JSON.stringify(shapes, null, 1));
console.log('wrote', outPath, '-', Object.keys(shapes).length, 'track shapes');
console.log(Object.keys(shapes).sort());
