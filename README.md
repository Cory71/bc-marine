# BC Marine

A React Native mobile app for BC coastal mariners. Shows live tide heights, wind, waves, currents, and Environment Canada marine forecasts for stations from Victoria to Prince Rupert.

Built with Expo for iOS and Android.

## Features

- **Dashboard** — at-a-glance view of wind, waves, visibility, tides, and tidal currents for the active station
- **Tide Chart** — current height, next high/low, today's tide curve, and 7-day max tide bar chart (all in feet)
- **Wind & Weather Detail** — compass headings, wave height, swell, visibility, and an 8-hour breakdown
- **Tidal Currents** — speed, direction, and flooding/ebbing phase
- **Locations** — search by name, browse by EC marine region, save favourites, or use GPS to find your nearest station
- **EC Marine Forecast** — full text forecast and active warnings pulled from the Environment Canada Atom feed
- **Pull to refresh** — clears the cache and pulls fresh data from all three sources

## Data Sources

| Source                                     | What it provides                               |
| ------------------------------------------ | ---------------------------------------------- |
| Fisheries and Oceans Canada (DFO IWLS API) | Tide heights, high/low events, 7-day forecast  |
| Open-Meteo Marine API                      | Wind, waves, swell, tidal currents, visibility |
| Environment Canada Atom feeds              | Marine warnings and text forecasts             |

No API keys are required — all three services are free and open.

## Setup

1. Install [Node.js](https://nodejs.org/) (18 or newer) and the Expo Go app on your phone.
2. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Cory71/bc-marine.git
   cd bc-marine
   npm install
   ```

3. Start the dev server (either command works):

   ```bash
   npm start
   # or
   npx expo start
   ```

4. Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Project Structure

```text
src/
├── context/
│   └── AppContext.js          # Global state: active station, data, loading, errors
├── services/
│   ├── cache.js               # In-memory cache with 30-min expiry
│   ├── dfoService.js          # DFO IWLS — tide heights and events
│   ├── weatherService.js      # Open-Meteo — wind, waves, currents
│   └── ecService.js           # Environment Canada — warnings and forecast text
├── utils/
│   ├── units.js               # Unit conversion, time formatting, sun/moon, nearest station
│   └── constants.js           # Colours, BC station list, API base URLs
├── components/
│   ├── WarningBanner.js       # Orange EC alert strip
│   ├── CardWrapper.js         # Reusable dashboard card container
│   └── TideCurve.js           # SVG tide chart
└── screens/
    ├── DashboardScreen.js
    ├── TideDetailScreen.js
    ├── WeatherDetailScreen.js
    ├── CurrentsDetailScreen.js
    └── LocationsScreen.js
```

## Notes

- All tide heights are shown in feet, wind in knots, waves in feet, visibility in km, temperature in °C.
- Tidal current data from Open-Meteo is not available for all sheltered BC waters (fjords and inlets). The currents screen shows a fallback message in those cases.
- Saved locations persist on the device via AsyncStorage.

## Tech Stack

Expo · React Native · React Navigation · Axios · AsyncStorage · react-native-svg · expo-location · suncalc · fast-xml-parser

## Project Planning

Development tracked on the [BC Marine project board](https://github.com/users/Cory71/projects/5).
