import type { PlantTypeId, Units } from './plants';

export type Profile = {
  setupDone: boolean;
  name: string;
  species: string;
  plantType: PlantTypeId;
  thirstyBelow: string; // percent as typed in Settings; empty = use the plant type's default
  useMock: boolean;
  sensorIp: string; // e.g. 192.168.4.1
  cameraIp: string; // optional, defaults to sensorIp
  alerts: boolean; // notify when the plant gets thirsty
  units: Units; // imperial = °F, fl oz, inches; metric = °C, ml, centimeters
  since: number | null; // when the plant was first set up (for "days together")
};

export const DEFAULT_PROFILE: Profile = {
  setupDone: false,
  name: '',
  species: '',
  plantType: 'leafy',
  thirstyBelow: '',
  useMock: true,
  sensorIp: '',
  cameraIp: '',
  alerts: true,
  units: 'imperial',
  since: null,
};
