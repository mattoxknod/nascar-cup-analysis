// Shared manufacturer/team logo lookup, used by index.html (report charts)
// and dashboard.html (breakdown charts + Compare Two). Manufacturer names in
// the dataset match the downloaded logo slugs directly; team logos are
// matched off the dataset's "owner" field, which is usually a person's name
// (e.g. "Rick Hendrick") rather than the org brand the logo is for, so that
// needs an explicit map. Historic owners/manufacturers outside this map
// simply get no logo - by design, since logos were only sourced for the
// current ~15 Cup Series team organizations and historically common makes.
window.NASCARLogos = (function () {
  "use strict";

  // All logos are PNG (SVGs were rasterized at download time) so <img> tags
  // render correctly regardless of the web server's configured mime types
  // for .svg - a static host that doesn't send image/svg+xml would silently
  // fail to render an <img src="*.svg">, since (unlike raster formats)
  // browsers don't content-sniff SVG into an <img> for security reasons.
  const MANUFACTURERS = ['chevrolet', 'toyota', 'ford', 'dodge', 'pontiac', 'buick', 'oldsmobile', 'plymouth'];
  const TEAM_SLUGS = [
    'hendrick-motorsports', 'team-penske', 'joe-gibbs-racing', 'trackhouse-racing',
    '23xi-racing', 'rfk-racing', 'richard-childress-racing', 'front-row-motorsports',
    'spire-motorsports', 'kaulig-racing', 'legacy-motor-club', 'wood-brothers-racing',
    'rick-ware-racing', 'hyak-motorsports', 'haas-factory-team'
  ];

  // dataset "owner" value -> team logo slug, for the current-era teams a
  // logo was sourced for. Owners not listed here (every earlier-era team,
  // and any owner name spelled differently than expected) just get no logo.
  const OWNER_TO_TEAM = {
    'Rick Hendrick': 'hendrick-motorsports',
    'Roger Penske': 'team-penske',
    'Joe Gibbs': 'joe-gibbs-racing',
    'Jack Roush': 'rfk-racing',
    'Richard Childress': 'richard-childress-racing',
    'Matthew Kaulig': 'kaulig-racing',
    'Rick Ware': 'rick-ware-racing',
    'Wood Brothers': 'wood-brothers-racing',
    'Gene Haas': 'haas-factory-team',
    'Bob Jenkins': 'front-row-motorsports',
    '23XI Racing': '23xi-racing',
    'Trackhouse Racing': 'trackhouse-racing',
    'Legacy Motor Club': 'legacy-motor-club',
    'Spire Motorsports': 'spire-motorsports',
    'HYAK Motorsports': 'hyak-motorsports'
  };

  function manufacturerLogo(name) {
    if (!name) return null;
    const slug = name.toLowerCase();
    if (!MANUFACTURERS.includes(slug)) return null;
    return 'data/logos/manufacturers/' + slug + '.png';
  }

  function teamLogo(ownerName) {
    if (!ownerName) return null;
    const slug = OWNER_TO_TEAM[ownerName];
    if (!slug || !TEAM_SLUGS.includes(slug)) return null;
    return 'data/logos/teams/' + slug + '.png';
  }

  // For a Compare Two / BREAKDOWNS category ('manufacturer' | 'owner' | ...)
  // and the entity name, return a logo URL if one is known.
  function logoForCategory(category, name) {
    if (category === 'manufacturer') return manufacturerLogo(name);
    if (category === 'owner') return teamLogo(name);
    return null;
  }

  return { manufacturerLogo, teamLogo, logoForCategory };
})();
