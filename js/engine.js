"use strict";
export class EventBus{
 #listeners=new Map();
 on(type,handler){const set=this.#listeners.get(type)||new Set();set.add(handler);this.#listeners.set(type,set);return()=>set.delete(handler)}
 emit(type,payload){for(const handler of this.#listeners.get(type)||[]){try{handler(payload)}catch(error){console.error(error)}}}
}
export class EvolvaEngine{
 constructor({stepHz=60,maxCatchUpSteps=5}={}){
  this.stepMs=1000/stepHz;this.maxCatchUpSteps=maxCatchUpSteps;this.events=new EventBus();this.systems=[];this.renderers=[];
  this.running=false;this.last=0;this.accumulator=0;this.frame=0;this.simulationSteps=0;this.boundFrame=t=>this.#frame(t)
 }
 addSystem(system){this.#validate(system,"update");this.systems.push(system);this.systems.sort((a,b)=>(a.priority||0)-(b.priority||0));return()=>this.#remove(this.systems,system.id)}
 addRenderer(renderer){this.#validate(renderer,"render");this.renderers.push(renderer);this.renderers.sort((a,b)=>(a.priority||0)-(b.priority||0));return()=>this.#remove(this.renderers,renderer.id)}
 start(){if(this.running)return;this.running=true;this.last=performance.now();this.accumulator=0;requestAnimationFrame(this.boundFrame);this.events.emit("engine:start",{})}
 stop(){this.running=false;this.events.emit("engine:stop",{})}
 #validate(item,method){if(!item||typeof item.id!=="string"||typeof item[method]!=="function")throw new TypeError(`Invalid engine ${method} registration`);if([...this.systems,...this.renderers].some(x=>x.id===item.id))throw new Error(`Duplicate engine component: ${item.id}`)}
 #remove(list,id){const i=list.findIndex(x=>x.id===id);if(i>=0)list.splice(i,1)}
 #safeCall(component,method,context){try{component[method](context)}catch(error){this.events.emit("engine:error",error);console.error(`[EVOLVA:${component.id}]`,error)}}
 #frame(now){
  if(!this.running)return;
  const elapsed=Math.min(250,Math.max(0,now-this.last));this.last=now;this.accumulator+=elapsed;
  let steps=0;
  while(this.accumulator>=this.stepMs&&steps<this.maxCatchUpSteps){
   const context={dt:this.stepMs/1000,now,step:this.simulationSteps++};
   for(const system of this.systems)this.#safeCall(system,"update",context);
   this.accumulator-=this.stepMs;steps++
  }
  if(steps===this.maxCatchUpSteps&&this.accumulator>=this.stepMs){this.accumulator=0;this.events.emit("engine:lag",{now})}
  const renderContext={now,frame:this.frame++,alpha:this.accumulator/this.stepMs};
  for(const renderer of this.renderers)this.#safeCall(renderer,"render",renderContext);
  requestAnimationFrame(this.boundFrame)
 }
}
