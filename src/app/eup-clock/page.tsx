'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface EupClockSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dailyGoal: number;
}

const DEFAULT_SETTINGS: EupClockSettings = {
  focusDuration: 35,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoal: 6,
};

// 播放简单提示音
const playTone = (freq: number, duration: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('播放失败', e);
  }
};

// 播放冥想音乐 - 持续的音调
const playMeditationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 创建多个低频音调营造氛围
    const freqs = [174, 285, 396];
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = f;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08 / (i + 1), ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0.05 / (i + 1), ctx.currentTime + 800);

      osc.start();
      oscs.push(osc);
      gains.push(gain);
    });

    // 返回停止函数
    return () => {
      gains.forEach(g => {
        try { g.gain.linearRampToValueAtTime(0, (window as any).audioContext.currentTime + 0.5); } catch {}
      });
      setTimeout(() => oscs.forEach(o => { try { o.stop(); } catch {} }), 500);
    };
  } catch (e) {
    console.log('冥想音乐失败', e);
    return () => {};
  }
};

export default function EupClockPage() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [settings, setSettings] = useState<EupClockSettings>(DEFAULT_SETTINGS);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicStopRef = useRef<(() => void) | null>(null);

  // 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('eup-clock-settings');
    if (saved) setSettings(JSON.parse(saved));

    const today = new Date().toISOString().slice(0, 10);
    const savedToday = localStorage.getItem(`eup-clock-today-${today}`);
    if (savedToday) setTodaySessions(parseInt(savedToday));
  }, []);

  const saveSettings = (newSettings: EupClockSettings) => {
    setSettings(newSettings);
    localStorage.setItem('eup-clock-settings', JSON.stringify(newSettings));
  };

  const getDuration = useCallback(() => {
    switch (mode) {
      case 'focus': return settings.focusDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [mode, settings]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  };

  // 完成一个周期
  const handleSessionComplete = () => {
    setStatus('idle');
    playTone(880, 0.3);

    if (mode === 'focus') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      const today = new Date().toISOString().slice(0, 10);
      const newTodaySessions = todaySessions + 1;
      setTodaySessions(newTodaySessions);
      localStorage.setItem(`eup-clock-today-${today}`, newTodaySessions.toString());

      sendNotification('🎉 Eup钟完成！', '35分钟专注结束，休息一下吧~');

      if (newSessions % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        // 长休息 - 播放冥想音乐
        if (musicEnabled) {
          if (musicStopRef.current) musicStopRef.current();
          musicStopRef.current = playMeditationSound();
        }
        sendNotification('🧘 长休息时间', '15分钟冥想，放松身心');
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
        // 短休息 - 停止音乐
        if (musicStopRef.current) {
          musicStopRef.current();
          musicStopRef.current = null;
        }
        sendNotification('🎯 短休息时间', '5分钟提肛运动，保持健康');
      }
    } else {
      // 休息结束
      setMode('focus');
      setTimeLeft(settings.focusDuration * 60);
      playTone(660, 0.3);
      sendNotification('⏰ 休息结束', '35分钟专注时间，开始工作！');

      if (musicStopRef.current) {
        musicStopRef.current();
        musicStopRef.current = null;
      }
    }
  };

  // 计时器
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  const handleStart = () => {
    if (Notification.permission === 'default') Notification.requestPermission();
    // 如果是长休息模式，开始时播放音乐
    if (musicEnabled && mode === 'longBreak') {
      if (musicStopRef.current) musicStopRef.current();
      musicStopRef.current = playMeditationSound();
    }
    setStatus('running');
  };

  const handlePause = () => setStatus('paused');
  const handleReset = () => {
    setStatus('idle');
    setTimeLeft(getDuration());
    if (musicStopRef.current) {
      musicStopRef.current();
      musicStopRef.current = null;
    }
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (musicStopRef.current) {
      musicStopRef.current();
      musicStopRef.current = null;
    }
    setMode(newMode);
    setStatus('idle');
    switch (newMode) {
      case 'focus': setTimeLeft(settings.focusDuration * 60); break;
      case 'shortBreak': setTimeLeft(settings.shortBreakDuration * 60); break;
      case 'longBreak': setTimeLeft(settings.longBreakDuration * 60); break;
    }
  };

  const modeConfig: Record<TimerMode, { label: string; icon: string; color: string }> = {
    focus: { label: '专注', icon: '⏰', color: '#f5a623' },
    shortBreak: { label: '短休息', icon: '🎯', color: '#4ecdc4' },
    longBreak: { label: '长休息', icon: '🧘', color: '#9b59b6' },
  };

  const totalTime = getDuration();
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="space-y-4 pb-32">
      <h1 className="text-xl font-bold text-center">⏰ Eup钟</h1>

      {/* 模式选择 */}
      <div className="flex rounded-xl bg-[#1e2a4a] p-1">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-[#16213e] text-white' : 'text-[#8892a4] hover:text-white'
            }`}
          >
            {modeConfig[m].icon} {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* 计时器 */}
      <div className="relative flex items-center justify-center py-4">
        <svg className="absolute w-40 h-40 transform -rotate-90">
          <circle cx="80" cy="80" r="72" fill="none" stroke="#2a3a5c" strokeWidth="6" />
          <circle
            cx="80" cy="80" r="72" fill="none" stroke={modeConfig[mode].color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 72}
            strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-center">
          <span className="text-4xl font-mono font-bold" style={{ color: modeConfig[mode].color }}>
            {formatTime(timeLeft)}
          </span>
          <p className="text-sm text-[#8892a2] mt-1">{modeConfig[mode].label}中</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center gap-3">
        {status === 'idle' && (
          <button onClick={handleStart} className="w-16 h-16 rounded-full text-xl font-bold text-[#1a1a2e] hover:scale-105" style={{ backgroundColor: modeConfig[mode].color }}>
            ▶
          </button>
        )}
        {status === 'running' && (
          <button onClick={handlePause} className="w-16 h-16 rounded-full text-xl font-bold text-[#1a1a2e] bg-[#f5a623] hover:scale-105">
            ⏸
          </button>
        )}
        {status === 'paused' && (
          <button onClick={handleStart} className="w-16 h-16 rounded-full text-xl font-bold text-[#1a1a2e] bg-[#4ecdc4] hover:scale-105">
            ▶
          </button>
        )}
        <button onClick={handleReset} className="w-12 h-12 rounded-full text-lg bg-[#2a3a5c] text-[#8892a4] hover:text-white">
          ↺
        </button>
      </div>

      {/* 统计 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">今日完成</h2>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#f5a623]">{todaySessions}</p>
            <p className="text-xs text-[#8892a4]">完成</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#4ecdc4]">{settings.dailyGoal}</p>
            <p className="text-xs text-[#8892a4]">目标</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{Math.min(100, Math.round((todaySessions / settings.dailyGoal) * 100))}%</p>
            <p className="text-xs text-[#8892a4]">完成率</p>
          </div>
        </div>
      </div>

      {/* 设置 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">⚙️ 设置</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm">🧘 冥想音乐</span>
          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${musicEnabled ? 'bg-[#4ecdc4]' : 'bg-[#2a3a5c]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${musicEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <button
          onClick={() => {
            if (musicEnabled) {
              const stop = playMeditationSound();
              setTimeout(stop, 3000);
              alert('正在播放冥想音乐...');
            }
          }}
          className="w-full py-2 rounded-lg bg-[#4ecdc4]/20 text-sm text-[#4ecdc4]"
        >
          🔊 测试冥想音乐
        </button>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm">专注时长</span>
          <select
            value={settings.focusDuration}
            onChange={(e) => saveSettings({ ...settings, focusDuration: parseInt(e.target.value) })}
            className="bg-[#16213e] rounded-lg px-3 py-1 text-sm text-[#f5a623]"
          >
            {[25, 30, 35, 45, 50, 60].map((v) => <option key={v} value={v}>{v}分钟</option>)}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm">每日目标</span>
          <select
            value={settings.dailyGoal}
            onChange={(e) => saveSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
            className="bg-[#16213e] rounded-lg px-3 py-1 text-sm text-[#f5a623]"
          >
            {[4, 6, 8, 10, 12].map((v) => <option key={v} value={v}>{v}个</option>)}
          </select>
        </div>
      </div>

      {/* 说明 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4 text-sm text-[#8892a4]">
        <p>💡 <strong>Eup钟工作法：</strong></p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>1. 专注35分钟工作</li>
          <li>2. 短休息5分钟（提肛运动）</li>
          <li>3. 每4个周期后长休息15分钟（冥想）</li>
        </ul>
      </div>
    </div>
  );
}
