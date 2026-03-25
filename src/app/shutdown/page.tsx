'use client';

import { useState, useEffect } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import Link from 'next/link';

const shutdownChecklist = [
  { id: 'save-work', label: '保存所有工作文件', icon: '💾' },
  { id: 'close-computer', label: '关闭电脑', icon: '💻' },
  { id: 'put-phone', label: '放下手机', icon: '📱' },
  { id: 'wash', label: '洗漱', icon: '🪥' },
  { id: 'prepare-bed', label: '准备好睡眠环境', icon: '🛏️' },
];

export default function ShutdownPage() {
  const { completeItem } = useScheduleStore();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState('');
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(22, 0, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        setIsOvertime(false);
      } else {
        const over = Math.abs(diff);
        const m = Math.floor(over / 60000);
        setCountdown(`已超时 ${m} 分钟`);
        setIsOvertime(true);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = checked.size === shutdownChecklist.length;

  const handleComplete = () => {
    completeItem('shutdown');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">断电仪式</h1>

      {/* 倒计时 */}
      <div className={`rounded-xl p-6 text-center ${isOvertime ? 'bg-[#ff6b6b]/20' : 'bg-[#1e2a4a]'}`}>
        <p className="text-sm text-[#8892a4] mb-2">
          {isOvertime ? '已超过断电时间' : '距离断电'}
        </p>
        <p className={`text-4xl font-mono font-bold ${isOvertime ? 'text-[#ff6b6b]' : 'text-[#f5a623]'}`}>
          {countdown}
        </p>
        <p className="text-xs text-[#8892a4] mt-2">目标：22:00 关闭电脑</p>
      </div>

      {/* 断电清单 */}
      <div>
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">断电清单</h2>
        <div className="space-y-2">
          {shutdownChecklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl p-4 transition-all ${
                checked.has(item.id)
                  ? 'bg-[#4ecdc4]/20 border border-[#4ecdc4]/40'
                  : 'bg-[#1e2a4a] border border-transparent'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  checked.has(item.id) ? 'bg-[#4ecdc4] border-[#4ecdc4]' : 'border-[#2a3a5c]'
                }`}
              >
                {checked.has(item.id) && <span className="text-xs text-white">✓</span>}
              </div>
              <span className="text-lg">{item.icon}</span>
              <span
                className={`text-sm ${
                  checked.has(item.id) ? 'text-[#4ecdc4] line-through' : 'text-[#f0f0f0]'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 完成按钮 */}
      <button
        onClick={handleComplete}
        disabled={!allChecked}
        className={`w-full rounded-xl py-3 font-bold transition-colors ${
          allChecked
            ? 'bg-[#4ecdc4] text-[#1a1a2e] hover:bg-[#4ecdc4]/90'
            : 'bg-[#2a3a5c] text-[#8892a4] cursor-not-allowed'
        }`}
      >
        {allChecked ? '确认断电，准备休息' : `还有 ${shutdownChecklist.length - checked.size} 项未完成`}
      </button>

      {/* 进入冥想 */}
      {allChecked && (
        <Link
          href="/meditate"
          className="block w-full rounded-xl bg-[#f5a623]/20 py-3 text-center text-[#f5a623] font-medium hover:bg-[#f5a623]/30 transition-colors"
        >
          进入冥想放松 →
        </Link>
      )}
    </div>
  );
}
