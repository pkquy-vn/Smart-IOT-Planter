import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraCard } from '@/components/camera-card';
import { CareCard } from '@/components/care-card';
import { MoistureChart } from '@/components/moisture-chart';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';
import { useStatus } from '@/lib/status';

// Care: how to look after this plant, how it has been doing, and the live camera.
export default function CareScreen() {
  const { profile, config, events, readings } = useSettings();
  const { status } = useStatus();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <CareCard
          plantType={profile.plantType}
          units={profile.units}
          dryBelow={config.dryBelow}
          moisture={status?.moisture ?? null}
          events={events}
        />
        <MoistureChart readings={readings} events={events} dryBelow={config.dryBelow} />
        <CameraCard config={config} cameraReady={status?.cameraReady ?? true} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 18, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' },
});
