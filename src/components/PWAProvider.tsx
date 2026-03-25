'use client';

import { useEffect } from 'react';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered:', registration.scope);

            // 检查更新
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // 有新版本可用
                    console.log('New version available');
                  }
                });
              }
            });
          })
          .catch(error => {
            console.log('SW registration failed:', error);
          });
      });
    }

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      // 静默请求，不弹窗打扰用户
      console.log('Notification permission available');
    }
  }, []);

  return <>{children}</>;
}
