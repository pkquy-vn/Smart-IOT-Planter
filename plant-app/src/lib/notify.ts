import * as Notifications from 'expo-notifications';

// Show alerts as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Asks once; returns whether we're allowed to show alerts.
export async function askToNotify(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// Fires a local alert right away. Only works while the app is running (no push server).
export async function notify(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {}
}
