import { config as baseConfig } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

import { appThemes } from './src/theme/themes';
import { appTokens } from './src/theme/tokens';
import { appFonts } from './src/theme/typography';

export const tamaguiConfig = createTamagui({
  ...baseConfig,
  tokens: appTokens,
  themes: {
    ...baseConfig.themes,
    ...appThemes,
  },
  fonts: {
    ...baseConfig.fonts,
    ...appFonts,
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
