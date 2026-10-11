#pragma once

#include <Arduino.h>

void initSensors();
void sensorsUpdate();          // call from loop(); refreshes the cached readings every SENSOR_INTERVAL_MS
int getMoistureRaw();          // cached raw ADC, for calibration
int getMoisturePercentage();   // cached, 0-100
float getTemperatureC();       // cached, NAN if no valid DHT reading yet
float getHumidity();           // cached, NAN if no valid DHT reading yet
