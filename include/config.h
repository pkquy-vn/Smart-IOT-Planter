#pragma once

// ==========================================
// Wi-Fi Configuration
// ==========================================
// Replace with your actual network credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ==========================================
// Sensor & Actuator Pins
// ==========================================
// NOTE: Make sure these don't conflict with the Camera pins below.
// GPIO3 supports ADC1_CH2 on ESP32-S3 for analog reads
#define SOIL_MOISTURE_PIN 3 

// Digital pin for the DHT11 / DHT22 Sensor
#define DHT_PIN 1

// Uncomment the type of DHT sensor you are using
#define DHT_TYPE DHT11   // DHT 11
//#define DHT_TYPE DHT22   // DHT 22 (AM2302)

// Digital pin for the 5V Relay controlling the water pump
#define PUMP_RELAY_PIN 2 

// ==========================================
// Application Configuration
// ==========================================
// Threshold at which the soil is considered "dry" (needs to be calibrated)
// The value depends on your sensor's ADC reading (usually 0-4095 on ESP32)
#define MOISTURE_DRY_THRESHOLD 2000 

// How long the pump should stay on when triggered (in milliseconds)
#define PUMP_ON_DURATION_MS 5000 

// ==========================================
// Camera Pins (ESP32-S3 CAM)
// ==========================================
// IMPORTANT: These pins match many standard ESP32-S3 CAM modules (like Freenove / ESP32-S3-WROOM-1).
// If your camera fails to initialize, verify the pinout for your specific manufacturer.
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     15
#define SIOD_GPIO_NUM     4
#define SIOC_GPIO_NUM     5

#define Y9_GPIO_NUM       16
#define Y8_GPIO_NUM       17
#define Y7_GPIO_NUM       18
#define Y6_GPIO_NUM       12
#define Y5_GPIO_NUM       10
#define Y4_GPIO_NUM       8
#define Y3_GPIO_NUM       9
#define Y2_GPIO_NUM       11
#define VSYNC_GPIO_NUM    6
#define HREF_GPIO_NUM     7
#define PCLK_GPIO_NUM     13
