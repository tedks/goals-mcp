// SPDX-FileCopyrightText: 2026 Ted Smith
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from 'zod';
import { SYNCABLE_TABLES, isCanonicalDayKey } from './contract';

export const text = (max: number) => z.string().max(max).refine(
  (value) => !value.includes('\u0000') && !/[\uD800-\uDFFF]/u.test(value),
  'Use valid Unicode text without NUL characters or unpaired surrogates.',
);
export const recordId = text(1024).min(1);
const newId = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
export const version = z.string().max(19).regex(/^[1-9][0-9]*$/).describe('sync_version from the most recent read. Re-read on a version_conflict.');
export const collection = z.enum(SYNCABLE_TABLES);
const title = text(500).trim().min(1);
const reflection = text(20000).trim().min(1, 'Record the person’s own answer; blank reflection is not allowed.');
const obstaclePlans = z.array(z.strictObject({ obstacle: text(4000).trim(), if_then_plan: text(4000).trim() })).max(50)
  .describe('Ask the person what could get in the way and what response they want to try. Use their answers; an explicit empty list means they chose to skip optional obstacle planning. Never invent answers or silently skip.');
const due = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('sprint_end'), due_at: z.null() }),
  z.strictObject({ type: z.literal('date_time'), due_at: z.iso.datetime({ offset: true }) }),
]);
const recurrence = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('daily') }),
  z.strictObject({ type: z.literal('n_per_week'), n: z.number().int().min(1).max(7) }),
  z.strictObject({ type: z.literal('specific_days'), days: z.array(z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ])).min(1).max(7).refine((days) => new Set(days).size === days.length, 'Days must be unique.') }),
]);
const common = { title, primary_vision_id: recordId, notes: text(20000), obstacle_plans: obstaclePlans };
const taskFields = { due, effort_user: z.number().int().min(1).max(5), blocked_by: z.array(recordId).max(100) };

export const visionContent = z.object({ title, wish_text: reflection, outcome_text: reflection });
export const createVision = visionContent.extend({ id: newId }).strict();
export const updateVision = z.strictObject({
  expected_version: version, title: title.optional(), wish_text: reflection.optional(), outcome_text: reflection.optional(),
}).refine((input) => Object.keys(input).length > 1, 'Provide at least one field to update.');

const createCommon = { ...common, id: newId, notes: common.notes.default(''), obstacle_plans: obstaclePlans };
export const createAction = z.discriminatedUnion('type', [
  z.strictObject({ ...createCommon, type: z.literal('task'),
    due: due.default({ type: 'sprint_end', due_at: null }), effort_user: taskFields.effort_user.default(3),
    blocked_by: taskFields.blocked_by.default([]) }),
  z.strictObject({ ...createCommon, type: z.literal('habit'), recurrence }),
]);
export const updateTask = z.strictObject({ ...common, ...taskFields, status: z.enum(['open', 'done']), archived: z.boolean() })
  .partial().extend({ expected_version: version });
export const updateHabit = z.strictObject({ ...common, recurrence, archived: z.boolean() })
  .partial().extend({ expected_version: version });
export const updateAction = z.union([updateTask, updateHabit])
  .refine((input) => Object.keys(input).length > 1, 'Provide at least one field to update.');
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isCanonicalDayKey, 'Use a real calendar day (YYYY-MM-DD).');
export const checkIn = z.strictObject({
  day_boundary_time: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)
    .describe('The person’s day boundary from Goals Settings (HH:MM). Settings are device-local; confirm this value with the person.'),
  expected_version: version, completed: z.boolean(), timezone: z.string().min(1).max(100).refine((zone) => {
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true; } catch { return false; }
  }, 'Use a valid IANA timezone.'),
});

export const writeSchemas = { create_vision: createVision, update_vision: updateVision,
  create_action: createAction, update_action: updateAction, set_habit_check_in: checkIn };

export function apiSchema() {
  return { version: '1', collections: SYNCABLE_TABLES,
    inputs: Object.fromEntries(Object.entries(writeSchemas).map(([name, schema]) =>
      [name, z.toJSONSchema(schema, { io: 'input' })])),
  };
}
