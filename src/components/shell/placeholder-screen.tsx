import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { H2, Paragraph, YStack } from 'tamagui';

type PlaceholderScreenProps = {
  title: string;
  description: string;
};

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <YStack gap="$3" padding="$4">
          <H2 selectable>{title}</H2>
          <Paragraph selectable>{description}</Paragraph>
          <Paragraph theme="alt2" selectable>
            Placeholder scaffold for Story 1.4. Feature behavior arrives in later stories.
          </Paragraph>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
