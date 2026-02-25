import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';

import { PrimaryNavLink } from '../src/components/shell/primary-nav-link';
import { Surface } from '../src/components/ui/surface';
import { Text } from '../src/components/ui/text';
import { spacing } from '../src/theme/tokens';

const primaryRoutes = [
  { href: '/stores' as const, label: 'Open Stores' },
  { href: '/scan' as const, label: 'Open Scan' },
  { href: '/results' as const, label: 'Open Results' },
  { href: '/add-price' as const, label: 'Open Add Price' },
  { href: '/shopping-list' as const, label: 'Open Shopping List' },
];

export default function Index() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md }}
      >
        <View style={{ gap: spacing.md }}>
          <Surface>
            <Text variant="largeTitle" selectable>
              PriceTag
            </Text>
            <Text variant="body" selectable style={{ marginTop: spacing.xs }}>
            Start building the offline-first price scanning experience.
            </Text>
            <Text variant="footnote" tone="secondary" selectable style={{ marginTop: spacing.xs }}>
            Use the links below to validate navigation transitions across primary shell routes.
            </Text>
          </Surface>

          <Surface variant="subtle">
          {primaryRoutes.map((route) => (
            <PrimaryNavLink key={route.href} href={route.href} label={route.label} />
          ))}

          {__DEV__ ? (
            <PrimaryNavLink
              href="/dev/device-smoke"
              label="Open device smoke screen (camera permission + haptics)"
            />
          ) : null}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
