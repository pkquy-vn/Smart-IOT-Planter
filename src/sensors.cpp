#include "sensors.h"
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// Cached readings. Written from loop(), read from the web server task.
static volatile int lastRaw = 0;
static volatile int lastMoisture = 0;
static volatile float lastTempC = NAN;
static volatile bool probeFound = false;

static OneWire oneWire(TEMP_SENSOR_PIN);
static DallasTemperature probes(&oneWire);
static DeviceAddress probeAddr;
static bool conversionPending = false;

static void readMoistureNow() {
    long sum = 0;
    for (int i = 0; i < 8; i++) {
        sum += analogRead(SOIL_MOISTURE_PIN);
    }
    int raw = sum / 8;
    int pct = map(raw, MOISTURE_RAW_DRY, MOISTURE_RAW_WET, 0, 100);
    lastRaw = raw;
    lastMoisture = constrain(pct, 0, 100);
}

// Looks for the first DS18B20 on the bus. Called at boot and again on every
// cycle while nothing is found, so a probe plugged in later just starts working.
static bool findProbe() {
    probes.begin();
    if (!probes.getAddress(probeAddr, 0)) return false;
    probes.setResolution(probeAddr, TEMP_RESOLUTION_BITS);
    // Never block in requestTemperatures(); we read the result on the next cycle.
    probes.setWaitForConversion(false);
    return true;
}

static void startConversion() {
    probes.requestTemperaturesByAddress(probeAddr);
    conversionPending = true;
}

void initSensors() {
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    readMoistureNow();

    probeFound = findProbe();
    if (probeFound) {
        startConversion();
        Serial.printf("DS18B20 found on GPIO%d.\n", TEMP_SENSOR_PIN);
    } else {
        Serial.printf("No DS18B20 found on GPIO%d. Check VCC, GND, DATA and the 4.7k pull-up.\n", TEMP_SENSOR_PIN);
    }
    Serial.println("Sensors initialized.");
}

void sensorsUpdate() {
    static unsigned long lastRead = 0;
    if (millis() - lastRead < SENSOR_INTERVAL_MS) return;
    lastRead = millis();

    readMoistureNow();

    if (!probeFound) {
        probeFound = findProbe();
        if (probeFound) {
            Serial.println("DS18B20 connected.");
            startConversion();
        }
        return;
    }

    // SENSOR_INTERVAL_MS is well above the 750 ms conversion time, so the
    // conversion started last cycle is complete by now.
    if (conversionPending) {
        float t = probes.getTempC(probeAddr);
        conversionPending = false;
        if (t == DEVICE_DISCONNECTED_C || t < -55.0f || t > 125.0f) {
            // Probe unplugged or a bad read: keep the last good value, re-detect next time.
            probeFound = false;
            Serial.println("DS18B20 read failed; will re-scan the bus.");
            return;
        }
        lastTempC = t;
    }
    startConversion();
}

int getMoistureRaw() { return lastRaw; }
int getMoisturePercentage() { return lastMoisture; }
float getTemperatureC() { return lastTempC; }
bool temperatureProbeFound() { return probeFound; }
