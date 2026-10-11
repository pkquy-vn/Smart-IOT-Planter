#include <Arduino.h>
#include "sensors.h"
#include "camera.h"
#include "server.h"
#include "pump.h"

void setup() {
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("===================================");
    Serial.println("Smart Planter Booting...");
    Serial.println("===================================");

    // Initialize the hardware modules
    initSensors();
    initCamera();
    pumpBegin();
    initServer();
}

void loop() {
    pumpUpdate();
    
    // Non-blocking status reporting every 2 seconds
    static unsigned long lastSensorLog = 0;
    if (millis() - lastSensorLog >= 2000) {
        lastSensorLog = millis();
        int moisture = getMoisturePercentage();
        Serial.print("Current Soil Moisture: ");
        Serial.print(moisture);
        Serial.println("%");
    }
}
