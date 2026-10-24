# BC Marine: Architecture Notes

Design notes for the BC Marine monorepo: how the pieces fit, and why they're built this way.

## Overview

```text
bc-marine/
├── apps/
│   ├── mobile/                 Expo / React Native app
│   └── web/                    Vite + React SPA
│       ├── api/ec-feed.js      Vercel function (Environment Canada proxy)
│       └── server/             Proxy logic shared by the function and local servers
└── packages/
    └── shared/                 @bc-marine/shared: plain-JS data layer
```

The repo is an npm-workspaces monorepo. Both apps depend on `@bc-marine/shared`, which has no build step (its `exports` point straight at `src/index.js`), so both bundlers consume the source directly. React is pinned to one exact version across the workspace so npm never installs two copies.

## What lives in shared, and why

`packages/shared` holds everything that isn't UI:

| Module                                | Purpose                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `services/dfoService.js`              | DFO tide heights, high/low events, 7-day maximums                          |
| `services/weatherService.js`          | Open-Meteo wind, waves, swell, visibility and currents                     |
| `services/ecService.js`, `ecFeeds.js` | EC feed codes, configurable feed URL, Atom/RSS parsing                     |
| `services/cache.js`                   | In-memory 30-minute cache                                                  |
| `loadStationData.js`                  | Loads all five data sets for a station; never throws                       |
| `bcTime.js`                           | Pacific-time date ranges and formatting                                    |
| `readings.js`                         | "Right now" helpers: closest reading, next tide, flood/ebb, upcoming hours |
| `stations.js`, `constants.js`         | Station list, URL slugs, default station                                   |
| `units.js`                            | Unit conversion, compass labels, sun/moon, nearest station                 |

The rule is that shared code never imports React, React Native, Expo or browser globals. That keeps it usable by the mobile app, the web app and the Node-based proxy, and testable in plain Node. A fix to an API call or a unit conversion reaches both apps at once.

### Partial failure and progressive loading

`loadStationData` uses `Promise.allSettled`, so one slow or broken API doesn't take down the others. It returns each data set or `null`, plus a list of the sources that failed. Both apps keep the previous data on screen for a failed source.

It also takes an optional `onData(key, value)` callback that fires as each source arrives. The web app uses it so every panel follows its own source: a placeholder while loading, the data as soon as it lands, or an inline error if that source failed. The dashboard fills in card by card instead of waiting for the slowest API (the 7-day tide outlook is seven requests), and switching stations never shows the previous station's numbers. For example, if Environment Canada is down, only the forecast panel says "Forecast unavailable".

### Adding a data layer

Data sources are listed in one table, `DATA_SOURCES` in `loadStationData.js`. To add a layer (for example, water temperature or buoy observations):

1. Write a fetch function in `packages/shared/src/services/` using `getJson` or `getText` from `http.js` (timeouts and HTTP errors are handled there), and cache it with `getCache`/`setCache`.
2. Add `{ key, load }` to `DATA_SOURCES`. Both apps now receive it from `loadStationData`.
3. On the web, add the key and its empty value to `EMPTY_DATA` in `AppContext.jsx`, then wrap the panel in `<SourceContent source="yourKey">` to get the loading, ready and error states for free.
4. Add a forced-refresh cache key in `clearStationCache` and a test alongside the other service tests.

## The Environment Canada proxy

The three data sources behave differently in a browser:

| Source                            | CORS header                      | Browser can call it directly? |
| --------------------------------- | -------------------------------- | ----------------------------- |
| DFO IWLS API                      | `access-control-allow-origin: *` | Yes                           |
| Open-Meteo                        | `access-control-allow-origin: *` | Yes                           |
| Environment Canada RSS/Atom feeds | none                             | No                            |

The mobile app isn't subject to CORS, so it fetches EC feeds directly. The web app calls `configureEcFeedUrl()` once at start-up so the shared service builds `/api/ec-feed?code=06400` instead of the EC URL. That endpoint is a small Vercel function that fetches the feed server-side and returns the XML.

**Why an allowlist.** A proxy that fetches whatever URL it's given is an open relay that anyone could abuse. This one only accepts a feed **code**, and only codes from the app's own list (`isValidEcFeedCode`). Anything else gets `400 Unknown feed code` without any outbound request. EC failures map to `502`.

**Caching.** Successful responses carry `Cache-Control: s-maxage=1800, stale-while-revalidate=600`, so Vercel's CDN serves each feed for 30 minutes (matching the app's own cache) and most visitors never trigger a function call.

The handler (`server/ecFeedHandler.js`) is a pure function that takes a code and a `fetch` implementation and returns `{ status, headers, body }`. The Vercel function, the Vite dev server and `vite preview` all wrap that same function, so local development behaves like production, and the tests can exercise it without a network.

## BC time

Both apps show every time in Pacific time (`America/Vancouver`), whatever time zone the viewer's device is set to. A boater checking Tofino tides from Toronto needs BC clock times, not Toronto ones. Displayed "Updated" times end in `PT` to make this explicit.

