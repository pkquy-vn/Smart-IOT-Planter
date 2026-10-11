#include "sensors.h"
#include "config.h"

// Cached readings. Written from loop(), read from the web server task.
static volatile int lastRaw = 0;
static volatile int lastMoisture = 0;
static volatile float lastTempC = NAN;
static volatile float lastHumidity = NAN;

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

// Spin while DHT_PIN stays at `level`. Returns the time spent in microseconds, or -1 on timeout.
static long waitWhile(int level, unsigned long timeoutUs) {
    unsigned long start = micros();
    while (digitalRead(DHT_PIN) == level) {
        if (micros() - start > timeoutUs) return -1;
    }
    return (long)(micros() - start);
}

// Bit-banged DHT11/DHT22 read with a hard timeout on every pulse.
// Interrupts are off only for the pulse-timing section: about 5 ms on a good read,
// at most ~13 ms on a bad one, far below the 300 ms interrupt watchdog.
// A missing sensor or a wrong pin simply returns false.
static bool readDHTSafe(float &temp, float &humidity) {
    uint8_t data[5] = {0, 0, 0, 0, 0};

    // Start signal: hold the line low for 20 ms, then release it.
    pinMode(DHT_PIN, OUTPUT);
    digitalWrite(DHT_PIN, LOW);
    delay(20);
    pinMode(DHT_PIN, INPUT_PULLUP);
    delayMicroseconds(30);

    bool ok = true;
    noInterrupts();
    // Sensor response: pulls low within ~40 us, then ~80 us low, ~80 us high.
    if (waitWhile(HIGH, 150) < 0 || waitWhile(LOW, 150) < 0 || waitWhile(HIGH, 150) < 0) ok = false;
    // 40 data bits: ~50 us low, then a high of 26-28 us for a 0 or ~70 us for a 1.
    for (int i = 0; ok && i < 40; i++) {
        if (waitWhile(LOW, 150) < 0) { ok = false; break; }
        long high = waitWhile(HIGH, 150);
        if (high < 0) { ok = false; break; }
        if (high > 50) data[i / 8] |= (1 << (7 - (i % 8)));
    }
    interrupts();

    if (!ok) return false;
    if (data[4] != ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) return false;

#if DHT_TYPE == DHT22
    humidity = ((data[0] << 8) | data[1]) * 0.1f;
    temp = (((data[2] & 0x7F) << 8) | data[3]) * 0.1f;
    if (data[2] & 0x80) temp = -temp;
#else
    humidity = data[0] + data[1] * 0.1f;
    temp = data[2] + (data[3] & 0x0F) * 0.1f;
    if (data[3] & 0x80) temp = -temp;
#endif
    return true;
}

void initSensors() {
    pinMode(SOIL_MOISTURE_PIN, INPUT);
    pinMode(DHT_PIN, INPUT_PULLUP);
    readMoistureNow();
    Serial.println("Sensors initialized.");
}

void sensorsUpdate() {
    static unsigned long lastRead = 0;
    if (millis() - lastRead < SENSOR_INTERVAL_MS) return;
    lastRead = millis();

    readMoistureNow();

    float t, h;
    // Keep the last good value when a read fails or fails its checksum.
    if (readDHTSafe(t, h)) {
        lastTempC = t;
        lastHumidity = h;
    }
}

int getMoistureRaw() { return lastRaw; }
int getMoisturePercentage() { return lastMoisture; }
float getTemperatureC() { return lastTempC; }
float getHumidity() { return lastHumidity; }
