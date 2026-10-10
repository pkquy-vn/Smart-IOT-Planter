import { View } from 'react-native';

import type { DayMood } from '@/lib/dates';
import { P } from '@/lib/palette';

const DARK = '#4A2B12';

// A little flower with a face. happy = watered, ok = fine, sad = was thirsty, empty = future day.
export function Face({ size = 48, mood = 'happy' }: { size?: number; mood?: DayMood }) {
  if (mood === 'empty') {
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#DADDE2' }} />;
  }
  const base = mood === 'happy' ? P.yellow : P.cream;
  const c = size / 2;
  const petal = size * 0.36;
  const r = size * 0.34;
  const core = size * 0.74;
  const eye = Math.max(3, size * 0.075);
  const cheek = size * 0.14;

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: petal,
              height: petal,
              borderRadius: petal / 2,
              backgroundColor: base,
              left: c + r * Math.cos(a) - petal / 2,
              top: c + r * Math.sin(a) - petal / 2,
            }}
          />
        );
      })}
      <View
        style={{
          position: 'absolute', width: core, height: core, borderRadius: core / 2, backgroundColor: base,
          left: c - core / 2, top: c - core / 2,
        }}
      />
      {/* eyes */}
      {[-1, 1].map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute', width: eye, height: eye * (mood === 'sad' ? 1 : 1.2), borderRadius: eye,
            backgroundColor: DARK, left: c + s * size * 0.17 - eye / 2, top: size * 0.4,
          }}
        />
      ))}
      {/* cheeks */}
      {[-1, 1].map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute', width: cheek, height: cheek, borderRadius: cheek,
            backgroundColor: mood === 'happy' ? '#F5A233' : '#E6E1D0', opacity: 0.8,
            left: c + s * size * 0.27 - cheek / 2, top: size * 0.52,
          }}
        />
      ))}
      {/* mouth */}
      {mood === 'happy' && (
        <View
          style={{
            position: 'absolute', width: size * 0.34, height: size * 0.18, backgroundColor: DARK,
            borderBottomLeftRadius: size * 0.17, borderBottomRightRadius: size * 0.17,
            left: c - size * 0.17, top: size * 0.55,
          }}
        />
      )}
      {mood === 'ok' && (
        <View
          style={{
            position: 'absolute', width: size * 0.2, height: size * 0.1, borderBottomWidth: Math.max(2, size * 0.045),
            borderColor: DARK, borderRadius: size * 0.1, left: c - size * 0.1, top: size * 0.55,
          }}
        />
      )}
      {mood === 'sad' && (
        <>
          <View
            style={{
              position: 'absolute', width: size * 0.26, height: size * 0.15, backgroundColor: DARK,
              borderTopLeftRadius: size * 0.13, borderTopRightRadius: size * 0.13,
              left: c - size * 0.13, top: size * 0.58,
            }}
          />
          <View
            style={{
              position: 'absolute', width: size * 0.1, height: size * 0.13, borderRadius: size * 0.06,
              backgroundColor: '#7CC4EE', left: c + size * 0.24, top: size * 0.5,
            }}
          />
        </>
      )}
    </View>
  );
}
