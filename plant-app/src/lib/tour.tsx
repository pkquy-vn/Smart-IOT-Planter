import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/text';

import { P } from './palette';
import { useSettings } from './settings';

// First-run tips: dims the Home screen, highlights one section at a time and explains it,
// with Next / Skip. Sections opt in with useTourTarget(id); Home lends its ScrollView via useTourScroller.

type Step = { target?: string; title: string; text: string };

const STEPS: Step[] = [
  {
    target: 'sprout',
    title: 'Meet your plant!',
    text: 'its face shows how it feels right now based on how wet the soil is',
  },
  {
    target: 'week',
    title: 'This week',
    text: 'each day shows a summary of how it was watered throughout the week. bright green means it was watered, pale means it was fine, and droopy means it got thirsty',
  },
  {
    target: 'water',
    title: 'Water button',
    text: 'Tap to run the pump for 5 seconds. The care tab tells you how many times the plant needs to be watered.',
  },
];

const PAD = 6; // space between a section and its highlight ring
const GAP = 12; // space between the highlight and the bubble

type Rect = { x: number; y: number; w: number; h: number };
type Target = { ref: RefObject<View | null>; y: number };

type Ctx = {
  register: (id: string, ref: RefObject<View | null>) => void;
  setY: (id: string, y: number) => void;
  setScroller: (fn: ((y: number) => void) | null) => void;
  restart: () => void;
};
const TourContext = createContext<Ctx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const { loaded, profile, tourSeen, setTourSeen } = useSettings();
  const [step, setStep] = useState<number | null>(null);
  const [measured, setMeasured] = useState<{ step: number; rect: Rect | null } | null>(null);
  const targets = useRef<Record<string, Target>>({});
  const scroller = useRef<((y: number) => void) | null>(null);

  const register = useCallback((id: string, ref: RefObject<View | null>) => {
    targets.current[id] = { ref, y: targets.current[id]?.y ?? 0 };
  }, []);
  const setY = useCallback((id: string, y: number) => {
    if (targets.current[id]) targets.current[id].y = y;
  }, []);
  const setScroller = useCallback((fn: ((y: number) => void) | null) => {
    scroller.current = fn;
  }, []);

  // Start once, shortly after the plant is set up (so Home has laid out).
  useEffect(() => {
    if (!loaded || !profile.setupDone || tourSeen || step !== null) return;
    const id = setTimeout(() => setStep(0), 900);
    return () => clearTimeout(id);
  }, [loaded, profile.setupDone, tourSeen, step]);

  // For each step: scroll its section into view, then measure where it landed on screen.
  useEffect(() => {
    if (step === null) return;
    const target = STEPS[step].target ? targets.current[STEPS[step].target!] : undefined;
    const scroll = setTimeout(() => {
      if (target) scroller.current?.(Math.max(0, target.y - 140));
      else setMeasured({ step, rect: null });
    }, 0);
    const measure = setTimeout(() => {
      if (!target?.ref.current) return setMeasured({ step, rect: null });
      target.ref.current.measureInWindow((x, y, w, h) => setMeasured({ step, rect: { x, y, w, h } }));
    }, 450);
    return () => {
      clearTimeout(scroll);
      clearTimeout(measure);
    };
  }, [step]);

  const finish = () => {
    setStep(null);
    setMeasured(null);
    setTourSeen(true);
    scroller.current?.(0);
  };
  const next = () => (step !== null && step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const restart = useCallback(() => {
    setMeasured(null);
    setTourSeen(false);
  }, [setTourSeen]);

  const ready = step !== null && measured?.step === step;

  return (
    <TourContext.Provider value={{ register, setY, setScroller, restart }}>
      {children}
      <Modal visible={step !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={finish}>
        {step !== null && (
          <TourOverlay
            step={STEPS[step]}
            index={step}
            rect={ready ? measured!.rect : undefined}
            onNext={next}
            onSkip={finish}
          />
        )}
      </Modal>
    </TourContext.Provider>
  );
}

function TourOverlay({ step, index, rect, onNext, onSkip }: {
  step: Step;
  index: number;
  rect: Rect | null | undefined; // undefined while measuring, null for a step with no section
  onNext: () => void;
  onSkip: () => void;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const last = index === STEPS.length - 1;
  const bubbleW = Math.min(W - 32, 340);

  const bubble = (
    <View style={[styles.bubble, { width: bubbleW }]}>
      <Text style={styles.count}>
        {index + 1} of {STEPS.length}
      </Text>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.text}>{step.text}</Text>
      <View style={styles.buttons}>
        {!last ? (
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={styles.skip}>skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={onNext} style={({ pressed }) => [styles.next, pressed && { opacity: 0.85 }]}>
          <Text style={styles.nextText}>{last ? 'let’s grow!' : 'next'}</Text>
        </Pressable>
      </View>
    </View>
  );

  // No section to point at: just dim everything and centre the bubble.
  if (!rect) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.dim, styles.center]}>
        {rect === null ? bubble : null}
      </View>
    );
  }

  const hole = { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 };
  const roomBelow = H - (hole.y + hole.h);
  const left = Math.min(Math.max(16, rect.x + rect.w / 2 - bubbleW / 2), W - 16 - bubbleW);
  const place = roomBelow > 220 ? { top: hole.y + hole.h + GAP } : { bottom: H - hole.y + GAP };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Four dim panels around the highlighted section */}
      <View style={[styles.dim, { position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, hole.y) }]} />
      <View style={[styles.dim, { position: 'absolute', left: 0, right: 0, top: hole.y + hole.h, bottom: 0 }]} />
      <View style={[styles.dim, { position: 'absolute', left: 0, width: Math.max(0, hole.x), top: hole.y, height: hole.h }]} />
      <View style={[styles.dim, { position: 'absolute', left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h }]} />
      <View pointerEvents="none" style={[styles.ring, { left: hole.x, top: hole.y, width: hole.w, height: hole.h }]} />
      <View style={[{ position: 'absolute', left }, place]}>{bubble}</View>
    </View>
  );
}

// Spread onto a View to make it a tour stop: <View {...useTourTarget('water')}>.
export function useTourTarget(id: string) {
  const ctx = useContext(TourContext);
  const ref = useRef<View>(null);
  useEffect(() => ctx?.register(id, ref), [ctx, id]);
  return {
    ref,
    collapsable: false, // keep the View on Android so it can be measured
    onLayout: (e: LayoutChangeEvent) => ctx?.setY(id, e.nativeEvent.layout.y),
  };
}

// Lets the tour scroll the screen that holds its sections.
export function useTourScroller(fn: (y: number) => void) {
  const ctx = useContext(TourContext);
  useEffect(() => {
    ctx?.setScroller(fn);
    return () => ctx?.setScroller(null);
  }, [ctx, fn]);
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(30, 40, 28, 0.6)' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  ring: { position: 'absolute', borderRadius: 30, borderWidth: 3, borderColor: P.white },
  bubble: { backgroundColor: P.white, borderRadius: 24, padding: 18, gap: 6 },
  count: { color: P.muteLight, fontSize: 12 },
  title: { color: P.ink, fontSize: 18 },
  text: { color: P.mute, fontSize: 14, lineHeight: 20 },
  buttons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  skip: { color: P.mute, fontSize: 15, paddingVertical: 6 },
  next: { backgroundColor: P.moss, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  nextText: { color: P.white, fontSize: 15 },
});
