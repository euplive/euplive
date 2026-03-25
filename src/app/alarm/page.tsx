'use client';

import { useState, useEffect, useRef } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';

const alarmMusics = [
  { id: 'energetic', name: '活力电子', description: '节奏感强，快速唤醒' },
  { id: 'classical', name: '激昂交响', description: '古典乐振奋精神' },
  { id: 'nature', name: '清晨鸟鸣', description: '自然声，温和唤醒' },
  { id: 'motivational', name: '励志旋律', description: '正能量，开启新一天' },
];

// 模拟音频播放（实际项目可使用真实音频文件）
function playAlarmSound() {
  try {
    // 尝试使用 Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 创建振荡器产生提示音
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    oscillator.start();

    // 响 3 声
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.6);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + 0.8);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 1.0);

    oscillator.stop(audioContext.currentTime + 1.2);

    // 震动
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 200, 300, 200, 300]);
    }
  } catch (e) {
    console.log('播放音频失败:', e);
  }
}

export default function AlarmPage() {
  const { today, completeItem } = useScheduleStore();
  const [alarmTime, setAlarmTime] = useState('06:30');
  const [selectedMusic, setSelectedMusic] = useState('energetic');
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // 检查通知权限
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    // 从 localStorage 加载设置
    const saved = localStorage.getItem('alarm-settings');
    if (saved) {
      const data = JSON.parse(saved);
      setAlarmTime(data.alarmTime || '06:30');
      setSelectedMusic(data.selectedMusic || 'energetic');
      setIsAlarmActive(data.isAlarmActive || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alarm-settings', JSON.stringify({ alarmTime, selectedMusic, isAlarmActive }));
  }, [alarmTime, selectedMusic, isAlarmActive]);

  // 倒计时到闹钟时间
  useEffect(() => {
    if (!isAlarmActive) {
      setCountdown('');
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = undefined;
      }
      return;
    }

    const update = () => {
      const now = new Date();
      const [h, m] = alarmTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours}小时${mins}分钟后响铃`);

      // 检查是否到时间（精确到分钟）
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const alarmMinutes = h * 60 + m;
      if (currentMinutes === alarmMinutes && !isRinging) {
        // 触发闹钟
        setIsRinging(true);
        // 发送浏览器通知
        if (notificationEnabled) {
          new Notification('⏰ 起床时间到！', {
            body: '新的一天，从现在开始！',
            requireInteraction: true,
          });
        }
        // 播放声音
        playAlarmSound();
      }
    };

    update();
    timerRef.current = setInterval(update, 10000); // 每10秒检查一次
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAlarmActive, alarmTime, notificationEnabled, isRinging]);

  const handleSnooze = () => {
    if (snoozeCount >= 2) return;
    setSnoozeCount((c) => c + 1);
    setIsRinging(false);
    // 5分钟后再响
    setTimeout(() => setIsRinging(true), 5 * 60 * 1000);
  };

  const handleWakeUp = () => {
    setIsRinging(false);
    setIsAlarmActive(false);
    completeItem('alarm');
    completeItem('morning-checkin');
  };

  const alarmItem = today?.items.find((i) => i.id === 'alarm');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">早起闹钟</h1>

      {/* 闹钟正在响 */}
      {isRinging && (
        <div className="rounded-xl bg-[#f5a623]/20 border border-[#f5a623]/40 p-6 text-center animate-pulse">
          <span className="text-5xl">⏰</span>
          <p className="text-xl font-bold text-[#f5a623] mt-3">起床时间到！</p>
          <p className="text-sm text-[#8892a4] mt-1">新的一天，从现在开始</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSnooze}
              disabled={snoozeCount >= 2}
              className={`flex-1 rounded-xl py-3 font-medium transition-colors ${
                snoozeCount >= 2
                  ? 'bg-[#2a3a5c] text-[#8892a4] cursor-not-allowed'
                  : 'bg-[#2a3a5c] text-[#f0f0f0] hover:bg-[#2a3a5c]/80'
              }`}
            >
              再睡5分钟 ({2 - snoozeCount}次)
            </button>
            <button
              onClick={handleWakeUp}
              className="flex-1 rounded-xl bg-[#4ecdc4] py-3 text-[#1a1a2e] font-bold hover:bg-[#4ecdc4]/90"
            >
              我起来了！
            </button>
          </div>
        </div>
      )}

      {/* 已完成 */}
      {alarmItem?.status === 'completed' && (
        <div className="rounded-xl bg-[#4ecdc4]/20 border border-[#4ecdc4]/40 p-6 text-center">
          <span className="text-4xl">🌅</span>
          <p className="text-lg font-bold text-[#4ecdc4] mt-2">今日已起床打卡</p>
          <p className="text-sm text-[#8892a4] mt-1">{alarmItem.completedAt} 起床</p>
        </div>
      )}

      {/* 闹钟设置 */}
      {!isRinging && (
        <>
          {/* 通知权限提示 */}
          {!notificationEnabled && (
            <div className="rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/30 p-3">
              <p className="text-xs text-[#f5a623] text-center">
                ⚠️ 开启通知才能在后台收到闹钟提醒
                <button
                  onClick={async () => {
                    const perm = await Notification.requestPermission();
                    setNotificationEnabled(perm === 'granted');
                  }}
                  className="ml-2 underline"
                >
                  开启通知
                </button>
              </p>
            </div>
          )}

          {/* 时间设置 */}
          <div className="rounded-xl bg-[#1e2a4a] p-5">
            <label className="text-sm text-[#8892a4] block mb-2">起床时间</label>
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="w-full rounded-lg bg-[#16213e] border border-[#2a3a5c] px-4 py-3 text-2xl font-mono text-center text-[#f5a623] focus:outline-none focus:border-[#f5a623]"
            />
            {isAlarmActive && countdown && (
              <p className="text-xs text-[#f5a623] text-center mt-2">{countdown}</p>
            )}
          </div>

          {/* 音乐选择 */}
          <div>
            <h2 className="text-sm text-[#8892a4] mb-2">闹钟音乐</h2>
            <div className="space-y-2">
              {alarmMusics.map((music) => (
                <button
                  key={music.id}
                  onClick={() => setSelectedMusic(music.id)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 transition-colors ${
                    selectedMusic === music.id
                      ? 'bg-[#f5a623]/20 border border-[#f5a623]/40'
                      : 'bg-[#1e2a4a] border border-transparent'
                  }`}
                >
                  <span className="text-lg">🎵</span>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${selectedMusic === music.id ? 'text-[#f5a623]' : 'text-[#f0f0f0]'}`}>
                      {music.name}
                    </p>
                    <p className="text-xs text-[#8892a4]">{music.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 开关 */}
          <button
            onClick={() => setIsAlarmActive(!isAlarmActive)}
            className={`w-full rounded-xl py-4 font-bold text-lg transition-colors ${
              isAlarmActive
                ? 'bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90'
                : 'bg-[#f5a623] text-[#1a1a2e] hover:bg-[#f5a623]/90'
            }`}
          >
            {isAlarmActive ? '关闭闹钟' : '开启闹钟'}
          </button>
        </>
      )}
    </div>
  );
}
