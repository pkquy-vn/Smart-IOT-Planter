# Smart Planter 🌿

An IoT planter built on the ESP32-S3 CAM. The board reads soil moisture and
temperature, waters the plant with a small pump, and streams camera
snapshots. It runs its own Wi-Fi access point and serves a browser dashboard; a
companion Expo app (`plant-app/`) talks to the same HTTP API.

## Hardware

- **Microcontroller**: ESP32-S3 CAM module with 8 MB flash and OPI PSRAM (Freenove-style pinout)
- **Sensors**: capacitive soil moisture probe (analog), waterproof DS18B20 temperature probe (1-Wire, 4.7k pull-up to 3V3)
- **Actuator**: 5 V relay module driving a mini submersible pump
- Pins are defined in `include/config.h`. The comments there explain which pins are
  free next to the camera and why.

## Firmware

PlatformIO + Arduino framework + ESPAsyncWebServer.

| File | Role |
|---|---|
| `src/main.cpp` | boot sequence and the `loop()` scheduler |
| `src/sensors.cpp` | averaged ADC moisture read and a non-blocking DS18B20 driver (OneWire + DallasTemperature) |
| `src/pump.cpp` | relay control with cooldown, a daily cap and an independent failsafe timer |
| `src/camera.cpp` | camera init and a background task that keeps the latest JPEG in PSRAM |
| `src/server.cpp` | access point, the dashboard (served from flash) and the JSON API |

### Build and flash

1. Open the repo in VS Code with the PlatformIO extension.
2. Check `include/config.h`: pins, relay polarity and the AP password.
3. Connect the board and click **Upload**. Open the serial monitor at 115200 baud.
4. Join the `SmartPlanter_AP` Wi-Fi network and open `http://192.168.4.1`.

### Calibrating the soil probe

`/status` includes the raw ADC value. Read it with the probe in dry air and then in a
glass of water, and put the two numbers into `MOISTURE_RAW_DRY` and `MOISTURE_RAW_WET`.

### Wiring the DS18B20

| Probe wire | ESP32-S3 |
|---|---|
| red (VCC) | 3V3 |
| yellow / white (DATA) | GPIO1, with a 4.7k resistor to 3V3 (already on the kit's adapter board) |
| black (GND) | GND |

### HTTP API

| Method | Path | Response |
|---|---|---|
| GET | `/` | browser dashboard |
| GET | `/status` | `{ moisture, raw, temperature, temperatureProbe, pumpRunning, cooldownMs, runsToday, cameraReady, uptimeMs }` (`temperature` is `null` until the probe answers; `temperatureProbe` is false when no DS18B20 is detected) |
| POST | `/water` | `{ ok: true }`, or HTTP 429 with `{ ok: false, error, cooldownMs }` while the pump is busy, cooling down or capped for the day |
| GET | `/capture` | latest JPEG frame, or 503 if the camera is not available |

All responses carry permissive CORS headers so the app can call the board directly.

### Safety notes

- The pump runs for `PUMP_ON_DURATION_MS` and is switched off from `loop()`. An `esp_timer`
  failsafe forces the relay off shortly after that even if `loop()` is stuck.
- Waterings are limited by `PUMP_COOLDOWN_MS` (5 s, just a settle time) and `PUMP_MAX_RUNS_PER_DAY`.
- Anyone who joins the access point can trigger the pump. Change `AP_PASSWORD`.

## Mobile app

See [`plant-app/README.md`](plant-app/README.md).

## Continuous integration

`.github/workflows/ci.yml` typechecks, lints and tests the app, and compiles the
firmware with PlatformIO on every push.
