'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import Timeline from '@/components/Timeline';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function HomePage() {
  const { today, streakDays, initToday, addCustomHabit } = useScheduleStore();
  const [currentTime, setCurrentTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // 添加习惯表单状态
  const [newHabit, setNewHabit] = useState({
    label: '',
    description: '',
    icon: '🎯',
    scheduledTime: '09:00',
  });

  useEffect(() => {
    initToday();
  }, [initToday]);

  const handleAddHabit = () => {
    if (!newHabit.label.trim()) return;
    addCustomHabit({
      label: newHabit.label,
      description: newHabit.description || `每日${newHabit.label}`,
      icon: newHabit.icon,
      scheduledTime: newHabit.scheduledTime,
      type: 'custom',
      path: '/',
    });
    setNewHabit({ label: '', description: '', icon: '🎯', scheduledTime: '09:00' });
    setShowAddModal(false);
  };

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#8892a4]">今日日程</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm text-[#f5a623] hover:text-[#f5a623]/80 flex items-center gap-1"
          >
            <span>+</span> 添加习惯
          </button>
        </div>
        <Timeline />
      </div>

      {/* 添加习惯弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2a4a] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-center mb-4">添加新习惯</h3>

            <div className="space-y-4">
              {/* 习惯名称 */}
              <div>
                <label className="text-xs text-[#8892a4]">习惯名称</label>
                <input
                  type="text"
                  value={newHabit.label}
                  onChange={(e) => setNewHabit({ ...newHabit, label: e.target.value })}
                  placeholder="比如：每天运动、读书..."
                  className="w-full mt-1 rounded-lg bg-[#16213e] border border-[#2a3a5c] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#8892a4]/50 focus:outline-none focus:border-[#f5a623]"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="text-xs text-[#8892a4]">描述（可选）</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="简单描述一下"
                  className="w-full mt-1 rounded-lg bg-[#16213e] border border-[#2a3a5c] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#8892a4]/50 focus:outline-none focus:border-[#f5a623]"
                />
              </div>

              {/* 提醒时间 */}
              <div>
                <label className="text-xs text-[#8892a4]">提醒时间</label>
                <input
                  type="time"
                  value={newHabit.scheduledTime}
                  onChange={(e) => setNewHabit({ ...newHabit, scheduledTime: e.target.value })}
                  className="w-full mt-1 rounded-lg bg-[#16213e] border border-[#2a3a5c] px-3 py-2 text-sm font-mono text-[#f5a623] focus:outline-none focus:border-[#f5a623]"
                />
              </div>

              {/* 图标选择 */}
              <div>
                <label className="text-xs text-[#8892a4]">图标</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['🎯', '🏃', '📚', '💪', '🧘', '💤', '🍎', '💧', '✍️', '🎨', '🎵', '💼'].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`w-10 h-10 rounded-lg text-lg transition-all ${
                        newHabit.icon === icon
                          ? 'bg-[#f5a623] text-[#1a1a2e]'
                          : 'bg-[#16213e] hover:bg-[#2a3a5c]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm text-[#8892a4] bg-[#16213e] hover:bg-[#2a3a5c] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddHabit}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-[#f5a623] text-[#1a1a2e] hover:bg-[#f5a623]/90 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
