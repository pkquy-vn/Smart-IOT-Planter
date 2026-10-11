import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/text';
import { P } from '@/lib/palette';

// Round gauge for soil moisture. The faint tick marks the "thirsty" level.
export function MoistureRing({
  value,
  dryBelow,
  size = 120,
  color = P.white,
  track = 'rgba(255,255,255,0.25)',
}: {
  value: number | null; // 0-100, null while loading
  dryBelow: number;
  size?: number;
  color?: string;
  track?: string;
}) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value));
  // The ring starts at 12 o'clock, so rotate the circle -90deg.
  const tickAngle = (dryBelow / 100) * 2 * Math.PI - Math.PI / 2;
  const tick = (d: number) => ({ x: size / 2 + Math.cos(tickAngle) * d, y: size / 2 + Math.sin(tickAngle) * d });
  const t = tick(r);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {value != null && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        <Circle cx={t.x} cy={t.y} r={stroke * 0.28} fill={P.blush} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color, fontSize: size * 0.26 }]}>{value == null ? '--' : `${Math.round(pct)}%`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '900' },
});
