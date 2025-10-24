// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装成功');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活成功');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_TIMER') {
    // 处理计时器消息
    console.log('收到计时器消息:', event.data);
  }
});
