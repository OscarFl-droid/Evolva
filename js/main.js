"use strict";
import {EvolvaEngine} from "./engine.js?v=10.3.1";
import {BUILD_VERSION,createGameRuntime} from "./game.js?v=10.3.1";

const engine=new EvolvaEngine({stepHz:60,maxCatchUpSteps:5});
const game=createGameRuntime(engine);
window.EVOLVA=Object.freeze({version:BUILD_VERSION,diagnostics:game.diagnostics,save:game.save});
engine.start();
async function verifyDeployedBuild(){
 try{
  const response=await fetch(`./release.json?check=${Date.now()}`,{cache:"no-store"});
  if(!response.ok)return;
  const release=await response.json();
  if(release.version!==BUILD_VERSION){
   console.error(`EVOLVA deployment mismatch: page ${BUILD_VERSION}, release ${release.version}`);
   const error=document.getElementById("error");
   if(error){error.hidden=false;error.textContent=`Update mismatch detected (${BUILD_VERSION} / ${release.version}). Open reset-cache.html once.`}
  }
 }catch(error){console.warn("EVOLVA build verification unavailable:",error)}
}
verifyDeployedBuild();


async function registerServiceWorker(){
 if(!("serviceWorker" in navigator)||!location.protocol.startsWith("http"))return;
 try{
  const registration=await navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(BUILD_VERSION)}`,{updateViaCache:"none"});
  if(registration?.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
  // update() is optional in some embedded WebKit states; never treat its absence as a game error.
  if(typeof registration?.update==="function")registration.update().catch(()=>{});
 }catch(error){console.warn("EVOLVA offline cache unavailable:",error)}
}
let controllerReloaded=false;
navigator.serviceWorker?.addEventListener("controllerchange",()=>{
 if(controllerReloaded)return;controllerReloaded=true;
 // Reload only when an older controller existed; first installation must not interrupt play.
 if(sessionStorage.getItem("evolva-had-controller")==="1")location.reload();
 else sessionStorage.setItem("evolva-had-controller","1")
});
if(navigator.serviceWorker?.controller)sessionStorage.setItem("evolva-had-controller","1");
registerServiceWorker();
