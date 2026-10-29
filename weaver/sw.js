/* 最小 service worker：讓瀏覽器把本站視為可安裝的 App；不快取，永遠取最新版 */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
