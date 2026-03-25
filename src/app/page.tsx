'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import Timeline from '@/components/Timeline';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function HomePage() {
  const { today, streakDays, initToday } = useScheduleStore();
  const [currentTime, setCurrentTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    initToday();
  }, [initToday]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(format(now, 'HH:mm'));
      setDateStr(format(now, 'yyyy年M月d日 EEEE', { locale: zhCN }));
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-[#f0f0f0]">每日自律</h1>
        <p className="text-sm text-[#8892a4] mt-1">{dateStr}</p>
        <p className="text-3xl font-mono font-bold text-[#f5a623] mt-2">{currentTime}</p>
      </div>

      {/* 统计卡片 */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-[#1e2a4a] p-3 text-center">
          <p className="text-2xl font-bold text-[#4ecdc4]">{streakDays}</p>
          <p className="text-xs text-[#8892a4] mt-1">连续自律</p>
        </div>
        <div className="flex-1 rounded-xl bg-[#1e2a4a] p-3 text-center">
          <p className="text-2xl font-bold text-[#f5a623]">{today?.completionRate ?? 0}%</p>
          <p className="text-xs text-[#8892a4] mt-1">今日完成</p>
        </div>
        <div className="flex-1 rounded-xl bg-[#1e2a4a] p-3 text-center">
          <p className="text-2xl font-bold text-[#f0f0f0]">
            {today ? today.items.filter((i) => i.status === 'completed').length : 0}/{today ? today.items.filter((i) => i.type !== 'sleep').length : 0}
          </p>
          <p className="text-xs text-[#8892a4] mt-1">已完成</p>
        </div>
      </div>

      {/* 时间线 */}
      <div>
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">今日日程</h2>
        <Timeline />
      </div>
    </div>
  );
}
