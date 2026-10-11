#pragma once

// ==========================================
// Wi-Fi Configuration
// ==========================================
// The planter runs its own access point. Connect your phone/laptop to it and
// open http://192.168.4.1 (the AP's default address).
#define AP_SSID "SmartPlanter_AP"
#define AP_PASSWORD "12345678" // WPA2 needs at least 8 characters. Change it!

// ==========================================
// Sensor & Actuator Pins (ESP32-S3)
// ==========================================
// Only GPIO1..GPIO10 are ADC1 channels on the S3, and ADC2 cannot be used
// while Wi-Fi is on. The camera (below) takes GPIO4..GPIO18, so GPIO1, 2 and 3
// are the free ADC1-capable pins on a Freenove-style S3 CAM board.
//
// NOTE: GPIO3 is a strapping pin (JTAG select). It works fine as an ADC input,
// but if the board ever boots strangely with the probe attached, swap the soil
// sensor to GPIO1 or GPIO2 and move the DHT / relay to a non-ADC pin (14, 21).
#define SOIL_MOISTURE_PIN 3 // ADC1_CH2

// Digital pin for the DHT11 / DHT22 sensor
#define DHT_PIN 1

// Digital pin for the 5V relay controlling the water pump.
// Hardware tip: the pin floats until setup() runs, so put a 10k pull-down
// (or pull-up for an active-low module) on the relay input so the pump can't
// twitch during boot.
#define PUMP_RELAY_PIN 2

// True if the relay turns on when the pin is LOW
#define PUMP_RELAY_ACTIVE_LOW false

// ==========================================
// Sensors
// ==========================================
// DHT sensor type. The values are the ones the Adafruit library uses, so a
// future switch back to that library needs no changes here.
#define DHT11 11
#define DHT22 22
#define DHT_TYPE DHT11
// #define DHT_TYPE DHT22   // AM2302

// How often the cached readings are refreshed. The DHT11 needs >= 2 s between reads.
#define SENSOR_INTERVAL_MS 2500

// Soil moisture calibration (raw ADC, 0-4095). Read "raw" from /status with the
// probe in dry air and then in a cup of water, and put those two numbers here.
#define MOISTURE_RAW_DRY 3000
#define MOISTURE_RAW_WET 1500

// ==========================================
// Pump
// ==========================================
// How long the pump runs per watering, in milliseconds.
#define PUMP_ON_DURATION_MS 5000
// Minimum time between waterings. Soil needs a while to absorb water, and a
// moisture reading only moves after that, so keep this in the minutes.
#define PUMP_COOLDOWN_MS (2UL * 60UL * 1000UL)
// Hard cap on waterings per rolling 24 h, in case a client goes haywire.
#define PUMP_MAX_RUNS_PER_DAY 12
// Independent hardware-timer failsafe: if loop() ever stalls, the relay is
// still forced off this long after it was switched on.
#define PUMP_FAILSAFE_MS (PUMP_ON_DURATION_MS + 1000)

// ==========================================
// Camera
// ==========================================
// The camera task grabs a frame this often and keeps the latest JPEG in PSRAM,
// so HTTP requests never block on the sensor.
#define CAMERA_FRAME_INTERVAL_MS 150

// Camera pins (ESP32-S3 CAM). These match many standard ESP32-S3 CAM modules
// (Freenove / ESP32-S3-WROOM-1). If the camera fails to initialize, verify the
// pinout for your specific board.
#define PWDN_GPIO_NUM -1
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 15
#define SIOD_GPIO_NUM 4
#define SIOC_GPIO_NUM 5

#define Y9_GPIO_NUM 16
#define Y8_GPIO_NUM 17
#define Y7_GPIO_NUM 18
#define Y6_GPIO_NUM 12
#define Y5_GPIO_NUM 10
#define Y4_GPIO_NUM 8
#define Y3_GPIO_NUM 9
#define Y2_GPIO_NUM 11
#define VSYNC_GPIO_NUM 6
#define HREF_GPIO_NUM 7
#define PCLK_GPIO_NUM 13
