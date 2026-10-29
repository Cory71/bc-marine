import { getStationRegion } from '../stations.js';

// BC marine area → Environment Canada feed code (verified codes)
export const EC_FEED_CODES = {
  'Dixon Entrance East': '03300',
  'Dixon Entrance West': '03400',
  'Hecate Strait': '06200',
  'West Coast Haida Gwaii': '15200',
  'Queen Charlotte Sound': '12300',
  Bowie: '01500',
  'Douglas Channel': '03700',
  'Milbanke Sound': '02300',
  'Queen Charlotte Strait': '12400',
  'Johnstone Strait': '06800',
  'Georgia Strait North': '14300',
  'Georgia Strait South': '14300',
  'Howe Sound': '06400',
  'Quatsino Sound': '15300',
  'Nootka Sound': '15300',
  'Clayoquot Sound': '16200',
  'Barkley Sound': '16200',
  Explorer: '04800',
  'Juan de Fuca Strait': '07000',
  'Haro Strait': '06100',
  // EC's own area names, used for remote inlets far from any named place above
  'Central Coast from McInnes Island to Pine Island': '02300',
  'West Coast Vancouver Island North': '15300',
  'West Coast Vancouver Island South': '16200',
};

// Sub-area filter for regions that share a single EC feed with other sub-areas.
// EC's Strait of Georgia feed (14300) bundles both north and south entries in
// one XML file, so we match the entry title to pick the right one.
export const EC_SUBAREA = {
  'Georgia Strait North': 'north of nanaimo',
  'Georgia Strait South': 'south of nanaimo',
};

// Every part name EC uses when it splits a BC area. An entry naming none of these
// covers the whole area (EC does this when conditions are the same across it).
export const EC_PART_NAMES = [
  'northern half',
  'southern half',
  'eastern half',
  'western half',
  'northwestern half',
  'southeastern half',
  'east of langara',
  'west of langara',
  'east entrance',
  'central strait',
  'west entrance',
  'north of nanaimo',
  'south of nanaimo',
];

// The part of a split EC area a station is in: its own ecSubarea, else its area's
// (e.g. 'east entrance' of Juan de Fuca Strait). Undefined when the area isn't split.
export function getEcSubarea(station) {
  return station.ecSubarea ?? EC_SUBAREA[getStationRegion(station)];
}

// The parts whose warnings a station shows: its own part, plus any part it sits on
// the line with (ecAlsoWarnFor). An empty list means the area isn't split: show all.
export function getEcWarningSubareas(station) {
  const ownPart = getEcSubarea(station);
  return ownPart ? [ownPart, ...(station.ecAlsoWarnFor ?? [])] : [];
}

// Cache key for one area's forecast, or one part of it (plus any extra warning parts)
export function ecCacheKey(regionName, subArea, warningSubAreas = []) {
  const extraParts = warningSubAreas.filter(part => part !== subArea);
  const key = subArea ? `ec_${regionName}_${subArea}` : `ec_${regionName}`;
  return extraParts.length ? `${key}+${extraParts.join('+')}` : key;
}

const KNOWN_CODES = new Set(Object.values(EC_FEED_CODES));

// Only codes from our own list are allowed — the web proxy relies on this
export function isValidEcFeedCode(code) {
  return KNOWN_CODES.has(code);
}

// Direct EC feed URL (works on mobile; browsers need the web app's proxy)
export function buildDirectEcFeedUrl(code) {
  return `https://weather.gc.ca/rss/marine/${code}_e.xml`;
}
