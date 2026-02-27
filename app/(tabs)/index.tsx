import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';

import { Surface } from '../../src/components/ui/surface';
import { Text } from '../../src/components/ui/text';
import { Button } from '../../src/components/ui/button';
import { spacing } from '../../src/theme/tokens';

export default function HomeTabScreen() {
  const theme = useTheme();
  const router = useRouter();

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
              Scan fast, compare prices, and keep your shopping list focused.
            </Text>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Start Scanning</Text>
            <Text variant="footnote" tone="secondary" style={{ marginTop: spacing.xs }}>
              Start with Scan, then jump to Stores or Shopping when needed.
            </Text>

            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Button
                onPress={() => router.push('/scan')}
                accessibilityLabel="Go to Scan"
                testID="home-primary-cta-scan"
              >
                Go to Scan
              </Button>

              <Button
                variant="secondary"
                onPress={() => router.push('/stores')}
                accessibilityLabel="Go to Stores"
                testID="home-secondary-cta-stores"
              >
                Go to Stores
              </Button>

              <Button
                variant="secondary"
                onPress={() => router.push('/shopping-list')}
                accessibilityLabel="Go to Shopping"
                testID="home-secondary-cta-shopping"
              >
                Go to Shopping
              </Button>

              <Button
                variant="secondary"
                onPress={() => router.push('/products')}
                accessibilityLabel="Go to Products"
                testID="home-secondary-cta-products"
              >
                Go to Products
              </Button>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
