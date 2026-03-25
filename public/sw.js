// 天天向上 - Service Worker
const CACHE_NAME = 'tiantianshangwang-v1';
const OFFLINE_URL = '/offline.html';

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // 预缓存核心资源
        return cache.addAll([
          '/',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 命中缓存直接返回
        if (response) {
          return response;
        }

        // 否则请求网络
        return fetch(event.request).then(response => {
          // 非有效响应直接返回
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应并缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 网络失败时返回离线页面
        return caches.match(OFFLINE_URL);
      })
  );
});

// 推送通知处理
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title || '天天向上';
  const options = {
    body: data.body || '时间到了，开始自律吧！',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
