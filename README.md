# BC Marine

Live tides, wind, waves, currents and Environment Canada marine forecasts for the British Columbia coast, on the web and on your phone.

[![CI](https://github.com/Cory71/bc-marine/actions/workflows/ci.yml/badge.svg)](https://github.com/Cory71/bc-marine/actions/workflows/ci.yml)

**Live demo:** coming soon <!-- TODO: Vercel URL (Task 15) --> (no install, works on desktop and phone browsers)

## Screenshots

### Web (desktop)

![BC Marine web dashboard for Tofino, showing wind, waves, tide, currents and today's tide curve](docs/screenshots/web-dashboard.png)

### Web (phone browser)

<img src="docs/screenshots/web-mobile.png" alt="BC Marine tides view on a phone-sized screen" width="320" />

### Mobile app (Expo)

<!-- TODO: mobile screenshots from Cory -->

## Features

- **Dashboard**: wind, waves, visibility, tide, tidal currents and sun/moon for the active station, plus today's tide curve and the full EC marine forecast
- **Tides**: current height and trend, next high/low, today's curve, upcoming events and a 7-day max tide chart (all in feet)
- **Wind & Weather**: 16-point compass headings, wave height and period, swell, visibility and an 8-hour breakdown
- **Tidal Currents**: speed, direction and flooding/ebbing phase
- **Locations**: search by name or weather area, browse by EC marine region, save favourites, or use your location to find the nearest station
- **Marine warnings**: active EC gale and wind warnings shown at the top of every screen
- **Web extras**: shareable links (`/tides?station=tofino`), a desktop layout with a station sidebar, keyboard navigation and screen-reader labels

## Data Sources

| Source                                     | What it provides                               |
| ------------------------------------------ | ---------------------------------------------- |
| Fisheries and Oceans Canada (DFO IWLS API) | Tide heights, high/low events, 7-day forecast  |
| Open-Meteo Marine and Forecast APIs        | Wind, waves, swell, tidal currents, visibility |
| Environment Canada Atom feeds              | Marine warnings and text forecasts             |

No API keys are required. All three services are free and open.

## Architecture

One npm-workspaces monorepo with two apps and a shared package:

```text
bc-marine/
├── apps/
│   ├── mobile/        Expo / React Native app (iOS and Android)
│   └── web/           Vite + React single-page app, deployed on Vercel
│       └── api/       One serverless function: the Environment Canada feed proxy
└── packages/
    └── shared/        Plain-JS data layer used by both apps: API services,
                       caching, BC-time helpers, station list, reading helpers
```

- **Shared data layer:** both apps import the same services, so a fix to an API call or a unit conversion reaches web and mobile at once.
- **One small proxy:** DFO and Open-Meteo allow browser requests, but Environment Canada's feeds don't, so the web app fetches them through a tiny Vercel function that only accepts known feed codes.
- **BC time everywhere:** times are shown in Pacific time whatever the viewer's own time zone.

The design reasoning is in [docs/architecture.md](docs/architecture.md).

## Tech Stack

- **Shared:** JavaScript (ES modules) · Axios · fast-xml-parser · SunCalc
- **Web:** React 19 · Vite · React Router · hand-built SVG charts and CSS (no UI or chart libraries) · Vercel Functions
- **Mobile:** Expo SDK 57 · React Native · React Navigation · AsyncStorage · react-native-svg · expo-location
- **Quality:** Vitest · Testing Library · ESLint · Prettier · GitHub Actions · Lighthouse (desktop: Performance 98+, Accessibility 100)

## Running Locally

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
git clone https://github.com/Cory71/bc-marine.git
cd bc-marine
npm install                              # installs every workspace

npm run dev --workspace bc-marine-web    # web app at http://localhost:5173
npm start --workspace bc-marine-mobile   # mobile app: scan the QR code with Expo Go
```

See [apps/web/README.md](apps/web/README.md) and [apps/mobile/README.md](apps/mobile/README.md) for more.

## Testing and CI

```bash
npm test        # Vitest: shared package and web app
npm run lint    # ESLint
```

Tests cover unit conversions, BC-time and daylight-saving edge cases, EC feed parsing (Atom, RSS and shared-feed sub-areas), cache expiry, partial API failures, the proxy's allowlist, the web data context and the tide chart. GitHub Actions runs lint, tests, the web build and a mobile bundle check on every push and pull request.

## Known Limitations

- **Shared tide station IDs:** several stations in the station list use another station's DFO ID (for example, Sandspit uses Prince Rupert's), so they show that station's tides. The web app identifies stations by name to keep saving and links correct.
- **Tidal currents:** Open-Meteo has no current data for fjords, inlets and many sheltered waters, so stations like Gold River show a "no data" message.
- **BC's permanent UTC−7:** BC stops changing its clocks on November 1, 2026. Devices with older time zone data may show times one hour off after that date. See [docs/architecture.md](docs/architecture.md#bc-time).

## How This Was Built

I designed BC Marine and wrote the design spec and the step-by-step build plan, including the key decisions: one shared data package, Vercel for hosting, JavaScript over TypeScript, BC time handled in shared code, and an allowlisted proxy for Environment Canada. The plan was carried out task by task with an AI coding assistant (Claude Code), with tests written before each feature, every change checked in a real browser or on a phone, and CI on every push. I reviewed each step and own the design, the decisions and the result.

## Project Planning

Development tracked on the [BC Marine project board](https://github.com/users/Cory71/projects/5).
