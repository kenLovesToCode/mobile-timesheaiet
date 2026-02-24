import { eq } from 'drizzle-orm';

import { db } from '../client';
import { devSmokeRecords } from '../schema';
import {
  DevSmokeValidationError,
  parseCreateDevSmokeRecordInput,
} from '../validation/dev-smoke';

export async function createDevSmokeRecord(input: unknown) {
  const payload = parseCreateDevSmokeRecordInput(input);

  await db
    .insert(devSmokeRecords)
    .values({
      id: payload.id,
      label: payload.label,
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: devSmokeRecords.id,
      set: {
        label: payload.label,
        createdAt: Date.now(),
      },
    });

  return payload;
}

export async function getDevSmokeRecordById(id: string) {
  const rows = await db.select().from(devSmokeRecords).where(eq(devSmokeRecords.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function runDevSmokeRepositoryDemo() {
  const demoId = `dev-smoke-record-${Date.now()}`;

  const created = await createDevSmokeRecord({
    id: demoId,
    label: 'SQLite + Drizzle ready',
  });
  const readBack = await getDevSmokeRecordById(demoId);

  let validationErrorSummary = '';

  try {
    await createDevSmokeRecord({
      id: demoId,
      label: '',
    });
  } catch (error) {
    if (error instanceof DevSmokeValidationError) {
      validationErrorSummary = error.message;
    } else {
      throw error;
    }
  }

  if (!validationErrorSummary) {
    throw new Error('Dev smoke validation check did not reject invalid input');
  }

  await db.delete(devSmokeRecords).where(eq(devSmokeRecords.id, demoId));

  return {
    created,
    readBack,
    validationErrorSummary,
  };
}
