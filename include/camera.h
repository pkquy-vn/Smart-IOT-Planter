#pragma once

#include <Arduino.h>

// Initializes the sensor and starts a background task that keeps the latest
// JPEG frame in PSRAM. Returns false if PSRAM or the camera is missing.
bool initCamera();

// True once the background task has captured at least one frame.
bool cameraIsReady();

// Copies the latest JPEG into a freshly allocated buffer (PSRAM when available).
// The caller owns the buffer and must free() it. Returns false if no frame is
// available yet or allocation fails. Never blocks on the sensor.
bool cameraSnapshot(uint8_t **outBuf, size_t *outLen);
