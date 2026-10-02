// One-off helper: crops individual logo marks out of the composite reference
// images in data/logos/history/_src_*.jpg into clean, trimmed, transparent-
// background PNGs for use in the site's tiled background pattern. Not part
// of the regular build - run manually only if the source images change.
const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'logos', 'history');
const EVO = path.join(DIR, '_src_nascar_logo_evolution.jpg');
const WCS = path.join(DIR, '_src_winston_cup.jpg');

// Make near-white pixels transparent so the logo sits cleanly on any
// background, instead of carrying its source image's white card.
async function whiteToTransparent(buffer) {
  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

async function extract(src, name, region) {
  let pipeline = sharp(src);
  if (region) pipeline = pipeline.extract(region);
  const cropped = await pipeline.trim({ threshold: 15 }).toBuffer();
  const transparent = await whiteToTransparent(cropped);
  const out = path.join(DIR, name + '.png');
  await transparent.toFile(out);
  const meta = await sharp(out).metadata();
  console.log('wrote', name + '.png', meta.width, meta.height);
}

async function main() {
  // evolution composite is 478x641: two logos per row for rows 1-2, one
  // wide logo in row 3, gray year-bars between - crop generous boxes, trim()
  // tightens to the actual logo content within each box.
  await extract(EVO, 'nascar-1948', { left: 0, top: 0, width: 239, height: 172 });
  await extract(EVO, 'nascar-1956', { left: 239, top: 0, width: 239, height: 170 });
  await extract(EVO, 'nascar-1964', { left: 0, top: 212, width: 239, height: 150 });
  await extract(EVO, 'nascar-1976', { left: 239, top: 212, width: 239, height: 150 });
  await extract(EVO, 'nascar-2017', { left: 0, top: 428, width: 478, height: 170 });

  // Winston Cup poster is a single card - just trim the outer white margin.
  await extract(WCS, 'winston-cup', null);
}
main().catch(e => { console.error(e); process.exit(1); });
