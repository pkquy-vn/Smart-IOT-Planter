import { describe, expect, test } from '@jest/globals';
import { configFor, DEFAULT_PLANTER_IP, withHttp } from '../config';
import { DEFAULT_PROFILE } from '../profile';

describe('configFor', () => {
  test('empty IPs fall back to the access point address', () => {
    const c = configFor({ ...DEFAULT_PROFILE, useMock: false });
    expect(c.boardUrl).toBe(`http://${DEFAULT_PLANTER_IP}`);
    expect(c.cameraSnapshotUrl).toBe(`http://${DEFAULT_PLANTER_IP}/capture`);
  });

  test('camera defaults to the sensor board, and accepts a full URL', () => {
    const c = configFor({ ...DEFAULT_PROFILE, sensorIp: ' 10.0.0.9 ', cameraIp: 'https://cam.local/' });
    expect(c.boardUrl).toBe('http://10.0.0.9');
    expect(c.cameraSnapshotUrl).toBe('https://cam.local/capture');
  });

  test('thresholds are clamped and keep a gap between dry and wet', () => {
    expect(configFor({ ...DEFAULT_PROFILE, thirstyBelow: '95' })).toMatchObject({ dryBelow: 90, wetAbove: 110 });
    expect(configFor({ ...DEFAULT_PROFILE, thirstyBelow: 'abc' })).toMatchObject({ dryBelow: 30, wetAbove: 70 });
    expect(configFor({ ...DEFAULT_PROFILE, thirstyBelow: '60' })).toMatchObject({ dryBelow: 60, wetAbove: 80 });
  });

  test('withHttp', () => {
    expect(withHttp('1.2.3.4')).toBe('http://1.2.3.4');
    expect(withHttp('http://1.2.3.4/')).toBe('http://1.2.3.4');
  });
});
