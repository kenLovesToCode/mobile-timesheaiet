import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';

export type DevHapticsSmokeResult =
  | {
      ok: true;
      mode: 'selection+notification' | 'selection+android';
      platform: 'ios' | 'android';
    }
  | {
      ok: false;
      message: string;
      platform: 'ios' | 'android';
    };

export async function runDevHapticsSmoke(): Promise<DevHapticsSmokeResult> {
  const platform = Platform.OS === 'android' ? 'android' : 'ios';

  try {
    await Haptics.selectionAsync();

    if (platform === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);

      return {
        ok: true,
        mode: 'selection+android',
        platform,
      };
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return {
      ok: true,
      mode: 'selection+notification',
      platform,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown haptics error';
    console.warn('Dev haptics smoke failed', error);

    return {
      ok: false,
      message,
      platform,
    };
  }
}

