const CACHE="evolva-v6-1";
const ASSETS=["./","./index.html","./styles.css?v=6.1","./game.js?v=6.1","./manifest.webmanifest?v=6.1","./icons/icon.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))]))});
self.addEventListener("fetch",e=>{if(e.request.mode==="navigate"){e.respondWith(fetch(e.request).then(r=>{const q=r.clone();caches.open(CACHE).then(c=>c.put("./index.html",q));return r}).catch(()=>caches.match("./index.html")));return}e.respondWith(fetch(e.request).then(r=>{const q=r.clone();caches.open(CACHE).then(c=>c.put(e.request,q));return r}).catch(()=>caches.match(e.request)))});
