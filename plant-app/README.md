# Smart Planter app

Expo / React Native companion app for the ESP32-S3 Smart Planter. Shows the plant's
mood, soil moisture, temperature, humidity and a live camera view, waters the plant,
and keeps a watering journal.

## Run it

```bash
npm install
npx expo start
```

Open it in Expo Go, a simulator, or the browser (`w`). The app works without hardware
in **Demo mode** (fake sensor data). To use the real planter, switch demo mode off in
setup, join the `SmartPlanter_AP` Wi-Fi network and keep the default IP `192.168.4.1`.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (React Compiler rules included)
npm test            # jest, unit tests in src/lib/__tests__
```

## Layout

| Path | Role |
|---|---|
| `src/app/_layout.tsx` | root stack; routes to onboarding until a plant profile is saved |
| `src/app/onboarding.tsx` | intro and setup screens |
| `src/app/(tabs)/` | Home dashboard and Journal calendar |
| `src/components/` | UI pieces (sprout, plant balls, tab bars, setup form) |
| `src/lib/api.ts` | HTTP client for the board, plus the demo-mode mock |
| `src/lib/config.ts` | turns the saved profile into URLs and thresholds |
| `src/lib/mood.ts` | pure mood logic for the big sprout |
| `src/lib/settings.tsx` | persisted profile, journal events and derived config |
