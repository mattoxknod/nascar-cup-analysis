// Downloads the official Wikipedia/Wikimedia Commons track-layout SVGs for
// every track in data/track_shapes.json's source list, from the "List of
// NASCAR tracks" Wikipedia article (https://en.wikipedia.org/wiki/List_of_NASCAR_tracks).
//
// This is the reproducible half of how data/track_shapes.json was built.
// The other half isn't a one-command script: for each downloaded SVG, the
// largest *visible* path/polygon/ellipse (by bounding-box area, measured
// with a real browser's SVG engine via getBBox() - not hand-parsed) was
// taken as the track outline, its exact ancestor-transform chain preserved,
// and the result spot-checked against a rendered preview. Three tracks
// where that heuristic picked the wrong shape (a diagram's background park/
// land fill instead of the track line, for Chicago Street Course and Road
// America; a transform-interaction edge case for Auto Club Speedway) were
// replaced with small hand-traced fallback paths instead. All of this is
// captured in the final, committed data/track_shapes.json - there is
// nothing to regenerate from scratch; this script exists to document and
// reproduce the sourcing, and to make re-downloading the originals easy if
// a diagram is ever updated on Commons.
//
// Run with: node scripts/download_track_svgs.js
// (writes files into scripts/_wiki_svgs/, gitignored scratch output)

const fs = require('fs');
const path = require('path');

// track name (as used in data/track_shapes.json) -> Commons file URL.
// Three tracks (Chicago Street Course, Road America, Auto Club Speedway)
// have a real source file here too, but ended up with a hand-traced
// fallback shape in track_shapes.json instead - see the note above.
const TRACK_IMAGE_SOURCES = {
  "Atlanta Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/3/34/Atlanta_Motor_Speedway_2024.svg",
  "Auto Club Speedway": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Auto_Club_Speedway_(formerly_California_Speedway)_-_Speedway.svg",
  "Bowman Gray Stadium": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Bowman_Gray_Stadium_2024.svg",
  "Bristol Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/e/ed/Bristol_Motor_Speedway_2024.svg",
  "Charlotte Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Charlotte_Motor_Speedway_2024.svg",
  "Charlotte Motor Speedway Road Course": "https://upload.wikimedia.org/wikipedia/commons/7/72/Charlotte_Motor_Speedway_Roval_2024.svg",
  "Chicago Street Course": "https://upload.wikimedia.org/wikipedia/commons/1/18/Chicago_Street_Course.svg",
  "Chicagoland Speedway": "https://upload.wikimedia.org/wikipedia/commons/4/43/Chicagoland_Speedway_diagram.svg",
  "Darlington Raceway": "https://upload.wikimedia.org/wikipedia/commons/6/65/Darlington_Raceway_2024.svg",
  "Daytona International Speedway": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Daytona_International_Speedway_2024.svg",
  "Dover Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/5/56/Dover_Motor_Speedway_2024.svg",
  "Fairgrounds Speedway Nashville": "https://upload.wikimedia.org/wikipedia/commons/f/fd/NashvilleSpeedwayMap.svg",
  "Hanford Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/4/45/Marchbanks_Speedway_(Hanford_Motor_Speedway)_map.svg",
  "Homestead-Miami Speedway": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Homestead_Miami_Speedway_2024.svg",
  "Indianapolis Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Indianapolis_Motor_Speedway_2024.svg",
  "Iowa Speedway": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Iowa_Speedway_2024.svg",
  "Kansas Speedway": "https://upload.wikimedia.org/wikipedia/commons/4/48/Kansas_Speedway_2024.svg",
  "Kentucky Speedway": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Kentucky_Speedway.svg",
  "Las Vegas Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Las_Vegas_Motor_Speedway_2024.svg",
  "Martinsville Speedway": "https://upload.wikimedia.org/wikipedia/commons/3/37/Martinsville_Speedway_2024.svg",
  "Michigan International Speedway": "https://upload.wikimedia.org/wikipedia/commons/3/35/Michigan_International_Speedway_2024.svg",
  "Myrtle Beach Speedway": "https://upload.wikimedia.org/wikipedia/commons/8/83/MyrtleBeachSpeedway.svg",
  "Nashville Superspeedway": "https://upload.wikimedia.org/wikipedia/commons/8/85/Nashville_Superspeedway_2024.svg",
  "New Hampshire Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/8/8e/New_Hampshire_Motor_Speedway_2024.svg",
  "North Wilkesboro Speedway": "https://upload.wikimedia.org/wikipedia/commons/5/52/North_Wilkesboro_Speedway_2024.svg",
  "Phoenix Raceway": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Phoenix_Raceway_2024.svg",
  "Pocono Raceway": "https://upload.wikimedia.org/wikipedia/commons/0/08/Pocono_Raceway_2024.svg",
  "Richmond Raceway": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Richmond_Raceway_2024.svg",
  "Riverside International Raceway": "https://upload.wikimedia.org/wikipedia/commons/5/50/Riverside_International_Raceway_1980_and_1967.svg",
  "Road America": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Road_America.svg",
  "Rockingham Speedway": "https://upload.wikimedia.org/wikipedia/commons/d/db/Rockingham_Speedway.svg",
  "Sonoma Raceway": "https://upload.wikimedia.org/wikipedia/commons/4/41/Sonoma_Raceway_NASCAR_Circuit_2024.svg",
  "Talladega Superspeedway": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Talladega_Superspeedway_2024.svg",
  "Texas Motor Speedway": "https://upload.wikimedia.org/wikipedia/commons/8/89/Texas_Motor_Speedway_2024.svg",
  "Texas World Speedway": "https://upload.wikimedia.org/wikipedia/commons/1/14/Texas_World_Speedway-Superspeedway.svg",
  "Thompson Speedway Motorsports Park": "https://upload.wikimedia.org/wikipedia/commons/2/26/ThompsonInternationalSpeedwayMap.svg",
  "Trenton Speedway": "https://upload.wikimedia.org/wikipedia/commons/d/df/Trenton_Speedway.svg",
  "Watkins Glen International": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Watkins_Glen_International_Short_Circuit_2024.svg",
  "World Wide Technology Raceway at Gateway": "https://upload.wikimedia.org/wikipedia/commons/6/6d/World_Wide_Technology_Raceway_2024.svg"
};
// Wikipedia/Commons occasionally reshuffle a file's hash path when a
// diagram is re-uploaded - if a URL above 404s, look up the current one at
// https://en.wikipedia.org/wiki/List_of_NASCAR_tracks or
// https://commons.wikimedia.org/wiki/File:<filename>.

const OUT_DIR = path.join(__dirname, '_wiki_svgs');
const UA = 'nascar-course-project/1.0 (personal data-viz project; contact: mattoxknod@gmail.com)';

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, url] of Object.entries(TRACK_IMAGE_SOURCES)) {
    const dest = path.join(OUT_DIR, name.replace(/[^a-zA-Z0-9]/g, '_') + '.svg');
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) { console.log('FAIL', res.status, name); continue; }
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log('OK  ', name);
    } catch (e) {
      console.log('ERR ', name, e.message);
    }
    await new Promise(r => setTimeout(r, 300)); // be polite to Wikimedia
  }
}

main();
