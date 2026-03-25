'use client';

import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const { requestPermission, checkAndNotify, reloadSettings } = useNotification();

  useEffect(() => {
    // 检查通知权限状态
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);

      // 加载设置并立即检查
      reloadSettings();
      checkAndNotify();
    }
  }, [checkAndNotify, reloadSettings]);

  // 提供给子组件的方法
  const requestNotification = async () => {
    const granted = await requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    return granted;
  };

  // 将方法挂载到 window 上供其他组件调用
  useEffect(() => {
    (window as any).__requestNotification = requestNotification;
    (window as any).__notificationStatus = permissionStatus;
  }, [permissionStatus]);

  return <>{children}</>;
}
