import { createFont } from 'tamagui';

import { typeScale } from './tokens';

const baseSize = {
  1: typeScale.caption.fontSize,
  2: typeScale.footnote.fontSize,
  3: typeScale.callout.fontSize,
  4: typeScale.body.fontSize,
  5: typeScale.titleSm.fontSize,
  6: typeScale.titleLg.fontSize,
  7: typeScale.largeTitle.fontSize,
  true: typeScale.body.fontSize,
} as const;

const baseLineHeight = {
  1: typeScale.caption.lineHeight,
  2: typeScale.footnote.lineHeight,
  3: typeScale.callout.lineHeight,
  4: typeScale.body.lineHeight,
  5: typeScale.titleSm.lineHeight,
  6: typeScale.titleLg.lineHeight,
  7: typeScale.largeTitle.lineHeight,
  true: typeScale.body.lineHeight,
} as const;

const letterSpacing = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0.2,
  6: 0.2,
  7: 0.37,
  true: 0,
} as const;

const bodyFont = createFont({
  family: 'System',
  size: baseSize,
  lineHeight: baseLineHeight,
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    true: '400',
  },
  letterSpacing,
});

const headingFont = createFont({
  family: 'System',
  size: baseSize,
  lineHeight: baseLineHeight,
  weight: {
    4: '600',
    5: '600',
    6: '700',
    7: '700',
    true: '600',
  },
  letterSpacing,
});

export const appFonts = {
  body: bodyFont,
  heading: headingFont,
};
