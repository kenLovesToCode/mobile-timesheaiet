import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { Surface } from '../../src/components/ui/surface';
import { Text } from '../../src/components/ui/text';
import { Button } from '../../src/components/ui/button';
import { importBackupJson, exportBackupJson, type ImportSummary } from '../../src/db/repositories/backup-repository';
import { spacing } from '../../src/theme/tokens';

function formatImportSummary(summary: ImportSummary): string {
  return [
    `Inserted - stores:${summary.inserted.stores}, products:${summary.inserted.products}, prices:${summary.inserted.prices}, recentScans:${summary.inserted.recentScans}, shoppingLists:${summary.inserted.shoppingLists}, shoppingListItems:${summary.inserted.shoppingListItems}`,
    `Skipped  - stores:${summary.skipped.stores}, products:${summary.skipped.products}, prices:${summary.skipped.prices}, recentScans:${summary.skipped.recentScans}, shoppingLists:${summary.skipped.shoppingLists}, shoppingListItems:${summary.skipped.shoppingListItems}`,
  ].join('\n');
}

export default function HomeTabScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExportToFile() {
    setBackupMessage(null);
    setIsExporting(true);

    try {
      const json = await exportBackupJson();
      const directory = FileSystem.documentDirectory;
      if (!directory) {
        throw new Error('Local document directory is unavailable.');
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileUri = `${directory}pricetag-backup-${stamp}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save PriceTag backup',
          UTI: 'public.json',
        });
        setBackupMessage('Exported backup file and opened Save/Share dialog.');
      } else {
        setBackupMessage(`Exported backup file to: ${fileUri}`);
      }
    } catch (error) {
      console.error('[backup] Failed to export data to file', error);
      if (error instanceof Error) {
        setBackupMessage(`Could not export file: ${error.message}`);
      } else {
        setBackupMessage('Could not export file right now.');
      }
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFromFile() {
    setBackupMessage(null);
    setIsImporting(true);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (picked.canceled) {
        setBackupMessage('Import cancelled.');
        return;
      }

      const fileUri = picked.assets[0]?.uri;
      if (!fileUri) {
        throw new Error('Could not read selected file.');
      }

      const json = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const summary = await importBackupJson(json);
      setBackupMessage(`Import complete from file.\n${formatImportSummary(summary)}`);
    } catch (error) {
      console.error('[backup] Failed to import data from file', error);
      if (error instanceof Error) {
        setBackupMessage(`Import failed: ${error.message}`);
      } else {
        setBackupMessage('Import failed due to an unknown error.');
      }
    } finally {
      setIsImporting(false);
    }
  }

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

          <Surface variant="subtle">
            <Text variant="headline">Backup</Text>
            <Text variant="footnote" tone="secondary" style={{ marginTop: spacing.xs }}>
              Import/export backup file with merge rules: existing device data always wins.
            </Text>

            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Button
                variant="secondary"
                onPress={() => void handleExportToFile()}
                disabled={isExporting}
                accessibilityLabel="Export data to file"
                testID="home-backup-export-file"
              >
                {isExporting ? 'Exporting...' : 'Export to File'}
              </Button>

              <Button
                variant="secondary"
                onPress={() => void handleImportFromFile()}
                disabled={isImporting}
                accessibilityLabel="Import data from file"
                testID="home-backup-import-file"
              >
                {isImporting ? 'Importing...' : 'Import from File'}
              </Button>

              {backupMessage ? (
                <Text variant="caption" tone="secondary" selectable>
                  {backupMessage}
                </Text>
              ) : null}
            </View>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
