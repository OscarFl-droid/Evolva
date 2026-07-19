
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("gameCanvas"),ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
const SAVE_KEY="evolva-save-v4";

const STAGES=[
{name:"MOLECULAR PET",summary:"reactive chemistry",scale:"0.8 nm",genome:"0 bp",cells:"0",need:18},
{name:"PROTOCELL",summary:"membrane + heredity",scale:"2 µm",genome:"180 nt",cells:"1",need:32},
{name:"SINGLE CELL",summary:"regulated metabolism",scale:"12 µm",genome:"0.7 Mb",cells:"1",need:48},
{name:"CELL COLONY",summary:"adhesion + cooperation",scale:"0.4 mm",genome:"3 Mb",cells:"160",need:65},
{name:"MULTICELLULAR",summary:"specialized tissues",scale:"3 cm",genome:"40 Mb",cells:"120,000",need:82},
{name:"COMPLEX LIFE",summary:"organs + behaviour",scale:"0.7 m",genome:"0.6 Gb",cells:"2.1 billion",need:92},
{name:"OPEN LINEAGE",summary:"unbounded forms",scale:"variable",genome:"dynamic",cells:"unbounded",need:96}
];
const BIOMES=[
{name:"TIDAL POOL",summary:"warm · wet · mineral-rich",sky:"#6ec6a6",ground:"#2e7d58",water:"#3185a8",waterTop:350,temp:38,moisture:78,light:72,nutrients:68,hazard:28,waterType:"saline",tags:["saline","cyclic tides"]},
{name:"ACID MARSH",summary:"wet · toxic · dim",sky:"#8fbf5c",ground:"#657a30",water:"#7ca53c",waterTop:344,temp:31,moisture:88,light:55,nutrients:62,hazard:71,waterType:"acidic",tags:["acidic","toxic"]},
{name:"FUNGAL FOREST",summary:"cool · shaded · organic",sky:"#315b3d",ground:"#24442d",water:"#31596a",waterTop:360,temp:21,moisture:74,light:29,nutrients:91,hazard:24,waterType:"fresh",tags:["organic","spore-rich"]},
{name:"WIND DESERT",summary:"hot · dry · abrasive",sky:"#e9a96f",ground:"#b16f3e",water:"#4e9da0",waterTop:416,temp:46,moisture:12,light:96,nutrients:22,hazard:66,waterType:"oasis",tags:["desiccating","abrasive"]},
{name:"FROZEN BASIN",summary:"cold · sparse · severe",sky:"#a6d5dc",ground:"#7da6ae",water:"#6d91ad",waterTop:365,temp:-18,moisture:38,light:48,nutrients:31,hazard:77,waterType:"ice",tags:["frozen","seasonal"]},
{name:"HYDROTHERMAL SHELF",summary:"hot · dark · reduced minerals",sky:"#173b36",ground:"#205a48",water:"#184f69",waterTop:320,temp:72,moisture:94,light:8,nutrients:84,hazard:53,waterType:"thermal",tags:["anoxic","mineral-rich"]}
];
const ITEMS={
lipid:{icon:"◉",name:"LIPID",color:"#ffd76b",effects:{complexity:5,health:4},traits:["selective membrane","insulating sheath"],bias:"membranes"},
amino:{icon:"⌁",name:"AMINO",color:"#8cff9a",effects:{complexity:4,energy:6},traits:["enzyme catalysis","contractile fibres"],bias:"proteins"},
mineral:{icon:"◆",name:"MINERAL",color:"#f28f6b",effects:{energy:12,complexity:2},traits:["redox chain","magnetic sensing"],bias:"metabolism"},
sugar:{icon:"⬡",name:"SUGAR",color:"#ffafa0",effects:{energy:18},traits:["energy storage","fermentation"],bias:"fuel"},
pigment:{icon:"✦",name:"PIGMENT",color:"#86e0ff",effects:{complexity:7},traits:["photoreception","photosynthetic tissue"],bias:"light"},
toxin:{icon:"☣",name:"TOXIN",color:"#d49cff",effects:{complexity:8,health:-6},traits:["chemical defence","detoxification"],bias:"defence"},
silica:{icon:"◇",name:"SILICA",color:"#e6ffff",effects:{health:11,energy:-2},traits:["protective shell","mineral skeleton"],bias:"support"},
spore:{icon:"✺",name:"SPORE",color:"#ddb477",effects:{complexity:10},traits:["endosymbiosis","external digestion"],bias:"symbiosis"}
};
const MUTATIONS=[
["motility","contractile locomotor structures"],["dormancy","stress-resistant resting body"],["directional sensing","polarized sensory apparatus"],
["regeneration","distributed repair zones"],["cell adhesion","stable multicellular matrix"],["fluid transport","internal transport channels"],
["thermal tolerance","heat-stable molecular machinery"],["antifreeze chemistry","cryoprotective intracellular solutes"],
["water retention","low-permeability outer barrier"],["branching growth","absorptive branching body plan"],
["predatory feeding","engulfment and capture structures"],["social signalling","chemical communication network"],
["osmoregulation","ion-balancing membrane pumps"]
];
const state={
stage:0,biome:0,cycle:1,tick:0,generation:1,x:192,y:255,vx:0,vy:0,held:null,
energy:72,water:68,health:92,complexity:4,foraging:false,forageTarget:null,lastForageStep:0,drinking:false,
inventory:{lipid:1,amino:1,mineral:1,sugar:0,pigment:0,toxin:0,silica:0,spore:0},
traits:["reactive core"],morphology:["catalytic molecular scaffold"],discovered:[0],objects:[],logs:[],eventCooldown:0
};
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v)),choice=a=>a[Math.floor(Math.random()*a.length)];
function log(m){state.logs.unshift(`Cycle ${state.cycle}: ${m}`);state.logs=state.logs.slice(0,60);renderLog()}
function showEvent(m){const e=$("eventBanner");e.textContent=m;e.hidden=false;clearTimeout(showEvent.t);showEvent.t=setTimeout(()=>e.hidden=true,2200)}
function has(t){return state.traits.includes(t)}
function addTrait(t,m){if(!has(t)){state.traits.push(t);state.complexity=clamp(state.complexity+3);log(`Trait retained: ${t}.`)}if(m&&!state.morphology.includes(m))state.morphology.push(m)}
function spawnObjects(n=10){const k=Object.keys(ITEMS);for(let i=0;i<n;i++)state.objects.push({x:18+Math.random()*348,y:88+Math.random()*350,type:choice(k),bob:Math.random()*6.28})}
function feedItem(type){if(!state.inventory[type]){log(`No ${ITEMS[type].name.toLowerCase()} remains.`);return}state.inventory[type]--;const d=ITEMS[type];for(const[k,v]of Object.entries(d.effects))state[k]=clamp((state[k]||0)+v);if(Math.random()<.76)addTrait(choice(d.traits),null);else log(`${d.name} was metabolized without stable innovation.`);renderAll();saveGame()}

