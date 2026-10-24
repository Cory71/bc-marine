# BC Marine: Mobile App

Expo / React Native app for iOS and Android. It shares its data layer with the web app through [`@bc-marine/shared`](../../packages/shared).

## Quick start

1. Install the Expo Go app on your phone.
2. From the repo root:

   ```bash
   npm install
   npm start --workspace bc-marine-mobile
   ```

3. Scan the QR code with Expo Go (Android) or the Camera app (iOS). If your phone is on a different network, run `npx expo start --tunnel` from this folder instead.

## Layout

- `App.js`: navigation (tabs and stack)
- `src/context/AppContext.js`: app state; data comes from `loadStationData` in the shared package
- `src/screens/`: dashboard, tide, weather, currents and locations screens
- `src/components/`: tide curve, warning banner, cards
- `src/theme.js`: colours

This app started as a course project; `instructions.md`, `plan.md` and `reflection.md` are the original assignment brief, plan and reflection.
