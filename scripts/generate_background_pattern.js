// Builds a tiling background pattern of overlapping, unlabeled track
// outlines (from data/track_shapes.json, traced from real Wikipedia track
// diagrams) and emits the two CSS custom-property declarations (light-mode
// dark-stroke, dark-mode light-stroke) to paste into css/styles.css as
// `--bg-pattern`. Each shape has its own viewBox/scale, so every placement
// first normalizes the shape to a common target size before positioning it.
const shapes = require('../data/track_shapes.json');

const TILE = 640;
const TARGET_SIZE = 150; // normalized longest-dimension size before placement scale

const placements = [
  { name: 'Pocono Raceway', x: 90, y: 110, scale: 0.75, rot: -12 },
  { name: 'Indianapolis Motor Speedway', x: 420, y: 90, scale: 0.65, rot: 8 },
  { name: 'Daytona International Speedway', x: 500, y: 330, scale: 0.9, rot: 20 },
  { name: 'Darlington Raceway', x: 150, y: 380, scale: 0.85, rot: -18 },
  { name: 'Martinsville Speedway', x: 330, y: 230, scale: 0.7, rot: 35 },
  { name: 'Watkins Glen International', x: 60, y: 520, scale: 0.65, rot: 6 },
  { name: 'Phoenix Raceway', x: 480, y: 540, scale: 0.6, rot: -25 }
];

function parseViewBox(vb) {
  const [x, y, w, h] = vb.split(/\s+/).map(Number);
  return { x, y, w, h };
}

function tileSvg(stroke, strokeWidth) {
  const groups = placements.map(p => {
    const s = shapes[p.name];
    const vb = parseViewBox(s.viewBox);
    const norm = TARGET_SIZE / Math.max(vb.w, vb.h);
    const finalScale = norm * p.scale;
    // order (rightmost applied first): move shape's own viewBox origin to 0,0, scale to target size, apply placement scale/rotate, translate to position
    const transform = `translate(${p.x},${p.y}) rotate(${p.rot}) scale(${finalScale}) translate(${-vb.x - vb.w / 2},${-vb.y - vb.h / 2})`;
    const styled = s.markup
      .replace(/<(path|polygon|ellipse|circle|rect)(\s|\/|>)/g, `<$1 fill="none" stroke="${stroke}" stroke-width="${strokeWidth / finalScale}"$2`);
    return `<g transform="${transform}">${styled}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${groups}</svg>`;
}

function toDataUri(svg) {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}")`;
}

const lightModeBg = toDataUri(tileSvg('rgba(11,11,11,0.055)', 2.5));
const darkModeBg = toDataUri(tileSvg('rgba(255,255,255,0.05)', 2.5));

const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_light.txt'), `  --bg-pattern: ${lightModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
fs.writeFileSync(path.join(__dirname, '..', 'data', '_bg_pattern_dark.txt'), `  --bg-pattern: ${darkModeBg};\n  --bg-pattern-size: ${TILE}px ${TILE}px;\n`);
console.log('wrote data/_bg_pattern_light.txt and data/_bg_pattern_dark.txt, tile size', TILE);
