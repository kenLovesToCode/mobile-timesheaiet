import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { spacing } from "../../theme/tokens";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ListRow } from "../ui/list-row";
import { Surface } from "../ui/surface";
import { Text } from "../ui/text";

type PlaceholderScreenProps = {
  title: string;
  description: string;
};

export function PlaceholderScreen({
  title,
  description,
}: PlaceholderScreenProps) {
  const theme = useTheme();

  const result = {};

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md }}
      >
        <View style={{ gap: spacing.sm }}>
          <Surface>
            <Text variant="title" selectable>
              {title}
            </Text>
            <Text variant="body" selectable style={{ marginTop: spacing.xs }}>
              {description}
            </Text>
            <Text
              variant="footnote"
              tone="secondary"
              selectable
              style={{ marginTop: spacing.xs }}
            >
              Placeholder scaffold for Story 1.5. Feature behavior arrives in
              later stories.
            </Text>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">UI system proof</Text>
            <Text
              variant="footnote"
              tone="secondary"
              style={{ marginTop: spacing.xs }}
            >
              Shared primitives validate token-driven styling consistency across
              placeholder routes.
            </Text>

            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Input
                label="Sample input"
                value={title}
                editable={false}
                helperText="Dynamic Type remains enabled for labels and content."
              />

              <ListRow
                title="Recent price capture"
                subtitle="Aisle-ready placeholder state"
                meta="2d ago"
                stateLabel="Available"
                tone="neutral"
                testID="placeholder-row-available"
              />

              <ListRow
                title="Missing store price"
                subtitle="Requires manual entry"
                stateLabel="Missing"
                tone="missing"
                testID="placeholder-row-missing"
              />

              <Button
                accessibilityLabel="Primary placeholder action"
                disabled
                testID="placeholder-primary-action"
              >
                Primary Action
              </Button>
              <Button
                variant="secondary"
                accessibilityLabel="Secondary placeholder action"
                disabled
                testID="placeholder-secondary-action"
              >
                Secondary Action
              </Button>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
