import { createTokens } from 'tamagui';

export const colorPalette = {
  green500: '#34C759',
  green600: '#29A74A',
  bgLight: '#F2F7F3',
  bgDark: '#000000',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1C1C1E',
  textLight: '#1C1C1E',
  textDark: '#FFFFFF',
  textSecondaryLight: '#6D6D72',
  textSecondaryDark: '#A1A1A6',
  borderLight: '#D1D6D1',
  borderDark: '#2C2C2E',
  warningLight: '#FFCC00',
  warningDark: '#FFD60A',
  dangerLight: '#FF3B30',
  dangerDark: '#FF453A',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
} as const;

export const typeScale = {
  caption: { fontSize: 12, lineHeight: 16 },
  footnote: { fontSize: 13, lineHeight: 18 },
  callout: { fontSize: 16, lineHeight: 22 },
  body: { fontSize: 17, lineHeight: 24 },
  headline: { fontSize: 17, lineHeight: 22 },
  titleSm: { fontSize: 22, lineHeight: 28 },
  titleLg: { fontSize: 28, lineHeight: 34 },
  largeTitle: { fontSize: 34, lineHeight: 41 },
  button: { fontSize: 16, lineHeight: 20 },
} as const;

export const touchTargets = {
  min: 44,
} as const;

export const appTokens = createTokens({
  color: {
    true: colorPalette.textLight,
    ...colorPalette,
  },
  space: {
    0: 0,
    1: spacing.xxs,
    2: spacing.xs,
    3: spacing.sm,
    4: spacing.md,
    5: spacing.lg,
    6: spacing.xl,
    7: 40,
    8: touchTargets.min,
    9: 48,
    true: spacing.md,
  },
  size: {
    0: 0,
    1: typeScale.caption.fontSize,
    2: typeScale.footnote.fontSize,
    3: typeScale.callout.fontSize,
    4: typeScale.body.fontSize,
    5: typeScale.titleSm.fontSize,
    6: typeScale.titleLg.fontSize,
    7: typeScale.largeTitle.fontSize,
    8: touchTargets.min,
    true: typeScale.body.fontSize,
  },
  radius: {
    0: 0,
    1: radii.sm,
    2: radii.md,
    3: radii.lg,
    4: 16,
    true: radii.lg,
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 100,
    3: 1000,
    true: 1,
  },
});
