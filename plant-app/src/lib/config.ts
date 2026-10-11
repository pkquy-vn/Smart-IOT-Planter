// One place for everything the hardware team might change.
export const CONFIG = {
  // Set to false once the ESP32 is serving real data.
  USE_MOCK: false,

  // IP address of the ESP32 that reads the sensors + runs the pump.
  // In AP Mode (SmartPlanter_AP), the ESP32 is at 192.168.4.1
  SENSOR_BOARD_URL: 'http://192.168.4.1',

  // Camera board snapshot URL. On our single-board setup, it's also at 192.168.4.1.
  CAMERA_SNAPSHOT_URL: 'http://192.168.4.1/capture',

  POLL_MS: 2000,
  CAMERA_REFRESH_MS: 700,

  // Must match PUMP_ON_DURATION_MS / PUMP_COOLDOWN_MS in the firmware's config.h
  PUMP_ON_MS: 5000,
  PUMP_COOLDOWN_MS: 10000,

  // Roughly how much water one 5-second pump run moves. Fixed by the hardware;
  // measure it once with a measuring cup and update this so the care guide is accurate.
  ML_PER_PRESS: 120,

  // Moisture history for the chart: one reading every 10 min, kept for 7 days
  HISTORY_SAMPLE_MS: 10 * 60 * 1000,
  HISTORY_DAYS: 7,

  // Moisture thresholds (percent) for the status colors.
  DRY_BELOW: 30,
  WET_ABOVE: 70, // above this the soil is nicely soaked (the plant is thrilled)
  TOO_WET: 85, // above this it's too much water

  // Temperature unit shown in the app. The board should send Celsius.
  FAHRENHEIT: true,
};
