# Smart Planter 🌿

## Overview
An IoT-enabled Smart Planter built on the ESP32-S3 CAM. 
This project monitors soil moisture, ambient temperature, and humidity, while providing automated watering and a live video stream via a local web dashboard.

## Architecture
- **Microcontroller**: ESP32-S3 CAM (handling sensors, camera, and local HTTP server)
- **Sensors**: Capacitive Soil Moisture Sensor (Analog), DHT11/22 (Digital)
- **Actuators**: 5V Relay + Mini Submersible Pump
- **Software Stack**: PlatformIO, Arduino framework, ESPAsyncWebServer

## Project Structure
- `src/`: Implementation files. Code is modularized for separation of concerns (sensors, camera, web server, pump).
- `include/`: Header files and system-wide configuration (`config.h`).
- `data/`: Frontend UI assets (`index.html`, `style.css`, `script.js`). Uploaded to the ESP32 via LittleFS/SPIFFS.

## Getting Started
1. Clone this repository.
2. Open the project in VS Code with the PlatformIO extension installed.
3. Update Wi-Fi credentials and hardware pin definitions in `include/config.h` (once implemented).
4. Connect the ESP32-S3 CAM.
5. Click **Build** and **Upload** in PlatformIO to flash the firmware.
6. Click **Upload File System image** to transfer the `data/` folder (frontend UI) to the ESP32's flash memory.
