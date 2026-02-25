import { ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { H1, Paragraph, YStack } from 'tamagui';

export default function Index() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <YStack gap="$4" padding="$4">
        <H1 selectable>PriceTag</H1>
        <Paragraph selectable>
          Start building the offline-first price scanning experience.
        </Paragraph>
        <Paragraph theme="alt2" selectable>
          Placeholder home screen only. Scanning and item-entry actions are added in later stories.
        </Paragraph>
        {__DEV__ ? (
          <Link href="/dev/device-smoke" asChild>
            <Paragraph selectable textDecorationLine="underline">
              Open device smoke screen (camera permission + haptics)
            </Paragraph>
          </Link>
        ) : null}
      </YStack>
    </ScrollView>
  );
}
