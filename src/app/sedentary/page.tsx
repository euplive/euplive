'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { STAND_UP_LINE, primeChineseVoice, speakChinese } from '@/lib/chineseVoice';
import {
  beginWorkRound,
  consumeNaturalTransition,
  getServerSnapshot,
  getSnapshot,
  recordStandUp,
  startStanding,
  stopTimer,
  subscribe,
  updateSettings,
  type SedentarySettings,
} from '@/lib/sedentaryStore';

function playInspirationalSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    for (let round = 0; round < 3; round++) {
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'square';

        const start = ctx.currentTime + round * 1.5 + i * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.5, start + 0.2);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.8);
        gain.gain.linearRampToValueAtTime(0, start + 1.2);
        osc.start(start);
        osc.stop(start + 1.3);
      });
    }

  } catch {
    // 浏览器拦截音频时忽略
  }
}

function announceStandUp() {
  try {
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
  } catch {
    // 震动被系统拒绝时忽略
  }
  const spoken = speakChinese(STAND_UP_LINE, () => playInspirationalSound());
  if (!spoken) playInspirationalSound();
}

function playSitDownSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 392;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  } catch {
    // 浏览器拦截音频时忽略
  }
}

function DurationCard({
  settings,
  running,
  onChange,
}: {
  settings: SedentarySettings;
  running: boolean;
  onChange: (next: SedentarySettings) => void;
}) {
  return (
    <div className="rounded-xl bg-[#1e2a4a] p-4">
      <h2 className="text-sm font-medium text-[#8892a4] mb-3">
        {running ? '🎛️ 调整时长' : '⏱️ 时间设置'}
      </h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm">💺 工作时长</span>
            <span className="text-sm text-[#f5a623]">{settings.workDuration} 分钟</span>
          </div>
          <input
            type="range"
            min={20}
            max={60}
            step={5}
            value={settings.workDuration}
            aria-label="工作时长"
            onChange={(e) => onChange({ ...settings, workDuration: Number(e.target.value) })}
            className="w-full h-2 rounded-full accent-[#f5a623]"
          />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm">🧍 站立时长</span>
            <span className="text-sm text-[#4ecdc4]">{settings.standDuration} 分钟</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={settings.standDuration}
            aria-label="站立时长"
            onChange={(e) => onChange({ ...settings, standDuration: Number(e.target.value) })}
            className="w-full h-2 rounded-full accent-[#4ecdc4]"
          />
        </div>
      </div>
      {running && (
        <p className="text-xs text-[#8892a4] mt-3">
          修改立即生效，这一轮已经过的时间会保留。新时长短于已用时间时，会马上进入下一阶段。
        </p>
      )}
    </div>
  );
}

