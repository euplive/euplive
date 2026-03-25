'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AlarmSettings {
  alarmTime: string;      // "06:30"
  alarmEnabled: boolean;
  shutdownTime: string;   // "22:00"
  sleepTime: string;      // "22:30"
}

const DEFAULT_SETTINGS: AlarmSettings = {
  alarmTime: '06:30',
  alarmEnabled: false,
  shutdownTime: '22:00',
  sleepTime: '22:30',
};

export function useNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<AlarmSettings>(DEFAULT_SETTINGS);
  const notifiedRef = useRef<{
    alarm: string;      // 最后通知的日期
    shutdown: string;  // 最后通知的日期
    sleep: string;     // 最后通知的日期
  }>({ alarm: '', shutdown: '', sleep: '' });

  // 加载设置
  useEffect(() => {
    const alarmSettings = localStorage.getItem('alarm-settings');
    if (alarmSettings) {
      const parsed = JSON.parse(alarmSettings);
      settingsRef.current = {
        alarmTime: parsed.alarmTime || '06:30',
        alarmEnabled: parsed.isAlarmActive || false,
        shutdownTime: '22:00',
        sleepTime: '22:30',
      };
    }
  }, []);

  // 初始化音频
  useEffect(() => {
    // 使用 Web Audio API 播放闹钟声音
    audioRef.current = new Audio();
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 请求通知权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('浏览器不支持通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // 发送浏览器通知
  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/file.svg',
        tag: title, // 避免重复通知
        requireInteraction: true, // 需要用户交互才能关闭
      });
    }
  }, []);

  // 播放闹钟声音
  const playAlarmSound = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      // 使用振荡器生成闹钟声音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // A4
      oscillator.type = 'sine';

      // 播放提示音
      oscillator.start();

      // 简单的提示音，实际可以用更好的音频文件
      // 这里用系统的提示音
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.log('播放音频失败:', e);
    }
  }, []);

  // 停止闹钟声音
  const stopAlarmSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // 检查并触发通知
  const checkAndNotify = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const { alarmEnabled, alarmTime, shutdownTime, sleepTime } = settingsRef.current;

    // 解析时间
    const [alarmH, alarmM] = alarmTime.split(':').map(Number);
    const alarmMinutes = alarmH * 60 + alarmM;

    const [shutdownH, shutdownM] = shutdownTime.split(':').map(Number);
    const shutdownMinutes = shutdownH * 60 + shutdownM;

    const [sleepH, sleepM] = sleepTime.split(':').map(Number);
    const sleepMinutes = sleepH * 60 + sleepM;

    // 1. 早起闹钟检查 (在设定时间的前后1分钟内)
    if (alarmEnabled && Math.abs(currentMinutes - alarmMinutes) <= 1) {
      if (notifiedRef.current.alarm !== today) {
        notifiedRef.current.alarm = today;
        sendNotification('⏰ 起床时间到！', '新的一天，从现在开始！');
        playAlarmSound();
      }
    }

    // 2. 断电提醒 (22:00)
    if (Math.abs(currentMinutes - shutdownMinutes) <= 1) {
      if (notifiedRef.current.shutdown !== today) {
        notifiedRef.current.shutdown = today;
        sendNotification('🔌 断电时间到！', '是时候关闭电脑，准备休息了');
      }
    }

    // 3. 睡觉提醒 (22:30)
    if (Math.abs(currentMinutes - sleepMinutes) <= 1) {
      if (notifiedRef.current.sleep !== today) {
        notifiedRef.current.sleep = today;
        sendNotification('😴 睡觉时间到！', '放下手机，给自己一个充足的睡眠');
      }
    }
  }, [sendNotification, playAlarmSound]);

  // 启动定时检查
  useEffect(() => {
    // 每30秒检查一次
    const interval = setInterval(checkAndNotify, 30000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  // 重新加载设置
  const reloadSettings = useCallback(() => {
    const alarmSettings = localStorage.getItem('alarm-settings');
    if (alarmSettings) {
      const parsed = JSON.parse(alarmSettings);
      settingsRef.current = {
        alarmTime: parsed.alarmTime || '06:30',
        alarmEnabled: parsed.isAlarmActive || false,
        shutdownTime: '22:00',
        sleepTime: '22:30',
      };
    }
  }, []);

  return {
    requestPermission,
    sendNotification,
    playAlarmSound,
    stopAlarmSound,
    reloadSettings,
    checkAndNotify,
  };
}
