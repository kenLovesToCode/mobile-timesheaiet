import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from 'tamagui';

import { radii, spacing } from '../../theme/tokens';

type SurfaceVariant = 'default' | 'subtle';

type SurfaceProps = PropsWithChildren<
  ViewProps & {
    variant?: SurfaceVariant;
    padded?: boolean;
  }
>;

export function Surface({
  children,
  style,
  variant = 'default',
  padded = true,
  ...rest
}: SurfaceProps) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'subtle'
      ? theme.backgroundHover?.val ?? theme.background?.val
      : theme.surface?.val ?? theme.background?.val;

  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        {
          backgroundColor,
          borderColor: theme.borderColor?.val,
          shadowColor: theme.shadowColor?.val ?? '#00000022',
        } satisfies ViewStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.lg,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  padded: {
    padding: spacing.md,
  },
});
