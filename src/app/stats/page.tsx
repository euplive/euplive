'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface ModuleStat {
  label: string;
  icon: string;
  completed: number;
  total: number;
}

// 成就定义
interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  condition: (stats: { streakDays: number; totalDays: number; moduleStats: ModuleStat[] }) => boolean;
  unlocked: boolean;
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_day', icon: '🌟', name: '第一天', desc: '完成首次打卡', condition: ({ totalDays }) => totalDays >= 1 },
  { id: 'week_streak', icon: '🔥', name: '一周坚持', desc: '连续7天', condition: ({ streakDays }) => streakDays >= 7 },
  { id: 'month_streak', icon: '💪', name: '月度自律', desc: '连续30天', condition: ({ streakDays }) => streakDays >= 30 },
  { id: 'century', icon: '🏆', name: '百日英雄', desc: '累计100天', condition: ({ totalDays }) => totalDays >= 100 },
  { id: 'early_bird', icon: '🐦', name: '早起鸟', desc: '早起打卡10次', condition: ({ moduleStats }) => moduleStats[0]?.completed >= 10 },
  { id: 'meditation_master', icon: '🧘', name: '冥想大师', desc: '冥想10次', condition: ({ moduleStats }) => moduleStats[4]?.completed >= 10 },
];

export default function StatsPage() {
  const { today, history, streakDays, initToday, customHabits } = useScheduleStore();
  const [weekData, setWeekData] = useState<number[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    initToday();
  }, [initToday]);

  useEffect(() => {
    // 计算最近7天数据
    const last7 = [...history.slice(-6), ...(today ? [today] : [])];
    const rates = last7.map((r) => r.completionRate);
    // 补齐7天
    while (rates.length < 7) rates.unshift(0);
    setWeekData(rates.slice(-7));

    // 模块统计
    if (today) {
      const modules: ModuleStat[] = [
        { label: '早起', icon: '⏰', completed: 0, total: 0 },
        { label: '久坐', icon: '🪑', completed: 0, total: 0 },
        { label: '提肛', icon: '🎯', completed: 0, total: 0 },
        { label: '断电', icon: '🔌', completed: 0, total: 0 },
        { label: '冥想', icon: '🧘', completed: 0, total: 0 },
      ];

      const allRecords = [...history, today];
      const total = allRecords.length;

      allRecords.forEach((record) => {
        record.items.forEach((item) => {
          if (item.status !== 'completed') return;
          if (item.id === 'alarm') modules[0].completed++;
          if (item.id === 'sedentary') modules[1].completed++;
          if (item.id === 'kegel') modules[2].completed++;
          if (item.id === 'shutdown') modules[3].completed++;
          if (item.id === 'meditate') modules[4].completed++;
        });
      });

      modules.forEach((m) => (m.total = total));
      setModuleStats(modules);

      // 计算成就
      const totalDays = history.length + (today ? 1 : 0);
      const unlockedAchievements = ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: a.condition({ streakDays, totalDays, moduleStats: modules }),
      }));
      setAchievements(unlockedAchievements);
    }
  }, [today, history, initToday, streakDays, customHabits]);

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const totalDays = history.length + (today ? 1 : 0);

  // 合并历史记录（今天的在前面）
  const allRecords = today ? [today, ...history] : history;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">统计</h1>

      {/* 核心指标 */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-[#1e2a4a] p-4 text-center">
          <p className="text-3xl font-bold text-[#f5a623]">{streakDays}</p>
          <p className="text-xs text-[#8892a4] mt-1">连续自律天数</p>
        </div>
        <div className="flex-1 rounded-xl bg-[#1e2a4a] p-4 text-center">
          <p className="text-3xl font-bold text-[#4ecdc4]">{totalDays}</p>
          <p className="text-xs text-[#8892a4] mt-1">累计天数</p>
        </div>
      </div>

      {/* 成就徽章 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">🏅 成就徽章</h2>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-lg p-2 text-center transition-all ${
                ach.unlocked ? 'bg-[#f5a623]/20' : 'bg-[#16213e] opacity-50'
              }`}
            >
              <span className="text-xl">{ach.icon}</span>
              <p className={`text-xs mt-1 ${ach.unlocked ? 'text-[#f5a623]' : 'text-[#8892a4]'}`}>
                {ach.name}
              </p>
              <p className="text-[10px] text-[#8892a4]">{ach.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8892a4] mt-2 text-center">
          已解锁 {achievements.filter((a) => a.unlocked).length} / {achievements.length}
        </p>
      </div>

      {/* 本周完成率 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-4">本周完成率</h2>
        <div className="flex items-end justify-between h-32 gap-2">
          {weekData.map((rate, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-[#8892a4]">{rate}%</span>
              <div className="w-full bg-[#2a3a5c] rounded-t-md relative" style={{ height: '100px' }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((rate / 100) * 100, 4)}px`,
                    backgroundColor: rate >= 60 ? '#4ecdc4' : rate > 0 ? '#f5a623' : '#2a3a5c',
                  }}
                />
              </div>
              <span className="text-xs text-[#8892a4]">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 模块统计 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">各模块完成情况</h2>
        <div className="space-y-3">
          {moduleStats.map((stat) => {
            const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
            return (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">
                    {stat.icon} {stat.label}
                  </span>
                  <span className="text-xs text-[#8892a4]">
                    {stat.completed}/{stat.total} ({rate}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#2a3a5c] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4ecdc4] transition-all duration-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 历史记录 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-sm font-medium text-[#8892a4]"
        >
          <span>📜 历史记录</span>
          <span>{showHistory ? '▲' : '▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {allRecords.slice(0, 30).map((record, index) => (
              <div
                key={record.date}
                className="flex items-center justify-between p-2 bg-[#16213e] rounded-lg text-xs"
              >
                <span className="text-[#8892a4]">{record.date}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      record.completionRate >= 60 ? 'text-[#4ecdc4]' : 'text-[#f5a623]'
                    }`}
                  >
                    {record.completionRate}%
                  </span>
                  <span className="text-[#8892a4]">
                    {record.items.filter((i) => i.status === 'completed').length}/
                    {record.items.filter((i) => i.type !== 'sleep').length}
                  </span>
                </div>
              </div>
            ))}
            {allRecords.length === 0 && (
              <p className="text-xs text-[#8892a4] text-center py-4">暂无记录</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
