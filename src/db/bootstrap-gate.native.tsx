import { PropsWithChildren, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { Paragraph, YStack } from 'tamagui';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
import { runDevSmokeRepositoryDemo } from './repositories/dev-smoke-repository';
import migrations from '../../drizzle/migrations';

export function DatabaseBootstrapGate({ children }: PropsWithChildren) {
  const hasRunDevSmoke = useRef(false);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!error || !__DEV__) {
      return;
    }

    console.error('[db] Migration initialization failed', error);
  }, [error]);

  useEffect(() => {
    if (!__DEV__ || !success || hasRunDevSmoke.current) {
      return;
    }

    hasRunDevSmoke.current = true;

    void runDevSmokeRepositoryDemo()
      .then((result) => {
        console.log('[db] Dev smoke create/read succeeded', result.created, result.readBack);
        if (!result.validationErrorSummary) {
          throw new Error('Dev smoke invalid payload check produced no validation error summary');
        }

        console.log('[db] Dev smoke invalid payload rejected', result.validationErrorSummary);
      })
      .catch((devSmokeError) => {
        console.error('[db] Dev smoke demo failed', devSmokeError);
      });
  }, [success]);

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$3">
        <Paragraph fontWeight="700">Database initialization failed</Paragraph>
        <Paragraph textAlign="center">
          Migrations did not complete. Check the dev console for error details.
        </Paragraph>
      </YStack>
    );
  }

  if (!success) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$3">
        <ActivityIndicator accessibilityRole="progressbar" />
        <Paragraph>Preparing local database...</Paragraph>
      </YStack>
    );
  }

  return children;
}
