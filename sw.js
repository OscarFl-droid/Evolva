const CACHE="evolva-v7-5-1";
const VERSION="7.5.1";
const SHELL=["./index.html","./styles.css?v=7.5.1","./game.js?v=7.5.1","./manifest.webmanifest?v=7.5.1","./icons/icon.svg"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)))});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);await self.clients.claim()})())});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 if(event.request.mode==="navigate"){
  event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:"reload"});if(fresh.ok){const cache=await caches.open(CACHE);await cache.put("./index.html",fresh.clone())}return fresh}catch{return (await caches.match("./index.html"))||Response.error()}})());return
 }
 event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:"no-store"});if(fresh.ok){const cache=await caches.open(CACHE);await cache.put(event.request,fresh.clone())}return fresh}catch{return (await caches.match(event.request))||Response.error()}})())
});
