# Reflection — BC Marine Weather & Tides

## Wins

- Built a working multi-screen React Native app pulling live data from three separate public APIs (DFO, Open-Meteo, Environment Canada).
- App stays usable when the network drops — existing data stays on screen instead of crashing or blanking out.
- Saved favourites persist across full app restarts via AsyncStorage.
- Pull-to-refresh, GPS "Use My Location", and graceful no-data fallbacks all work end-to-end.

## Struggles

- **DFO station IDs.** I started with 5-digit station codes and assumed they'd work with the IWLS API. They don't — the API needs MongoDB ObjectIDs. I had to query the live DFO endpoint to get the correct ID for every BC station.
- **Missing tide stations.** Several important coastal towns (Tofino, Ucluelet, Gold River, Bella Bella) aren't in the IWLS API at all. They're "secondary" prediction stations with no real-time sensors. I worked around this by mapping each one to its nearest verified station as a fallback.
- **Switching weather APIs mid-project.** I planned to use Stormglass but switched to Open-Meteo because it's free with no API key and no rate limit. Simpler setup, but I had to redo the weather service.
- **Partial data coverage.** Open-Meteo doesn't return wave or current data for sheltered BC inlets and fjords. Hiding the whole screen would have been worse than just showing `--` for missing fields, so I added graceful no-data fallbacks instead.
- **EC feed quirks.** Environment Canada's Strait of Georgia RSS feed bundles north-of-Nanaimo and south-of-Nanaimo entries in the same XML file. Vancouver and Comox were initially getting identical forecasts. Fixed by filtering entries by sub-area.
- **Scope adjustments.** I dropped the planned Map tab to keep things focused. The 2-tab layout (Home + Locations) ended up feeling cleaner anyway.

## What I Learned

- Always verify external API data structures before assuming defaults. I lost time early on assuming the API worked one way when it didn't.
- `Promise.allSettled` is the right tool when multiple independent fetches need to succeed or fail on their own without taking down the whole load.
- Graceful degradation matters more than I expected. Showing `--` for missing fields is almost always better than hiding the whole screen.
