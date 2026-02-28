import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'tamagui';

import { radii, spacing } from '../../theme/tokens';
import { Text } from './text';
import type { TextTone } from './text';

type ListRowTone = 'neutral' | 'missing' | 'secondary';

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  stateLabel?: string;
  tone?: ListRowTone;
  onPress?: () => void;
  rightAccessory?: ReactNode;
  showChevronWhenPressable?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  subtitle,
  meta,
  stateLabel,
  tone = 'neutral',
  onPress,
  rightAccessory,
  showChevronWhenPressable = true,
  accessibilityLabel,
  testID,
  style,
}: ListRowProps) {
  const theme = useTheme();
  const isPressable = typeof onPress === 'function';

  let stateTone: TextTone = 'primary';
  if (tone === 'missing') stateTone = 'warning';
  if (tone === 'secondary') stateTone = 'secondary';

  const baseStyles: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: theme.surface?.val ?? theme.background?.val,
      borderColor: theme.borderColor?.val,
    },
    style,
  ];

  if (isPressable) {
    const derivedAccessibilityLabel =
      accessibilityLabel ?? [title, stateLabel, meta, subtitle].filter(Boolean).join(', ');

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={derivedAccessibilityLabel}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [...baseStyles, { opacity: pressed ? 0.92 : 1 }]}
      >
        <ListRowContent
          title={title}
          subtitle={subtitle}
          meta={meta}
          stateLabel={stateLabel}
          stateTone={stateTone}
          rightAccessory={rightAccessory}
          showChevron={showChevronWhenPressable}
        />
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={baseStyles}>
      <ListRowContent
        title={title}
        subtitle={subtitle}
        meta={meta}
        stateLabel={stateLabel}
        stateTone={stateTone}
        rightAccessory={rightAccessory}
      />
    </View>
  );
}

type ListRowContentProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  stateLabel?: string;
  stateTone: TextTone;
  rightAccessory?: ReactNode;
  showChevron?: boolean;
};

function ListRowContent({
  title,
  subtitle,
  meta,
  stateLabel,
  stateTone,
  rightAccessory,
  showChevron = false,
}: ListRowContentProps) {
  return (
    <>
      <View style={styles.main}>
        <Text variant="headline">{title}</Text>
        {subtitle ? <Text variant="footnote" tone="secondary">{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {meta ? <Text variant="caption" tone="secondary">{meta}</Text> : null}
        {stateLabel ? <Text variant="footnote" tone={stateTone}>{stateLabel}</Text> : null}
        {rightAccessory}
        {showChevron ? (
          <Text
            variant="footnote"
            tone="secondary"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            ›
          </Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  main: {
    flex: 1,
    gap: spacing.xxs,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
