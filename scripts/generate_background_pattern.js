// Builds a tiling background pattern of overlapping, unlabeled track
// outlines (from data/track_shapes.json) and emits the two CSS custom-
// property declarations (light-mode dark-stroke, dark-mode light-stroke) to
// paste into css/styles.css as `--bg-pattern`.
const shapes = require('../data/track_shapes.json');

const TILE = 640;
// hand-picked for variety of silhouette, placed/rotated/scaled to overlap
const placements = [
  { name: 'Pocono Raceway', x: 90, y: 110, scale: 1.3, rot: -12 },
  { name: 'Indianapolis Grand Prix Circuit', x: 420, y: 90, scale: 1.1, rot: 8 },
  { name: 'Daytona International Speedway', x: 500, y: 330, scale: 1.5, rot: 20 },
  { name: 'Darlington Raceway', x: 150, y: 380, scale: 1.4, rot: -18 },
  { name: 'Martinsville Speedway', x: 330, y: 230, scale: 1.2, rot: 35 },
  { name: 'Watkins Glen International', x: 60, y: 520, scale: 1.1, rot: 6 },
  { name: 'Phoenix Raceway', x: 480, y: 540, scale: 1.0, rot: -25 }
];

function tileSvg(stroke, strokeWidth) {
  const paths = placements.map(p => {
    const s = shapes[p.name];
    // shapes are authored in a 200x100 box centered at 100,50 - recenter to origin, scale, rotate, translate
    return `<g transform="translate(${p.x},${p.y}) rotate(${p.rot}) scale(${p.scale}) translate(-100,-50)">` +
      `<path d="${s.path}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>` +
      `</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${paths}</svg>`;
}

function toDataUri(svg) {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}")`;
}

const lightModeBg = toDataUri(tileSvg('rgba(11,11,11,0.05)', 2.5));
const darkModeBg = toDataUri(tileSvg('rgba(255,255,255,0.045)', 2.5));

const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_light.txt'), `  --bg-pattern: ${lightModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_dark.txt'), `  --bg-pattern: ${darkModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
console.log('wrote data/_bg_pattern_light.txt and data/_bg_pattern_dark.txt, tile size', TILE);
