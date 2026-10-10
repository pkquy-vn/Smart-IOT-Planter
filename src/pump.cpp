#include "pump.h"
#include <Arduino.h>
#include "config.h"

static const int RELAY_ON = PUMP_RELAY_ACTIVE_LOW ? LOW : HIGH;
static const int RELAY_OFF = PUMP_RELAY_ACTIVE_LOW ? HIGH : LOW;

// Set from the web server task, read from loop()
static volatile bool running = false;
static volatile unsigned long startedMs = 0;
static volatile unsigned long stoppedMs = 0;
static volatile bool everRan = false;

static void relay(bool on) {
    digitalWrite(PUMP_RELAY_PIN, on ? RELAY_ON : RELAY_OFF);
}

void pumpBegin() {
    // Write OFF before switching to output so the pump never blips at boot
    relay(false);
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    relay(false);
}

void pumpUpdate() {
    if (running && millis() - startedMs >= PUMP_ON_DURATION_MS) {
        relay(false);
        running = false;
        stoppedMs = millis();
        everRan = true;
        Serial.println("Pump OFF");
    }
}

bool pumpStart() {
    if (running) return false;
    if (everRan && millis() - stoppedMs < PUMP_COOLDOWN_MS) return false;

    startedMs = millis();
    running = true;
    relay(true);
    Serial.println("Pump ON");
    return true;
}

bool pumpIsRunning() {
    return running;
}
