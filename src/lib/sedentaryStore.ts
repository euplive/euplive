import {
  dayKey,
  earlyStand,
  freshWork,
  parseTimer,
  rebaseDurations,
  snapshot,
  type PersistedTimer,
  type TimerPhase,
} from '@/lib/sedentaryTimer';

export interface SedentarySettings {
  enabled: boolean;
  workDuration: number;
  standDuration: number;
  excludeNoon: boolean;
  excludeEvening: boolean;
  excludeNight: boolean;
}

export interface SedentaryView {
  ready: boolean;
  settings: SedentarySettings;
  phase: 'idle' | TimerPhase;
  remaining: number;
  standCount: number;
}

const STORAGE_KEY = 'sedentary_timer';
const SETTINGS_KEY = 'sedentary-settings';
const SESSIONS_PREFIX = 'sedentary-sessions-';

const DEFAULT_SETTINGS: SedentarySettings = {
  enabled: false,
  workDuration: 40,
  standDuration: 20,
  excludeNoon: true,
  excludeEvening: true,
  excludeNight: true,
};

const SERVER_VIEW: SedentaryView = {
  ready: false,
  settings: DEFAULT_SETTINGS,
  phase: 'idle',
  remaining: 0,
  standCount: 0,
};

type Transition = 'stand-up' | 'sit-down';

const listeners = new Set<() => void>();
let cached: SedentaryView | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
// 手动操作会提前记下阶段，秒针只为真正跨阶段的变化发声、计数。
let acknowledgedPhase: SedentaryView['phase'] | null = null;

function stamp(view: SedentaryView): string {
  const settings = view.settings;
  return [
    view.ready,
    view.phase,
    view.remaining,
    view.standCount,
    settings.enabled,
    settings.workDuration,
    settings.standDuration,
    settings.excludeNoon,
    settings.excludeEvening,
    settings.excludeNight,
  ].join('|');
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式写不进去时，页面仍按本次内存结果更新
  }
}

function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // 删不掉时下次读取会再判断
  }
}

