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

  // Moisture thresholds (percent) for the status colors.
  DRY_BELOW: 30,
  WET_ABOVE: 70,

  // Temperature unit shown in the app. The board should send Celsius.
  FAHRENHEIT: true,
};
