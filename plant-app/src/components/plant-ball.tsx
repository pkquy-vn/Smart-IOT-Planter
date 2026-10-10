import { View } from 'react-native';

const INK = '#1F2420';

export type BallMood = 'happy' | 'ok' | 'sad' | 'wet' | 'empty';
export type Accessory = 'leaf' | 'twin' | 'wilted' | 'bud';

// Soft greens per mood: fresh = watered, pale = fine, yellowed = thirsty, blue-green = soaked.
const BODY = {
  happy: { base: '#A9D49C', shade: '#94C388' },
  ok: { base: '#C6DDB4', shade: '#B1CC9E' },
  sad: { base: '#C2C3A0', shade: '#ADAF8A' },
  wet: { base: '#A3D0C2', shade: '#8DBDAE' },
};
const LEAF = '#6FA563';
const LEAF_DRY = '#A89E6C';
const DEFAULT_ACCESSORY: Record<Exclude<BallMood, 'empty'>, Accessory> = {
  happy: 'leaf',
  ok: 'twin',
  sad: 'wilted',
  wet: 'leaf',
};

// Leaf shape: two opposite rounded corners.
function Leaf({ w, h, color, x, y, deg }: { w: number; h: number; color: string; x: number; y: number; deg: number }) {
  return (
    <View
      style={{
        position: 'absolute', width: w, height: h, backgroundColor: color,
        borderTopLeftRadius: w, borderBottomRightRadius: w, left: x - w / 2, top: y - h / 2,
        transform: [{ rotate: `${deg}deg` }],
      }}
    />
  );
}

function Hat({ type, size, top }: { type: Accessory; size: number; top: number }) {
  const mid = size / 2;
  const stemW = Math.max(1.5, size * 0.035);
  const stem = (h: number, deg = 0, color = LEAF) => (
    <View
      style={{
        position: 'absolute', width: stemW, height: h, borderRadius: stemW, backgroundColor: color,
        left: mid - stemW / 2, top: top - h + size * 0.02, transform: [{ rotate: `${deg}deg` }],
      }}
    />
  );

  switch (type) {
    case 'leaf':
      return (
        <>
          {stem(size * 0.12, 8)}
          <Leaf w={size * 0.24} h={size * 0.13} color={LEAF} x={mid + size * 0.1} y={top - size * 0.12} deg={-20} />
        </>
      );
    case 'twin':
      return (
        <>
          {stem(size * 0.08)}
          <Leaf w={size * 0.2} h={size * 0.11} color={LEAF} x={mid - size * 0.09} y={top - size * 0.09} deg={-150} />
          <Leaf w={size * 0.2} h={size * 0.11} color={LEAF} x={mid + size * 0.09} y={top - size * 0.09} deg={-30} />
        </>
      );
    case 'wilted':
      return (
        <>
          {stem(size * 0.1, -25, LEAF_DRY)}
          <Leaf w={size * 0.2} h={size * 0.11} color={LEAF_DRY} x={mid - size * 0.12} y={top - size * 0.03} deg={200} />
        </>
      );
    case 'bud':
      return (
        <>
          {stem(size * 0.12)}
          <Leaf w={size * 0.15} h={size * 0.08} color={LEAF} x={mid + size * 0.08} y={top - size * 0.05} deg={-25} />
          <View
            style={{
              position: 'absolute', width: size * 0.12, height: size * 0.12, borderRadius: size,
              backgroundColor: '#EDB9BE', left: mid - size * 0.06, top: top - size * 0.2,
            }}
          />
        </>
      );
  }
}