export default function SedentaryPage() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sendNotify = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, requireInteraction: true });
    } catch {
      // 通知被系统拒绝时不影响计时
    }
  }, []);

  useEffect(() => {
    primeChineseVoice();
  }, []);

  useEffect(() => {
    if (!view.ready) return;
    // 手动改时长、提前站立、重开一轮会事先同步阶段，这里只处理秒针走到的切换。
    const kind = consumeNaturalTransition(view.phase);
    if (kind === 'stand-up') {
      announceStandUp();
      sendNotify('🧍 该站起来了', STAND_UP_LINE);
      recordStandUp();
    } else if (kind === 'sit-down') {
      playSitDownSound();
      sendNotify('💺 坐下休息', '活动完成，继续工作吧！');
    }
  }, [view.ready, view.phase, sendNotify]);

  if (!view.ready) {
    return <div className="text-center py-10 text-[#8892a4]">加载中...</div>;
  }

  const { settings, phase, remaining, standCount } = view;
  const running = phase !== 'idle';
  const phaseSeconds = phase === 'working'
    ? settings.workDuration * 60
    : phase === 'standing'
      ? settings.standDuration * 60
      : 0;
  const progress = phaseSeconds > 0
    ? Math.min(100, Math.max(0, ((phaseSeconds - remaining) / phaseSeconds) * 100))
    : 0;
  const phaseClass = phase === 'standing'
    ? 'text-[#4ecdc4]'
    : phase === 'working'
      ? 'text-[#f5a623]'
      : 'text-[#8892a4]';
  const phaseLabel = phase === 'working' ? '工作中' : phase === 'standing' ? '站立中' : '未开始';

  const fmt = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-center">久坐提醒</h1>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#1e2a4a] p-4 text-center">
        <div className="min-w-0">
          <p className={`text-lg font-bold ${phaseClass}`}>{phaseLabel}</p>
          <p className="text-xs text-[#8892a4] mt-1">当前阶段</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-mono font-bold text-[#f5a623]">
            {running ? fmt(remaining) : '--:--'}
          </p>
          <p className="text-xs text-[#8892a4] mt-1">剩余时间</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-[#4ecdc4]">{standCount}</p>
          <p className="text-xs text-[#8892a4] mt-1">今日站起次数</p>
        </div>
      </div>

      {running && (
        <div className={`rounded-xl p-6 text-center ${
          phase === 'working' ? 'bg-[#1e2a4a]' : 'bg-[#4ecdc4]/20'
        }`}>
          <p className="text-2xl mb-2">
            {phase === 'working' ? '💺 工作中' : '🧍 站立中'}
          </p>
          <p className="text-5xl font-mono font-bold text-[#f5a623]">
            {fmt(remaining)}
          </p>
          <div className="w-full h-2 rounded-full bg-[#2a3a5c] mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                phase === 'working' ? 'bg-[#f5a623]' : 'bg-[#4ecdc4]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#8892a4] mt-2">
            {phase === 'working'
              ? `工作剩余 ${Math.ceil(remaining / 60)} 分钟`
              : `站立剩余 ${Math.ceil(remaining / 60)} 分钟`}
          </p>

          {phase === 'standing' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-[#f0f0f0]">{STAND_UP_LINE}</p>
              <Link
                href="/meditate"
                className="block w-full rounded-xl bg-[#f5a623] py-3 text-sm font-bold text-[#1a1a2e]"
              >
                去做冥想 →
              </Link>
              <Link
                href="/kegel"
                className="block w-full rounded-xl bg-[#f5a623]/20 py-2 text-sm text-[#f5a623]"
              >
                🎯 去做提肛运动 →
              </Link>
            </div>
          )}
        </div>
      )}

      {!running && (
        <>
          <DurationCard settings={settings} running={false} onChange={updateSettings} />
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <h2 className="text-sm font-medium text-[#8892a4] mb-3">⏰ 排除时段</h2>
            <div className="space-y-2">
              <label className="flex justify-between">
                <span className="text-sm">🌞 午休 (12-14点)</span>
                <input
                  type="checkbox"
                  checked={settings.excludeNoon}
                  onChange={(e) => updateSettings({ ...settings, excludeNoon: e.target.checked })}
                  className="accent-[#f5a623]"
                />
              </label>
              <label className="flex justify-between">
                <span className="text-sm">🌙 晚餐 (18-19点)</span>
                <input
                  type="checkbox"
                  checked={settings.excludeEvening}
                  onChange={(e) => updateSettings({ ...settings, excludeEvening: e.target.checked })}
                  className="accent-[#f5a623]"
                />
              </label>
              <label className="flex justify-between">
                <span className="text-sm">😴 睡眠 (22-8点)</span>
                <input
                  type="checkbox"
                  checked={settings.excludeNight}
                  onChange={(e) => updateSettings({ ...settings, excludeNight: e.target.checked })}
                  className="accent-[#f5a623]"
                />
              </label>
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        {running && (
          <button
            type="button"
            onClick={beginWorkRound}
            className="w-full rounded-xl border border-[#f5a623] bg-[#f5a623]/10 py-3 text-[#f5a623] font-bold"
          >
            重开一轮
            <span className="block text-xs font-normal text-[#f5a623]/80 mt-0.5">
              从现在重新开始工作计时
            </span>
          </button>
        )}
        <div className="flex gap-3">
          {phase === 'idle' ? (
            <button
              type="button"
              onClick={beginWorkRound}
              className="flex-1 rounded-xl bg-[#f5a623] py-3 text-[#1a1a2e] font-bold"
            >
              开始提醒
            </button>
          ) : (
            <>
              {phase === 'working' && (
                <button
                  type="button"
                onClick={() => {
                  startStanding();
                  announceStandUp();
                }}
                className="flex-1 rounded-xl bg-[#4ecdc4] py-3 text-[#1a1a2e] font-bold"
              >
                提前站立
              </button>
              )}
              <button
                type="button"
                onClick={stopTimer}
                className="flex-1 rounded-xl bg-[#ff6b6b] py-3 text-white font-bold"
              >
                停止
              </button>
            </>
          )}
        </div>
      </div>

      {running && (
        <DurationCard
          settings={settings}
          running
          onChange={(next) => {
            if (updateSettings(next)) announceStandUp();
          }}
        />
      )}

      <div className="rounded-xl bg-[#f5a623]/10 p-4 space-y-1">
        <p className="text-xs text-[#f5a623]">
          💡 {settings.workDuration} 分钟工作 → {settings.standDuration} 分钟站立 → 循环
        </p>
        <p className="text-xs text-[#8892a4]">
          计时中可以直接改时长。被打断后点「重开一轮」，工作计时从现在重新开始。
        </p>
        <p className="text-xs text-[#8892a4]">
          退出页面后计时继续，重新进入仍会显示正确进度。
        </p>
      </div>
    </div>
  );
}
