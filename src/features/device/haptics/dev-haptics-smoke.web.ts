export type DevHapticsSmokeResult = {
  ok: false;
  mode: 'web-unsupported';
  message: string;
  platform: 'web';
};

export async function runDevHapticsSmoke(): Promise<DevHapticsSmokeResult> {
  return {
    ok: false,
    mode: 'web-unsupported',
    message: 'Haptics smoke is unsupported on web. Validate on an iOS or Android device.',
    platform: 'web',
  };
}
