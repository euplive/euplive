import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  dayKey,
  earlyStand,
  freshWork,
  parseTimer,
  rebaseDurations,
  snapshot,
} from './sedentaryTimer.ts';

const START = 1_700_000_000_000;

function timerAt(work = 40, stand = 20) {
  return freshWork(START, work, stand);
}

test('snapshot stays in the work phase and keeps elapsed time across cycles', () => {
  const timer = timerAt();
  const tenMinutes = START + 10 * 60 * 1000 + 500;
  const snap = snapshot(timer, tenMinutes);
  assert.equal(snap.phase, 'working');
  assert.equal(snap.elapsedInPhase, 600);
  assert.equal(snap.remaining, 30 * 60);

  const twoCyclesLater = START + (120 + 10) * 60 * 1000;
  const wrapped = snapshot(timer, twoCyclesLater);
  assert.equal(wrapped.phase, 'working');
  assert.equal(wrapped.elapsedInPhase, 600);
  assert.equal(wrapped.remaining, 30 * 60);
});

test('lengthening or shortening work keeps elapsed time', () => {
  const now = START + 10 * 60 * 1000 + 400;
  const longer = rebaseDurations(timerAt(), now, 45, 20);
  assert.equal(longer.enteredStanding, false);
  assert.equal(longer.snapshot.phase, 'working');
  assert.equal(longer.snapshot.elapsedInPhase, 600);
  assert.equal(longer.snapshot.remaining, 45 * 60 - 600);

  const shorter = rebaseDurations(timerAt(), now, 30, 20);
  assert.equal(shorter.snapshot.phase, 'working');
  assert.equal(shorter.snapshot.remaining, 20 * 60);

  const later = snapshot(shorter.persisted, now + 60_000);
  assert.equal(later.remaining, shorter.snapshot.remaining - 60);
});

test('work shortened below elapsed time starts standing immediately', () => {
  const now = START + 35 * 60 * 1000;
  const result = rebaseDurations(timerAt(), now, 30, 15);
  assert.equal(result.enteredStanding, true);
  assert.equal(result.snapshot.phase, 'standing');
  assert.equal(result.snapshot.elapsedInPhase, 0);
  assert.equal(result.snapshot.remaining, 15 * 60);
  assert.equal(result.persisted.workMinutes, 30);
  assert.equal(result.persisted.standMinutes, 15);
});

test('changing stand duration during work does not move the work countdown', () => {
  const now = START + 10 * 60 * 1000;
  const result = rebaseDurations(timerAt(), now, 40, 10);
  assert.equal(result.snapshot.phase, 'working');
  assert.equal(result.snapshot.remaining, 30 * 60);
  assert.equal(result.persisted.standMinutes, 10);

  const atStand = snapshot(result.persisted, result.persisted.startTimestamp + 40 * 60 * 1000);
  assert.equal(atStand.phase, 'standing');
  assert.equal(atStand.remaining, 10 * 60);
});

test('stand edits keep elapsed stand time, and a too-short stand starts the next work round', () => {
  const now = START + (40 + 5) * 60 * 1000;
  const current = snapshot(timerAt(), now);
  assert.equal(current.phase, 'standing');
  assert.equal(current.elapsedInPhase, 300);
  assert.equal(current.remaining, 15 * 60);

  const longerWork = rebaseDurations(timerAt(), now, 50, 20);
  assert.equal(longerWork.enteredStanding, false);
  assert.equal(longerWork.snapshot.phase, 'standing');
  assert.equal(longerWork.snapshot.elapsedInPhase, 300);
  assert.equal(longerWork.snapshot.remaining, 15 * 60);

  const shorterStand = rebaseDurations(timerAt(), now, 40, 10);
  assert.equal(shorterStand.snapshot.phase, 'standing');
  assert.equal(shorterStand.snapshot.remaining, 5 * 60);

  const finished = rebaseDurations(timerAt(), now, 40, 5);
  assert.equal(finished.enteredStanding, false);
  assert.equal(finished.snapshot.phase, 'working');
  assert.equal(finished.snapshot.elapsedInPhase, 0);
  assert.equal(finished.snapshot.remaining, 40 * 60);
});

test('fresh work and early stand land on the expected phase', () => {
  const now = START + 5_000;
  const work = snapshot(freshWork(now, 25, 10), now);
  assert.equal(work.phase, 'working');
  assert.equal(work.remaining, 25 * 60);

  const standing = snapshot(earlyStand(now, 40, 20), now);
  assert.equal(standing.phase, 'standing');
  assert.equal(standing.elapsedInPhase, 0);
  assert.equal(standing.remaining, 20 * 60);

  const stillStanding = snapshot(earlyStand(now, 40, 20), now + 60_000);
  assert.equal(stillStanding.phase, 'standing');
  assert.equal(stillStanding.remaining, 19 * 60);
});

test('restarting work ignores how far the previous round had gone', () => {
  const now = START + (40 + 8) * 60 * 1000;
  const restarted = freshWork(now, 40, 20);
  const snap = snapshot(restarted, now);
  assert.equal(snap.phase, 'working');
  assert.equal(snap.elapsedInPhase, 0);
  assert.equal(snap.remaining, 40 * 60);
});

test('dayKey uses the UTC date stored with existing session counts', () => {
  assert.equal(dayKey(Date.UTC(2026, 9, 25, 3, 15, 0)), '2026-10-25');
});

test('parseTimer accepts stored timers and rejects garbage', () => {
  const parsed = parseTimer({
    state: 'standing',
    startTimestamp: START,
    workMinutes: 40,
    standMinutes: 20,
  });
  assert.deepEqual(parsed, {
    state: 'standing',
    startTimestamp: START,
    workMinutes: 40,
    standMinutes: 20,
  });
  assert.equal(parseTimer(null), null);
  assert.equal(parseTimer({ startTimestamp: 'nope', workMinutes: 40, standMinutes: 20 }), null);
  assert.equal(parseTimer({ startTimestamp: START, workMinutes: 0, standMinutes: 20 }), null);
});
