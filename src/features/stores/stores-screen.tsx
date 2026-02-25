import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import { StoreValidationError } from '../../db/validation/stores';
import {
  createStore,
  listStores,
  toggleStoreActive,
  updateStoreName,
  type StoreListItem,
} from '../../db/repositories/store-repository';
import { spacing } from '../../theme/tokens';

export function StoresFeatureScreen() {
  const theme = useTheme();
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [busyStoreId, setBusyStoreId] = useState<number | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function loadStores() {
    setScreenError(null);

    try {
      const rows = await listStores();
      setStores(rows);
    } catch (error) {
      console.error('[stores] Failed to load stores', error);
      setScreenError('Could not load stores right now.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStores();
  }, []);

  async function handleAddStore() {
    if (isAddingStore) {
      return;
    }

    setAddError(null);
    setScreenError(null);
    setIsAddingStore(true);

    try {
      await createStore({ name: addName });
      setAddName('');
      await loadStores();
    } catch (error) {
      if (error instanceof StoreValidationError) {
        setAddError(error.message);
        return;
      }

      console.error('[stores] Failed to create store', error);
      setScreenError('Could not save store right now.');
    } finally {
      setIsAddingStore(false);
    }
  }

  function startEditing(store: StoreListItem) {
    setEditingStoreId(store.id);
    setEditName(store.name);
    setEditError(null);
  }

  function cancelEditing() {
    setEditingStoreId(null);
    setEditName('');
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (editingStoreId == null || isSavingEdit) {
      return;
    }

    setEditError(null);
    setScreenError(null);
    setBusyStoreId(editingStoreId);
    setIsSavingEdit(true);

    try {
      await updateStoreName({ id: editingStoreId, name: editName });
      cancelEditing();
      await loadStores();
    } catch (error) {
      if (error instanceof StoreValidationError) {
        setEditError(error.message);
        return;
      }

      console.error('[stores] Failed to update store', error);
      setScreenError('Could not update store right now.');
    } finally {
      setIsSavingEdit(false);
      setBusyStoreId(null);
    }
  }

  async function handleToggleStore(store: StoreListItem, nextValue: boolean) {
    setScreenError(null);
    setBusyStoreId(store.id);

    try {
      await toggleStoreActive({ id: store.id, isActive: nextValue });
      await loadStores();
    } catch (error) {
      console.error('[stores] Failed to toggle store state', error);
      setScreenError('Could not update store status right now.');
    } finally {
      setBusyStoreId(null);
    }
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.stack}>
          <Surface>
            <Text variant="title">Stores</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
              Add stores you shop at and mark at least one as active before scanning.
            </Text>

            <View style={styles.formStack}>
              <Input
                label="Store name"
                value={addName}
                onChangeText={setAddName}
                autoCapitalize="words"
                placeholder="e.g. Trader Joe's"
                returnKeyType="done"
                onSubmitEditing={() => void handleAddStore()}
                errorText={addError ?? undefined}
                testID="store-name-input"
              />
              <Button
                accessibilityLabel="Save store"
                disabled={isAddingStore}
                onPress={() => void handleAddStore()}
                testID="save-store-button"
              >
                Save Store
              </Button>
            </View>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Saved stores</Text>
            <Text variant="caption" tone="secondary" style={styles.sectionLead}>
              Tap a row to edit the name. Use the switch to change active status.
            </Text>

            {screenError ? (
              <Text variant="footnote" tone="danger" style={styles.feedbackText}>
                {screenError}
              </Text>
            ) : null}

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator accessibilityRole="progressbar" />
                <Text variant="footnote" tone="secondary">
                  Loading stores...
                </Text>
              </View>
            ) : stores.length === 0 ? (
              <View style={styles.centerState}>
                <Text variant="body">No stores saved yet.</Text>
                <Text variant="footnote" tone="secondary">
                  Add your first store above to enable scan gating.
                </Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {stores.map((store) => {
                  const isEditing = editingStoreId === store.id;
                  const isBusy = busyStoreId === store.id;

                  return (
                    <View key={store.id} style={styles.listItemStack}>
                      <ListRow
                        title={store.name}
                        subtitle={isEditing ? 'Editing name' : 'Tap to edit name'}
                        stateLabel={store.isActive ? 'Active' : 'Inactive'}
                        tone={store.isActive ? 'neutral' : 'secondary'}
                        onPress={() => startEditing(store)}
                        accessibilityLabel={`${store.name}, ${
                          store.isActive ? 'Active' : 'Inactive'
                        }. Tap to edit name.`}
                        rightAccessory={
                          <View
                            style={styles.switchAccessory}
                            onStartShouldSetResponder={() => true}
                          >
                            <Text variant="caption" tone="secondary">
                              {store.isActive ? 'On' : 'Off'}
                            </Text>
                            <Switch
                              accessibilityLabel={`Toggle active for ${store.name}`}
                              disabled={isBusy}
                              value={store.isActive}
                              onValueChange={(value) => void handleToggleStore(store, value)}
                              testID={`store-active-switch-${store.id}`}
                            />
                          </View>
                        }
                        testID={`store-row-${store.id}`}
                      />

                      {isEditing ? (
                        <Surface style={styles.editSurface}>
                          <View style={styles.formStack}>
                            <Input
                              label={`Edit ${store.name}`}
                              value={editName}
                              onChangeText={setEditName}
                              autoCapitalize="words"
                              errorText={editError ?? undefined}
                              testID="edit-store-name-input"
                            />
                            <View style={styles.editActions}>
                              <Button
                                variant="secondary"
                                disabled={isSavingEdit}
                                onPress={cancelEditing}
                                accessibilityLabel="Cancel store edit"
                                testID="cancel-edit-store-button"
                              >
                                Cancel
                              </Button>
                              <Button
                                disabled={isSavingEdit}
                                onPress={() => void handleSaveEdit()}
                                accessibilityLabel="Save edited store name"
                                testID="save-edit-store-button"
                              >
                                Save Changes
                              </Button>
                            </View>
                          </View>
                        </Surface>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
  },
  formStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listItemStack: {
    gap: spacing.xs,
  },
  switchAccessory: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  editSurface: {
    marginTop: spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  feedbackText: {
    marginTop: spacing.sm,
  },
  centerState: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
