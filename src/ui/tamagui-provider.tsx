import { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';

import appConfig from '../../tamagui.config';

type TamaguiProviderProps = {
  children: ReactNode;
};

export function AppTamaguiProvider({ children }: TamaguiProviderProps) {
  const colorScheme = useColorScheme();
  const themeName = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={appConfig} defaultTheme={themeName}>
      <Theme name={themeName}>{children}</Theme>
    </TamaguiProvider>
  );
}
