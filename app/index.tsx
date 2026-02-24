import { ScrollView } from 'react-native';
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
      </YStack>
    </ScrollView>
  );
}
