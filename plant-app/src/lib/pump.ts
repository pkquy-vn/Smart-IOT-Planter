// Fixed pump numbers. They must match the firmware's include/config.h.
export const PUMP_ON_MS = 5000; // PUMP_ON_DURATION_MS
export const PUMP_COOLDOWN_MS = 5000; // PUMP_COOLDOWN_MS, used when the board doesn't report cooldownMs
export const PUMP_MAX_RUNS_PER_DAY = 60; // PUMP_MAX_RUNS_PER_DAY

// Roughly how much water one 5-second pump run moves. Fixed by the hardware;
// measure it once with a measuring cup and update this so the care guide is accurate.
export const ML_PER_PRESS = 120;
