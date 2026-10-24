// BC marine region → Environment Canada feed code (verified codes)
export const EC_FEED_CODES = {
  'Dixon Entrance': '03300',
  'Hecate Strait': '06200',
  'Queen Charlotte Sound': '12300',
  'Milbanke Sound': '02300',
  'Queen Charlotte Strait': '12400',
  'Johnstone Strait': '06800',
  'Georgia Strait North': '14300',
  'Georgia Strait South': '14300',
  'Howe Sound': '06400',
  'Nootka Sound': '15300',
  'Clayoquot Sound': '16200',
  'Barkley Sound': '16200',
  'Juan de Fuca Strait': '07000',
  'Saanich Inlet': '07000',
};

// Sub-area filter for regions that share a single EC feed with other sub-areas.
// EC's Strait of Georgia feed (14300) bundles both north and south entries in
// one XML file, so we match the entry title to pick the right one.
export const EC_SUBAREA = {
  'Georgia Strait North': 'north of nanaimo',
  'Georgia Strait South': 'south of nanaimo',
};

const KNOWN_CODES = new Set(Object.values(EC_FEED_CODES));

// Only codes from our own list are allowed — the web proxy relies on this
export function isValidEcFeedCode(code) {
  return KNOWN_CODES.has(code);
}

// Direct EC feed URL (works on mobile; browsers need the web app's proxy)
export function buildDirectEcFeedUrl(code) {
  return `https://weather.gc.ca/rss/marine/${code}_e.xml`;
}
