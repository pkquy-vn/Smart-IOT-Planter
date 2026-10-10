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
    
    // Quick hardware test: turn on the pump when the device boots
    pumpStart();
}

void loop() {
    pumpUpdate();
    
    // We can now cleanly read our sensors
    int moisture = getMoisturePercentage();
    
    Serial.print("Current Soil Moisture: ");
    Serial.print(moisture);
    Serial.println("%");
    
    // Wait before taking the next reading
    delay(2000);
}
