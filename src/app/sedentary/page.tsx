'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SedentarySettings {
  enabled: boolean;
  workDuration: number;    // 工作时长（分钟）
  standDuration: number;  // 站立时长（分钟）
  excludeNoon: boolean;
  excludeEvening: boolean;
  excludeNight: boolean;
}

const DEFAULT_SETTINGS: SedentarySettings = {
  enabled: false,
  workDuration: 40,
  standDuration: 20,
  excludeNoon: true,
  excludeEvening: true,
  excludeNight: true,
};

type TimerState = 'idle' | 'working' | 'standing';

// 振奋人心的提示音 - 更响亮
function playInspirationalSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 播放3次，更响亮
    for (let round = 0; round < 3; round++) {
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'square'; // 方波更响亮

        const start = ctx.currentTime + round * 1.5 + i * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.5, start + 0.2); // 音量更大
        gain.gain.linearRampToValueAtTime(0.3, start + 0.8);
        gain.gain.linearRampToValueAtTime(0, start + 1.2);
        osc.start(start);
        osc.stop(start + 1.3);
      });
    }

    // 强力震动
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  } catch (e) {}
}

function playSitDownSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  } catch (e) {}
}

// 持久化状态
interface PersistedState {
  state: TimerState;
  startTimestamp: number; // 周期开始时间
  workMinutes: number;
  standMinutes: number;
}

const STORAGE_KEY = 'sedentary_timer';