function snapMinutes(value: unknown, min: number, max: number, step: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(max, Math.max(min, n));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

function loadSettings(): SedentarySettings {
  const raw = storageGet(SETTINGS_KEY);
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const record = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    return {
      enabled: Boolean(record.enabled),
      workDuration: snapMinutes(record.workDuration, 20, 60, 5, DEFAULT_SETTINGS.workDuration),
      standDuration: snapMinutes(record.standDuration, 5, 30, 5, DEFAULT_SETTINGS.standDuration),
      excludeNoon: record.excludeNoon !== false,
      excludeEvening: record.excludeEvening !== false,
      excludeNight: record.excludeNight !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readSessionCount(day: string): number {
  const raw = storageGet(`${SESSIONS_PREFIX}${day}`);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function readTimer(): PersistedTimer | null {
  const raw = storageGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    const timer = parseTimer(JSON.parse(raw));
    if (!timer) {
      storageRemove(STORAGE_KEY);
      return null;
    }
    return timer;
  } catch {
    return null;
  }
}

function writeTimer(timer: PersistedTimer) {
  storageSet(STORAGE_KEY, JSON.stringify(timer));
}

function writeSettings(settings: SedentarySettings) {
  storageSet(SETTINGS_KEY, JSON.stringify(settings));
}

function activeTimer(now: number): PersistedTimer | null {
  const timer = readTimer();
  if (!timer) return null;
  if (dayKey(timer.startTimestamp) !== dayKey(now)) return null;
  return timer;
}

function compute(): SedentaryView {
  if (typeof window === 'undefined') return SERVER_VIEW;
  const now = Date.now();
  const settings = loadSettings();
  const timer = activeTimer(now);
  const standCount = readSessionCount(dayKey(now));
  if (!timer) {
    return { ready: true, settings, phase: 'idle', remaining: 0, standCount };
  }
  const current = snapshot(timer, now);
  return {
    ready: true,
    settings: {
      ...settings,
      workDuration: snapMinutes(timer.workMinutes, 20, 60, 5, settings.workDuration),
      standDuration: snapMinutes(timer.standMinutes, 5, 30, 5, settings.standDuration),
    },
    phase: current.phase,
    remaining: current.remaining,
    standCount,
  };
}

function publish() {
  const next = compute();
  if (cached && stamp(cached) === stamp(next)) return;
  cached = next;
  listeners.forEach((listener) => listener());
}

function reconcileStorage() {
  const now = Date.now();
  const timer = readTimer();
  if (!timer) return;
  if (dayKey(timer.startTimestamp) !== dayKey(now)) {
    storageRemove(STORAGE_KEY);
    return;
  }
  const settings = loadSettings();
  const workDuration = snapMinutes(timer.workMinutes, 20, 60, 5, settings.workDuration);
  const standDuration = snapMinutes(timer.standMinutes, 5, 30, 5, settings.standDuration);
  if (workDuration !== timer.workMinutes || standDuration !== timer.standMinutes) {
    writeTimer(rebaseDurations(timer, now, workDuration, standDuration).persisted);
  }
  if (workDuration !== settings.workDuration || standDuration !== settings.standDuration) {
    writeSettings({ ...settings, workDuration, standDuration });
  }
}

function bumpStandCount(now: number) {
  const today = dayKey(now);
  storageSet(`${SESSIONS_PREFIX}${today}`, String(readSessionCount(today) + 1));
}

export function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  listeners.add(listener);
  if (listeners.size === 1) {
    reconcileStorage();
    cached = compute();
    acknowledgedPhase = cached.phase;
    intervalId = setInterval(() => {
      reconcileStorage();
      publish();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      cached = null;
    }
  };
}

export function getSnapshot(): SedentaryView {
  if (typeof window === 'undefined') return SERVER_VIEW;
  if (!cached) cached = compute();
  return cached;
}

export function getServerSnapshot(): SedentaryView {
  return SERVER_VIEW;
}

export function consumeNaturalTransition(phase: SedentaryView['phase']): Transition | null {
  const previous = acknowledgedPhase;
  acknowledgedPhase = phase;
  if (previous === 'working' && phase === 'standing') return 'stand-up';
  if (previous === 'standing' && phase === 'working') return 'sit-down';
  return null;
}

export function updateSettings(next: SedentarySettings): boolean {
  const settings: SedentarySettings = {
    ...next,
    workDuration: snapMinutes(next.workDuration, 20, 60, 5, DEFAULT_SETTINGS.workDuration),
    standDuration: snapMinutes(next.standDuration, 5, 30, 5, DEFAULT_SETTINGS.standDuration),
  };
  writeSettings(settings);

  const now = Date.now();
  const timer = readTimer();
  if (!timer || dayKey(timer.startTimestamp) !== dayKey(now)) {
    if (timer) storageRemove(STORAGE_KEY);
    publish();
    return false;
  }

  const result = rebaseDurations(timer, now, settings.workDuration, settings.standDuration);
  writeTimer(result.persisted);
  let enteredStanding = false;
  if (result.enteredStanding && acknowledgedPhase === 'working') {
    acknowledgedPhase = 'standing';
    bumpStandCount(now);
    enteredStanding = true;
  } else {
    acknowledgedPhase = result.snapshot.phase;
  }
  publish();
  return enteredStanding;
}

export function beginWorkRound() {
  const now = Date.now();
  const settings = loadSettings();
  const timer = activeTimer(now);
  // 正在计时时，滑块显示的是这一轮的时长；重开要沿用它，而不是磁盘上可能过期的设置。
  const workDuration = timer
    ? snapMinutes(timer.workMinutes, 20, 60, 5, settings.workDuration)
    : settings.workDuration;
  const standDuration = timer
    ? snapMinutes(timer.standMinutes, 5, 30, 5, settings.standDuration)
    : settings.standDuration;
  writeSettings({ ...settings, workDuration, standDuration });
  writeTimer(freshWork(now, workDuration, standDuration));
  acknowledgedPhase = 'working';
  publish();
}

export function stopTimer() {
  storageRemove(STORAGE_KEY);
  acknowledgedPhase = 'idle';
  publish();
}

export function startStanding() {
  const now = Date.now();
  const timer = activeTimer(now);
  if (!timer || snapshot(timer, now).phase !== 'working') return;
  const settings = loadSettings();
  writeTimer(earlyStand(
    now,
    snapMinutes(timer.workMinutes, 20, 60, 5, settings.workDuration),
    snapMinutes(timer.standMinutes, 5, 30, 5, settings.standDuration),
  ));
  acknowledgedPhase = 'standing';
  bumpStandCount(now);
  publish();
}

export function recordStandUp() {
  bumpStandCount(Date.now());
  publish();
}
