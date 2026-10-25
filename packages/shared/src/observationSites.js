import { toStationSlug } from './stations.js';

// Live marine observation sites near the BC coast. Checked on 2026-10-25: each
// lighthouse/headland station had a wind reading within 3 hours, and each buoy a
// NOAA report within 6 hours. sourceId is the EC msc_id (lighthouses) or the
// NOAA/WMO buoy number (buoys).
const SITES = [
  // Lighthouse and headland weather stations (Environment Canada)
  { name: 'Race Rocks', type: 'lighthouse', lat: 48.298, lon: -123.5314, sourceId: '1016640' },
  {
    name: 'Discovery Island',
    type: 'lighthouse',
    lat: 48.4246,
    lon: -123.2258,
    sourceId: '1012475',
  },
  {
    name: 'Entrance Island',
    type: 'lighthouse',
    lat: 49.2087,
    lon: -123.8105,
    sourceId: '1022689',
  },
  {
    name: 'Ballenas Island',
    type: 'lighthouse',
    lat: 49.3506,
    lon: -124.1605,
    sourceId: '1020590',
  },
  { name: 'Sisters Island', type: 'lighthouse', lat: 49.4864, lon: -124.4349, sourceId: '1027403' },
  { name: 'Pam Rocks', type: 'lighthouse', lat: 49.4878, lon: -123.2995, sourceId: '10459NN' },
  { name: 'Point Atkinson', type: 'lighthouse', lat: 49.3304, lon: -123.2647, sourceId: '1106200' },
  { name: 'Sandheads', type: 'lighthouse', lat: 49.1059, lon: -123.3034, sourceId: '1107010' },
  { name: 'Grief Point', type: 'lighthouse', lat: 49.8004, lon: -124.5188, sourceId: '1043304' },
  { name: 'Kelp Reefs', type: 'lighthouse', lat: 48.5476, lon: -123.2369, sourceId: '1013998' },
  { name: 'Estevan Point', type: 'lighthouse', lat: 49.3832, lon: -126.5447, sourceId: '1032731' },
  {
    name: 'Solander Island',
    type: 'lighthouse',
    lat: 50.1115,
    lon: -127.9403,
    sourceId: '1037553',
  },
  { name: 'Sartine Island', type: 'lighthouse', lat: 50.8194, lon: -128.9062, sourceId: '1037090' },
  { name: 'Cape St. James', type: 'lighthouse', lat: 51.9358, lon: -131.0158, sourceId: '1051351' },
  { name: 'Bonilla Island', type: 'lighthouse', lat: 53.4925, lon: -130.6372, sourceId: '1060R0K' },
  { name: 'Lucy Island', type: 'lighthouse', lat: 54.2959, lon: -130.6086, sourceId: '1064728' },
  { name: 'Holland Rock', type: 'lighthouse', lat: 54.1723, lon: -130.361, sourceId: '1063496' },
  { name: 'Grey Islet', type: 'lighthouse', lat: 54.5803, lon: -130.6978, sourceId: '1063303' },
  { name: 'Herbert Island', type: 'lighthouse', lat: 50.9399, lon: -127.6322, sourceId: '1063461' },
  {
    name: 'Cathedral Point',
    type: 'lighthouse',
    lat: 52.1875,
    lon: -127.4711,
    sourceId: '1061458',
  },
  { name: 'Kindakun Rocks', type: 'lighthouse', lat: 53.3156, lon: -132.772, sourceId: '1054222' },
  { name: 'Rose Spit', type: 'lighthouse', lat: 54.1591, lon: -131.6613, sourceId: '1056869' },
  { name: 'Fanny Island', type: 'lighthouse', lat: 50.4535, lon: -125.9929, sourceId: '1022795' },
  {
    name: 'Cumshewa Island',
    type: 'lighthouse',
    lat: 53.0303,
    lon: -131.6014,
    sourceId: '1062251',
  },
  { name: 'Saturna Island', type: 'lighthouse', lat: 48.7832, lon: -123.0458, sourceId: '1017101' },
  // Ocean buoys (Environment Canada buoys, published by NOAA NDBC)
  { name: 'Central Dixon Entrance', type: 'buoy', lat: 54.3667, lon: -132.4439, sourceId: '46145' },
  { name: 'East Dellwood', type: 'buoy', lat: 50.8742, lon: -129.9158, sourceId: '46207' },
  { name: 'Halibut Bank', type: 'buoy', lat: 49.34, lon: -123.7267, sourceId: '46146' },
  { name: 'La Perouse Bank', type: 'buoy', lat: 48.835, lon: -125.9983, sourceId: '46206' },
  { name: 'North Hecate Strait', type: 'buoy', lat: 53.6167, lon: -131.105, sourceId: '46183' },
  { name: 'Middle Nomad', type: 'buoy', lat: 50.9305, lon: -136.0953, sourceId: '46004' },
  { name: 'Nanakwa Shoal', type: 'buoy', lat: 53.8333, lon: -128.8317, sourceId: '46181' },
  { name: 'North Nomad', type: 'buoy', lat: 53.915, lon: -138.8508, sourceId: '46184' },
  { name: 'Sentry Shoal', type: 'buoy', lat: 49.9067, lon: -124.9858, sourceId: '46131' },
  { name: 'South Hecate Strait', type: 'buoy', lat: 52.425, lon: -129.7917, sourceId: '46185' },
  { name: 'South Nomad', type: 'buoy', lat: 48.355, lon: -133.9383, sourceId: '46036' },
  { name: 'West Dixon Entrance', type: 'buoy', lat: 54.185, lon: -134.323, sourceId: '46205' },
  { name: 'West Moresby', type: 'buoy', lat: 52.515, lon: -132.6925, sourceId: '46208' },
  { name: 'West Sea Otter', type: 'buoy', lat: 51.3835, lon: -128.7668, sourceId: '46204' },
  { name: 'South Brooks', type: 'buoy', lat: 49.7383, lon: -127.9317, sourceId: '46132' },
];

// Each site also gets a URL-safe id from its name, e.g. 'race-rocks'
export const OBSERVATION_SITES = SITES.map(site => ({ id: toStationSlug(site.name), ...site }));
