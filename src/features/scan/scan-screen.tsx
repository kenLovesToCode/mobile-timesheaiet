import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import { getActiveStoreCount } from '../../db/repositories/store-repository';
import { spacing } from '../../theme/tokens';

type ScanGateState =
  | { status: 'loading' }
  | { status: 'blocked' }
  | { status: 'ready'; activeStoreCount: number }
  | { status: 'error' };

export function ScanFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [gateState, setGateState] = useState<ScanGateState>({ status: 'loading' });

  async function loadGateState() {
    setGateState({ status: 'loading' });

    try {
      const activeStoreCount = await getActiveStoreCount();

      if (activeStoreCount < 1) {
        setGateState({ status: 'blocked' });
        return;
      }

      setGateState({ status: 'ready', activeStoreCount });
    } catch (error) {
      console.error('[scan] Failed to load active store gate', error);
      setGateState({ status: 'error' });
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadGateState();
    }, [])
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}
      >
        <Surface>
          <Text variant="title">Scan</Text>
          <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
            Scan entry stays feature-driven while camera permissions and capture flow land in later
            stories.
          </Text>
        </Surface>

        <Surface variant="subtle" style={styles.stateCard}>
          {gateState.status === 'loading' ? (
            <View style={styles.centerState}>
              <ActivityIndicator accessibilityRole="progressbar" />
              <Text variant="footnote" tone="secondary">
                Checking active stores...
              </Text>
            </View>
          ) : null}

          {gateState.status === 'blocked' ? (
            <View style={styles.stack}>
              <Text variant="headline">Activate a store to start scanning</Text>
              <Text variant="body">
                Choose at least one active store so scan results stay relevant to where you shop.
              </Text>
              <Button
                accessibilityLabel="Manage stores"
                onPress={() => router.push('/stores')}
                testID="scan-gate-manage-stores-button"
              >
                Manage Stores
              </Button>
            </View>
          ) : null}

          {gateState.status === 'ready' ? (
            <View style={styles.stack}>
              <Text variant="headline">Scan is ready</Text>
              <Text variant="body">
                {gateState.activeStoreCount} active store
                {gateState.activeStoreCount === 1 ? '' : 's'} found. Camera capture UI will plug
                into this entry state in a later story.
              </Text>
              <Text variant="footnote" tone="secondary">
                Next step placeholder: request camera permission, then open barcode scanner.
              </Text>
            </View>
          ) : null}

          {gateState.status === 'error' ? (
            <View style={styles.stack}>
              <Text variant="headline" tone="danger">
                Could not load scan readiness
              </Text>
              <Text variant="footnote" tone="secondary">
                Try again after returning to this screen.
              </Text>
              <Button
                variant="secondary"
                accessibilityLabel="Retry scan readiness check"
                onPress={() => void loadGateState()}
                testID="scan-gate-retry-button"
              >
                Retry
              </Button>
            </View>
          ) : null}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  stateCard: {
    marginTop: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
});
