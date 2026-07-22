"use strict";
const CACHE="evolva-v10-3-3";
const SHELL=["./reset-cache.html","./release.json","./","./index.html","./styles.css?v=10.3.3","./manifest.webmanifest?v=10.3.3","./icons/icon.svg","./js/main.js?v=10.3.3","./js/engine.js?v=10.3.3","./js/game.js?v=10.3.3"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("evolva-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 const isRelease=url.pathname.endsWith("/release.json")||url.pathname.endsWith("/manifest.webmanifest")||url.pathname.endsWith("/reset-cache.html");
 const isAppAsset=event.request.mode==="navigate"||/\.(?:js|css|html)$/.test(url.pathname)||url.pathname.endsWith("/");
 if(isRelease){event.respondWith(fetch(event.request,{cache:"no-store"}));return}
 if(isAppAsset){
  // Network-first prevents an old HTML shell and newer modules (or vice versa)
  // from being combined during an iPhone/Home Screen update.
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
   return response;
  }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html"))));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response})));
});
