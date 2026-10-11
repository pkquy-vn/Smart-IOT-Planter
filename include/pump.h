#pragma once

#include <Arduino.h>

enum PumpResult {
    PUMP_STARTED,
    PUMP_ALREADY_RUNNING,
    PUMP_COOLING_DOWN,
    PUMP_DAILY_LIMIT,
};

void pumpBegin();
void pumpUpdate();                         // call from loop(); turns the pump off after PUMP_ON_DURATION_MS
PumpResult pumpStart();                    // safe to call from any task (the web server calls it)
bool pumpIsRunning();
unsigned long pumpCooldownRemainingMs();   // 0 when a watering is allowed
int pumpRunsLast24h();
const char *pumpResultMessage(PumpResult r);
