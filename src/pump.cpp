#include "pump.h"
#include "config.h"
#include "esp_timer.h"

static const int RELAY_ON = PUMP_RELAY_ACTIVE_LOW ? LOW : HIGH;
static const int RELAY_OFF = PUMP_RELAY_ACTIVE_LOW ? HIGH : LOW;
static const unsigned long DAY_MS = 24UL * 60UL * 60UL * 1000UL;

// State is touched from loop(), the web server task and the esp_timer task,
// so every access goes through this spinlock.
static portMUX_TYPE lock = portMUX_INITIALIZER_UNLOCKED;
static bool running = false;
static unsigned long startedMs = 0;
static unsigned long stoppedMs = 0;
static bool everRan = false;
static unsigned long runTimes[PUMP_MAX_RUNS_PER_DAY]; // millis() of recent starts, ring buffer
static int runCount = 0;
static int runHead = 0;

static esp_timer_handle_t failsafeTimer = nullptr;

static void relay(bool on) {
    digitalWrite(PUMP_RELAY_PIN, on ? RELAY_ON : RELAY_OFF);
}

// Turns the pump off. Returns true if it was running.
static bool stopLocked() {
    if (!running) return false;
    relay(false);
    running = false;
    stoppedMs = millis();
    everRan = true;
    return true;
}

static int runsInLast24hLocked(unsigned long now) {
    int n = 0;
    for (int i = 0; i < runCount; i++) {
        if (now - runTimes[i] < DAY_MS) n++;
    }
    return n;
}

// Runs on the esp_timer task, independent of loop(). If loop() is stuck
// (camera init, Wi-Fi, a long sensor read), this still shuts the relay off.
static void failsafeFired(void *) {
    portENTER_CRITICAL(&lock);
    bool wasRunning = stopLocked();
    portEXIT_CRITICAL(&lock);
    if (wasRunning) Serial.println("Pump OFF (failsafe timer)");
}

void pumpBegin() {
    // Write OFF before switching to output so the pump never blips at boot
    relay(false);
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    relay(false);

    esp_timer_create_args_t args = {};
    args.callback = failsafeFired;
    args.name = "pump_failsafe";
    esp_timer_create(&args, &failsafeTimer);
}

void pumpUpdate() {
    bool stopped = false;
    portENTER_CRITICAL(&lock);
    if (running && millis() - startedMs >= PUMP_ON_DURATION_MS) stopped = stopLocked();
    portEXIT_CRITICAL(&lock);
    if (stopped) {
        if (failsafeTimer) esp_timer_stop(failsafeTimer);
        Serial.println("Pump OFF");
    }
}

PumpResult pumpStart() {
    unsigned long now = millis();
    PumpResult result;

    portENTER_CRITICAL(&lock);
    if (running) {
        result = PUMP_ALREADY_RUNNING;
    } else if (everRan && now - stoppedMs < PUMP_COOLDOWN_MS) {
        result = PUMP_COOLING_DOWN;
    } else if (runsInLast24hLocked(now) >= PUMP_MAX_RUNS_PER_DAY) {
        result = PUMP_DAILY_LIMIT;
    } else {
        runTimes[runHead] = now;
        runHead = (runHead + 1) % PUMP_MAX_RUNS_PER_DAY;
        if (runCount < PUMP_MAX_RUNS_PER_DAY) runCount++;
        startedMs = now;
        running = true;
        relay(true);
        result = PUMP_STARTED;
    }
    portEXIT_CRITICAL(&lock);

    if (result == PUMP_STARTED) {
        if (failsafeTimer) {
            esp_timer_stop(failsafeTimer);
            esp_timer_start_once(failsafeTimer, (uint64_t)PUMP_FAILSAFE_MS * 1000ULL);
        }
        Serial.println("Pump ON");
    }
    return result;
}

bool pumpIsRunning() {
    portENTER_CRITICAL(&lock);
    bool r = running;
    portEXIT_CRITICAL(&lock);
    return r;
}

unsigned long pumpCooldownRemainingMs() {
    unsigned long now = millis();
    unsigned long remaining = 0;
    portENTER_CRITICAL(&lock);
    if (running) {
        remaining = PUMP_COOLDOWN_MS + PUMP_ON_DURATION_MS - (now - startedMs);
    } else if (everRan && now - stoppedMs < PUMP_COOLDOWN_MS) {
        remaining = PUMP_COOLDOWN_MS - (now - stoppedMs);
    }
    portEXIT_CRITICAL(&lock);
    return remaining;
}

int pumpRunsLast24h() {
    portENTER_CRITICAL(&lock);
    int n = runsInLast24hLocked(millis());
    portEXIT_CRITICAL(&lock);
    return n;
}

const char *pumpResultMessage(PumpResult r) {
    switch (r) {
        case PUMP_STARTED: return "Watering";
        case PUMP_ALREADY_RUNNING: return "Pump is already running";
        case PUMP_COOLING_DOWN: return "Pump is cooling down, try again in a bit";
        case PUMP_DAILY_LIMIT: return "Daily watering limit reached";
    }
    return "Unknown";
}
