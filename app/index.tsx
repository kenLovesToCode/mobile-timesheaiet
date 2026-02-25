import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { H1, Paragraph, YStack } from 'tamagui';

import { PrimaryNavLink } from '../src/components/shell/primary-nav-link';

const primaryRoutes = [
  { href: '/stores' as const, label: 'Open Stores' },
  { href: '/scan' as const, label: 'Open Scan' },
  { href: '/results' as const, label: 'Open Results' },
  { href: '/add-price' as const, label: 'Open Add Price' },
  { href: '/shopping-list' as const, label: 'Open Shopping List' },
];

export default function Index() {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <YStack gap="$4" padding="$4">
          <H1 selectable>PriceTag</H1>
          <Paragraph selectable>
            Start building the offline-first price scanning experience.
          </Paragraph>
          <Paragraph theme="alt2" selectable>
            Use the links below to validate navigation transitions across primary shell routes.
          </Paragraph>

          {primaryRoutes.map((route) => (
            <PrimaryNavLink key={route.href} href={route.href} label={route.label} />
          ))}

          {__DEV__ ? (
            <PrimaryNavLink
              href="/dev/device-smoke"
              label="Open device smoke screen (camera permission + haptics)"
            />
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
