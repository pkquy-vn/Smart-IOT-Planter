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

    // Pump first so the relay is driven OFF as early as possible.
    pumpBegin();
    initSensors();
    if (!initCamera()) {
        Serial.println("Continuing without the camera. /status reports cameraReady=false.");
    }
    initServer();
}

void loop() {
    pumpUpdate();
    sensorsUpdate();

    // Non-blocking status log every 2 seconds
    static unsigned long lastLog = 0;
    if (millis() - lastLog >= 2000) {
        lastLog = millis();
        Serial.printf("Moisture: %d%% (raw %d)  Temp: %.1f C  Humidity: %.0f%%  Pump: %s\n",
                      getMoisturePercentage(), getMoistureRaw(), getTemperatureC(), getHumidity(),
                      pumpIsRunning() ? "ON" : "off");
    }
}
