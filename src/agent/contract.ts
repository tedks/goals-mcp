// SPDX-FileCopyrightText: 2026 Ted Smith
// SPDX-License-Identifier: AGPL-3.0-only

/** Portable API/MCP contract primitives; no database or application dependencies. */

export const SYNCABLE_TABLES = [
  'visions',
  'actions',
  'sprints',
  'metric_templates',
  'metric_values',
  'adaptations',
  'sprint_predictions',
  'postmortems',
] as const;

export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

export const HABIT_DAY_KEY_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export function isCanonicalDayKey(value: unknown): value is string {
  if (typeof value !== 'string' || !HABIT_DAY_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

export const PLANNING_PROMPTS = {
  wish: 'What do you want to achieve, for your own reasons?',
  outcome: 'Picture the best result. What would achieving this wish mean to you?',
  obstacle: 'Imagine the sprint ended with this action undone. What habit, feeling or belief in you most likely got in the way?',
  plan: 'If that obstacle appears, what specific response do you want to try? Discuss any relevant past strategies.',
  choice: 'Obstacle planning is optional. Ask whether the person wants to add a plan or skip; never invent an answer or silently choose for them.',
  review: 'Help the person reflect on what worked and what got in the way. The person completes the review in Goals; an agent cannot mark it complete.',
};