function traitEffects(){
 const b=BIOMES[state.biome],effects=[];
 if(has("water retention"))effects.push("Water loss reduced by 65% in dry biomes.");
 if(has("osmoregulation"))effects.push("Saline and acidic water can be used more safely.");
 if(has("thermal tolerance"))effects.push("Heat damage strongly reduced.");
 if(has("antifreeze chemistry"))effects.push("Cold damage reduced; frozen water becomes drinkable.");
 if(has("detoxification"))effects.push("Toxin and acidic-water damage reduced.");
 if(has("photosynthetic tissue"))effects.push(`Light generates energy${b.light>70?" efficiently":" slowly"}.`);
 if(has("external digestion"))effects.push("Foraging preferentially seeks amino acids and spores.");
 if(has("directional sensing"))effects.push("Collection radius and target selection improved.");
 if(has("motility"))effects.push("Movement speed increased.");
 if(has("protective shell")||has("mineral skeleton"))effects.push("Physical damage reduced, but movement is slower.");
 if(has("dormancy"))effects.push("Low-energy autonomous resting prevents rapid collapse.");
 if(has("regeneration"))effects.push("Passive health repair when energy is sufficient.");
 return effects.length?effects:["No specialized environmental adaptations yet."];
}
function environmentalFit(){
 const b=BIOMES[state.biome];let fit=45;
 if(b.temp>45)fit+=has("thermal tolerance")?25:-18;
 if(b.temp<0)fit+=has("antifreeze chemistry")?25:-20;
 if(b.moisture<25)fit+=has("water retention")?26:-24;
 if(b.light>70&&has("photosynthetic tissue"))fit+=18;
 if(b.hazard>60)fit+=(has("detoxification")||has("protective shell"))?20:-18;
 if(b.nutrients>75&&has("external digestion"))fit+=14;
 if(b.waterType==="saline"&&has("osmoregulation"))fit+=10;
 return clamp(fit);
}
function drinkEffect(){
 const b=BIOMES[state.biome];
 if(state.y<b.waterTop)return {rate:0,damage:0,label:""};
 if(b.waterType==="fresh"||b.waterType==="oasis")return {rate:1.15,damage:0,label:"DRINKING"};
 if(b.waterType==="saline")return has("osmoregulation")?{rate:.8,damage:0,label:"OSMOREGULATING"}:{rate:.35,damage:.025,label:"SALT STRESS"};
 if(b.waterType==="acidic")return has("detoxification")||has("osmoregulation")?{rate:.55,damage:.01,label:"FILTERING WATER"}:{rate:.18,damage:.08,label:"ACID STRESS"};
 if(b.waterType==="ice")return has("antifreeze chemistry")?{rate:.45,damage:0,label:"MELTING ICE"}:{rate:.08,damage:.06,label:"COLD STRESS"};
 if(b.waterType==="thermal")return has("thermal tolerance")?{rate:.5,damage:.01,label:"THERMAL WATER"}:{rate:.12,damage:.08,label:"HEAT STRESS"};
 return {rate:.2,damage:0,label:"DRINKING"};
}
function chooseForageTarget(){
 if(!state.objects.length)spawnObjects(5);
 let candidates=state.objects.slice();
 if(has("external digestion")){
   const preferred=candidates.filter(o=>o.type==="spore"||o.type==="amino");
   if(preferred.length)candidates=preferred;
 }
 if(has("photosynthetic tissue")&&BIOMES[state.biome].light>65&&Math.random()<.25){
   return {x:30+Math.random()*324,y:95+Math.random()*80,type:null,solar:true};
 }
 if(has("directional sensing")){
   candidates.sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y));
   return candidates[0];
 }
 return choice(candidates);
}
function forageStep(){
 if(!state.foraging)return;
 if(has("dormancy")&&state.energy<16){state.foraging=false;state.forageTarget=null;log("Low energy triggered dormancy.");showEvent("DORMANCY");return}
 state.forageTarget=chooseForageTarget();
 if(!state.forageTarget)return;
 const dx=state.forageTarget.x-state.x,dy=state.forageTarget.y-state.y,len=Math.hypot(dx,dy)||1;
 const step=has("motility")?58:42;
 state.x=clamp(state.x+dx/len*Math.min(step,len),18,366);
 state.y=clamp(state.y+dy/len*Math.min(step,len),92,450);
 state.energy=clamp(state.energy-(has("motility")?1.2:1.7));
 collectNearby();
 if(state.forageTarget.solar&&has("photosynthetic tissue")){state.energy=clamp(state.energy+5);log("The organism moved into stronger light and harvested energy.")}
 state.forageTarget=null;
}
function performAction(a){
 if(a==="forage"){
   state.foraging=!state.foraging;state.forageTarget=null;
   log(state.foraging?"Autonomous foraging activated: one movement every three seconds.":"Autonomous foraging stopped.");
   showEvent(state.foraging?"FORAGING ON":"FORAGING OFF");renderAll();saveGame();return;
 }
 if(a==="rest"){
   const bonus=has("dormancy")?1.45:1;state.health=clamp(state.health+14*bonus);state.energy=clamp(state.energy+4);state.water=clamp(state.water-2);log("The organism entered a repair-biased state.");
 }
 if(a==="metabolize"){const bonus=has("redox chain")?1.5:1;state.energy=clamp(state.energy+10*bonus);state.water=clamp(state.water-3);log("Internal reserves were converted into usable energy.")}
 if(a==="divide"){state.energy=clamp(state.energy-13);state.generation++;if(Math.random()<.64){let [t,m]=choice(MUTATIONS);const b=BIOMES[state.biome];if(b.temp>45)[t,m]=["thermal tolerance","heat-stable molecular machinery"];else if(b.temp<0)[t,m]=["antifreeze chemistry","cryoprotective intracellular solutes"];else if(b.moisture<25)[t,m]=["water retention","low-permeability outer barrier"];else if(b.waterType==="saline"&&Math.random()<.5)[t,m]=["osmoregulation","ion-balancing membrane pumps"];addTrait(t,m);state.complexity=clamp(state.complexity+7);log(`Replication produced a heritable novelty: ${t}.`)}else log("Replication succeeded without major innovation.")}
 if(a==="migrate"){state.biome=(state.biome+1)%BIOMES.length;if(!state.discovered.includes(state.biome))state.discovered.push(state.biome);state.energy=clamp(state.energy-10);state.x=192;state.y=255;state.foraging=false;log(`The lineage migrated into ${BIOMES[state.biome].name}.`);showEvent(BIOMES[state.biome].name)}
 if(a==="adapt"){const b=BIOMES[state.biome];state.energy=clamp(state.energy-8);if(b.temp>45)addTrait("thermal tolerance","heat-stable protein network");else if(b.temp<0)addTrait("antifreeze chemistry","cryoprotective solute system");else if(b.moisture<25)addTrait("water retention","low-permeability integument");else if(b.hazard>60)addTrait("detoxification","chemical filtration tissue");else if(b.waterType==="saline")addTrait("osmoregulation","ion-balancing membrane pumps");else{const[t,m]=choice(MUTATIONS);addTrait(t,m)}log("Selection refined the lineage under local conditions.")}
 state.cycle++;renderAll();saveGame();
}
function attemptEvolution(){
 const req=STAGES[state.stage].need;if(state.energy<34||state.complexity<req){log(`Evolutionary leap requires 34 energy and ${req} complexity.`);showEvent("INSUFFICIENT RESOURCES");return}
 const risk=Math.max(.04,(BIOMES[state.biome].hazard-environmentalFit())/170);
 if(Math.random()<risk&&state.health<60){state.health=clamp(state.health-20);state.energy=clamp(state.energy-12);log("Development collapsed under environmental stress.");showEvent("DEVELOPMENTAL FAILURE");renderAll();return}
 state.energy=clamp(state.energy-27);state.complexity=clamp(state.complexity-8);state.generation+=2+Math.floor(Math.random()*7);
 if(state.stage<STAGES.length-1){state.stage++;const ms=[["compartmentalisation","semi-permeable protocellular membrane"],["heredity","replicating nucleic-acid genome"],["cell adhesion","cooperative clonal layer"],["cell differentiation","feeding, sensing and locomotor tissues"],["organ integration","internal transport and signalling network"],["developmental plasticity","modular organs responsive to climate"]];const[t,m]=ms[state.stage-1]||["open-ended body plan","modular emergent anatomy"];addTrait(t,m);log(`Major transition achieved: ${STAGES[state.stage].name}.`);showEvent(STAGES[state.stage].name)}
 else{const[t,m]=choice([["aerial reef organism","buoyant photosynthetic sacs and anchoring tendrils"],["mobile photosynthetic grazer","leaf-like solar surfaces on a motile body"],["fungal neural lattice","conductive mycelial decision network"],["mineral-armoured swimmer","segmented silica plates and jet propulsion"],["colonial superorganism","semi-autonomous castes linked by chemical signals"]]);addTrait(t,m);log(`A new open lineage emerged: ${t}.`);showEvent("NEW OPEN LINEAGE")}
 renderAll();saveGame();
}
function setDirection(d){state.foraging=false;state.held=d==="stop"?null:d;if(d==="stop"){state.vx=0;state.vy=0}renderBehaviour()}
function collectNearby(){
 const radius=has("directional sensing")?27:18;
 for(let i=state.objects.length-1;i>=0;i--){const o=state.objects[i];if(Math.hypot(o.x-state.x,o.y-state.y)<radius){state.inventory[o.type]++;state.complexity=clamp(state.complexity+.6);log(`${ITEMS[o.type].name} collected.`);state.objects.splice(i,1);if(state.objects.length<8)spawnObjects(5);renderInventory()}}
}
function randomWorldEvent(){if(state.eventCooldown>0){state.eventCooldown--;return}if(Math.random()>.003)return;state.eventCooldown=800;choice([
()=>{state.water=clamp(state.water+14);log("A rain pulse increased hydration.");showEvent("RAIN PULSE")},
()=>{let dmg=has("thermal tolerance")?2:8;state.energy=clamp(state.energy-5);state.health=clamp(state.health-dmg);log("A heat spike imposed environmental stress.");showEvent("HEAT SPIKE")},
()=>{spawnObjects(8);log("A nutrient bloom enriched the environment.");showEvent("NUTRIENT BLOOM")},
()=>{let dmg=has("detoxification")?2:8;state.health=clamp(state.health-dmg);state.complexity=clamp(state.complexity+4);log("Toxic exposure intensified selection.");showEvent("TOXIC PLUME")}
])();renderAll()}
function updateSimulation(){
 state.tick++;
 let speed=.52+state.stage*.07;if(has("motility"))speed*=1.35;if(has("protective shell")||has("mineral skeleton"))speed*=.78;
 if(state.held==="up")state.vy-=speed;if(state.held==="down")state.vy+=speed;if(state.held==="left")state.vx-=speed;if(state.held==="right")state.vx+=speed;
 state.vx*=.86;state.vy*=.86;state.x=clamp(state.x+state.vx,18,366);state.y=clamp(state.y+state.vy,92,450);
 collectNearby();randomWorldEvent();
 if(state.foraging&&state.tick-state.lastForageStep>=180){state.lastForageStep=state.tick;forageStep();renderAll()}
 const drink=drinkEffect();state.drinking=drink.rate>0;
 if(drink.rate>0&&state.tick%18===0){state.water=clamp(state.water+drink.rate);state.health=clamp(state.health-drink.damage);renderStats();renderBehaviour()}
 if(has("photosynthetic tissue")&&BIOMES[state.biome].light>55&&state.y<210&&state.tick%150===0)state.energy=clamp(state.energy+1.3);
 if(has("regeneration")&&state.energy>35&&state.tick%240===0)state.health=clamp(state.health+.8);
 if(state.tick%300===0){
   const b=BIOMES[state.biome],fit=environmentalFit();state.energy=clamp(state.energy-(2.2+state.stage*.35));
   let waterLoss=b.moisture<25?5:2;if(has("water retention"))waterLoss*=.35;if(state.drinking)waterLoss=0;state.water=clamp(state.water-waterLoss);
   let damage=0;if(state.energy<18||state.water<15)damage+=4;if(fit<35)damage+=2;if(has("protective shell")||has("mineral skeleton"))damage*=.55;
   state.health=clamp(state.health-damage);if(fit>=55)state.complexity=clamp(state.complexity+.45);state.cycle++;renderAll();if(state.cycle%4===0)saveGame()
 }
}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawBackground(){const b=BIOMES[state.biome];px(0,0,384,480,b.sky);px(0,68,384,412,b.ground);px(0,b.waterTop,384,480-b.waterTop,b.water);
 for(let y=88;y<b.waterTop;y+=16)for(let x=0;x<384;x+=16){const n=(x*7+y*3+state.biome*19)%6;if(n===0)px(x+3,y+9,5,5,"rgba(255,255,255,.16)");if(n===1)px(x+8,y+4,7,3,"rgba(0,0,0,.18)")}
 for(let x=14;x<384;x+=48){if(x%96===14){px(x,b.waterTop-40,5,36,"#225f45");px(x-5,b.waterTop-46,15,8,"#62b36c")}}
 for(let i=0;i<26;i++){const x=(i*47+state.tick*.06)%384,y=80+(i*31)%Math.max(120,b.waterTop-95);px(x,y,2,2,"rgba(255,255,255,.36)")}
}
function drawObjects(){state.objects.forEach(o=>{o.bob+=.04;const d=ITEMS[o.type],yy=o.y+Math.round(Math.sin(o.bob)*2);px(o.x-4,yy-4,8,8,d.color);px(o.x-2,yy-7,4,3,"#fff")})}
function drawPet(){const x=Math.round(state.x),y=Math.round(state.y),n=state.stage,main="#8cff9a",dark="#173b2a",light="#e8ffd7",gold="#ffd76b";ctx.save();ctx.translate(x,y);
 if(n===0){px(-12,-4,8,8,main);px(4,-6,8,8,gold);px(-2,5,8,8,light);px(-5,-2,10,10,dark);px(-1,0,4,4,main)}
 else if(n===1){px(-14,-10,28,20,main);px(-10,-14,20,28,main);px(-10,-7,20,14,dark);px(-4,-4,8,8,gold);px(12,-2,7,4,light)}
 else if(n===2){px(-15,-11,30,22,main);px(-11,-15,22,30,main);px(-7,-6,14,12,dark);px(-3,-2,6,6,gold);px(14,-3,10,5,light);if(has("motility")){px(-23,-2,10,3,light);px(-29,0,7,3,light)}}
 else if(n===3){[[-12,-9],[0,-12],[12,-7],[-14,4],[0,2],[13,7],[-4,13]].forEach((p,i)=>{px(p[0]-6,p[1]-6,12,12,i%2?main:light);px(p[0]-2,p[1]-2,4,4,dark)})}
 else{px(-18,-14,36,28,main);px(-14,-18,28,36,main);px(-9,-8,18,16,dark);px(7,-7,5,5,light);px(9,-5,2,2,"#000");px(-16,12,6,15,main);px(10,12,6,15,main);px(-24,-3,9,5,main);px(15,2,10,5,main);
 if(has("protective shell")||has("mineral skeleton")){px(-20,-17,40,4,light);px(-22,-13,4,26,light);px(18,-13,4,26,light)}
 if(has("photosynthetic tissue")||has("photoreception")){px(-8,-22,7,10,gold);px(2,-24,7,12,gold)}
 if(has("endosymbiosis")){px(-6,5,5,5,"#d49cff");px(3,6,5,5,"#d49cff")}
 if(has("branching growth")){px(-4,-30,4,14,main);px(-11,-31,9,4,main);px(2,-35,10,4,main)}}
 px(-14,24,28,4,"rgba(0,0,0,.28)");px(-2,-30,4,4,"#fff");ctx.restore()}
