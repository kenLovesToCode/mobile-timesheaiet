import type { ComponentProps } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';

import { typeScale } from '../../theme/tokens';

type NativeTextProps = ComponentProps<typeof RNText>;

export type TextVariant =
  | 'largeTitle'
  | 'title'
  | 'headline'
  | 'body'
  | 'callout'
  | 'footnote'
  | 'caption'
  | 'label';

export type TextTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';

type TextProps = NativeTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

const variantStyles = StyleSheet.create({
  largeTitle: {
    fontSize: typeScale.largeTitle.fontSize,
    lineHeight: typeScale.largeTitle.lineHeight,
    fontWeight: '700',
  },
  title: {
    fontSize: typeScale.titleLg.fontSize,
    lineHeight: typeScale.titleLg.lineHeight,
    fontWeight: '700',
  },
  headline: {
    fontSize: typeScale.headline.fontSize,
    lineHeight: typeScale.headline.lineHeight,
    fontWeight: '600',
  },
  body: {
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  callout: {
    fontSize: typeScale.callout.fontSize,
    lineHeight: typeScale.callout.lineHeight,
  },
  footnote: {
    fontSize: typeScale.footnote.fontSize,
    lineHeight: typeScale.footnote.lineHeight,
  },
  caption: {
    fontSize: typeScale.caption.fontSize,
    lineHeight: typeScale.caption.lineHeight,
  },
  label: {
    fontSize: typeScale.button.fontSize,
    lineHeight: typeScale.button.lineHeight,
    fontWeight: '600',
  },
});

function getThemeColor(theme: ReturnType<typeof useTheme>, tone: TextTone) {
  if (tone === 'secondary') return theme.textSecondary?.val ?? theme.color?.val;
  if (tone === 'accent') return theme.accentBackground?.val ?? theme.color?.val;
  if (tone === 'success') return theme.success?.val ?? theme.color?.val;
  if (tone === 'warning') return theme.warning?.val ?? theme.color?.val;
  if (tone === 'danger') return theme.danger?.val ?? theme.color?.val;
  return theme.textPrimary?.val ?? theme.color?.val;
}

export function Text({
  variant = 'body',
  tone = 'primary',
  allowFontScaling = true,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      style={[styles.base, variantStyles[variant], { color: getThemeColor(theme, tone) }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});
