import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from 'tamagui';

import { radii, spacing, touchTargets, typeScale } from '../../theme/tokens';
import { Text } from './text';

type NativeInputProps = ComponentProps<typeof TextInput>;

type InputProps = NativeInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  rightAccessory?: ReactNode;
};

export function Input({
  label,
  helperText,
  errorText,
  rightAccessory,
  style,
  ...inputProps
}: InputProps) {
  const theme = useTheme();
  const describedByText = errorText ?? helperText;

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="footnote" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View style={styles.inputWrap}>
        <TextInput
          allowFontScaling
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          accessibilityHint={inputProps.accessibilityHint ?? describedByText}
          placeholderTextColor={theme.placeholderColor?.val ?? theme.textSecondary?.val}
          style={[
            styles.input,
            rightAccessory ? styles.inputWithAccessory : null,
            {
              color: theme.color?.val,
              backgroundColor: theme.surface?.val ?? theme.background?.val,
              borderColor: errorText ? theme.danger?.val : theme.borderColor?.val,
            },
            style,
          ]}
          {...inputProps}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>

      {describedByText ? (
        <Text variant="caption" tone={errorText ? 'danger' : 'secondary'} style={styles.helper}>
          {describedByText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTargets.min,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  inputWrap: {
    position: 'relative',
    width: '100%',
  },
  inputWithAccessory: {
    paddingRight: spacing.xl,
  },
  rightAccessory: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helper: {
    marginTop: spacing.xs,
  },
});
