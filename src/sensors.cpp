#include "sensors.h"

// Instantiate the DHT sensor using pins and type from config.h
DHT dht(DHT_PIN, DHT_TYPE);

void initSensors() {
    // Initialize DHT sensor
    dht.begin();
    
    // Configure soil moisture pin for analog input
    // Note: ESP32 analogRead() returns a 12-bit value (0-4095)
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    
    Serial.println("Sensors initialized.");
}

int readSoilMoisture() {
    // Read the raw analog value from the capacitive moisture sensor
    // Calibration note: lower values typically mean wetter soil, higher means drier
    int rawValue = analogRead(SOIL_MOISTURE_PIN);
    return rawValue;
}

float readTemperature() {
    // Read temperature as Celsius
    float temp = dht.readTemperature();
    
    // Check if the reading failed and return a fallback/error value if so
    if (isnan(temp)) {
        Serial.println("Warning: Failed to read temperature from DHT sensor!");
        return 0.0;
    }
    return temp;
}

float readHumidity() {
    // Read humidity percentage
    float hum = dht.readHumidity();
    
    // Check if the reading failed
    if (isnan(hum)) {
        Serial.println("Warning: Failed to read humidity from DHT sensor!");
        return 0.0;
    }
    return hum;
}
