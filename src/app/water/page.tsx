'use client';

import { useState, useEffect } from 'react';

interface WaterRecord {
  time: string;
  amount: number; // ml
}

export default function WaterPage() {
  const [todayCount, setTodayCount] = useState(0);
  const [todayAmount, setTodayAmount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8); // 目标杯数
  const [cupSize, setCupSize] = useState(250); // 每杯 ml
  const [history, setHistory] = useState<{ date: string; count: number; amount: number }[]>([]);
  const [showTip, setShowTip] = useState(false);

  // 加载数据
  useEffect(() => {
    const savedGoal = localStorage.getItem('water-daily-goal');
    if (savedGoal) setDailyGoal(parseInt(savedGoal));

    const savedCupSize = localStorage.getItem('water-cup-size');
    if (savedCupSize) setCupSize(parseInt(savedCupSize));

    // 加载今日记录
    const today = new Date().toISOString().slice(0, 10);
    const savedToday = localStorage.getItem(`water-today-${today}`);
    if (savedToday) {
      const data = JSON.parse(savedToday);
      setTodayCount(data.count);
      setTodayAmount(data.amount);
    }

    // 加载历史
    const savedHistory = localStorage.getItem('water-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存设置
  const saveGoal = (goal: number) => {
    setDailyGoal(goal);
    localStorage.setItem('water-daily-goal', goal.toString());
  };

  const saveCupSize = (size: number) => {
    setCupSize(size);
    localStorage.setItem('water-cup-size', size.toString());
  };

  // 喝水
  const addWater = () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newCount = todayCount + 1;
    const newAmount = todayAmount + cupSize;

    setTodayCount(newCount);
    setTodayAmount(newAmount);

    // 保存今日
    localStorage.setItem(
      `water-today-${today}`,
      JSON.stringify({ count: newCount, amount: newAmount, time })
    );

    // 更新历史
    const existingIndex = history.findIndex((h) => h.date === today);
    let newHistory = [...history];
    if (existingIndex >= 0) {
      newHistory[existingIndex] = { date: today, count: newCount, amount: newAmount };
    } else {
      newHistory.unshift({ date: today, count: newCount, amount: newAmount });
    }
    newHistory = newHistory.slice(0, 30); // 保留30天
    setHistory(newHistory);
    localStorage.setItem('water-history', JSON.stringify(newHistory));

    // 激励提示
    if (newCount === dailyGoal) {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
    }
  };

  // 撤销
  const undoWater = () => {
    if (todayCount <= 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const newCount = todayCount - 1;
    const newAmount = todayAmount - cupSize;

    setTodayCount(newCount);
    setTodayAmount(newAmount);

    localStorage.setItem(
      `water-today-${today}`,
      JSON.stringify({ count: newCount, amount: newAmount, time: '' })
    );

    // 更新历史
    const newHistory = history.map((h) =>
      h.date === today ? { ...h, count: newCount, amount: newAmount } : h
    );
    setHistory(newHistory);
    localStorage.setItem('water-history', JSON.stringify(newHistory));
  };

  // 进度
  const progress = Math.min(100, (todayCount / dailyGoal) * 100);

  // 剩余杯数
  const remaining = Math.max(0, dailyGoal - todayCount);

  // 生成喝水杯子的视觉效果
  const cups = Array.from({ length: dailyGoal }, (_, i) => i < todayCount);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">💧 喝水记录</h1>

      {/* 目标进度 */}
      <div className="rounded-xl bg-[#1e2a4a] p-6 text-center">
        <div className="relative inline-block">
          {/* 大数字 */}
          <p className="text-5xl font-bold text-[#4ecdc4]">{todayCount}</p>
          <p className="text-sm text-[#8892a4]">/ {dailyGoal} 杯</p>

          {/* 进度环 */}
          <svg className="absolute -inset-4 w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="#2a3a5c"
              strokeWidth="6"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="#4ecdc4"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
              className="transition-all duration-500"
            />
          </svg>
        </div>

        <p className="text-sm text-[#8892a4] mt-4">
          {remaining > 0 ? `还需喝 ${remaining} 杯` : '🎉 今日目标已完成！'}
        </p>
        <p className="text-xs text-[#8892a4] mt-1">
          约 {(todayAmount / 1000).toFixed(1)}L
        </p>
      </div>

      {/* 喝水提示 */}
      {showTip && (
        <div className="rounded-xl bg-[#4ecdc4]/20 p-4 text-center animate-pulse">
          <span className="text-lg">🎉 太棒了！今日喝水目标达成！</span>
        </div>
      )}

      {/* 杯子网格 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">今日喝水</h2>
        <div className="grid grid-cols-4 gap-3">
          {cups.map((filled, i) => (
            <div
              key={i}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                filled
                  ? 'bg-[#4ecdc4]/30'
                  : 'bg-[#16213e]'
              }`}
            >
              {filled ? '💧' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* 喝水按钮 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={undoWater}
          disabled={todayCount <= 0}
          className="w-14 h-14 rounded-full text-xl bg-[#2a3a5c] text-[#8892a4] hover:text-white disabled:opacity-30 transition-all"
        >
          ↩
        </button>
        <button
          onClick={addWater}
          className="w-24 h-24 rounded-full text-3xl font-bold bg-gradient-to-br from-[#4ecdc4] to-[#45b7aa] text-white hover:scale-105 transition-transform shadow-lg shadow-[#4ecdc4]/30"
        >
          +{cupSize}ml
        </button>
      </div>

      {/* 快速添加 */}
      <div className="flex justify-center gap-2">
        {[100, 150, 200, 250, 300, 350].map((size) => (
          <button
            key={size}
            onClick={() => {
              if (size !== cupSize) {
                saveCupSize(size);
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              cupSize === size
                ? 'bg-[#4ecdc4] text-[#1a1a2e]'
                : 'bg-[#2a3a5c] text-[#8892a4] hover:text-white'
            }`}
          >
            {size}ml
          </button>
        ))}
      </div>

      {/* 设置 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <h2 className="text-sm font-medium text-[#8892a4] mb-3">⚙️ 每日目标</h2>
        <div className="flex justify-center gap-2">
          {[4, 6, 8, 10, 12].map((goal) => (
            <button
              key={goal}
              onClick={() => saveGoal(goal)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                dailyGoal === goal
                  ? 'bg-[#4ecdc4] text-[#1a1a2e]'
                  : 'bg-[#16213e] text-[#8892a4] hover:text-white'
              }`}
            >
              {goal}杯
            </button>
          ))}
        </div>
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="rounded-xl bg-[#1e2a4a] p-4">
          <h2 className="text-sm font-medium text-[#8892a4] mb-3">📜 最近记录</h2>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.slice(0, 7).map((h) => (
              <div key={h.date} className="flex justify-between text-sm">
                <span className="text-[#8892a4]">{h.date}</span>
                <span>
                  <span className="text-[#4ecdc4]">{h.count}杯</span>
                  <span className="text-[#8892a4]"> ({(h.amount / 1000).toFixed(1)}L)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
