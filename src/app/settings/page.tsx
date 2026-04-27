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
  waterReminder: boolean;
  sedentaryReminder: boolean;
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
  waterReminder: true,
  sedentaryReminder: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const data = localStorage.getItem('user-settings');
    if (data) setSettings(JSON.parse(data));

    // 加载用户ID
    const savedUserId = localStorage.getItem('eup-user-id');
    if (savedUserId) setUserId(savedUserId);
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

        {/* 喝水提醒开关 */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm">💧 喝水提醒</span>
          <button
            onClick={() => updateSetting('waterReminder', !settings.waterReminder)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.waterReminder ? 'bg-[#4ecdc4]' : 'bg-[#2a3a5c]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.waterReminder ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 久坐提醒开关 */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm">🪑 久坐提醒</span>
          <button
            onClick={() => updateSetting('sedentaryReminder', !settings.sedentaryReminder)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.sedentaryReminder ? 'bg-[#4ecdc4]' : 'bg-[#2a3a5c]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.sedentaryReminder ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-3 p-3 bg-[#16213e] rounded-lg">
          <p className="text-xs text-[#8892a4]">
            <span className="text-[#f5a623] font-medium">⏰ 早起提醒：</span>设置闹钟时间后，到点会通知+响铃
          </p>
          <p className="text-xs text-[#8892a4] mt-1">
            <span className="text-[#f5a623] font-medium">💧 喝水提醒：</span>每小时整点提醒喝水
          </p>
          <p className="text-xs text-[#8892a4] mt-1">
            <span className="text-[#f5a623] font-medium">🪑 久坐提醒：</span>每40分钟提醒活动
          </p>
          <p className="text-xs text-[#8892a4] mt-1">
            <span className="text-[#f5a623] font-medium">🌙 睡眠提醒：</span>22:00 断电提醒 + 22:30 睡觉提醒
          </p>
          <p className="text-xs text-[#ff6b6b] mt-2">
            ⚠️ 需要保持页面在浏览器中打开（可在后台运行）
          </p>
        </div>
      </div>

      {/* 用户ID */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">👤 用户ID</h2>
        {userId ? (
          <div className="space-y-2">
            <p className="text-sm text-[#f0f0f0] font-mono bg-[#16213e] p-2 rounded-lg">
              {userId}
            </p>
            <p className="text-xs text-[#8892a4]">这是你的唯一标识，可用于数据备份恢复</p>
          </div>
        ) : (
          <button
            onClick={() => {
              const newId = 'EUPLIVE-' + Math.random().toString(36).substring(2, 10).toUpperCase();
              setUserId(newId);
              localStorage.setItem('eup-user-id', newId);
            }}
            className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm text-[#1a1a2e] hover:bg-[#f5a623]/90 transition-colors"
          >
            生成用户ID
          </button>
        )}
      </div>

      {/* 数据备份与恢复 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">💾 数据备份与恢复</h2>
        <div className="space-y-3">
          <button
            onClick={() => {
              // 导出所有数据
              const data: Record<string, any> = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) data[key] = localStorage.getItem(key);
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `eup-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              alert('数据导出成功！');
            }}
            className="w-full rounded-lg bg-[#4ecdc4]/20 px-4 py-2 text-sm text-[#4ecdc4] hover:bg-[#4ecdc4]/30 transition-colors"
          >
            导出数据（备份）
          </button>

          <label className="block w-full rounded-lg bg-[#f5a623]/20 px-4 py-2 text-sm text-[#f5a623] hover:bg-[#f5a623]/30 transition-colors text-center cursor-pointer">
            导入数据（恢复）
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target?.result as string);
                    if (confirm('导入数据将覆盖当前所有数据，确定继续吗？')) {
                      localStorage.clear();
                      Object.entries(data).forEach(([key, value]) => {
                        localStorage.setItem(key, value as string);
                      });
                      alert('数据导入成功！页面将刷新。');
                      window.location.reload();
                    }
                  } catch {
                    alert('文件格式不正确');
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
        <p className="text-xs text-[#8892a4] mt-2">
          定期备份数据，防止浏览器清除导致数据丢失
        </p>
      </div>

      {/* 数据管理 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">🗑️ 数据管理</h2>
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