function draw(){drawBackground();drawObjects();drawPet()}
function renderStats(){["energy","water","health","complexity"].forEach(k=>{const p=k,$v=$(p+"Value"),bar=$(p+"Bar");$v.textContent=Math.round(state[k]);bar.style.width=clamp(state[k])+"%";bar.style.background=state[k]<25?"var(--danger)":k==="complexity"?"var(--gold)":"var(--accent)"})}
function renderBehaviour(){const drink=drinkEffect(),b=$("behaviourBadge");let txt=state.foraging?"FORAGING":state.held?"MANUAL MOVE":"MANUAL";if(drink.label)txt=drink.label;b.textContent=txt;b.style.borderColor=drink.label?"var(--blue)":state.foraging?"var(--accent)":"var(--blue)";$("forageButton").classList.toggle("active",state.foraging);$("forageButton").innerHTML=state.foraging?"STOP FORAGE<small>autonomous roaming</small>":"FORAGE<small>autonomous roaming</small>"}
function renderInventory(){$("inventoryGrid").innerHTML=Object.entries(ITEMS).map(([k,d])=>`<button class="inventory-item" data-feed="${k}" style="color:${d.color}"><span class="qty">x${state.inventory[k]}</span>${d.icon}<small>${d.name}</small><span class="bias">${d.bias}</span></button>`).join("");document.querySelectorAll("[data-feed]").forEach(b=>b.onclick=()=>feedItem(b.dataset.feed))}
function renderBiology(){const s=STAGES[state.stage];$("generationValue").textContent=state.generation;$("cellsValue").textContent=s.cells;$("genomeValue").textContent=s.genome;$("scaleValue").textContent=s.scale;$("effectList").innerHTML=traitEffects().map(e=>`<div class="card good">${e}</div>`).join("");$("traitList").innerHTML=state.traits.slice().reverse().map(t=>`<span class="chip">${t}</span>`).join("");$("morphologyList").innerHTML=state.morphology.slice().reverse().map(m=>`<div class="card"><strong>${m}</strong>Structure retained because it improves survival, reproduction or resource capture.</div>`).join("")}
function renderWorld(){const b=BIOMES[state.biome],ps=[["Temperature",Math.min(100,Math.abs(b.temp-24)*2)],["Desiccation",100-b.moisture],["Light exposure",b.light],["Chemical hazard",b.hazard],["Nutrient scarcity",100-b.nutrients]];$("pressureList").innerHTML=ps.map(([n,v])=>`<div class="pressure"><span>${n}</span><div class="bar"><i style="width:${v}%;background:linear-gradient(90deg,var(--blue),var(--danger))"></i></div><b>${Math.round(v)}</b></div>`).join("");const fit=environmentalFit();$("fitCard").className="card "+(fit>=55?"good":"bad");$("fitCard").innerHTML=`<strong>${Math.round(fit)}% environmental fit</strong>${fit>=55?"Current traits buffer the dominant local pressures.":"The lineage is poorly matched; adapt, migrate or acquire relevant traits."}`;$("biomeList").innerHTML=BIOMES.map((x,i)=>`<div class="card"><strong>${state.discovered.includes(i)?x.name:"UNKNOWN BIOME"}</strong>${state.discovered.includes(i)?`${x.summary}<br>Water: ${x.waterType}<br>Traits: ${x.tags.join(", ")}`:"Migrate to discover this environment."}</div>`).join("")}
function renderLog(){$("logList").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("")}
function renderHeader(){const b=BIOMES[state.biome],s=STAGES[state.stage];$("cycleLabel").textContent=`CYCLE ${state.cycle}`;$("timeLabel").textContent=["DAWN","DAY","DUSK","NIGHT"][Math.floor(state.tick/360)%4];$("biomeName").textContent=b.name;$("biomeSummary").textContent=b.summary;$("stageName").textContent=s.name;$("stageSummary").textContent=s.summary}
function renderAll(){renderHeader();renderStats();renderBehaviour();renderInventory();renderBiology();renderWorld();renderLog()}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("saveStatus").textContent="Saved";setTimeout(()=>$("saveStatus").textContent="Autosave enabled",1200)}catch(e){$("saveStatus").textContent="Save unavailable"}}
function loadGame(){const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem("evolva-save-v3");if(!raw)return false;try{Object.assign(state,JSON.parse(raw));state.held=null;state.foraging=false;state.forageTarget=null;return true}catch(e){return false}}
function resetGame(){localStorage.removeItem(SAVE_KEY);localStorage.removeItem("evolva-save-v3");location.reload()}
function bind(){document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>performAction(b.dataset.action));document.querySelectorAll("[data-dir]").forEach(b=>{const d=b.dataset.dir;["pointerdown","touchstart","mousedown"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setDirection(d)},{passive:false}));["pointerup","pointercancel","touchend","touchcancel","mouseup","mouseleave"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();if(state.held===d)state.held=null},{passive:false}))});const km={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};addEventListener("keydown",e=>{if(km[e.key.toLowerCase()])setDirection(km[e.key.toLowerCase()])});addEventListener("keyup",e=>{if(km[e.key.toLowerCase()]===state.held)state.held=null});$("evolveButton").onclick=attemptEvolution;$("saveButton").onclick=saveGame;$("resetButton").onclick=()=>{if(confirm("Reset this lineage?"))resetGame()};document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab,.tab-content").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active")})}
let running=false;function loop(){if(!running)return;updateSimulation();draw();requestAnimationFrame(loop)}
function begin(fresh=false){if(fresh){localStorage.removeItem(SAVE_KEY);localStorage.removeItem("evolva-save-v3")}else loadGame();if(!state.logs.length)log("A self-organising molecular pet has formed.");if(!state.objects.length)spawnObjects(14);$("startScreen").classList.remove("visible");renderAll();running=true;requestAnimationFrame(loop)}
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=4").catch(()=>{});
window.addEventListener("error",e=>{const b=$("startupError");b.hidden=false;b.textContent=`Game error: ${e.message}`});
$("startButton").onclick=()=>begin(false);$("newGameButton").onclick=()=>begin(true);bind();