// A round green buddy with sprout-style eyes and a little leaf accessory on its head.
export function PlantBall({ size = 48, mood = 'happy', accessory }: { size?: number; mood?: BallMood; accessory?: Accessory }) {
  if (mood === 'empty') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: size * 0.74, height: size * 0.74, borderRadius: size, backgroundColor: '#E6E9E1', marginBottom: size * 0.03 }} />
      </View>
    );
  }

  const c = BODY[mood];
  const mid = size / 2;
  const D = size * 0.78; // body diameter
  const bodyTop = size - D - size * 0.02; // leave headroom for the accessory

  // Sprout-style eyes: thin white ring, big black pupil
  const eye = D * 0.27;
  const pupil = eye * 0.76;
  const eyeY = bodyTop + D * 0.36;
  const eyeGap = D * 0.19;
  const line = Math.max(1.2, size * 0.025);
  const showBlush = mood !== 'sad';

  return (
    <View style={{ width: size, height: size }}>
      <Hat type={accessory ?? DEFAULT_ACCESSORY[mood]} size={size} top={bodyTop + size * 0.02} />

      {/* body with a soft darker band along the bottom, like the sprout */}
      <View
        style={{
          position: 'absolute', width: D, height: D, borderRadius: D / 2, backgroundColor: c.shade,
          left: mid - D / 2, top: bodyTop, overflow: 'hidden',
        }}>
        <View style={{ position: 'absolute', width: D, height: D, borderRadius: D / 2, backgroundColor: c.base, top: -D * 0.05 }} />
      </View>

      {/* eyes */}
      {[-1, 1].map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute', width: eye, height: eye, borderRadius: eye, backgroundColor: '#F7F7F5',
            left: mid + s * eyeGap - eye / 2, top: eyeY, overflow: 'hidden',
            alignItems: 'center', justifyContent: 'center',
          }}>
          <View
            style={{
              width: pupil, height: pupil, borderRadius: pupil, backgroundColor: INK,
              marginLeft: -s * eye * 0.05, marginTop: mood === 'sad' ? eye * 0.1 : 0,
            }}
          />
          {/* sad: eyelids slope down toward the outside */}
          {mood === 'sad' && (
            <View
              style={{
                position: 'absolute', width: eye * 1.8, height: eye * 0.55, backgroundColor: c.base,
                top: -eye * 0.08, left: -eye * 0.4, transform: [{ rotate: `${s * 22}deg` }],
              }}
            />
          )}
        </View>
      ))}

      {/* blush */}
      {showBlush &&
        [-1, 1].map((s) => (
          <View
            key={`b${s}`}
            style={{
              position: 'absolute', width: D * 0.13, height: D * 0.07, borderRadius: D,
              backgroundColor: '#EDB9BE', opacity: 0.85,
              left: mid + s * D * 0.29 - D * 0.065, top: eyeY + eye * 1.02,
            }}
          />
        ))}

      {/* mouth */}
      {(mood === 'happy' || mood === 'ok') && (
        <View
          style={{
            position: 'absolute', width: D * (mood === 'happy' ? 0.11 : 0.08), height: D * (mood === 'happy' ? 0.07 : 0.035),
            borderBottomWidth: line, borderLeftWidth: line, borderRightWidth: line, borderColor: INK,
            borderBottomLeftRadius: D * 0.06, borderBottomRightRadius: D * 0.06,
            left: mid - D * (mood === 'happy' ? 0.055 : 0.04), top: eyeY + eye * 1.0,
          }}
        />
      )}
      {mood === 'sad' && (
        <View
          style={{
            position: 'absolute', width: D * 0.09, height: D * 0.045,
            borderTopWidth: line, borderLeftWidth: line, borderRightWidth: line, borderColor: INK,
            borderTopLeftRadius: D * 0.05, borderTopRightRadius: D * 0.05,
            left: mid - D * 0.045, top: eyeY + eye * 1.12,
          }}
        />
      )}
      {mood === 'wet' && (
        <>
          <View
            style={{
              position: 'absolute', width: D * 0.07, height: D * 0.08, borderRadius: D,
              backgroundColor: INK, left: mid - D * 0.035, top: eyeY + eye * 1.05,
            }}
          />
          {/* water droplet */}
          <View
            style={{
              position: 'absolute', width: D * 0.12, height: D * 0.12, backgroundColor: '#A9CBD3',
              borderTopLeftRadius: 0, borderTopRightRadius: D, borderBottomLeftRadius: D,
              borderBottomRightRadius: D, transform: [{ rotate: '45deg' }],
              left: mid + D * 0.3, top: bodyTop + D * 0.12,
            }}
          />
        </>
      )}
    </View>
  );
}
