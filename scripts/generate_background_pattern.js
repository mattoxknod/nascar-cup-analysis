// Builds a tiling background pattern of overlapping, unlabeled track
// outlines (from data/track_shapes.json, traced from real Wikipedia track
// diagrams) plus a handful of NASCAR's own historic logo marks (cropped from
// a logo-history reference graphic into data/logos/history/ by
// scripts/crop_history_logos.js), and emits the two CSS custom-property
// declarations (light-mode dark-stroke, dark-mode light-stroke) to paste
// into css/styles.css as `--bg-pattern`. Each track shape has its own
// viewBox/scale, so every placement first normalizes the shape to a common
// target size before positioning it. The logos are raster images (not
// recolorable like the stroke-only track outlines), so they're kept at a
// low, theme-agnostic opacity instead.
const fs = require('fs');
const path = require('path');
const shapes = require('../data/track_shapes.json');

const TILE = 760;
const TARGET_SIZE = 130; // normalized longest-dimension size before placement scale

// Fewer, more spread-out tracks than logos below, by design - the user
// asked for the background to lean toward the historic logos over the track
// outlines, where an earlier pass had it the other way around.
const trackPlacements = [
  { name: 'Pocono Raceway', x: 95, y: 95, scale: 0.7, rot: -12 },
  { name: 'Indianapolis Motor Speedway', x: 380, y: 60, scale: 0.6, rot: 8 },
  { name: 'Daytona International Speedway', x: 660, y: 150, scale: 0.85, rot: 20 },
  { name: 'Darlington Raceway', x: 60, y: 280, scale: 0.8, rot: -18 },
  { name: 'Martinsville Speedway', x: 270, y: 230, scale: 0.6, rot: 35 },
  { name: 'Watkins Glen International', x: 560, y: 330, scale: 0.55, rot: 6 },
  { name: 'Phoenix Raceway', x: 60, y: 480, scale: 0.55, rot: -25 },
  { name: 'Bristol Motor Speedway', x: 430, y: 440, scale: 0.55, rot: 15 },
  { name: 'Talladega Superspeedway', x: 700, y: 500, scale: 0.75, rot: -10 },
  { name: 'Charlotte Motor Speedway', x: 220, y: 420, scale: 0.55, rot: 40 },
  { name: 'Richmond Raceway', x: 380, y: 630, scale: 0.5, rot: -20 },
  { name: 'Sonoma Raceway', x: 600, y: 660, scale: 0.5, rot: 12 },
  { name: 'Road America', x: 90, y: 680, scale: 0.55, rot: -8 },
  { name: 'Texas Motor Speedway', x: 500, y: 240, scale: 0.5, rot: 25 },
  { name: 'Rockingham Speedway', x: 710, y: 30, scale: 0.45, rot: -15 },
  { name: 'North Wilkesboro Speedway', x: 300, y: 90, scale: 0.4, rot: 18 },
  { name: 'Michigan International Speedway', x: 640, y: 600, scale: 0.5, rot: -30 },
  { name: 'Homestead-Miami Speedway', x: 150, y: 600, scale: 0.5, rot: 22 },
  { name: 'Dover Motor Speedway', x: 150, y: 350, scale: 0.45, rot: -30 },
  { name: 'Atlanta Motor Speedway', x: 180, y: 150, scale: 0.45, rot: 33 }
];

