// Shared test data for the observations card and page
const MINUTE_MS = 60 * 1000;

export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * MINUTE_MS);
}

export const RACE_ROCKS = {
  site: { id: 'race-rocks', name: 'Race Rocks', type: 'lighthouse' },
  distanceKm: 18,
  reading: {
    observedAt: minutesAgo(1),
    windKts: 17,
    windDirDeg: 86,
    gustKts: 25,
    waveHeightFt: null,
    wavePeriodS: null,
    pressureHpa: 1007.5,
    airTempC: 11.3,
    waterTempC: null,
  },
};

export const HALIBUT_BANK = {
  site: { id: 'halibut-bank', name: 'Halibut Bank', type: 'buoy' },
  distanceKm: 24,
  reading: {
    observedAt: minutesAgo(40),
    windKts: 8,
    windDirDeg: 270,
    gustKts: 8,
    waveHeightFt: 1.3,
    wavePeriodS: 4,
    pressureHpa: 1014.5,
    airTempC: 10,
    waterTempC: 11.1,
  },
};

export const SILENT_SITE = {
  site: { id: 'kelp-reefs', name: 'Kelp Reefs', type: 'lighthouse' },
  distanceKm: 17,
  reading: null,
};

export const VICTORIA = {
  name: 'Victoria',
  region: 'Juan de Fuca Strait',
  coast: 'Juan de Fuca & South Coast',
};
