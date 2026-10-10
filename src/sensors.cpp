#include "sensors.h"

// User specified GPIO 3 for the Soil Moisture Sensor
#define SOIL_MOISTURE_PIN 3

// Estimated calibration values
const int DRY_VALUE = 3000; 
const int WET_VALUE = 1500; 

void initSensors() {
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    Serial.println("Sensors initialized.");
}

int getMoisturePercentage() {
    int rawValue = analogRead(SOIL_MOISTURE_PIN);
    int percentage = map(rawValue, DRY_VALUE, WET_VALUE, 0, 100);
    percentage = constrain(percentage, 0, 100);
    return percentage;
}
