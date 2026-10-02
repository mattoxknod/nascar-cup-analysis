# NASCAR Cup Series Analysis

A data website built around every NASCAR Cup Series race from 1949 through 2025: 2,822 races, 100,199
driver-race entries, 206 different winners. Built for a Financial Data Analytics course project.

**Live site:** https://mattoxknod.github.io/nascar-cup-analysis/
**Report:** `index.html` &middot; **Dashboard:** `dashboard.html` &middot; **Bonus track map:** `map.html`

## What's in this repository

| File / folder | What it does |
|---|---|
| `index.html` | The report page. Title, summary, four headline numbers, eight findings (each with a chart and the numbers behind it), and a closing section documenting the data and every calculation. The nav bar and points ticker are locked in place together as you scroll, and the ticker itself changes with the finding scrolled into view - top 40 drivers by wins on Finding 1, each decade's leading manufacturer on Finding 2, top 20 owners by wins on Finding 3, average winning speed by decade on Finding 4, total purse winnings by season on Finding 5 - falling back to the live points standings everywhere else. |
| `dashboard.html` | The interactive dashboard. Filters the full dataset by season, driver, manufacturer, track, surface, and finish status; shows five summary numbers, four independently configurable charts (each with a measure switch, a breakdown switch, and a Ranked/Trend-by-season view switch - trend draws one line per season for the top 5 entities in the current breakdown, so you can see *when* a manufacturer or driver was dominant, not just the all-time ranking), a sortable data table, a head-to-head "Compare Two" tool (defaults to Dale Earnhardt vs. Dale Earnhardt, Jr., for fun), and a reset-all-filters button. Manufacturer and team logos (see `js/logos.js`) appear automatically next to manufacturer/owner rows in the charts and in the Compare Two header. |
| `map.html` | A bonus page (not required by the assignment) with an interactive, zoomable map of North America (focused on the US, where almost every track is), styled like a population-density/light-pollution satellite map: dark land, and every one of the 181 tracks that have hosted a Cup race glowing like a city light, size and brightness scaled by races hosted. A track with a recorded real outline (see `data/track_shapes.json`) sits inside its glow as that outline's own silhouette; the rest get a diamond. Click a state and it lifts above its neighbors (point-in-polygon against the real state geometry, not the track's address string) while a glowing bar rises from each of its tracks - height by races hosted, like a density-prism map - and the sidebar's track list filters down to just that state; click it again, or the banner's "Show all tracks" button, to put it back. The track-list sidebar starts collapsed so the map itself is the first thing you see. |
| `css/styles.css` | One shared stylesheet for all three pages &mdash; palette (a vivid orange-red accent, `--accent`), type, nav bar, and every component. |
| `js/data.js` | Shared data-loading and aggregation module. Both `index.html` and `dashboard.html` call the exact same `loadData()` / `aggregate()` / `applyFilters()` functions on the exact same CSV, so the report and the dashboard can never disagree with each other by construction. |
| `js/charts.js` | Shared chart renderers (a ranked bar list, an SVG line chart) used by all three pages. Both can show a small logo next to a bar's label or a line's legend entry when `js/logos.js` resolves one for that name. |
| `js/logos.js` | Looks up a manufacturer or team logo file for a given dataset value - manufacturer names match a logo slug directly, team logos go through an explicit owner-name -> team map since the dataset's `owner` column is usually a person's name (e.g. "Rick Hendrick") rather than the team brand. Used by `index.html` and `dashboard.html`; historic owners/manufacturers outside the current ~15-team, 8-make map simply get no logo, by design. |
| `data/race_results.csv` | **The dataset.** One row per driver per race, 1949&ndash;2025: 100,199 rows, 22 columns. This is what `dashboard.html` and `index.html` load and compute from in the browser. |
| `data/tracks.json` | One row per physical track (181 of them, after merging tracks that changed name/URL across eras), with geocoded coordinates and full race history. Used only by `map.html`. |
| `data/us-states-10m.json` | US state boundaries (TopoJSON, from the public `us-atlas` package) used to draw the base map on `map.html`. |
| `data/countries-110m.json` | World country boundaries (TopoJSON, from the public `world-atlas` package); `map.html` draws just Canada and Mexico from it, since both have hosted Cup races. |
| `data/NASCAR_Cup_Series_Stats.xlsx` | The raw scraped source workbook (season-by-season schedules, full race results, qualifying, track list) that `scripts/prepare_data.js` reads to build `race_results.csv`. |
| `scripts/prepare_data.js` | Reads the raw workbook and writes `data/race_results.csv`. Run with `node scripts/prepare_data.js`. |
| `scripts/compute_findings.js` | A verification script (not used by the site itself) that independently recomputes every number quoted in the report's eight findings, so they can be checked against `race_results.csv` directly. Run with `node scripts/compute_findings.js`. |
| `vendor/d3.min.js`, `vendor/topojson.min.js` | Third-party libraries used only by `map.html`, to draw the projected US map and convert the TopoJSON basemap to drawable paths. |
| `vendor/papaparse.min.js` | Third-party CSV parser used by `js/data.js` to load `race_results.csv` in the browser. |
| `js/theme.js` | Shared light/dark toggle, used by all three pages and persisted in `localStorage`. |
| `js/ticker.js` | The points-standings ticker, shown on the report page only, built around a small `showStandings()` / `showRanked()` / `showTimeline()` API so `index.html`'s own script can swap its content as the reader scrolls (see above). Reads `data/current_standings.json` and `data/current_lineup.json` for the default standings view - each driver shows their actual car-number badge and current team, so the ticker is pinned to fixed light colors in both site themes (the badge art is painted for a white background, like NASCAR's own spotter's-guide graphics) rather than following the page's dark/light toggle. Scrolling the ticker tape no longer pauses on hover. |
| `data/current_standings.json` | A hand-captured snapshot of the current (2026, mid-season) NASCAR Cup Series points standings &mdash; the 36 chartered drivers only (the handful of part-time/open entries below them are excluded), from [nascar.com/standings](https://www.nascar.com/standings/nascar-cup-series/). This is a static snapshot, not a live feed: GitHub Pages has no backend to poll NASCAR.com, so the ticker shows the "as of" race it was captured at rather than updating itself. |
| `data/current_lineup.json` | The most recent race weekend's car number and team per driver, hand-captured from a NASCAR.com spotter's-guide graphic. Matched to `current_standings.json` by driver name in `js/ticker.js`; a driver in the standings but not in this lineup (a one-off substitute, say) just shows no car badge. |
| `data/logos/cars/` | Official NASCAR car-number badge images (PNG, one per car number in the current lineup), downloaded from NASCAR's own CDN ahead of time since GitHub Pages can't proxy a live request to it. |
| `data/logos/manufacturers/`, `data/logos/teams/` | Logo PNGs for the 8 manufacturers and 15 team organizations `js/logos.js` knows how to match, sourced from Wikipedia/Wikimedia Commons (each folder's `manifest.json` records where every file came from). SVG originals were rasterized to PNG so they render regardless of a web server's configured mime type for `.svg` (raster formats are browser-sniffed into an `<img>` regardless of the declared content type; SVG isn't, for security reasons). |
| `data/logos/history/` | Six historic NASCAR logo marks (1948 through today) plus the 1980s Winston Cup Series logo and the current Daytona 500 event logo, woven into the tiled background pattern alongside 28 track outlines (see `scripts/generate_background_pattern.js`). |
| `scripts/crop_history_logos.js` | The one-off script that produced `data/logos/history/` - crops, trims, and makes near-white pixels transparent. Needs the original composite reference images (not committed) to re-run; the committed PNGs are the source of truth. |
| `data/track_shapes.json` | Real outline geometry for 39 tracks, traced directly from the official track-layout diagrams on [Wikipedia's "List of NASCAR tracks"](https://en.wikipedia.org/wiki/List_of_NASCAR_tracks) (so Daytona and Talladega show their actual tri-oval shape, Darlington its real egg shape, Indianapolis its real near-rectangle, and so on). For each diagram, the largest *visible* path was taken as the track outline, measured with a real browser's SVG engine rather than hand-parsed, and spot-checked against a rendered preview. Three tracks (Chicago Street Course, Road America, Auto Club Speedway) use a small hand-traced fallback shape instead, since that heuristic picked the diagram's background art rather than the track line for those three specific files. `map.html` shows a shape in the detail panel when you click a track that has one; most of the 181 tracks don't, by design. |
| `scripts/download_track_svgs.js` | Downloads the 39 source SVGs listed above from Wikimedia Commons. This is the reproducible half of how `track_shapes.json` was built; the shape-extraction half was an interactive, browser-assisted process (see the comment at the top of the script) rather than a single command - the committed `track_shapes.json` is the source of truth. Run with `node scripts/download_track_svgs.js`. |
| `scripts/generate_background_pattern.js` | Generates the tiling background pattern (overlapping, unlabeled track outlines plus a handful of historic NASCAR logo marks from `data/logos/history/`, each normalized to a common size before placement) baked into `css/styles.css` as the `--bg-pattern` custom property, used behind the report and dashboard pages. Run with `node scripts/generate_background_pattern.js`. |
| `package.json` | Declares the one dependency (`xlsx`) used by `scripts/prepare_data.js`. Not needed to view the site, only to regenerate the dataset. |

## Where the data comes from

[racing-reference.info](https://www.racing-reference.info/), a public NASCAR statistics archive. The site
blocks ordinary scripted requests, so the raw workbook (`data/NASCAR_Cup_Series_Stats.xlsx`) was collected
through a real browser session, one page at a time, across every NASCAR Cup Series season from 1949 through
2025 (the in-progress 2026 season is excluded, since it has no results yet). `scripts/prepare_data.js` turns
that workbook into the single clean dataset, `data/race_results.csv`, that every page on the site loads.

One row in `race_results.csv` is one driver's result in one race &mdash; for example, "Kyle Larson's run in
the 2024 Daytona 500" is a single row. Full methodology, including exactly how every rate, average, and
race-level figure in the report is computed, is documented in the closing section of `index.html` itself.

## Running it locally

Everything is static files; no build step or server-side code. Because the pages `fetch()` the data files,
opening `index.html` directly from disk (a `file://` URL) will fail in most browsers &mdash; serve the
folder over HTTP instead, for example:

```
npx serve .
```

then open the printed `localhost` URL.

## Regenerating the dataset

```
npm install
node scripts/prepare_data.js
node scripts/compute_findings.js   # optional - prints every report number for verification
```
