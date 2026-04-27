'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

type MusicMode = 'none' | 'meditation' | 'nature';

interface PomodoroSettings {
  focusDuration: number; // 分钟
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // 几次长休息
  dailyGoal: number; // 每日目标
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 35,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoal: 6,
};

export default function PomodoroPage() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // 加载冥想音乐
  useEffect(() => {
    musicRef.current = new Audio('/audio/meditation-rest-now.mp3');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.5;
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  // 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('eup-clock-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // 加载今日完成数
    const today = new Date().toISOString().slice(0, 10);
    const savedToday = localStorage.getItem(`eup-clock-today-${today}`);
    if (savedToday) {
      setTodaySessions(parseInt(savedToday));
    }
  }, []);

  // 保存设置
  const saveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem('eup-clock-settings', JSON.stringify(newSettings));
  };

  // 获取当前时长
  const getDuration = useCallback(() => {
    switch (mode) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [mode, settings]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 发送浏览器通知
  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
      });
    }
  };

  // 播放提示音
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // 震动
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.log('播放音频失败:', e);
    }
  };

  // 计时器逻辑
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 时间到
            playNotificationSound();
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // 完成一个番茄钟
  const handleSessionComplete = () => {
    setStatus('idle');

    if (mode === 'focus') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      // 保存今日完成数
      const today = new Date().toISOString().slice(0, 10);
      const newTodaySessions = todaySessions + 1;
      setTodaySessions(newTodaySessions);
      localStorage.setItem(`eup-clock-today-${today}`, newTodaySessions.toString());

      // 发送通知提醒
      playNotificationSound();

      // 自动切换到休息
      if (newSessions % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        // 长休息时提醒冥想，并播放冥想音乐
        sendNotification('🧘 长休息时间到', '15分钟冥想，放松身心');
        if (musicRef.current) {
          musicRef.current.play().catch(() => {});
        }
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
        // 短休息时提醒提肛，暂停冥想音乐
        sendNotification('🎯 短休息时间到', '5分钟提肛运动，保持健康');
        if (musicRef.current) {
          musicRef.current.pause();
        }
      }
    } else {
      // 休息结束，切换到专注
      setMode('focus');
      setTimeLeft(settings.focusDuration * 60);
      playNotificationSound();
      sendNotification('⏰ 休息结束', '35分钟专注时间，开始工作吧！');
      // 停止冥想音乐
      if (musicRef.current) {
        musicRef.current.pause();
      }
    }
  };

  // 开始
  const handleStart = () => {
    setStatus('running');
  };

  // 暂停
  const handlePause = () => {
    setStatus('paused');
  };

  // 重置
  const handleReset = () => {
    setStatus('idle');
    setTimeLeft(getDuration());
  };

  // 切换模式
  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setStatus('idle');
    switch (newMode) {
      case 'focus':
        setTimeLeft(settings.focusDuration * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
  };

  // 模式配置
  const modeConfig = {
    focus: { label: '专注', icon: '🎯', color: '#f5a623' },
    shortBreak: { label: '短休息', icon: '☕', color: '#4ecdc4' },
    longBreak: { label: '长休息', icon: '🌟', color: '#9b59b6' },
  };

  // 进度百分比
  const totalTime = getDuration();
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">⏰ Eup钟</h1>

      {/* 模式选择 */}
      <div className="flex rounded-xl bg-[#1e2a4a] p-1">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? 'bg-[#16213e] text-white'
                : 'text-[#8892a4] hover:text-white'
            }`}
          >
            {modeConfig[m].icon} {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* 计时器 */}
      <div className="relative flex items-center justify-center py-8">
        {/* 进度环 */}
        <svg className="absolute w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="#2a3a5c"
            strokeWidth="8"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke={modeConfig[mode].color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
        </svg>

        {/* 时间显示 */}
        <div className="text-center">
          <span className="text-5xl font-mono font-bold" style={{ color: modeConfig[mode].color }}>
            {formatTime(timeLeft)}
          </span>
          <p className="text-sm text-[#8892a2] mt-2">{modeConfig[mode].label}中</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center gap-4">
        {status === 'idle' && (
          <button
            onClick={handleStart}
            className="w-20 h-20 rounded-full text-2xl font-bold text-[#1a1a2e] hover:scale-105 transition-transform"
            style={{ backgroundColor: modeConfig[mode].color }}
          >
            ▶
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={handlePause}
            className="w-20 h-20 rounded-full text-2xl font-bold text-[#1a1a2e] bg-[#f5a623] hover:scale-105 transition-transform"
          >
            ⏸
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={handleStart}
            className="w-20 h-20 rounded-full text-2xl font-bold text-[#1a1a2e] bg-[#4ecdc4] hover:scale-105 transition-transform"
          >
            ▶
          </button>
        )}
        <button
          onClick={handleReset}
          className="w-14 h-14 rounded-full text-xl bg-[#2a3a5c] text-[#8892a4] hover:text-white hover:scale-105 transition-transform"
        >
          ↺
        </button>
      </div>

      {/* 统计 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">今日统计</h2>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-[#f5a623]">{todaySessions}</p>
            <p className="text-xs text-[#8892a4]">完成</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-[#4ecdc4]">{settings.dailyGoal}</p>
            <p className="text-xs text-[#8892a4]">目标</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">
              {Math.min(100, Math.round((todaySessions / settings.dailyGoal) * 100))}%
            </p>
            <p className="text-xs text-[#8892a4]">完成率</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4 h-2 rounded-full bg-[#2a3a5c] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#4ecdc4] transition-all duration-500"
            style={{ width: `${Math.min(100, (todaySessions / settings.dailyGoal) * 100)}%` }}
          />
        </div>
      </div>

      {/* 设置 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">⚙️ 设置</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">专注时长</span>
            <select
              value={settings.focusDuration}
              onChange={(e) => saveSettings({ ...settings, focusDuration: parseInt(e.target.value) })}
              className="bg-[#16213e] rounded-lg px-3 py-1 text-sm text-[#f5a623]"
            >
              {[25, 30, 35, 45, 50, 60].map((v) => (
                <option key={v} value={v}>{v}分钟</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">每日目标</span>
            <select
              value={settings.dailyGoal}
              onChange={(e) => saveSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
              className="bg-[#16213e] rounded-lg px-3 py-1 text-sm text-[#f5a623]"
            >
              {[4, 6, 8, 10, 12].map((v) => (
                <option key={v} value={v}>{v}个</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