`bcTime.js` does this with the built-in `Intl.DateTimeFormat` API, without a date library:

- **API requests use BC calendar days.** DFO is asked for `getBcDayRangeUtc('2026-10-24')`, the UTC instants covering BC midnight to 23:59:59, rather than the UTC day. Computing BC midnight in UTC takes two passes: guess with the offset at UTC midnight, then correct with the offset at the guess. That handles the 23-hour and 25-hour days when clocks change.
- **Open-Meteo is asked for `timezone=GMT`,** and its timestamps (which have no offset) are parsed explicitly as UTC. Asking for Pacific times and parsing them on the device would silently shift them by the viewer's own offset.
- **All formatting goes through `formatBcTime`,** which formats in `America/Vancouver`.

The test suite runs with `TZ=America/Toronto`, so any code that accidentally depends on the device's time zone fails in CI.

### BC's move to permanent UTC−7

BC stops changing its clocks on **November 1, 2026**: after the March 2026 spring-forward, clocks stay on UTC−7 all year. This surfaced in CI. A test asserting the old fall-back rule for November 1, 2026 passed locally (Node 24.11, time zone data 2025b) and failed in CI (Node 24.21, which ships the newer rules). The code was correct in both places: it trusts the runtime's time zone data. The test was encoding a rule that no longer holds, so the daylight-saving tests now use 2025 dates, which every version of the data agrees on.

The practical consequence is a known limitation: times are computed from the time zone data on the viewer's device, so a phone or browser that hasn't received the update will show times one hour off after November 1, 2026.

## Hosting: Vercel rather than Render

The app is a static site plus one tiny function. On Vercel, the static files are served from a CDN and the function is cached at the edge as described above, so most requests never wake a server. Render's free web services spin down when idle and take a long time to cold-start, which would make the first visit after a quiet period (often a recruiter's first click) slow. Vercel also gives a preview URL for every branch push.

## Web framework: Vite + React rather than Expo for web

Expo can export the mobile app to the web through `react-native-web`, but that wasn't the right fit:

- **Bundle size.** `react-native-web` and the React Navigation stack add a lot of JavaScript for a page that only needs React and a router. The first download is about 86 KB of gzipped JavaScript (React, React Router, the app and the shared data layer); the XML parser and the detail pages load on demand. Lighthouse scores it 98–100 for performance on desktop.
- **Desktop layout.** The mobile screens are designed for a narrow, tab-driven phone UI. The web app is built around a persistent station sidebar, a card grid and wide charts, and collapses to a drawer below 1024px. Building it as a normal React DOM app made that layout, semantic HTML (real `<table>`s, links and buttons) and accessibility much easier.
- **Shareable URLs.** React Router keeps the active station in the URL (`/tides?station=tofino`), so links can be shared and survive a refresh.

The two apps still share all data logic, so the cost of separate UIs is limited to the presentation layer.

## Testing strategy

- **Shared package (Vitest, Node):** unit conversions and compass labels; BC-time helpers, including daylight-saving edge cases, run under `TZ=America/Toronto`; the `fetch` wrapper (query parameters, timeouts, HTTP errors); DFO and Open-Meteo request URLs, with `fetch` stubbed; EC parsing of Atom, RSS 2.0 and the Georgia Strait north/south shared feed; cache expiry with fake timers; and `loadStationData` partial failure, forced refresh and progressive `onData` delivery.
- **Web (Vitest + Testing Library, jsdom):** the proxy allowlist and error mapping; `localStorage` fallbacks (blocked storage, bad JSON, quota errors); the data context (unknown `?station=` falls back to Victoria and rewrites the URL, and a failed source keeps the other data); the tide chart's accessible label; and the currents page's no-data state.
- **CI (GitHub Actions):** lint, tests, the web production build, and an Android bundle export of the mobile app on every push and pull request, so a shared-package change that breaks either app is caught before merge.
- **Manual checks:** each UI change was checked in a real browser at 1440px and 375px widths (layout, no horizontal scroll, keyboard focus, drawer behaviour), with Lighthouse for performance and accessibility, and the mobile app was checked on a phone in Expo Go.

## Known limitations

- **Station identity.** Every location now uses its own nearby DFO tide station (verified against DFO's station catalogue; all within 6 km), but a few communities still share one, such as Courtenay using Comox's station. So both apps identify stations by **name**: the web app uses a slug of the name for URLs, favourites and list keys, and the mobile app matches saved stations by name and refreshes them from the current list on launch, so older saves pick up corrected IDs.
- **Tidal current coverage.** Open-Meteo's ocean model doesn't cover fjords, inlets and many sheltered BC waters. Those stations show a clear "no data" message instead of zeros.
- **Device time zone data.** See [BC's move to permanent UTC−7](#bcs-move-to-permanent-utc7).
- **In-memory cache only.** The 30-minute cache lives in memory, so reloading the page refetches. The CDN cache in front of the EC proxy softens this for the slowest source.
