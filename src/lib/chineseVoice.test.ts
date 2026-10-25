import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  KEGEL_PHASE_LINE,
  STAND_UP_LINE,
  pickChineseFemaleVoice,
  scoreChineseFemaleVoice,
  type VoiceLike,
} from './chineseVoice.ts';

const xiaoxiao: VoiceLike = { name: 'Microsoft Xiaoxiao Online', lang: 'zh-CN', localService: true };
const kangkang: VoiceLike = { name: 'Microsoft Kangkang - Chinese', lang: 'zh-CN' };
const google: VoiceLike = { name: 'Google 普通话（中国大陆）', lang: 'zh-CN' };
const tingting: VoiceLike = { name: 'Ting-Ting', lang: 'zh-CN', localService: true };
const generic: VoiceLike = { name: 'Chinese (China)', lang: 'zh-CN' };
const english: VoiceLike = { name: 'Google UK English Female', lang: 'en-GB' };

test('kegel and stand-up lines stay plain Chinese', () => {
  assert.deepEqual(KEGEL_PHASE_LINE, { inhale: '收缩', hold: '保持', exhale: '放松' });
  assert.equal(STAND_UP_LINE, '该站起来了，去做冥想');
});

test('picks a named mainland female voice over a male voice', () => {
  const picked = pickChineseFemaleVoice([kangkang, english, xiaoxiao]);
  assert.equal(picked?.name, xiaoxiao.name);
});

test('uses the built-in Google Mandarin voice when it is the only Chinese one', () => {
  const picked = pickChineseFemaleVoice([english, google]);
  assert.equal(picked?.name, google.name);
  assert.ok(scoreChineseFemaleVoice(google) > 0);
});

test('uses Ting-Ting and prefers her over an unmarked Chinese voice', () => {
  assert.equal(pickChineseFemaleVoice([tingting])?.name, tingting.name);
  assert.equal(pickChineseFemaleVoice([generic, tingting])?.name, tingting.name);
});

test('accepts an unmarked zh-CN voice so common phones still speak', () => {
  assert.equal(pickChineseFemaleVoice([generic])?.name, generic.name);
});

test('returns null when Chinese voices are all male or missing', () => {
  assert.equal(pickChineseFemaleVoice([kangkang, { name: 'Yunyang', lang: 'zh-CN' }]), null);
  assert.equal(pickChineseFemaleVoice([english]), null);
  assert.equal(pickChineseFemaleVoice([]), null);
  assert.equal(scoreChineseFemaleVoice(kangkang), 0);
});
