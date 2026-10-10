// One place for everything the hardware team might change.
export const CONFIG = {
  // Set to false once the ESP32 is serving real data.
  USE_MOCK: false,

  // IP address of the ESP32 that reads the sensors + runs the pump.
  // (Hardware teammates: print it in the Serial Monitor.)
  SENSOR_BOARD_URL: 'http://172.20.10.5',

  // Camera board. Snapshot URL = a single JPEG; the app refreshes it a few times a second.
  CAMERA_SNAPSHOT_URL: 'http://192.168.1.51/capture',

  POLL_MS: 2000,
  CAMERA_REFRESH_MS: 700,

  // Moisture thresholds (percent) for the status colors.
  DRY_BELOW: 30,
  WET_ABOVE: 70,

  // Temperature unit shown in the app. The board should send Celsius.
  FAHRENHEIT: true,
};
