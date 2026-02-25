import { Link } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { H1, Paragraph, YStack } from 'tamagui';

const primaryRoutes = [
  { href: '/stores' as const, label: 'Open Stores' },
  { href: '/scan' as const, label: 'Open Scan' },
  { href: '/results' as const, label: 'Open Results' },
  { href: '/add-price' as const, label: 'Open Add Price' },
  { href: '/shopping-list' as const, label: 'Open Shopping List' },
];

export default function Index() {
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
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
            <Link key={route.href} href={route.href} asChild>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#2F6FEB',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Paragraph selectable={false}>{route.label}</Paragraph>
              </Pressable>
            </Link>
          ))}

          {__DEV__ ? (
            <Link href="/dev/device-smoke" asChild>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#2F6FEB',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Paragraph selectable={false}>
                  Open device smoke screen (camera permission + haptics)
                </Paragraph>
              </Pressable>
            </Link>
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
