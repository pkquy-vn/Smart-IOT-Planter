import { Image } from 'expo-image';

import type { PlantTypeId } from '@/lib/plants';

// Hand-drawn pictures for the "kind of plant" cards (cropped to a square, transparent background).
const ART: Record<PlantTypeId, number> = {
  succulent: require('@/assets/images/plants/succulent.png'),
  leafy: require('@/assets/images/plants/leafy.png'),
  flowering: require('@/assets/images/plants/flowering.png'),
  herb: require('@/assets/images/plants/herb.png'),
  fern: require('@/assets/images/plants/fern.png'),
  veggie: require('@/assets/images/plants/veggie.png'),
  other: require('@/assets/images/plants/other.png'),
};

export function PlantArt({ type, size }: { type: PlantTypeId; size: number }) {
  return <Image source={ART[type]} style={{ width: size, height: size }} contentFit="contain" />;
}
