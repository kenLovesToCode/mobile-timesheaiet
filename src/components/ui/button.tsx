import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'tamagui';

import { radii, spacing, touchTargets } from '../../theme/tokens';
import { Text } from './text';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PropsWithChildren<{
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  leadingAccessory?: ReactNode;
  trailingAccessory?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}>;

export function Button({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  leadingAccessory,
  trailingAccessory,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary
    ? theme.accentBackground?.val ?? theme.color?.val
    : theme.surface?.val ?? theme.background?.val;
  const borderColor = isPrimary
    ? theme.accentBorderColor?.val ?? theme.accentBackground?.val ?? theme.borderColor?.val
    : theme.borderColor?.val;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) =>
        getButtonContainerStyle({ pressed, disabled, backgroundColor, borderColor })
      }
    >
      {leadingAccessory ? <View style={styles.accessory}>{leadingAccessory}</View> : null}
      <Text
        variant="label"
        style={{
          color: isPrimary ? theme.accentColor?.val ?? '#FFFFFF' : theme.color?.val,
        }}
      >
        {children}
      </Text>
      {trailingAccessory ? <View style={styles.accessory}>{trailingAccessory}</View> : null}
    </Pressable>
  );
}

type ButtonContainerStyleOptions = {
  pressed: boolean;
  disabled: boolean;
  backgroundColor: string | undefined;
  borderColor: string | undefined;
};

export function getButtonContainerStyle({
  pressed,
  disabled,
  backgroundColor,
  borderColor,
}: ButtonContainerStyleOptions): StyleProp<ViewStyle> {
  return [
    styles.base,
    {
      backgroundColor,
      borderColor,
      opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
      transform: [{ scale: pressed ? 0.99 : 1 }],
    },
  ];
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
