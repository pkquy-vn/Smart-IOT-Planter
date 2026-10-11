export type Profile = {
  setupDone: boolean;
  name: string;
  species: string;
  thirstyBelow: string; // percent, as typed
  location: string;
  notes: string;
  useMock: boolean;
  sensorIp: string; // e.g. 192.168.4.1
  cameraIp: string; // optional, defaults to sensorIp
  fahrenheit: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  setupDone: false,
  name: '',
  species: '',
  thirstyBelow: '30',
  location: '',
  notes: '',
  useMock: true,
  sensorIp: '',
  cameraIp: '',
  fahrenheit: false,
};
