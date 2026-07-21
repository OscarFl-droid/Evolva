"use strict";
const CACHE="evolva-v9-0-1";
const SHELL=["./","./index.html","./styles.css?v=9.0.1","./manifest.webmanifest?v=9.0.1","./icons/icon.svg","./js/main.js?v=9.0.1","./js/engine.js?v=9.0.1","./js/game.js?v=9.0.1"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("evolva-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put("./index.html",copy));return response}).catch(()=>caches.match("./index.html")));
  return
 }
 event.respondWith(caches.match(event.request).then(cached=>{
  const network=fetch(event.request,{cache:"no-cache"}).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>cached);
  return cached||network
 }))
});
