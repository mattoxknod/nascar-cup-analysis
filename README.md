# NASCAR Cup Series Analysis

A data website built around every NASCAR Cup Series race from 1949 through 2025: 2,822 races, 100,199
driver-race entries, 206 different winners. Built for a Financial Data Analytics course project.

**Live site:** https://mattoxknod.github.io/nascar-cup-analysis/
**Report:** `index.html` &middot; **Dashboard:** `dashboard.html` &middot; **Bonus track map:** `map.html`

## What's in this repository

| File / folder | What it does |
|---|---|
| `index.html` | The report page. Title, summary, four headline numbers, eight findings (each with a chart and the numbers behind it), and a closing section documenting the data and every calculation. |
| `dashboard.html` | The interactive dashboard. Filters the full dataset by season, driver, manufacturer, track, surface, and finish status; shows five summary numbers, four independently configurable charts (each with a measure switch and a breakdown switch), a sortable data table, and a reset-all-filters button. |
| `map.html` | A bonus page (not required by the assignment) with an interactive, zoomable US map pinning every one of the 181 tracks that have hosted a Cup race, each clickable for its full race history. |
| `css/styles.css` | One shared stylesheet for all three pages &mdash; palette, type, nav bar, and every component. |
| `js/data.js` | Shared data-loading and aggregation module. Both `index.html` and `dashboard.html` call the exact same `loadData()` / `aggregate()` / `applyFilters()` functions on the exact same CSV, so the report and the dashboard can never disagree with each other by construction. |
| `js/charts.js` | Shared chart renderers (a ranked bar list, an SVG line chart) used by all three pages. |
| `data/race_results.csv` | **The dataset.** One row per driver per race, 1949&ndash;2025: 100,199 rows, 22 columns. This is what `dashboard.html` and `index.html` load and compute from in the browser. |
| `data/tracks.json` | One row per physical track (181 of them, after merging tracks that changed name/URL across eras), with geocoded coordinates and full race history. Used only by `map.html`. |
| `data/us-states-10m.json` | US state boundaries (TopoJSON, from the public `us-atlas` package) used to draw the base map on `map.html`. |
| `data/NASCAR_Cup_Series_Stats.xlsx` | The raw scraped source workbook (season-by-season schedules, full race results, qualifying, track list) that `scripts/prepare_data.js` reads to build `race_results.csv`. |
| `scripts/prepare_data.js` | Reads the raw workbook and writes `data/race_results.csv`. Run with `node scripts/prepare_data.js`. |
| `scripts/compute_findings.js` | A verification script (not used by the site itself) that independently recomputes every number quoted in the report's eight findings, so they can be checked against `race_results.csv` directly. Run with `node scripts/compute_findings.js`. |
| `vendor/d3.min.js`, `vendor/topojson.min.js` | Third-party libraries used only by `map.html`, to draw the projected US map and convert the TopoJSON basemap to drawable paths. |
| `vendor/papaparse.min.js` | Third-party CSV parser used by `js/data.js` to load `race_results.csv` in the browser. |
| `js/theme.js` | Shared light/dark toggle, used by all three pages and persisted in `localStorage`. |
| `data/track_shapes.json` | Real outline geometry for 39 tracks, traced directly from the official track-layout diagrams on [Wikipedia's "List of NASCAR tracks"](https://en.wikipedia.org/wiki/List_of_NASCAR_tracks) (so Daytona and Talladega show their actual tri-oval shape, Darlington its real egg shape, Indianapolis its real near-rectangle, and so on). For each diagram, the largest *visible* path was taken as the track outline, measured with a real browser's SVG engine rather than hand-parsed, and spot-checked against a rendered preview. Three tracks (Chicago Street Course, Road America, Auto Club Speedway) use a small hand-traced fallback shape instead, since that heuristic picked the diagram's background art rather than the track line for those three specific files. `map.html` shows a shape in the detail panel when you click a track that has one; most of the 181 tracks don't, by design. |
| `scripts/download_track_svgs.js` | Downloads the 39 source SVGs listed above from Wikimedia Commons. This is the reproducible half of how `track_shapes.json` was built; the shape-extraction half was an interactive, browser-assisted process (see the comment at the top of the script) rather than a single command - the committed `track_shapes.json` is the source of truth. Run with `node scripts/download_track_svgs.js`. |
| `scripts/generate_background_pattern.js` | Generates the tiling background pattern (overlapping, unlabeled track outlines, each normalized to a common size before placement) baked into `css/styles.css` as the `--bg-pattern` custom property, used behind the report and dashboard pages. Run with `node scripts/generate_background_pattern.js`. |
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