// Historic logo marks - every NASCAR branding era (1948 through today),
// the 1980s Winston Cup Series logo, the Sprint Cup and Monster Energy Cup
// sponsor-era logos, and the current Daytona 500 event logo - repeated
// across the tile (there are only 9 distinct marks, so each appears 2-3
// times at a different size/rotation/position, the same way the 20 track
// outlines above already overlap and repeat) so logos read as the stronger
// presence in the pattern, tracks as the accent.
const logoPlacements = [
  { file: 'nascar-1948.png', x: 120, y: 250, size: 80, rot: -8 },
  { file: 'nascar-1948.png', x: 650, y: 590, size: 75, rot: 15 },
  { file: 'nascar-1956.png', x: 580, y: 120, size: 85, rot: 12 },
  { file: 'nascar-1956.png', x: 90, y: 630, size: 75, rot: -10 },
  { file: 'nascar-1964.png', x: 390, y: 40, size: 80, rot: -15 },
  { file: 'nascar-1964.png', x: 720, y: 420, size: 85, rot: 8 },
  { file: 'nascar-1976.png', x: 250, y: 470, size: 90, rot: 10 },
  { file: 'nascar-1976.png', x: 560, y: 690, size: 80, rot: -12 },
  { file: 'nascar-2017.png', x: 40, y: 400, size: 100, rot: -5 },
  { file: 'nascar-2017.png', x: 480, y: 250, size: 90, rot: 8 },
  { file: 'nascar-2017.png', x: 690, y: 690, size: 75, rot: 20 },
  { file: 'winston-cup.png', x: 650, y: 30, size: 70, rot: -14 },
  { file: 'winston-cup.png', x: 150, y: 560, size: 75, rot: 16 },
  { file: 'winston-cup.png', x: 350, y: 170, size: 65, rot: -18 },
  { file: 'sprint-cup-series.png', x: 300, y: 330, size: 90, rot: -10 },
  { file: 'sprint-cup-series.png', x: 610, y: 450, size: 80, rot: 18 },
  { file: 'monster-energy-cup.png', x: 55, y: 80, size: 90, rot: 10 },
  { file: 'monster-energy-cup.png', x: 450, y: 430, size: 85, rot: -15 },
  { file: 'daytona-500-2026.png', x: 400, y: 610, size: 90, rot: -8 },
  { file: 'daytona-500-2026.png', x: 730, y: 250, size: 80, rot: 12 }
];

function parseViewBox(vb) {
  const [x, y, w, h] = vb.split(/\s+/).map(Number);
  return { x, y, w, h };
}

function trackGroups(stroke, strokeWidth) {
  return trackPlacements.map(p => {
    const s = shapes[p.name];
    const vb = parseViewBox(s.viewBox);
    const norm = TARGET_SIZE / Math.max(vb.w, vb.h);
    const finalScale = norm * p.scale;
    const transform = `translate(${p.x},${p.y}) rotate(${p.rot}) scale(${finalScale}) translate(${-vb.x - vb.w / 2},${-vb.y - vb.h / 2})`;
    const styled = s.markup
      .replace(/<(path|polygon|ellipse|circle|rect)(\s|\/|>)/g, `<$1 fill="none" stroke="${stroke}" stroke-width="${strokeWidth / finalScale}"$2`);
    return `<g transform="${transform}">${styled}</g>`;
  }).join('');
}

const logoCache = {};
function logoDataUri(file) {
  if (logoCache[file]) return logoCache[file];
  const buf = fs.readFileSync(path.join(__dirname, '..', 'data', 'logos', 'history', file));
  const uri = 'data:image/png;base64,' + buf.toString('base64');
  logoCache[file] = uri;
  return uri;
}

function logoGroups(opacity) {
  return logoPlacements.map(p => {
    const uri = logoDataUri(p.file);
    const transform = `translate(${p.x - p.size / 2},${p.y - p.size / 2}) rotate(${p.rot} ${p.size / 2} ${p.size / 2})`;
    return `<image href="${uri}" width="${p.size}" height="${p.size}" opacity="${opacity}" transform="${transform}"/>`;
  }).join('');
}

function tileSvg(stroke, strokeWidth, logoOpacity) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
    trackGroups(stroke, strokeWidth) + logoGroups(logoOpacity) +
    `</svg>`;
}

function toDataUri(svg) {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}")`;
}

const lightModeBg = toDataUri(tileSvg('rgba(11,11,11,0.055)', 2.5, 0.1));
const darkModeBg = toDataUri(tileSvg('rgba(255,255,255,0.05)', 2.5, 0.12));

fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_light.txt'), `  --bg-pattern: ${lightModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_dark.txt'), `  --bg-pattern: ${darkModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
console.log('wrote data/_bg_pattern_light.txt and data/_bg_pattern_dark.txt, tile size', TILE);
console.log('light bytes:', lightModeBg.length, 'dark bytes:', darkModeBg.length);
