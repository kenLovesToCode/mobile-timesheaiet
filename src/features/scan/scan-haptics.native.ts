import * as Haptics from 'expo-haptics';

export async function triggerScanHaptics(): Promise<void> {
  try {
    await Haptics.selectionAsync();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    if (__DEV__) {
      console.warn('[scan] Haptics failed to trigger', error);
    }
  }
}
