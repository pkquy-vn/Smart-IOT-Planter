#pragma once

#include <Arduino.h>

void initSensors();
void sensorsUpdate();          // call from loop(); refreshes the cached readings every SENSOR_INTERVAL_MS
int getMoistureRaw();          // cached raw ADC, for calibration
int getMoisturePercentage();   // cached, 0-100
float getTemperatureC();       // cached, NAN until the DS18B20 has answered
bool temperatureProbeFound();  // false if no DS18B20 is detected on the bus
