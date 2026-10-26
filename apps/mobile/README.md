# BC Marine: Mobile App

Expo / React Native app for iOS and Android. It shares its data layer with the web app through [`@bc-marine/shared`](../../packages/shared).

## Run it on your phone

1. Install **Expo Go** from the App Store or Google Play. Make sure it's up to date: this app uses **Expo SDK 58**, and an older Expo Go says the project is incompatible.
2. Connect your phone to the same Wi-Fi as your computer.
3. From the repo root:

   ```bash
   npm install
   npm start --workspace bc-marine-mobile
   ```

4. Scan the QR code in the terminal: on Android with Expo Go's **Scan QR code**, on iPhone with the **Camera** app.

### Tips

- **After pulling new changes**, start with a cleared cache so the phone gets the new code:

  ```bash
  npm start --workspace bc-marine-mobile -- --clear
  ```

- **Phone on a different network, or the QR code won't connect?** Use tunnel mode. The first time, Expo may ask to install a tunnel helper; say yes.

  ```bash
  npm start --workspace bc-marine-mobile -- --tunnel
  ```

- **Use my location:** allow location for Expo Go and turn on **Precise location**. Without it, the phone only roughly knows where you are, and the app asks before switching stations.
- In the terminal, press `r` to reload the app on your phone, and `Ctrl+C` to stop.

## Layout

- `App.js`: navigation (tabs and stack) and the light/dark theme
- `src/context/AppContext.js`: app state (station, data, units, theme, opening station); data comes from `loadStationData` in the shared package
- `src/context/useSavedSites.js`: saved lighthouses and buoys
- `src/screens/`: dashboard, tides, weather, currents, observations, lighthouse/buoy page and locations
- `src/components/`: settings panel, units picker, tide curve, lighthouse/buoy charts, warning banner, cards
- `src/theme.js`: light and dark colours; `useColors()` and `makeStyles()` make every screen follow the theme

This app started as a course project; `instructions.md`, `plan.md` and `reflection.md` are the original assignment brief, plan and reflection.
