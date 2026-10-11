import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { FONT, Text } from '@/components/text';
import { useNow } from '@/hooks/use-now';
import type { PlantEvent, Reading } from '@/lib/dates';
import { P } from '@/lib/palette';

const RANGES = { day: { label: '24h', ms: 86400000 }, week: { label: '7 days', ms: 7 * 86400000 } } as const;
type Range = keyof typeof RANGES;

const H = 150;

const PAD = { top: 14, bottom: 22, left: 4, right: 30 };

// Moisture over time, with the thirsty level dashed and waterings marked as drops.
export function MoistureChart({ readings, events, dryBelow }: { readings: Reading[]; events: PlantEvent[]; dryBelow: number }) {
  const [range, setRange] = useState<Range>('day');
  const [width, setWidth] = useState(0);

  const end = useNow(60000);
  const start = end - RANGES[range].ms;
  const pts = readings.filter((r) => r.t >= start);
  const waters = events.filter((e) => e.kind === 'water' && e.t >= start);

  const w = width - PAD.left - PAD.right;
  const h = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - start) / (end - start)) * w;
  const y = (m: number) => PAD.top + (1 - m / 100) * h;

  const line = pts.map((r, i) => `${i ? 'L' : 'M'}${x(r.t).toFixed(1)},${y(r.m).toFixed(1)}`).join(' ');
  const area = pts.length > 1 ? `${line} L${x(pts[pts.length - 1].t).toFixed(1)},${y(0)} L${x(pts[0].t).toFixed(1)},${y(0)} Z` : '';

  // Time labels along the bottom
  const ticks =
    range === 'day'
      ? [0, 6, 12, 18].map((hAgo) => end - (24 - hAgo) * 3600000).map((t) => ({
          t,
          label: new Date(t).toLocaleTimeString([], { hour: 'numeric' }),
        }))
      : [6, 4, 2, 0].map((dAgo) => end - dAgo * 86400000).map((t) => ({
          t,
          label: new Date(t).toLocaleDateString([], { weekday: 'short' }),
        }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Moisture history</Text>
        <View style={styles.toggle}>
          {(Object.keys(RANGES) as Range[]).map((k) => (
            <Pressable key={k} onPress={() => setRange(k)} style={[styles.toggleBtn, range === k && styles.toggleOn]}>
              <Text style={[styles.toggleText, range === k && { color: P.white }]}>{RANGES[k].label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ height: H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={H}>
            {[0, 50, 100].map((m) => (
              <Line key={m} x1={PAD.left} x2={PAD.left + w} y1={y(m)} y2={y(m)} stroke={P.mist} strokeWidth={1} />
            ))}
            {[0, 50, 100].map((m) => (
              <SvgText key={`l${m}`} x={width - 2} y={y(m) + 4} fontSize={12} fontFamily={FONT} fill={P.muteLight} textAnchor="end">
                {m}%
              </SvgText>
            ))}

            <Line x1={PAD.left} x2={PAD.left + w} y1={y(dryBelow)} y2={y(dryBelow)} stroke={P.alert} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />

            {area ? <Path d={area} fill={P.sage} opacity={0.45} /> : null}
            {pts.length > 1 ? <Path d={line} stroke={P.moss} strokeWidth={2.5} fill="none" strokeLinejoin="round" /> : null}
            {pts.length === 1 ? <Circle cx={x(pts[0].t)} cy={y(pts[0].m)} r={4} fill={P.moss} /> : null}

            {waters.map((e) => (
              <Circle key={e.t} cx={x(e.t)} cy={PAD.top - 4} r={4} fill={P.water} />
            ))}

            {ticks.map((tk) => (
              <SvgText key={tk.t} x={x(tk.t)} y={H - 6} fontSize={12} fontFamily={FONT} fill={P.muteLight} textAnchor="middle">
                {tk.label}
              </SvgText>
            ))}
          </Svg>
        )}
        {pts.length === 0 && (
          <View style={[StyleSheet.absoluteFill, styles.empty]}>
            <Text style={styles.emptyText}>Readings show up here while the app is open.</Text>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: P.water }]} />
        <Text style={styles.legendText}>Watered</Text>
        <View style={[styles.legendDash, { backgroundColor: P.alert }]} />
        <Text style={styles.legendText}>Thirsty level ({dryBelow}%)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: P.ink, fontSize: 16, fontWeight: '800' },
  toggle: { flexDirection: 'row', backgroundColor: P.mist, borderRadius: 14, padding: 3 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 11 },
  toggleOn: { backgroundColor: P.moss },
  toggleText: { fontSize: 12, fontWeight: '700', color: P.mute },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: P.mute, fontSize: 13 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 14, height: 2, marginLeft: 10, opacity: 0.6 },
  legendText: { color: P.mute, fontSize: 11, fontWeight: '600' },
});
