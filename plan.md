# BC Marine Weather & Tides — Project Plan

**Goal:** Build a React Native mobile app showing BC coastal marine weather, tides, and alerts using DFO, Stormglass, and Environment Canada data sources.

**Tech Stack:** Expo, React Native, React Navigation, Axios, AsyncStorage, react-native-svg

**Timeline:** ~May 9 to May 26, 2026

**Design spec:** `2026-05-09-bc-marine-weather-design.md`

---

## File Structure

```text
/
├── App.js                          # Root — navigation setup
├── app.json                        # Expo config
├── plan.md                         # This file
├── src/
│   ├── context/
│   │   └── AppContext.js           # Global state: location, data, loading, errors
│   ├── services/
│   │   ├── cache.js                # In-memory cache with 30-min expiry
│   │   ├── dfoService.js           # DFO IWLS API — tide heights & times
│   │   ├── stormglassService.js    # Stormglass API — wind, waves, currents
│   │   └── ecService.js            # Environment Canada — warnings, forecast text
│   ├── utils/
│   │   ├── units.js                # metresToFeet(), formatTime(), timeSince(), getSunMoon(), findNearestStation()
│   │   └── constants.js            # Colors, BC station list, API base URLs
│   ├── components/
│   │   ├── WarningBanner.js        # Orange EC alert strip
│   │   ├── CardWrapper.js          # Reusable dashboard card container
│   │   ├── LocationCard.js         # Saved location row (Alert/Wind/Waves/Tide)
│   │   └── TideCurve.js            # SVG tide chart for Tide Detail screen
│   └── screens/
│       ├── DashboardScreen.js      # Home tab — all cards stacked
│       ├── TideDetailScreen.js     # Full tide chart + table + 7-day
│       ├── WeatherDetailScreen.js  # Compass rose + hourly table + wave chart
│       ├── CurrentsDetailScreen.js # Currents speed/direction/phase + hourly
│       └── LocationsScreen.js      # Search + saved favourites + accordion regions
```

---

## Phase 1 — Project Setup & Navigation Skeleton

**Week 1, Days 1–2 · Est. 3–4 hours**
*Goal: Working app on your phone with all screens stubbed out and navigation functional.*

### Task 1.1 — Initialize Expo Project

- [x] Initialize Expo project with blank template
- [x] Confirm default app loads in Expo Go on your phone
- [x] Install all project dependencies (React Navigation, Axios, AsyncStorage, react-native-svg, suncalc)
- [x] Commit

### Task 1.2 — Theme Constants

- [x] Create `src/utils/constants.js` with COLORS, BC_REGIONS (all 5 regions + EC sub-areas + stations), BC_STATIONS flat list, and API base URLs
- [x] Commit

### Task 1.3 — Unit Utilities

- [x] Create `src/utils/units.js` with `metresToFeet()`, `formatTime()`, `timeSince()`, and `getSunMoon()`
- [x] Commit

### Task 1.4 — Navigation & Stub Screens

- [x] Create stub screen files for: DashboardScreen, TideDetailScreen, WeatherDetailScreen, CurrentsDetailScreen, LocationsScreen
- [x] Set up `App.js` with 2-tab bottom navigation (Home · Locations) and stack navigator for drill-down screens
- [x] Confirm 2 tabs appear and navigation works on your phone
- [x] Commit

---

## Phase 2 — AppContext & Data Services

**Week 1, Days 3–5 · Est. 4–5 hours**
*Goal: All three data sources fetching real data and flowing into global app state.*

### Task 2.1 — Cache Module

- [x] Create `src/services/cache.js` with get, set, and isFresh functions (30-minute expiry)
- [x] Commit

### Task 2.2 — DFO Tide Service

- [x] Create `src/services/dfoService.js` with `fetchTides()`, `fetchTideEvents()`, and `fetchWeeklyTides()`
- [x] Verify DFO station IDs against the live IWLS API for the stations in `constants.js`
- [x] Confirm tide data returns in metres and converts to feet correctly
- [x] Commit

### Task 2.3 — Stormglass Weather Service

- [x] Sign up at stormglass.io and get a free API key (50 calls/day)
- [x] Create `src/services/stormglassService.js` with `fetchWeather()` returning wind, waves, swell, currents, visibility, water temp
- [x] Confirm data returns with correct units (kts, ft, km, °C)
- [x] Commit

### Task 2.4 — Environment Canada Marine Alerts Service

- [x] Create `src/services/ecService.js` with `fetchMarineForecast()` returning warnings array and forecast text
- [x] Confirm EC RSS/XML parses correctly using fast-xml-parser
- [x] Commit

### Task 2.5 — AppContext

- [x] Create `src/context/AppContext.js` with all shared state: activeStation, savedStations, tides, tideEvents, weeklyTides, weather, marineForecast, loading, error, lastUpdated, refresh
- [x] Wrap `App.js` with the AppContext provider
- [x] Confirm data loads for default station on app open
- [x] Commit

