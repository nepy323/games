/* Service worker：圖片等素材存在手機上（捷運沒訊號也能開）；頁面與程式永遠先抓最新版，抓不到才用存起來的。
   換版本時改 VERSION，舊快取會被清掉。 */
const VERSION='v1',ASSET='assets-'+VERSION,CORE='core-'+VERSION;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k!==ASSET&&k!==CORE)await caches.delete(k);
 await self.clients.claim();
})()));
const isAsset=u=>/\/assets\//.test(u.pathname)||/\.(png|webp|jpg|jpeg|svg|woff2?)$/.test(u.pathname);
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(isAsset(u)){ /* 素材：先用存起來的，背景再更新 */
  e.respondWith((async()=>{const c=await caches.open(ASSET),hit=await c.match(r);
   const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;}).catch(()=>null);
   return hit||(await net)||Response.error();})());
 }else{ /* 頁面、程式、樣式：網路優先，失敗才用快取 */
  e.respondWith((async()=>{const c=await caches.open(CORE);
   try{const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;}
   catch{const hit=await c.match(r,{ignoreSearch:true});return hit||Response.error();}})());
 }
});
