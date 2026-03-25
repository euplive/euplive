'use client';

import { useState, useEffect, useRef } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';

type MeditationMode = 'breathing' | 'guided' | 'free';
type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

const durations = [5, 10, 15];

const phaseConfig: Record<BreathPhase, { label: string; duration: number; color: string }> = {
  inhale: { label: '吸气', duration: 4, color: '#f5a623' },
  hold: { label: '屏息', duration: 7, color: '#4ecdc4' },
  exhale: { label: '呼气', duration: 8, color: '#8892a4' },
  rest: { label: '放松', duration: 1, color: '#2a3a5c' },
};

const phaseOrder: BreathPhase[] = ['inhale', 'hold', 'exhale', 'rest'];

export default function MeditatePage() {
  const { completeItem } = useScheduleStore();
  const [mode, setMode] = useState<MeditationMode>('breathing');
  const [duration, setDuration] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = duration * 60;
  const currentPhaseConfig = phaseConfig[phase];
  const totalProgress = (totalElapsed / totalSeconds) * 100;

  // 初始化音频
  useEffect(() => {
    audioRef.current = new Audio('/audio/meditation-rest-now.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 冥想开始/停止时控制音乐
  useEffect(() => {
    if (!audioRef.current) return;
    if (isRunning && musicPlaying) {
      audioRef.current.play().catch(() => {});
    } else if (!isRunning) {
      audioRef.current.pause();
    }
  }, [isRunning, musicPlaying]);

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTotalElapsed((prev) => {
        if (prev >= totalSeconds - 1) {
          setIsRunning(false);
          return totalSeconds;
        }
        return prev + 1;
      });

      if (mode === 'breathing') {
        setPhaseElapsed((prev) => {
          const currentDuration = phaseConfig[phaseOrder[phaseIndex]].duration;
          if (prev >= currentDuration - 1) {
            const nextIndex = (phaseIndex + 1) % phaseOrder.length;
            setPhaseIndex(nextIndex);
            setPhase(phaseOrder[nextIndex]);
            return 0;
          }
          return prev + 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, phaseIndex, totalSeconds]);

  const handleStart = () => {
    setIsRunning(true);
    setMusicPlaying(true);
    setTotalElapsed(0);
    setPhaseElapsed(0);
    setPhaseIndex(0);
    setPhase('inhale');
  };

  const handleStop = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const handleComplete = () => {
    handleStop();
    setMusicPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    completeItem('meditate');
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 呼吸圆环尺寸
  const ringScale = phase === 'inhale'
    ? 1 + (phaseElapsed / currentPhaseConfig.duration) * 0.5
    : phase === 'exhale'
    ? 1.5 - (phaseElapsed / currentPhaseConfig.duration) * 0.5
    : phase === 'hold'
    ? 1.5
    : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">冥想放松</h1>

      {!isRunning && totalElapsed === 0 && (
        <>
          {/* 模式选择 */}
          <div>
            <h2 className="text-sm text-[#8892a4] mb-2">选择模式</h2>
            <div className="flex rounded-xl bg-[#1a1a2e] p-1">
              {[
                { key: 'breathing' as MeditationMode, label: '4-7-8 呼吸' },
                { key: 'guided' as MeditationMode, label: '引导冥想' },
                { key: 'free' as MeditationMode, label: '自由冥想' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    mode === m.key ? 'bg-[#f5a623] text-[#1a1a2e]' : 'text-[#8892a4]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 时长选择 */}
          <div>
            <h2 className="text-sm text-[#8892a4] mb-2">选择时长</h2>
            <div className="flex gap-3">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 rounded-xl py-3 text-center font-medium transition-colors ${
                    duration === d
                      ? 'bg-[#f5a623] text-[#1a1a2e]'
                      : 'bg-[#1e2a4a] text-[#8892a4] hover:text-[#f0f0f0]'
                  }`}
                >
                  {d} 分钟
                </button>
              ))}
            </div>
          </div>

          {/* 背景音乐预览 */}
          <div className="rounded-xl bg-[#1e2a4a] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎵</span>
                <div>
                  <p className="text-sm text-[#f0f0f0]">Rest Now</p>
                  <p className="text-xs text-[#8892a4]">by Eugenio Mininni · 5:00 · Ambient</p>
                </div>
              </div>
              <button
                onClick={toggleMusic}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  musicPlaying
                    ? 'bg-[#f5a623]/20 text-[#f5a623]'
                    : 'bg-[#2a3a5c] text-[#8892a4] hover:text-[#f0f0f0]'
                }`}
              >
                {musicPlaying ? '暂停试听' : '试听'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8892a4]">音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none bg-[#2a3a5c] accent-[#f5a623]"
              />
              <span className="text-xs text-[#8892a4] w-8">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            className="w-full rounded-xl bg-[#f5a623] py-4 text-[#1a1a2e] font-bold text-lg hover:bg-[#f5a623]/90 transition-colors"
          >
            开始冥想
          </button>
        </>
      )}

      {/* 冥想进行中 */}
      {(isRunning || totalElapsed > 0) && (
        <div className="flex flex-col items-center space-y-8">
          {/* 呼吸圆环 */}
          {mode === 'breathing' && (
            <div className="relative flex items-center justify-center w-64 h-64">
              <div
                className="absolute rounded-full transition-all duration-1000 ease-in-out"
                style={{
                  width: `${120 * ringScale}px`,
                  height: `${120 * ringScale}px`,
                  backgroundColor: currentPhaseConfig.color,
                  opacity: 0.3,
                }}
              />
              <div
                className="absolute rounded-full transition-all duration-1000 ease-in-out"
                style={{
                  width: `${80 * ringScale}px`,
                  height: `${80 * ringScale}px`,
                  backgroundColor: currentPhaseConfig.color,
                  opacity: 0.6,
                }}
              />
              <div className="relative z-10 text-center">
                <p className="text-2xl font-bold" style={{ color: currentPhaseConfig.color }}>
                  {currentPhaseConfig.label}
                </p>
                <p className="text-sm text-[#8892a4] mt-1">
                  {currentPhaseConfig.duration - phaseElapsed}秒
                </p>
              </div>
            </div>
          )}

          {/* 引导冥想 / 自由冥想 */}
          {mode !== 'breathing' && (
            <div className="flex items-center justify-center w-64 h-64">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-[#f5a623]/20 mx-auto flex items-center justify-center animate-pulse">
                  <span className="text-4xl">🧘</span>
                </div>
                <p className="text-lg text-[#f0f0f0] mt-4">
                  {mode === 'guided' ? '静心聆听，放松身体...' : '安静地与自己相处...'}
                </p>
              </div>
            </div>
          )}

          {/* 计时 */}
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-[#f0f0f0]">
              {formatTime(totalSeconds - totalElapsed)}
            </p>
            <div className="w-48 h-1 rounded-full bg-[#2a3a5c] mt-3 mx-auto overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f5a623] transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* 音乐控制 */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMusic}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                musicPlaying
                  ? 'bg-[#f5a623]/20 text-[#f5a623]'
                  : 'bg-[#2a3a5c] text-[#8892a4]'
              }`}
            >
              🎵 {musicPlaying ? '关闭音乐' : '播放音乐'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 rounded-full appearance-none bg-[#2a3a5c] accent-[#f5a623]"
            />
          </div>

          {/* 控制 */}
          <div className="flex gap-4">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="rounded-xl bg-[#2a3a5c] px-8 py-3 text-[#8892a4] font-medium hover:text-[#f0f0f0] transition-colors"
              >
                暂停
              </button>
            ) : totalElapsed < totalSeconds ? (
              <button
                onClick={() => setIsRunning(true)}
                className="rounded-xl bg-[#f5a623] px-8 py-3 text-[#1a1a2e] font-medium"
              >
                继续
              </button>
            ) : null}
            <button
              onClick={handleComplete}
              className="rounded-xl bg-[#4ecdc4] px-8 py-3 text-[#1a1a2e] font-bold hover:bg-[#4ecdc4]/90 transition-colors"
            >
              完成冥想
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
