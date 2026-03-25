'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KegelSettings {
  rounds: number;        // 轮次
  holdDuration: number;   // 保持秒数
}

const DEFAULT_SETTINGS: KegelSettings = {
  rounds: 10,
  holdDuration: 5,
};

type Phase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'rest' | 'completed';

// 背景音乐 - 舒缓节奏
let backgroundMusic: AudioContext | null = null;
let bgGainNode: GainNode | null = null;

function createBackgroundMusic(): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  let isPlaying = false;

  const start = () => {
    if (isPlaying) return;
    try {
      backgroundMusic = new (window.AudioContext || (window as any).webkitAudioContext)();
      bgGainNode = backgroundMusic!.createGain();
      bgGainNode.connect(backgroundMusic!.destination);
      bgGainNode.gain.value = 0.15;

      // 创建舒缓的pad音色
      const frequencies = [130.81, 164.81, 196.00]; // C3, E3, G3

      frequencies.forEach((freq) => {
        const osc = backgroundMusic!.createOscillator();
        const oscGain = backgroundMusic!.createGain();

        osc.connect(oscGain);
        oscGain.connect(bgGainNode!);

        osc.frequency.value = freq;
        osc.type = 'sine';

        // 持续播放
        oscGain.gain.value = 0.3;
        osc.start();
      });

      isPlaying = true;
    } catch (e) {
      console.log('背景音乐播放失败:', e);
    }
  };

  const stop = () => {
    if (backgroundMusic) {
      backgroundMusic.close();
      backgroundMusic = null;
      bgGainNode = null;
      isPlaying = false;
    }
  };

  const setVolume = (v: number) => {
    if (bgGainNode) {
      bgGainNode.gain.value = v;
    }
  };

  return { start, stop, setVolume };
}

// 节奏提示音 - 收缩/放松
function playPhaseSound(phase: 'inhale' | 'hold' | 'exhale') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (phase === 'inhale') {
      // 上升音调 - 收缩
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(523.25, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    } else if (phase === 'hold') {
      // 保持 - 稳定音
      osc.frequency.value = 523.25;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
    } else if (phase === 'exhale') {
      // 下降音调 - 放松
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    }

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.log('提示音播放失败:', e);
  }
}

// 完成提示音
function playCompleteSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 播放胜利和弦
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.1);
      gain.gain.linearRampToValueAtTime(0, start + 1);

      osc.start(start);
      osc.stop(start + 1.2);
    });
  } catch (e) {
    console.log('完成音播放失败:', e);
  }
}

