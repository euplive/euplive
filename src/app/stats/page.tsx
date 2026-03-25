'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { useEffect, useState } from 'react';

interface ModuleStat {
  label: string;
  icon: string;
  completed: number;
  total: number;
}

export default function StatsPage() {
  const { today, history, streakDays, initToday } = useScheduleStore();
  const [weekData, setWeekData] = useState<number[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);

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
    }
  }, [today, history, initToday]);

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const maxRate = Math.max(...weekData, 1);

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
          <p className="text-3xl font-bold text-[#4ecdc4]">{history.length + (today ? 1 : 0)}</p>
          <p className="text-xs text-[#8892a4] mt-1">累计天数</p>
        </div>
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
                    height: `${(rate / 100) * 100}px`,
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
    </div>
  );
}
