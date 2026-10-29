import { BC_STATIONS, BC_COMMUNITIES, DEFAULT_STATION_NAME } from './constants.js';
import { EXTRA_TIDE_STATIONS } from './extraTideStations.js';

// Every place a user can pick: tide stations, nearby communities, and more DFO tide
// stations (harbours and bays) that are found by search
export const ALL_LOCATIONS = [...BC_STATIONS, ...BC_COMMUNITIES, ...EXTRA_TIDE_STATIONS];

// Turn a station name into a URL-safe slug: 'Port McNeill' → 'port-mcneill'.
// Station ids aren't unique, so names (and their slugs) identify stations.
export function toStationSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // each run of spaces/symbols becomes one dash
    .replace(/^-+|-+$/g, ''); // trim dashes from both ends
}

// Find a station or community by its slug
export function findStationBySlug(slug) {
  return ALL_LOCATIONS.find(location => toStationSlug(location.name) === slug);
}

// The station shown before the user picks one
export function getDefaultStation() {
  return BC_STATIONS.find(station => station.name === DEFAULT_STATION_NAME) ?? BC_STATIONS[0];
}

// Region may be missing on older saved stations — look it up by id if so
export function getStationRegion(station) {
  return station.region ?? BC_STATIONS.find(s => s.id === station.id)?.region;
}

// What the tide card says when there are no tides to show
export function noTidesMessage(station) {
  return station?.offshore
    ? 'No tide station out here: this is an offshore forecast area.'
    : 'No tide data available for this station.';
}
