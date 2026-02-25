import { config as baseConfig } from '@tamagui/config/v3';

import { colorPalette } from './tokens';

const lightBase = baseConfig.themes.light;
const darkBase = baseConfig.themes.dark;

export const appThemes = {
  light: {
    ...lightBase,
    background: colorPalette.bgLight,
    backgroundHover: '#EAF3EC',
    backgroundPress: '#E1EEE5',
    color: colorPalette.textLight,
    colorHover: colorPalette.textLight,
    colorPress: colorPalette.textLight,
    borderColor: colorPalette.borderLight,
    borderColorHover: '#B8C3B8',
    borderColorPress: '#AEB9AE',
    placeholderColor: colorPalette.textSecondaryLight,
    accentBackground: colorPalette.green500,
    accentColor: '#FFFFFF',
    accentBorderColor: colorPalette.green500,
    surface: colorPalette.surfaceLight,
    textPrimary: colorPalette.textLight,
    textSecondary: colorPalette.textSecondaryLight,
    success: colorPalette.green500,
    warning: colorPalette.warningLight,
    danger: colorPalette.dangerLight,
    shadowColor: '#00000020',
  },
  dark: {
    ...darkBase,
    background: colorPalette.bgDark,
    backgroundHover: '#111113',
    backgroundPress: '#1A1A1C',
    color: colorPalette.textDark,
    colorHover: colorPalette.textDark,
    colorPress: colorPalette.textDark,
    borderColor: colorPalette.borderDark,
    borderColorHover: '#3A3A3C',
    borderColorPress: '#48484A',
    placeholderColor: colorPalette.textSecondaryDark,
    accentBackground: colorPalette.green500,
    accentColor: '#FFFFFF',
    accentBorderColor: colorPalette.green500,
    surface: colorPalette.surfaceDark,
    textPrimary: colorPalette.textDark,
    textSecondary: colorPalette.textSecondaryDark,
    success: colorPalette.green500,
    warning: colorPalette.warningDark,
    danger: colorPalette.dangerDark,
    shadowColor: '#00000066',
  },
} as const;