export default function KegelPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<KegelSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>('ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [totalCompleted, setTotalCompleted] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const bgMusicRef = useRef<ReturnType<typeof createBackgroundMusic> | null>(null);

  // 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('kegel-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // 加载今日完成次数
    const today = new Date().toISOString().split('T')[0];
    const savedCount = localStorage.getItem(`kegel-completed-${today}`);
    if (savedCount) {
      setTotalCompleted(parseInt(savedCount, 10));
    }

    bgMusicRef.current = createBackgroundMusic();

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
      }
    };
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('kegel-settings', JSON.stringify(settings));
  }, [settings]);

  // 音量控制
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.setVolume(volume * 0.3);
    }
  }, [volume]);

  // 阶段计时
  useEffect(() => {
    if (phase === 'ready' || phase === 'completed') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setPhaseTime((prev) => {
        const newTime = prev + 1;

        // 阶段时长
        let duration = 0;
        if (phase === 'inhale') duration = 3;
        else if (phase === 'hold') duration = settings.holdDuration;
        else if (phase === 'exhale') duration = 3;
        else if (phase === 'rest') duration = 2;

        if (newTime >= duration) {
          // 切换阶段
          if (phase === 'inhale') {
            setPhase('hold');
            playPhaseSound('hold');
          } else if (phase === 'hold') {
            setPhase('exhale');
            playPhaseSound('exhale');
          } else if (phase === 'exhale') {
            if (currentRound < settings.rounds) {
              setPhase('rest');
              playPhaseSound('exhale');
            } else {
              // 完成
              handleComplete();
              return prev;
            }
          } else if (phase === 'rest') {
            // 开始下一轮
            setCurrentRound((r) => r + 1);
            setPhase('inhale');
            playPhaseSound('inhale');
            return 0;
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, currentRound, settings.holdDuration, settings.rounds]);

  const handleComplete = () => {
    setPhase('completed');
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
    }
    playCompleteSound();

    // 记录完成次数
    const today = new Date().toISOString().split('T')[0];
    const newCount = totalCompleted + 1;
    setTotalCompleted(newCount);
    localStorage.setItem(`kegel-completed-${today}`, String(newCount));
  };

  const startExercise = () => {
    setCurrentRound(1);
    setPhase('inhale');
    setPhaseTime(0);
    if (bgMusicRef.current) {
      bgMusicRef.current.start();
    }
    playPhaseSound('inhale');
  };

  const stopExercise = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
    }
    setPhase('ready');
    setCurrentRound(0);
    setPhaseTime(0);
  };

  // 获取阶段显示
  const getPhaseDisplay = () => {
    switch (phase) {
      case 'inhale':
        return { text: '收缩', icon: '💪', color: '#f5a623' };
      case 'hold':
        return { text: '保持', icon: '⏸️', color: '#4ecdc4' };
      case 'exhale':
        return { text: '放松', icon: '🌊', color: '#8892a4' };
      case 'rest':
        return { text: '休息', icon: '😌', color: '#8892a4' };
      default:
        return { text: '准备', icon: '🎯', color: '#f5a623' };
    }
  };

  const phaseDisplay = getPhaseDisplay();

  // 进度
  const totalPhases = settings.rounds * 4; // 每轮4个阶段
  const currentPhase = (currentRound - 1) * 4 + (phase === 'inhale' ? 1 : phase === 'hold' ? 2 : phase === 'exhale' ? 3 : phase === 'rest' ? 4 : 0);
  const progress = phase === 'ready' ? 0 : (currentPhase / totalPhases) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">提肛运动</h1>

      {/* 今日统计 */}
      <div className="rounded-xl bg-[#1e2a4a] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-[#4ecdc4]">{totalCompleted}</p>
            <p className="text-xs text-[#8892a4]">今日完成次数</p>
          </div>
          <div className="text-right text-xs text-[#8892a4]">
            <p>收缩 → 保持 → 放松</p>
            <p>每轮约 {settings.holdDuration + 8} 秒</p>
          </div>
        </div>
      </div>

      {/* 运动进行中 */}
      {phase !== 'ready' && phase !== 'completed' && (
        <div className="rounded-xl bg-[#1e2a4a] p-8 text-center">
          <p className="text-6xl mb-4">{phaseDisplay.icon}</p>
          <p className="text-4xl font-bold mb-2" style={{ color: phaseDisplay.color }}>
            {phaseDisplay.text}
          </p>
          <p className="text-2xl font-mono text-[#f5a623]">
            第 {currentRound}/{settings.rounds} 轮
          </p>

          {/* 进度条 */}
          <div className="w-full h-2 rounded-full bg-[#2a3a5c] mt-6 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4ecdc4] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 完成画面 */}
      {phase === 'completed' && (
        <div className="rounded-xl bg-[#4ecdc4]/20 p-8 text-center">
          <p className="text-6xl mb-4">🎉</p>
          <p className="text-2xl font-bold text-[#4ecdc4]">练习完成！</p>
          <p className="text-sm text-[#8892a4] mt-2">
            今日已完成 {totalCompleted} 次提肛运动
          </p>
        </div>
      )}

      {/* 设置区域 */}
      {phase === 'ready' && (
        <>
          {/* 轮次设置 */}
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">🏋️ 练习轮次</span>
              <span className="text-sm text-[#f5a623]">{settings.rounds} 轮</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={settings.rounds}
              onChange={(e) => setSettings({ ...settings, rounds: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none bg-[#2a3a5c] accent-[#f5a623]"
            />
            <div className="flex justify-between text-xs text-[#8892a4] mt-1">
              <span>5轮</span>
              <span>20轮</span>
            </div>
          </div>

          {/* 保持时长 */}
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">⏱️ 保持时长</span>
              <span className="text-sm text-[#4ecdc4]">{settings.holdDuration} 秒</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={settings.holdDuration}
              onChange={(e) => setSettings({ ...settings, holdDuration: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none bg-[#2a3a5c] accent-[#4ecdc4]"
            />
            <div className="flex justify-between text-xs text-[#8892a4] mt-1">
              <span>3秒</span>
              <span>10秒</span>
            </div>
          </div>

          {/* 音量控制 */}
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">🔊 背景音乐</span>
              <span className="text-xs text-[#8892a4]">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-[#2a3a5c] accent-[#f5a623]"
            />
          </div>

          {/* 说明 */}
          <div className="rounded-xl bg-[#f5a623]/10 p-4">
            <p className="text-xs text-[#f5a623] font-medium mb-2">💡 提肛运动节奏</p>
            <div className="text-xs text-[#8892a4] space-y-1">
              <p>1️⃣ 吸气收缩 → 2️⃣ 保持 → 3️⃣ 呼气放松 → 4️⃣ 休息</p>
              <p>配合舒缓背景音乐，保持节奏均匀</p>
            </div>
          </div>
        </>
      )}

      {/* 控制按钮 */}
      <div className="flex gap-3">
        {phase === 'ready' ? (
          <button
            onClick={startExercise}
            className="flex-1 rounded-xl bg-[#f5a623] py-3 text-[#1a1a2e] font-bold hover:bg-[#f5a623]/90"
          >
            开始练习
          </button>
        ) : phase === 'completed' ? (
          <button
            onClick={() => {
              setPhase('ready');
              setCurrentRound(0);
            }}
            className="flex-1 rounded-xl bg-[#f5a623] py-3 text-[#1a1a2e] font-bold"
          >
            再次练习
          </button>
        ) : (
          <button
            onClick={stopExercise}
            className="flex-1 rounded-xl bg-[#ff6b6b] py-3 text-white font-bold"
          >
            停止
          </button>
        )}
      </div>
    </div>
  );
}
