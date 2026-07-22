"use strict";
import {EvolvaEngine} from "./engine.js?v=10.3.4";
import {BUILD_VERSION,createGameRuntime} from "./game.js?v=10.3.4";

const engine=new EvolvaEngine({stepHz:60,maxCatchUpSteps:5});
let game=null;
function showBootFailure(error){
 console.error("EVOLVA startup failure:",error);
 const box=document.getElementById("error");
 if(box){box.hidden=false;box.textContent=`Build ${BUILD_VERSION} could not finish startup: ${error?.message||error||"unknown error"}. Open reset-cache.html once, then reload.`}
}
try{
 game=createGameRuntime(engine);
 window.__EVOLVA_START__=game.start;
 window.EVOLVA=Object.freeze({version:BUILD_VERSION,diagnostics:game.diagnostics,save:game.save,start:game.start});
 engine.start();
 window.dispatchEvent(new CustomEvent("evolva-runtime-ready"));
}catch(error){
 showBootFailure(error);
 window.EVOLVA=Object.freeze({version:BUILD_VERSION,startupError:String(error?.message||error||"unknown")});
 window.dispatchEvent(new CustomEvent("evolva-runtime-failed",{detail:{message:error?.message||String(error)}}));
}
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
