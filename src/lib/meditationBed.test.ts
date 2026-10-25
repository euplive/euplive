import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MEDITATION_AUDIBLE_START_SEC,
  MEDITATION_TRACK_SRC,
  meditationPlayhead,
} from './meditationBed.ts';

test('meditation starts past the silent intro and keeps a later playhead', () => {
  assert.equal(MEDITATION_AUDIBLE_START_SEC, 12);
  assert.equal(meditationPlayhead(0), 12);
  assert.equal(meditationPlayhead(4.5), 12);
  assert.equal(meditationPlayhead(12), 12);
  assert.equal(meditationPlayhead(48), 48);
  assert.equal(meditationPlayhead(Number.NaN), 12);
});

test('meditation track stays on the repo mp3 path', () => {
  assert.equal(MEDITATION_TRACK_SRC, '/audio/meditation-rest-now.mp3');
});
