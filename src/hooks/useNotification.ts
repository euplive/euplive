'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AlarmSettings {
  alarmTime: string;      // "06:30"
  alarmEnabled: boolean;
  shutdownTime: string;   // "22:00"
  sleepTime: string;      // "22:30"
  waterReminder: boolean; // 喝水提醒
  sedentaryReminder: boolean; // 久坐提醒
}

const DEFAULT_SETTINGS: AlarmSettings = {
  alarmTime: '06:30',
  alarmEnabled: false,
  shutdownTime: '22:00',
  sleepTime: '22:30',
  waterReminder: true,
  sedentaryReminder: true,
};

export function useNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<AlarmSettings>(DEFAULT_SETTINGS);
  const notifiedRef = useRef<{
    alarm: string;      // 最后通知的日期
    shutdown: string;  // 最后通知的日期
    sleep: string;     // 最后通知的日期
    water: string;     // 最后通知的时间（每小时的整点）
    sedentary: string; // 最后通知的时间
  }>({ alarm: '', shutdown: '', sleep: '', water: '', sedentary: '' });

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
        waterReminder: parsed.waterReminder !== false,
        sedentaryReminder: parsed.sedentaryReminder !== false,
      };
    }
    // 也从 user-settings 读取
    const userSettings = localStorage.getItem('user-settings');
    if (userSettings) {
      const parsed = JSON.parse(userSettings);
      settingsRef.current = {
        alarmTime: parsed.alarmTime || settingsRef.current.alarmTime,
        alarmEnabled: parsed.alarmEnabled || false,
        shutdownTime: parsed.shutdownTime || '22:00',
        sleepTime: parsed.sleepTime || '22:30',
        waterReminder: parsed.waterReminder !== false,
        sedentaryReminder: parsed.sedentaryReminder !== false,
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
    const currentHour = now.getHours();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { alarmEnabled, alarmTime, shutdownTime, sleepTime, waterReminder, sedentaryReminder } = settingsRef.current;

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

    // 2. 喝水提醒 (每小时整点)
    if (waterReminder && now.getMinutes() === 0) {
      const waterKey = `${today}-${currentHour}`;
      if (notifiedRef.current.water !== waterKey) {
        notifiedRef.current.water = waterKey;
        sendNotification('💧 喝水时间到！', '站起来活动一下，喝杯水补充水分~');
      }
    }

    // 3. 久坐提醒 (每40分钟)
    if (sedentaryReminder) {
      const lastSedentary = localStorage.getItem('last-sedentary-active');
      const lastActive = lastSedentary ? parseInt(lastSedentary) : 0;
      const timeSinceActive = Date.now() - lastActive;

      // 如果超过40分钟没有活动
      if (timeSinceActive > 40 * 60 * 1000) {
        const sedentaryKey = `${today}-${currentTime}`;
        if (notifiedRef.current.sedentary !== sedentaryKey) {
          // 限制每小时最多一次
          const lastSedentaryNotify = notifiedRef.current.sedentary;
          if (!lastSedentaryNotify || !lastSedentaryNotify.startsWith(today) || parseInt(lastSedentaryNotify.split('-')[1] || '0') !== currentHour) {
            notifiedRef.current.sedentary = sedentaryKey;
            sendNotification('🪑 久坐提醒！', '你已经坐很久了，站起来活动一下吧！');
          }
        }
      }
    }

    // 4. 断电提醒 (22:00)
    if (Math.abs(currentMinutes - shutdownMinutes) <= 1) {
      if (notifiedRef.current.shutdown !== today) {
        notifiedRef.current.shutdown = today;
        sendNotification('🔌 断电时间到！', '是时候关闭电脑，准备休息了');
      }
    }

    // 5. 睡觉提醒 (22:30)
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
        waterReminder: parsed.waterReminder !== false,
        sedentaryReminder: parsed.sedentaryReminder !== false,
      };
    }
    // 也从 user-settings 读取
    const userSettings = localStorage.getItem('user-settings');
    if (userSettings) {
      const parsed = JSON.parse(userSettings);
      settingsRef.current = {
        alarmTime: parsed.alarmTime || settingsRef.current.alarmTime,
        alarmEnabled: parsed.alarmEnabled || settingsRef.current.alarmEnabled,
        shutdownTime: parsed.shutdownTime || settingsRef.current.shutdownTime,
        sleepTime: parsed.sleepTime || settingsRef.current.sleepTime,
        waterReminder: parsed.waterReminder !== false,
        sedentaryReminder: parsed.sedentaryReminder !== false,
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
