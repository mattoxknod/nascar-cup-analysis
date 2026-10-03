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

  // The car number each driver is most identified with for the bulk of
  // their career wins - researched per driver (Wikipedia infoboxes and
  // win-by-number breakdowns where available), not guessed. A few greats
  // ran two numbers roughly evenly across their career (Junior Johnson,
  // Jim Paschal) and are left out entirely rather than showing a number
  // that's arguably wrong; David Pearson and Tony Stewart are genuine
  // multi-number careers too, but each has one number clearly tied to their
  // signature wins (his Daytona 500s for Pearson, his Gibbs-era wins for
  // Stewart), so that one is used.
  const DRIVER_NUMBER = {
    'Richard Petty': '43', 'David Pearson': '21', 'Jeff Gordon': '24',
    'Bobby Allison': '12', 'Darrell Waltrip': '11', 'Cale Yarborough': '11',
    'Jimmie Johnson': '48', 'Dale Earnhardt': '3', 'Kyle Busch': '18',
    'Denny Hamlin': '11', 'Kevin Harvick': '4', 'Rusty Wallace': '2',
    'Lee Petty': '42', 'Ned Jarrett': '11', 'Tony Stewart': '20',
    'Herb Thomas': '92', 'Buck Baker': '87', 'Bill Elliott': '9',
    'Mark Martin': '6', 'Tim Flock': '300', 'Matt Kenseth': '17',
    'Joey Logano': '22', 'Bobby Isaac': '71', 'Brad Keselowski': '2',
    'Kurt Busch': '41', 'Martin Truex Jr': '19', 'Fireball Roberts': '22',
    'Kyle Larson': '5', 'Dale Jarrett': '88', 'Rex White': '4',
    'Carl Edwards': '99', 'Fred Lorenzen': '28', 'Dale Earnhardt, Jr.': '88',
    'Joe Weatherly': '8', 'Ricky Rudd': '5', 'Terry Labonte': '5',
    'Chase Elliott': '9', 'Jack Smith': '47'
  };

  // NASCAR's own car-number badge art (data/logos/cars/, downloaded ahead
  // of time) is the realest "number font" available - not a generic
  // typeface, the actual team-styled numeral graphic - but it only exists
  // for numbers NASCAR's current badge system recognizes. A driver whose
  // number isn't in that set (an old 3-digit number like Tim Flock's 300,
  // say) falls back to styled text in the caller rather than a missing image.
  const CAR_BADGE_NUMBERS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '16', '17',
    '18', '19', '20', '21', '22', '23', '24', '28', '33', '34', '35', '38',
    '41', '42', '43', '45', '47', '48', '51', '54', '60', '71', '77', '87',
    '88', '97', '99'
  ];

  function driverNumber(name) {
    return DRIVER_NUMBER[name] || null;
  }

  function driverNumberBadge(name) {
    const num = driverNumber(name);
    if (!num || !CAR_BADGE_NUMBERS.includes(num)) return null;
    return 'data/logos/cars/' + num + '.png';
  }

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

  return { manufacturerLogo, teamLogo, logoForCategory, driverNumber, driverNumberBadge };
})();
