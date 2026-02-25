import type { ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from 'tamagui';

import { radii, spacing, touchTargets, typeScale } from '../../theme/tokens';
import { Text } from './text';

type NativeInputProps = ComponentProps<typeof TextInput>;

type InputProps = NativeInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export function Input({ label, helperText, errorText, style, ...inputProps }: InputProps) {
  const theme = useTheme();
  const describedByText = errorText ?? helperText;

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="footnote" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TextInput
        allowFontScaling
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        accessibilityHint={inputProps.accessibilityHint ?? describedByText}
        placeholderTextColor={theme.placeholderColor?.val ?? theme.textSecondary?.val}
        style={[
          styles.input,
          {
            color: theme.color?.val,
            backgroundColor: theme.surface?.val ?? theme.background?.val,
            borderColor: errorText ? theme.danger?.val : theme.borderColor?.val,
          },
          style,
        ]}
        {...inputProps}
      />

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
  helper: {
    marginTop: spacing.xs,
  },
});
