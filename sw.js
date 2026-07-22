"use strict";
const CACHE="evolva-v10-3-5";
const SHELL=["./","./index.html","./app.js?v=10.3.5","./styles.css?v=10.3.5","./manifest.webmanifest?v=10.3.5","./icons/icon.svg","./release.json","./reset-cache.html"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("evolva-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html"))));});