---

## Phase 3 — Dashboard Screen

**Week 2, Days 1–2 · Est. 3–4 hours**
*Goal: Full Dashboard showing all live data cards for the active location.*

### Task 3.1 — Shared Card Component

- [ ] Create `src/components/CardWrapper.js` — reusable styled card container used by all dashboard cards
- [ ] Commit

### Task 3.2 — Warning Banner Component

- [ ] Create `src/components/WarningBanner.js` — orange EC alert strip, hidden when no active warnings
- [ ] Commit

### Task 3.3 — Full Dashboard Screen

- [ ] Replace `DashboardScreen.js` stub with full implementation showing: location header (with sunrise/sunset/moon phase), warning banner, EC forecast card, Wind & Weather card, Tides card, Tidal Currents card
- [ ] Confirm pull-to-refresh works
- [ ] Confirm each card is tappable and navigates to the correct detail screen
- [ ] Commit

---

## Phase 4 — Tide Detail & Weather Detail Screens

**Week 2, Days 3–5 · Est. 4–5 hours**
*Goal: Full drill-down detail screens for tides and weather.*

### Task 4.1 — TideCurve SVG Component

- [ ] Create `src/components/TideCurve.js` — SVG sine wave tide chart with current position marker and high/low labels
- [ ] Commit

### Task 4.2 — Tide Detail Screen

- [ ] Replace `TideDetailScreen.js` stub with full implementation showing: current height (ft), next event countdown, SVG tide curve, today's tide table, 7-day max tide bar chart
- [ ] Confirm all values display in feet
- [ ] Commit

### Task 4.3 — Wind & Weather Detail Screen

- [ ] Replace `WeatherDetailScreen.js` stub with full implementation showing: compass rose, wind/gusts/waves/swell/visibility/water temp, hourly breakdown table, wave height trend chart
- [ ] Confirm wind in kts, waves in ft, visibility in km, temp in °C
- [ ] Commit

---

## Phase 5 — Locations & Currents Screens

**Week 3, Days 1–3 · Est. 4–5 hours**
*Goal: Fully functional Locations browser and Currents detail screen.*

### Task 5.1 — LocationCard Component

- [ ] Create `src/components/LocationCard.js` — saved location card showing Alert / Wind / Waves / Tide summary with active station indicator
- [ ] Commit

### Task 5.2 — Locations Screen

- [ ] Replace `LocationsScreen.js` stub with full implementation: search bar, saved favourites with LocationCards, accordion region browser (all 5 regions → EC sub-areas → station name rows)
- [ ] Confirm tapping a station sets it as active and opens the Dashboard with full conditions
- [ ] Confirm accordion expand/collapse works for all regions
- [ ] Commit

### Task 5.3 — Currents Detail Screen

- [ ] Replace `CurrentsDetailScreen.js` stub with full implementation showing: current speed (kts), direction, flooding/ebbing phase, hourly breakdown table
- [ ] Commit

### Task 5.4 — GPS: Use My Location

- [ ] Add `expo-location` to the install command (already included in Task 1.1)
- [ ] Add `findNearestStation()` utility to `src/utils/units.js`
- [ ] Add "Use My Location" button to `LocationsScreen.js` that requests GPS permission, gets current coordinates, finds the nearest BC station, and opens the Dashboard for it
- [ ] Confirm permission prompt appears on first tap and nearest station loads correctly
- [ ] Commit

---

## Phase 6 — Polish & Submission

**Week 3, Days 4–5 · Est. 2–3 hours**
*Goal: Clean up edge cases, secure API key, write README, submit.*

### Task 6.1 — Error States & Loading Indicators

- [ ] Confirm loading spinner shows on Dashboard while data fetches
- [ ] Add no-data guard to each detail screen (graceful fallback message)
- [ ] Test with network off to confirm error states display correctly
- [ ] Commit

### Task 6.2 — .gitignore & API Key Safety

- [ ] Create `.gitignore` excluding `node_modules/`, `.env`, build folders
- [ ] Move Stormglass API key to a `.env` file and load via `expo-constants` or `process.env`
- [ ] Confirm `.env` is not tracked by git
- [ ] Commit

### Task 6.3 — README

- [ ] Write `README.md` with: project description, setup instructions, API key setup, how to run, features list, data sources, screenshots
- [ ] Commit

### Task 6.4 — Final Testing Checklist

- [ ] Tides load and display in feet for multiple stations
- [ ] Wind and waves display in kts and ft
- [ ] EC warnings appear when active, banner hides when none
- [ ] Accordion regions all expand and show correct stations
- [ ] Tapping a station loads full Dashboard conditions
- [ ] Saved favourites persist after closing and reopening the app
- [ ] Pull-to-refresh fetches new data
- [ ] App works with no network (shows error state, not crash)
- [ ] Commit and push to GitHub
