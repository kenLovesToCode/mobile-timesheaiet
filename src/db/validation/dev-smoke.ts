import * as z from 'zod';

export const createDevSmokeRecordSchema = z.object({
  id: z.string().min(1, 'id is required'),
  label: z
    .string()
    .trim()
    .min(1, 'label is required')
    .max(120, 'label must be 120 characters or fewer'),
});

export type CreateDevSmokeRecordInput = z.infer<typeof createDevSmokeRecordSchema>;

export class DevSmokeValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Invalid dev smoke payload: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'DevSmokeValidationError';
    this.issues = issues;
  }
}

export function parseCreateDevSmokeRecordInput(input: unknown): CreateDevSmokeRecordInput {
  const result = createDevSmokeRecordSchema.safeParse(input);

  if (!result.success) {
    throw new DevSmokeValidationError(result.error.issues);
  }

  return result.data;
}
