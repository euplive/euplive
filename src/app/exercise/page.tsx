'use client';

import { useState, useEffect, useCallback } from 'react';
import { baduanjinSteps, paipaoSteps, type ExerciseStep } from '@/constants/exercises';
import { useScheduleStore } from '@/store/scheduleStore';

type ExerciseType = 'baduanjin' | 'paipao';

export default function ExercisePage() {
  const [activeTab, setActiveTab] = useState<ExerciseType>('baduanjin');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const { completeItem } = useScheduleStore();

  const steps = activeTab === 'baduanjin' ? baduanjinSteps : paipaoSteps;
  const step = steps[currentStep];
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= step.duration - 1) {
          // 自动进入下一步
          if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, step.duration, currentStep, steps.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleComplete = useCallback(() => {
    // 根据当前时间判断是晨练还是午后锻炼
    const hour = new Date().getHours();
    const id = hour < 12 ? 'morning-exercise' : 'afternoon-exercise';
    completeItem(id);
  }, [completeItem]);

  const progress = step ? (elapsed / step.duration) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">锻炼引导</h1>

      {/* Tab 切换 */}
      <div className="flex rounded-xl bg-[#1a1a2e] p-1">
        {[
          { key: 'baduanjin' as ExerciseType, label: '八段锦' },
          { key: 'paipao' as ExerciseType, label: '拍拍操' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentStep(0);
              setElapsed(0);
              setIsPlaying(false);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#f5a623] text-[#1a1a2e]'
                : 'text-[#8892a4] hover:text-[#f0f0f0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 当前动作 */}
      <div className="rounded-xl bg-[#1e2a4a] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#8892a4]">
            动作 {currentStep + 1}/{steps.length}
          </span>
          <span className="text-xs text-[#f5a623]">
            {formatTime(elapsed)} / {formatTime(step.duration)}
          </span>
        </div>

        <h2 className="text-lg font-bold text-[#f5a623] mb-2">{step.name}</h2>
        <p className="text-sm text-[#8892a4] leading-relaxed">{step.description}</p>

        {/* 进度条 */}
        <div className="mt-4 h-1.5 rounded-full bg-[#2a3a5c] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#f5a623] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep((s) => s - 1);
              setElapsed(0);
            }
          }}
          disabled={currentStep === 0}
          className="rounded-full bg-[#1e2a4a] p-3 text-[#8892a4] disabled:opacity-30 hover:text-[#f0f0f0] transition-colors"
        >
          上一步
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="rounded-full bg-[#f5a623] px-8 py-3 text-[#1a1a2e] font-bold text-lg hover:bg-[#f5a623]/90 transition-colors"
        >
          {isPlaying ? '暂停' : '开始'}
        </button>

        <button
          onClick={() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep((s) => s + 1);
              setElapsed(0);
            }
          }}
          disabled={currentStep === steps.length - 1}
          className="rounded-full bg-[#1e2a4a] p-3 text-[#8892a4] disabled:opacity-30 hover:text-[#f0f0f0] transition-colors"
        >
          下一步
        </button>
      </div>

      {/* 总时长 */}
      <p className="text-center text-xs text-[#8892a4]">
        总时长约 {Math.round(totalDuration / 60)} 分钟
      </p>

      {/* 动作列表 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#8892a4]">全部动作</h3>
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentStep(i);
              setElapsed(0);
            }}
            className={`w-full text-left rounded-lg p-3 transition-colors ${
              i === currentStep
                ? 'bg-[#f5a623]/20 border border-[#f5a623]/40'
                : i < currentStep
                ? 'bg-[#4ecdc4]/10 border border-transparent'
                : 'bg-[#1e2a4a]/60 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${i === currentStep ? 'text-[#f5a623]' : i < currentStep ? 'text-[#4ecdc4]' : 'text-[#8892a4]'}`}>
                {i + 1}. {s.name}
              </span>
              <span className="text-xs text-[#8892a4]">{s.duration}秒</span>
            </div>
          </button>
        ))}
      </div>

      {/* 完成打卡 */}
      <button
        onClick={handleComplete}
        className="w-full rounded-xl bg-[#4ecdc4] py-3 text-[#1a1a2e] font-bold hover:bg-[#4ecdc4]/90 transition-colors"
      >
        完成打卡
      </button>
    </div>
  );
}
