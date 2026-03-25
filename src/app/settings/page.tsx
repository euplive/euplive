'use client';

import { useState, useEffect } from 'react';

interface Settings {
  alarmTime: string;
  morningExerciseTime: string;
  afternoonExerciseTime: string;
  shutdownTime: string;
  meditateTime: string;
  sleepTime: string;
  meditationDuration: number;
  notificationEnabled: boolean;
  notificationRequested: boolean;
}

const defaultSettings: Settings = {
  alarmTime: '06:30',
  morningExerciseTime: '06:40',
  afternoonExerciseTime: '17:00',
  shutdownTime: '22:00',
  meditateTime: '22:10',
  sleepTime: '22:30',
  meditationDuration: 10,
  notificationEnabled: false,
  notificationRequested: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('user-settings');
    if (data) setSettings(JSON.parse(data));
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('user-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      alert('你的浏览器不支持通知功能');
      return;
    }
    const perm = await Notification.requestPermission();
    updateSetting('notificationEnabled', perm === 'granted');
    updateSetting('notificationRequested', true);

    if (perm === 'granted') {
      // 测试发送一个通知
      new Notification('🔔 通知已开启！', {
        body: '你将在指定时间收到起床和睡觉提醒',
      });
    }
  };

  const timeFields: { key: keyof Settings; label: string; icon: string }[] = [
    { key: 'alarmTime', label: '早起闹钟', icon: '⏰' },
    { key: 'morningExerciseTime', label: '晨练时间', icon: '🏃' },
    { key: 'afternoonExerciseTime', label: '午后锻炼', icon: '💪' },
    { key: 'shutdownTime', label: '断电时间', icon: '🔌' },
    { key: 'meditateTime', label: '冥想时间', icon: '🧘' },
    { key: 'sleepTime', label: '目标入睡', icon: '😴' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">设置</h1>

      {/* 时间设置 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">时间设置</h2>
        <div className="space-y-3">
          {timeFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between">
              <span className="text-sm">
                {field.icon} {field.label}
              </span>
              <input
                type="time"
                value={settings[field.key] as string}
                onChange={(e) => updateSetting(field.key, e.target.value)}
                className="rounded-lg bg-[#16213e] border border-[#2a3a5c] px-3 py-1.5 text-sm font-mono text-[#f5a623] focus:outline-none focus:border-[#f5a623]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 冥想时长 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">冥想设置</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">🧘 默认冥想时长</span>
          <div className="flex gap-2">
            {[5, 10, 15].map((d) => (
              <button
                key={d}
                onClick={() => updateSetting('meditationDuration', d)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  settings.meditationDuration === d
                    ? 'bg-[#f5a623] text-[#1a1a2e]'
                    : 'bg-[#16213e] text-[#8892a4]'
                }`}
              >
                {d}分钟
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">通知设置</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">🔔 浏览器通知</span>
          <button
            onClick={handleRequestNotification}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
              settings.notificationEnabled
                ? 'bg-[#4ecdc4]/20 text-[#4ecdc4]'
                : 'bg-[#f5a623] text-[#1a1a2e] hover:bg-[#f5a623]/90'
            }`}
          >
            {settings.notificationEnabled ? '已开启 ✓' : '开启提醒'}
          </button>
        </div>
        <div className="mt-3 p-3 bg-[#16213e] rounded-lg">
          <p className="text-xs text-[#8892a4]">
            <span className="text-[#f5a623] font-medium">⏰ 早起提醒：</span>设置闹钟时间后，到点会通知+响铃
          </p>
          <p className="text-xs text-[#8892a4] mt-1">
            <span className="text-[#f5a623] font-medium">🌙 睡眠提醒：</span>22:00 断电提醒 + 22:30 睡觉提醒
          </p>
          <p className="text-xs text-[#ff6b6b] mt-2">
            ⚠️ 需要保持页面在浏览器中打开（可在后台运行）
          </p>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">数据管理</h2>
        <button
          onClick={() => {
            if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="rounded-lg bg-[#ff6b6b]/20 px-4 py-2 text-sm text-[#ff6b6b] hover:bg-[#ff6b6b]/30 transition-colors"
        >
          清除所有数据
        </button>
      </div>

      {/* 保存 */}
      <button
        onClick={handleSave}
        className={`w-full rounded-xl py-3 font-bold transition-colors ${
          saved ? 'bg-[#4ecdc4] text-[#1a1a2e]' : 'bg-[#f5a623] text-[#1a1a2e] hover:bg-[#f5a623]/90'
        }`}
      >
        {saved ? '已保存 ✓' : '保存设置'}
      </button>

      {/* 关于 */}
      <div className="text-center text-xs text-[#8892a4] space-y-1 pb-4">
        <p>每日自律 v1.0</p>
        <p>从起床到入睡，掌控你的每一天</p>
      </div>
    </div>
  );
}
