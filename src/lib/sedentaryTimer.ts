// 久坐计时以开始时间戳为基准，阶段和剩余时间都从墙钟推算。
// 改时长时保留当前阶段已经过的秒数，而不是把这一轮清零。

export type TimerPhase = 'working' | 'standing';

export interface PersistedTimer {
  state: TimerPhase;
  startTimestamp: number;
  workMinutes: number;
  standMinutes: number;
}

export interface PhaseSnapshot {
  phase: TimerPhase;
  remaining: number;
  elapsedInPhase: number;
  phaseSeconds: number;
}

export interface RebaseResult {
  persisted: PersistedTimer;
  snapshot: PhaseSnapshot;
  /** 工作阶段因缩短时长而立刻结束，进入站立。 */
  enteredStanding: boolean;
}

export function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

export function snapshot(timer: PersistedTimer, now: number): PhaseSnapshot {
  const workSec = minutesToSeconds(timer.workMinutes);
  const standSec = minutesToSeconds(timer.standMinutes);
  const cycleSec = workSec + standSec;
  const elapsed = Math.max(0, Math.floor((now - timer.startTimestamp) / 1000));
  const cycleElapsed = elapsed % cycleSec;

  if (cycleElapsed < workSec) {
    return {
      phase: 'working',
      remaining: workSec - cycleElapsed,
      elapsedInPhase: cycleElapsed,
      phaseSeconds: workSec,
    };
  }

  const standElapsed = cycleElapsed - workSec;
  return {
    phase: 'standing',
    remaining: standSec - standElapsed,
    elapsedInPhase: standElapsed,
    phaseSeconds: standSec,
  };
}

export function freshWork(now: number, workMinutes: number, standMinutes: number): PersistedTimer {
  return {
    state: 'working',
    startTimestamp: now,
    workMinutes: normalizeMinutes(workMinutes, 40),
    standMinutes: normalizeMinutes(standMinutes, 20),
  };
}

/** 把时间戳拨到本轮工作刚结束的位置，使当前正好处于站立阶段起点。 */
export function earlyStand(now: number, workMinutes: number, standMinutes: number): PersistedTimer {
  const work = normalizeMinutes(workMinutes, 40);
  const stand = normalizeMinutes(standMinutes, 20);
  return {
    state: 'standing',
    startTimestamp: now - work * 60 * 1000,
    workMinutes: work,
    standMinutes: stand,
  };
}

export function rebaseDurations(
  timer: PersistedTimer,
  now: number,
  workMinutes: number,
  standMinutes: number,
): RebaseResult {
  const before = snapshot(timer, now);
  const work = normalizeMinutes(workMinutes, timer.workMinutes);
  const stand = normalizeMinutes(standMinutes, timer.standMinutes);
  const workSec = work * 60;
  const standSec = stand * 60;

  let phase = before.phase;
  let elapsedInPhase = before.elapsedInPhase;
  let enteredStanding = false;

  if (before.phase === 'working') {
    if (elapsedInPhase >= workSec) {
      phase = 'standing';
      elapsedInPhase = 0;
      enteredStanding = true;
    }
  } else if (elapsedInPhase >= standSec) {
    phase = 'working';
    elapsedInPhase = 0;
  }

  const offsetSec = phase === 'working' ? elapsedInPhase : workSec + elapsedInPhase;
  const persisted: PersistedTimer = {
    state: phase,
    startTimestamp: now - offsetSec * 1000,
    workMinutes: work,
    standMinutes: stand,
  };

  return {
    persisted,
    snapshot: snapshot(persisted, now),
    enteredStanding,
  };
}

export function parseTimer(raw: unknown): PersistedTimer | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const startTimestamp = typeof record.startTimestamp === 'number'
    ? record.startTimestamp
    : Number(record.startTimestamp);
  if (!Number.isFinite(startTimestamp)) return null;

  const workMinutes = readMinutes(record.workMinutes);
  const standMinutes = readMinutes(record.standMinutes);
  if (workMinutes === null || standMinutes === null) return null;

  return {
    state: record.state === 'standing' ? 'standing' : 'working',
    startTimestamp,
    workMinutes,
    standMinutes,
  };
}

function minutesToSeconds(minutes: number): number {
  return Math.max(1, Math.round(minutes)) * 60;
}

function normalizeMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return Math.max(1, Math.round(fallback));
  return Math.max(1, Math.round(value));
}

function readMinutes(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.round(n);
}