export default function SedentaryPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SedentarySettings>(DEFAULT_SETTINGS);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isRecovering, setIsRecovering] = useState(true); // 恢复中

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<{ work: boolean; stand: boolean }>({ work: false, stand: false });

  // 加载
  useEffect(() => {
    const saved = localStorage.getItem('sedentary-settings');
    if (saved) setSettings(JSON.parse(saved));

    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }

    const today = new Date().toISOString().split('T')[0];
    const savedSessions = localStorage.getItem(`sedentary-sessions-${today}`);
    if (savedSessions) setTotalSessions(parseInt(savedSessions, 10));

    setIsRecovering(false);
  }, []);

  // 检查排除时段
  const isExcludeTime = useCallback(() => {
    const h = new Date().getHours();
    if (settings.excludeNoon && h >= 12 && h < 14) return true;
    if (settings.excludeEvening && h >= 18 && h < 19) return true;
    if (settings.excludeNight && (h >= 22 || h < 8)) return true;
    return false;
  }, [settings]);

  // 发送通知
  const sendNotify = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, requireInteraction: true });
    }
  }, []);

  // 计算当前状态
  const calculateState = useCallback(( persisted: PersistedState, now: number) => {
    const { state, startTimestamp, workMinutes, standMinutes } = persisted;
    const elapsed = Math.floor((now - startTimestamp) / 1000);
    const workSec = workMinutes * 60;
    const standSec = standMinutes * 60;
    const cycleSec = workSec + standSec;

    const cycleElapsed = elapsed % cycleSec;

    if (cycleElapsed < workSec) {
      // 工作中
      return {
        state: 'working' as TimerState,
        remaining: workSec - cycleElapsed,
        notified: cycleElapsed >= workSec - 5 && !notifiedRef.current.work
      };
    } else {
      // 站立中
      return {
        state: 'standing' as TimerState,
        remaining: standSec - (cycleElapsed - workSec),
        notified: cycleElapsed >= workSec + standSec - 5 && !notifiedRef.current.stand
      };
    }
  }, []);

  // 主计时器
  useEffect(() => {
    if (isRecovering) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setTimerState('idle');
      return;
    }

    const persisted: PersistedState = JSON.parse(saved);
    const now = Date.now();

    // 检查是否同一天
    const savedDate = new Date(persisted.startTimestamp).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    if (savedDate !== today) {
      localStorage.removeItem(STORAGE_KEY);
      setTimerState('idle');
      return;
    }

    // 计算当前状态
    const result = calculateState(persisted, now);
    setTimerState(result.state);
    setRemainingSeconds(result.remaining);

    // 如果刚恢复就快要触发通知，标记已通知避免重复
    if (result.notified) {
      if (result.state === 'working') notifiedRef.current.work = true;
      else notifiedRef.current.stand = true;
    }

    // 启动计时器
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // 状态切换
          const current = localStorage.getItem(STORAGE_KEY);
          if (!current) return 0;

          const p: PersistedState = JSON.parse(current);
          const now2 = Date.now();
          const result2 = calculateState(p, now2);

          if (result2.state === 'working' && !notifiedRef.current.work) {
            playInspirationalSound();
            sendNotify('🧍 起身时间到！', `工作了${p.workMinutes}分钟，站起来活动一下！`);
            notifiedRef.current.work = true;
            notifiedRef.current.stand = false;
          } else if (result2.state === 'standing' && !notifiedRef.current.stand) {
            // 站立结束，记录次数
            const todayStr = new Date().toISOString().split('T')[0];
            const newCount = totalSessions + 1;
            setTotalSessions(newCount);
            localStorage.setItem(`sedentary-sessions-${todayStr}`, String(newCount));

            playSitDownSound();
            sendNotify('💺 坐下休息', '活动完成，继续工作吧！');
            notifiedRef.current.stand = true;
            notifiedRef.current.work = false;
          }

          return result2.remaining;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecovering, calculateState, sendNotify, totalSessions]);

  // 开始/停止
  const toggleTimer = () => {
    if (timerState === 'idle') {
      const now = Date.now();
      const state: PersistedState = {
        state: 'working',
        startTimestamp: now,
        workMinutes: settings.workDuration,
        standMinutes: settings.standDuration,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setTimerState('working');
      setRemainingSeconds(settings.workDuration * 60);
      notifiedRef.current = { work: false, stand: false };
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setTimerState('idle');
      setRemainingSeconds(0);
    }
  };

  // 手动触发站立
  const startStanding = () => {
    const now = Date.now();
    const state: PersistedState = {
      state: 'standing',
      startTimestamp: now - settings.workDuration * 60 * 1000, // 假设工作已完成
      workMinutes: settings.workDuration,
      standMinutes: settings.standDuration,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setTimerState('standing');
    setRemainingSeconds(settings.standDuration * 60);
    notifiedRef.current = { work: true, stand: false };
  };

  // 格式化时间
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progress = timerState === 'working'
    ? ((settings.workDuration * 60 - remainingSeconds) / (settings.workDuration * 60)) * 100
    : timerState === 'standing'
    ? ((settings.standDuration * 60 - remainingSeconds) / (settings.standDuration * 60)) * 100
    : 0;

  if (isRecovering) {
    return <div className="text-center py-10 text-[#8892a4]">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">久坐提醒</h1>

      {/* 状态卡片 */}
      {timerState !== 'idle' && (
        <div className={`rounded-xl p-6 text-center ${
          timerState === 'working' ? 'bg-[#1e2a4a]' : 'bg-[#4ecdc4]/20'
        }`}>
          <p className="text-2xl mb-2">
            {timerState === 'working' ? '💺工作中' : '🧍站立中'}
          </p>
          <p className="text-5xl font-mono font-bold text-[#f5a623]">
            {fmt(remainingSeconds)}
          </p>
          <div className="w-full h-2 rounded-full bg-[#2a3a5c] mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                timerState === 'working' ? 'bg-[#f5a623]' : 'bg-[#4ecdc4]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#8892a4] mt-2">
            {timerState === 'working'
              ? `还需工作 ${Math.ceil(remainingSeconds / 60)} 分钟`
              : `站立剩余 ${Math.ceil(remainingSeconds / 60)} 分钟`}
          </p>

          {timerState === 'standing' && (
            <button
              onClick={() => router.push('/kegel')}
              className="mt-4 w-full rounded-xl bg-[#f5a623]/20 py-2 text-sm text-[#f5a623]"
            >
              🎯 去做提肛运动 →
            </button>
          )}
        </div>
      )}

      {/* 统计 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-[#4ecdc4]">{totalSessions}</p>
            <p className="text-xs text-[#8892a4]">今日站起次数</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#8892a4]">
              {timerState !== 'idle' ? '🔔 计时中' : '⏸️ 已停止'}
            </p>
          </div>
        </div>
      </div>

      {/* 设置 */}
      {timerState === 'idle' && (
        <>
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <h2 className="text-sm font-medium text-[#8892a4] mb-3">⏱️ 时间设置</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">💺 工作时长</span>
                  <span className="text-sm text-[#f5a623]">{settings.workDuration} 分钟</span>
                </div>
                <input
                  type="range" min="20" max="60" step="5"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-full accent-[#f5a623]"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">🧍 站立时长</span>
                  <span className="text-sm text-[#4ecdc4]">{settings.standDuration} 分钟</span>
                </div>
                <input
                  type="range" min="5" max="30" step="5"
                  value={settings.standDuration}
                  onChange={(e) => setSettings({ ...settings, standDuration: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-full accent-[#4ecdc4]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <h2 className="text-sm font-medium text-[#8892a4] mb-3">⏰ 排除时段</h2>
            <div className="space-y-2">
              <label className="flex justify-between">
                <span className="text-sm">🌞 午休 (12-14点)</span>
                <input type="checkbox" checked={settings.excludeNoon}
                  onChange={(e) => setSettings({ ...settings, excludeNoon: e.target.checked })}
                  className="accent-[#f5a623]" />
              </label>
              <label className="flex justify-between">
                <span className="text-sm">🌙 晚餐 (18-19点)</span>
                <input type="checkbox" checked={settings.excludeEvening}
                  onChange={(e) => setSettings({ ...settings, excludeEvening: e.target.checked })}
                  className="accent-[#f5a623]" />
              </label>
              <label className="flex justify-between">
                <span className="text-sm">😴 睡眠 (22-8点)</span>
                <input type="checkbox" checked={settings.excludeNight}
                  onChange={(e) => setSettings({ ...settings, excludeNight: e.target.checked })}
                  className="accent-[#f5a623]" />
              </label>
            </div>
          </div>
        </>
      )}

      {/* 按钮 */}
      <div className="flex gap-3">
        {timerState === 'idle' ? (
          <button
            onClick={toggleTimer}
            className="flex-1 rounded-xl bg-[#f5a623] py-3 text-[#1a1a2e] font-bold"
          >
            开始提醒
          </button>
        ) : (
          <>
            {timerState === 'working' && (
              <button onClick={startStanding} className="flex-1 rounded-xl bg-[#4ecdc4] py-3 text-[#1a1a2e] font-bold">
                提前站立
              </button>
            )}
            <button
              onClick={toggleTimer}
              className="flex-1 rounded-xl bg-[#ff6b6b] py-3 text-white font-bold"
            >
              停止
            </button>
          </>
        )}
      </div>

      {/* 说明 */}
      <div className="rounded-xl bg-[#f5a623]/10 p-4">
        <p className="text-xs text-[#f5a623]">
          💡 {settings.workDuration}分钟工作 → {settings.standDuration}分钟站立 → 循环
        </p>
        <p className="text-xs text-[#8892a4] mt-1">
          ⚠️ 退出页面后计时继续，重新进入仍会显示正确进度
        </p>
      </div>
    </div>
  );
}
