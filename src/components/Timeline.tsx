'use client';

import { useScheduleStore, type ScheduleItem } from '@/store/scheduleStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-[#4ecdc4]/20', text: 'text-[#4ecdc4]', label: '已完成' },
    active: { bg: 'bg-[#f5a623]/20', text: 'text-[#f5a623]', label: '进行中' },
    skipped: { bg: 'bg-[#8892a4]/20', text: 'text-[#8892a4]', label: '已跳过' },
    pending: { bg: 'bg-[#2a3a5c]/50', text: 'text-[#8892a4]', label: '待完成' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export default function Timeline() {
  const { today, completeItem, skipItem, completeCustomHabit } = useScheduleStore();

  const handleComplete = (item: ScheduleItem) => {
    if (item.id.startsWith('custom-')) {
      completeCustomHabit(item.id);
    } else {
      completeItem(item.id);
    }
  };
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentTimeMinutes());

  useEffect(() => {
    const timer = setInterval(() => setCurrentMinutes(getCurrentTimeMinutes()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!today) return null;

  return (
    <div className="space-y-1">
      {today.items.map((item: ScheduleItem, index: number) => {
        const itemMinutes = timeToMinutes(item.scheduledTime);
        const nextItem = today.items[index + 1];
        const nextMinutes = nextItem ? timeToMinutes(nextItem.scheduledTime) : itemMinutes + 60;
        const isCurrent = currentMinutes >= itemMinutes && currentMinutes < nextMinutes;
        const isPast = currentMinutes >= nextMinutes;

        return (
          <div key={item.id} className="flex gap-3">
            {/* 时间轴线 */}
            <div className="flex flex-col items-center w-12 flex-shrink-0">
              <span className={`text-xs font-mono ${isCurrent ? 'text-[#f5a623]' : 'text-[#8892a4]'}`}>
                {item.scheduledTime}
              </span>
              <div
                className={`w-3 h-3 rounded-full mt-1 border-2 ${
                  item.status === 'completed'
                    ? 'bg-[#4ecdc4] border-[#4ecdc4]'
                    : isCurrent
                    ? 'bg-[#f5a623] border-[#f5a623] animate-pulse'
                    : isPast
                    ? 'bg-[#2a3a5c] border-[#8892a4]'
                    : 'bg-transparent border-[#2a3a5c]'
                }`}
              />
              {index < today.items.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[40px] ${
                    item.status === 'completed' ? 'bg-[#4ecdc4]/40' : 'bg-[#2a3a5c]'
                  }`}
                />
              )}
            </div>

            {/* 卡片 */}
            <div
              className={`flex-1 mb-2 rounded-xl p-3 transition-all ${
                isCurrent
                  ? 'bg-[#1e2a4a] border border-[#f5a623]/40 shadow-lg shadow-[#f5a623]/5'
                  : 'bg-[#1e2a4a]/60 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className={`font-medium text-sm ${isCurrent ? 'text-[#f0f0f0]' : 'text-[#8892a4]'}`}>
                    {item.label}
                  </span>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <p className="text-xs text-[#8892a4] mt-1 ml-7">{item.description}</p>

              {item.completedAt && (
                <p className="text-xs text-[#4ecdc4] mt-1 ml-7">
                  {item.completedAt} 完成
                </p>
              )}

              {/* 操作按钮 */}
              {item.status === 'pending' && (isPast || isCurrent) && item.type !== 'sleep' && (
                <div className="flex gap-2 mt-2 ml-7">
                  {item.path !== '/' && (
                    <Link
                      href={item.path}
                      className="rounded-lg bg-[#f5a623]/20 px-3 py-1 text-xs text-[#f5a623] hover:bg-[#f5a623]/30 transition-colors"
                    >
                      开始
                    </Link>
                  )}
                  <button
                    onClick={() => handleComplete(item)}
                    className="rounded-lg bg-[#4ecdc4]/20 px-3 py-1 text-xs text-[#4ecdc4] hover:bg-[#4ecdc4]/30 transition-colors"
                  >
                    完成
                  </button>
                  <button
                    onClick={() => skipItem(item.id)}
                    className="rounded-lg bg-[#2a3a5c] px-3 py-1 text-xs text-[#8892a4] hover:bg-[#2a3a5c]/80 transition-colors"
                  >
                    跳过
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
