import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildModuleStats,
  parseSessionCount,
  parseWaterGoal,
  parseWaterToday,
  summarizeActivity,
} from './healthGlance.ts';

test('parseSessionCount matches sedentary session storage', () => {
  assert.equal(parseSessionCount(null), 0);
  assert.equal(parseSessionCount(''), 0);
  assert.equal(parseSessionCount('0'), 0);
  assert.equal(parseSessionCount('-2'), 0);
  assert.equal(parseSessionCount('nope'), 0);
  assert.equal(parseSessionCount('4'), 4);
});

test('parseWaterToday reads count and ignores bad payloads', () => {
  assert.equal(parseWaterToday(null), 0);
  assert.equal(parseWaterToday(''), 0);
  assert.equal(parseWaterToday('{'), 0);
  assert.equal(parseWaterToday('{}'), 0);
  assert.equal(parseWaterToday(JSON.stringify({ count: 0, amount: 0 })), 0);
  assert.equal(parseWaterToday(JSON.stringify({ count: 3, amount: 750 })), 3);
  assert.equal(parseWaterToday(JSON.stringify({ count: '5' })), 5);
});

test('parseWaterGoal defaults to 8', () => {
  assert.equal(parseWaterGoal(null), 8);
  assert.equal(parseWaterGoal(''), 8);
  assert.equal(parseWaterGoal('0'), 8);
  assert.equal(parseWaterGoal('abc'), 8);
  assert.equal(parseWaterGoal('10'), 10);
});

test('summarizeActivity counts only present health check-ins', () => {
  assert.deepEqual(
    summarizeActivity([
      { id: 'alarm', status: 'completed' },
      { id: 'shutdown', status: 'completed' },
    ]),
    { completed: 0, total: 0, checkedIn: false },
  );

  assert.deepEqual(
    summarizeActivity([
      { id: 'sedentary', status: 'completed' },
      { id: 'kegel', status: 'pending' },
      { id: 'morning-exercise', status: 'completed' },
      { id: 'meditate', status: 'completed' },
    ]),
    { completed: 2, total: 3, checkedIn: true },
  );

  assert.deepEqual(
    summarizeActivity([
      { id: 'sedentary', status: 'pending' },
      { id: 'kegel', status: 'skipped' },
    ]),
    { completed: 0, total: 2, checkedIn: false },
  );

  assert.deepEqual(summarizeActivity(undefined), { completed: 0, total: 0, checkedIn: false });
});

test('buildModuleStats leads with sedentary, water, and activity', () => {
  const stats = buildModuleStats(
    [
      {
        items: [
          { id: 'alarm', status: 'completed' },
          { id: 'sedentary', status: 'completed' },
          { id: 'kegel', status: 'pending' },
          { id: 'shutdown', status: 'completed' },
          { id: 'meditate', status: 'pending' },
        ],
      },
      {
        items: [
          { id: 'alarm', status: 'pending' },
          { id: 'sedentary', status: 'pending' },
          { id: 'kegel', status: 'completed' },
          { id: 'afternoon-exercise', status: 'completed' },
          { id: 'shutdown', status: 'pending' },
          { id: 'meditate', status: 'completed' },
        ],
      },
    ],
    { cups: 3, goal: 8 },
  );

  assert.deepEqual(
    stats.map((item) => item.label),
    ['久坐', '喝水', '活动', '早起', '提肛', '断电', '冥想'],
  );
  assert.deepEqual(
    stats.map((item) => [item.completed, item.total]),
    [
      [1, 2],
      [3, 8],
      [2, 2],
      [1, 2],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
  );
});

test('empty records keep a calm water goal', () => {
  const stats = buildModuleStats([], { cups: 0, goal: 8 });
  assert.deepEqual(
    stats.map((item) => [item.label, item.completed, item.total]),
    [
      ['久坐', 0, 0],
      ['喝水', 0, 8],
      ['活动', 0, 0],
      ['早起', 0, 0],
      ['提肛', 0, 0],
      ['断电', 0, 0],
      ['冥想', 0, 0],
    ],
  );
});
