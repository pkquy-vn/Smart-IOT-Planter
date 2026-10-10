#pragma once

#include <Arduino.h>
#include <DHT.h>
#include "config.h"

// Initialize the sensors
void initSensors();

// Read the soil moisture sensor (returns raw ADC value, typically 0-4095)
int readSoilMoisture();

// Read temperature in Celsius
float readTemperature();

// Read humidity percentage
float readHumidity();
