#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

void initSensors();
void sensorsUpdate();          // call from loop(); refreshes the cached readings every ~2.5 s
int getMoistureRaw();          // cached raw ADC, for calibration
int getMoisturePercentage();   // cached, 0-100
float getTemperatureC();       // cached, NAN if no valid DHT reading yet
float getHumidity();           // cached, NAN if no valid DHT reading yet

#endif
