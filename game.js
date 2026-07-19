"use strict";

const $ = id => document.getElementById(id);
const clamp = (v,a=0,b=100) => Math.max(a,Math.min(b,v));
const rand = (a,b) => a + Math.random()*(b-a);
const choice = arr => arr[Math.floor(Math.random()*arr.length)];
const weightedChoice = table => {
  const total = table.reduce((s,x)=>s+x[1],0);
  let r=Math.random()*total;
  for(const [v,w] of table){r-=w;if(r<=0)return v}
  return table[table.length-1][0];
};

const canvas=$("gameCanvas"), ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;
const SAVE_KEY="evolva-save-v5";
const WORLD=1800;
const FPS=60;

const RESOURCES={
  sugar:{name:"SUGAR",icon:"⬡",color:"#ffb6a6",energy:18,water:0,path:"metabolism",xp:4,desc:"rapid carbon fuel"},
  lipid:{name:"LIPID",icon:"◉",color:"#ffd66a",energy:28,water:0,path:"structure",xp:5,desc:"dense fuel + membranes"},
  amino:{name:"AMINO",icon:"⌁",color:"#91ff9c",energy:12,water:0,path:"reproduction",xp:5,desc:"proteins + growth"},
  mineral:{name:"MINERAL",icon:"◆",color:"#f18b66",energy:9,water:0,path:"defense",xp:4,desc:"redox + support"},
  pigment:{name:"PIGMENT",icon:"✦",color:"#7de0ff",energy:3,water:0,path:"sensing",xp:6,desc:"light capture + sensing"},
  osmolyte:{name:"OSMOLYTE",icon:"◈",color:"#d7f7ff",energy:5,water:8,path:"homeostasis",xp:6,desc:"water + ion balance"},
  spore:{name:"SPORE",icon:"✺",color:"#ddb477",energy:14,water:2,path:"symbiosis",xp:7,desc:"rare biological partner"},
  toxin:{name:"TOXIN",icon:"☣",color:"#dba0ff",energy:0,water:0,path:"defense",xp:9,desc:"risk + chemical defence"}
};

const PATHS={
  metabolism:{name:"METABOLISM",color:"#ffb6a6",thresholds:[
    [1,"efficient glycolysis","More energy from sugar."],
    [3,"redox chain","More energy from minerals and lipids."],
    [6,"reserve cycling","Automatically metabolise stored food before starvation."],
    [10,"chemotrophy","Mineral-rich terrain passively supplies energy."]
  ]},
  structure:{name:"STRUCTURE",color:"#ffd66a",thresholds:[
    [1,"selective membrane","Reduced passive resource loss."],
    [3,"flexible cortex","Improved movement at low biomass."],
    [6,"mineral scaffold","Damage resistance but lower speed."],
    [10,"segmented body","Growth produces visible body modules."]
  ]},
  reproduction:{name:"GROWTH",color:"#91ff9c",thresholds:[
    [1,"replication control","Division costs less energy."],
    [3,"cell adhesion","Division retains more biomass."],
    [6,"developmental zones","Growth changes body proportions."],
    [10,"modular budding","Occasional offspring-like helper buds."]
  ]},
  sensing:{name:"SENSING",color:"#7de0ff",thresholds:[
    [1,"chemical gradient sensing","Forage selects nearer food."],
    [3,"threat detection","Forage avoids predators earlier."],
    [6,"photoreception","Light-rich positions improve energy gain."],
    [10,"social learning","Prey encounters can teach genes."]
  ]},
  defense:{name:"DEFENCE",color:"#dba0ff",thresholds:[
    [1,"stress response","Lower hazard damage."],
    [3,"detoxification","Toxins can be invested safely."],
    [6,"protective armour","Predator damage reduced; movement slower."],
    [10,"chemical weapon","Can repel or consume smaller predators."]
  ]},
  homeostasis:{name:"HOMEOSTASIS",color:"#d7f7ff",thresholds:[
    [1,"water retention","Water use reduced."],
    [3,"osmoregulation","Saline water hydrates safely."],
    [6,"thermal buffering","Heat and cold penalties reduced."],
    [10,"dormancy","Emergency rest activates near collapse."]
  ]},
  symbiosis:{name:"SYMBIOSIS",color:"#ddb477",thresholds:[
    [1,"surface microbiome","Small passive food yield."],
    [3,"digestive symbiont","Spore and amino energy increased."],
    [6,"photosymbiont","Light can replenish energy."],
    [10,"distributed colony","Severe attacks rarely erase genes."]
  ]}
};

const BIOMES=[
 {name:"TIDAL POOL",detail:"saline · cyclic · mineral-rich",base:"#2c7655",water:"#2c84a6",sky:"#79c7a8",hazard:30,temp:38,moisture:82,light:76,waterType:"saline",
  abundance:{mineral:9,osmolyte:7,pigment:6,sugar:3,lipid:3,amino:3,spore:1,toxin:2},prey:8,predators:3},
 {name:"FUNGAL FOREST",detail:"shaded · organic · prey-rich",base:"#27472f",water:"#315d6b",sky:"#365f40",hazard:25,temp:20,moisture:78,light:28,waterType:"fresh",
  abundance:{spore:10,amino:8,sugar:6,lipid:5,mineral:2,pigment:2,osmolyte:3,toxin:2},prey:12,predators:5},
 {name:"WIND DESERT",detail:"dry · bright · energy-poor",base:"#b17343",water:"#4d9b9d",sky:"#e4a36e",hazard:68,temp:47,moisture:10,light:98,waterType:"oasis",
  abundance:{pigment:8,lipid:4,mineral:5,osmolyte:2,sugar:2,amino:1,spore:.3,toxin:4},prey:4,predators:6},
 {name:"ACID MARSH",detail:"acidic · toxic · nutrient-rich",base:"#657b32",water:"#7ba33c",sky:"#8dbd5a",hazard:76,temp:32,moisture:91,light:53,waterType:"acidic",
  abundance:{toxin:10,amino:6,sugar:6,spore:5,osmolyte:4,mineral:4,lipid:3,pigment:2},prey:9,predators:7},
 {name:"FROZEN BASIN",detail:"cold · sparse · seasonal",base:"#7fa6ad",water:"#6c92ac",sky:"#acd6dc",hazard:78,temp:-18,moisture:36,light:48,waterType:"ice",
  abundance:{lipid:7,osmolyte:6,mineral:4,pigment:3,sugar:2,amino:2,spore:1,toxin:1},prey:5,predators:5},
 {name:"HYDROTHERMAL SHELF",detail:"dark · hot · chemically rich",base:"#205a49",water:"#184e68",sky:"#173a35",hazard:58,temp:72,moisture:96,light:7,waterType:"thermal",
  abundance:{mineral:12,lipid:5,amino:4,toxin:4,osmolyte:3,sugar:1,pigment:.5,spore:2},prey:7,predators:4}
];

const RARE_GENES=[
 ["bioluminescence","Visible pulses attract prey but also predators.","sensing"],
 ["lateral gene capture","Teaching interactions are more likely.","symbiosis"],
 ["regeneration","Health slowly recovers outside combat.","reproduction"],
 ["venom gland","Close predators may lose biomass.","defense"],
 ["magnetic navigation","Migration costs less energy.","sensing"],
 ["cryptobiosis","Survive one otherwise lethal collapse.","homeostasis"],
 ["jet propulsion","Large bodies retain high movement speed.","structure"],
 ["cannibal metabolism","Defeated predators become dense food.","metabolism"]
];

function freshState(){
 const paths={}; Object.keys(PATHS).forEach(k=>paths[k]=0);
 const inventory={}; Object.keys(RESOURCES).forEach(k=>inventory[k]=0);
 return {
  version:5,cycle:1,tick:0,generation:1,biome:0,
  x:WORLD/2,y:WORLD/2,vx:0,vy:0,held:null,
  energy:72,water:68,health:92,mass:1,potential:0,
  mode:"manual",resting:false,foraging:false,lastForage:0,
  paths,genes:["basal chemistry"],rare:[],inventory,
  internal:{carbohydrate:0,lipid:0,protein:0},
  resources:[],organisms:[],logs:[],discovered:[0],
  combatCooldown:0,eventCooldown:0,invulnerable:0,deathEscapes:0
 };
}
let state=freshState();

function log(message){
 state.logs.unshift(`Cycle ${state.cycle}: ${message}`);
 state.logs=state.logs.slice(0,80);
 renderLog();
}
function banner(message){
 const el=$("messageBanner");el.textContent=message;el.hidden=false;
 clearTimeout(banner.timer);banner.timer=setTimeout(()=>el.hidden=true,2300);
}
function gene(name){return state.genes.includes(name)||state.rare.includes(name)}
function addGene(name,rare=false){
 const arr=rare?state.rare:state.genes;
 if(!arr.includes(name)){arr.push(name);log(`${rare?"Rare variant":"Gene"} fixed: ${name}.`);return true}
 return false;
}
function removeGene(name){
 const protectedGenes=["basal chemistry"];
 const candidates=state.genes.filter(g=>!protectedGenes.includes(g));
 const target=name||choice(candidates);
 if(!target)return false;
 state.genes=state.genes.filter(g=>g!==target);
 log(`Function lost: ${target}.`);
 return true;
}
function rank(path){return Math.floor(state.paths[path]||0)}
function unlockedGenesForPath(path){
 return PATHS[path].thresholds.filter(([level])=>rank(path)>=level).map(x=>x[1]);
}
function syncThresholdGenes(){
 for(const path of Object.keys(PATHS)){
  for(const [level,name] of PATHS[path].thresholds){
   if(rank(path)>=level && !gene(name)){
    // Threshold makes a function evolution-ready, but does not always fix it automatically.
    if(level===1)addGene(name);
   }
  }
 }
}
function dominantPath(){
 return Object.keys(state.paths).sort((a,b)=>state.paths[b]-state.paths[a])[0];
}
function phenotype(){
 const speedBase=1.55*Math.pow(state.mass,-0.15);
 const speed=(gene("jet propulsion")?1.4:1)*(gene("flexible cortex")?1.16:1)*(gene("protective armour")||gene("mineral scaffold")?.82:1);
 const waterUse=(gene("water retention")?.42:1)*(gene("selective membrane")?.86:1);
 const defense=(gene("protective armour")?2.0:1)*(gene("stress response")?1.25:1)*(gene("distributed colony")?1.2:1);
 let trophic="scavenger";
 if(gene("photosymbiont"))trophic="photo-mixotroph";
 if(gene("chemotrophy"))trophic="chemo-mixotroph";
 if(gene("chemical weapon")||gene("venom gland"))trophic="opportunistic predator";
 return {speed:speedBase*speed,waterUse,defense,trophic};
}
function biomeFit(){
 const b=BIOMES[state.biome];let fit=48;
 if(b.moisture<20)fit+=gene("water retention")?24:-25;
 if(b.temp>45||b.temp<0)fit+=gene("thermal buffering")?22:-22;
 if(b.waterType==="saline")fit+=gene("osmoregulation")?14:-8;
 if(b.waterType==="acidic")fit+=gene("detoxification")?22:-20;
 if(b.hazard>60)fit+=(gene("stress response")||gene("protective armour"))?15:-18;
 if(b.light>70&&gene("photosymbiont"))fit+=17;
 if(b.light<15&&gene("chemotrophy"))fit+=16;
 if(b.name==="FUNGAL FOREST"&&gene("digestive symbiont"))fit+=15;
 return clamp(fit);
}
function worldScale(){
 return clamp(1/Math.pow(state.mass,0.22),0.30,1);
}
function bodyRadius(mass=state.mass){
 return 10+Math.log2(mass+1)*5.2;
}
function bodyScaleLabel(){
 if(state.mass<2)return"molecular";
 if(state.mass<5)return"unicellular";
 if(state.mass<15)return"micro-colony";
 if(state.mass<45)return"mesoscopic";
 if(state.mass<130)return"small organism";
 if(state.mass<400)return"macroscopic";
 return"giant modular form";
}

function resourceTable(){
 const a=BIOMES[state.biome].abundance;
 return Object.entries(a);
}
function spawnResource(count=1){
 for(let i=0;i<count;i++){
  const type=weightedChoice(resourceTable());
  state.resources.push({type,x:rand(40,WORLD-40),y:rand(40,WORLD-40),phase:rand(0,6.28),size:rand(.8,1.25)});
 }
}
function makeOrganism(role){
 const b=BIOMES[state.biome];
 const isPred=role==="predator";
 const mass=isPred?rand(Math.max(1,state.mass*.45),Math.max(3,state.mass*2.3)):rand(.35,Math.max(.7,state.mass*.75));
 const palette=isPred?["#ff7474","#b94a63","#ff9b68"]:["#6fe5ff","#8cff9c","#ffd66a"];
 const traits=[];
 if(Math.random()<.45)traits.push(choice(["fast","armoured","social","toxic","camouflaged","photosynthetic"]));
 return {id:Math.random().toString(36).slice(2),role,x:rand(50,WORLD-50),y:rand(50,WORLD-50),vx:0,vy:0,mass,
  tier:Math.max(1,Math.round(Math.log2(mass+1))),traits,color:choice(palette),phase:rand(0,6.28),age:0,evolveTimer:rand(900,2200)};
}
function repopulate(){
 const b=BIOMES[state.biome];
 state.organisms=[];
 for(let i=0;i<b.prey;i++)state.organisms.push(makeOrganism("prey"));
 for(let i=0;i<b.predators;i++)state.organisms.push(makeOrganism("predator"));
}
function nearest(list){
 let best=null,dist=Infinity;
 for(const o of list){const d=Math.hypot(o.x-state.x,o.y-state.y);if(d<dist){best=o;dist=d}}
 return best?{o:best,d:dist}:null;
}
function threatVector(){
 let ax=0,ay=0;
 const detection=gene("threat detection")?260:145;
 for(const o of state.organisms){
  if(o.role!=="predator")continue;
  const dx=state.x-o.x,dy=state.y-o.y,d=Math.hypot(dx,dy)||1;
  const dangerous=o.mass>state.mass*(gene("chemical weapon")?.8:.55);
  if(d<detection&&dangerous){const w=(detection-d)/detection;ax+=dx/d*w;ay+=dy/d*w}
 }
 return {x:ax,y:ay,mag:Math.hypot(ax,ay)};
}
function forageStep(){
 if(!state.foraging)return;
 const threat=threatVector();
 let tx=0,ty=0;
 if(threat.mag>.08){tx=state.x+threat.x/threat.mag*180;ty=state.y+threat.y/threat.mag*180}
 else{
  const resourceTarget=nearest(state.resources);
  const preyTargets=state.organisms.filter(o=>o.role==="prey"&&o.mass<state.mass*.68);
  const preyTarget=(gene("chemical weapon")||gene("venom gland"))?nearest(preyTargets):null;
  const target=(preyTarget&&(!resourceTarget||preyTarget.d<resourceTarget.d*.8))?preyTarget:resourceTarget;
  if(target){tx=target.o.x;ty=target.o.y}else{tx=state.x+rand(-220,220);ty=state.y+rand(-220,220)}
 }
 const dx=tx-state.x,dy=ty-state.y,d=Math.hypot(dx,dy)||1;
 const stride=gene("chemical gradient sensing")?105:78;
 state.x=clamp(state.x+dx/d*Math.min(stride,d),25,WORLD-25);
 state.y=clamp(state.y+dy/d*Math.min(stride,d),25,WORLD-25);
 state.energy=clamp(state.energy-1.1);
 collectResources();
 interactOrganisms();
}

function autoMetabolise(type){
 const r=RESOURCES[type];
 if(r.energy<=0)return false;
 if(state.energy>=96)return false;
 let yieldEnergy=r.energy;
 if(type==="sugar"&&gene("efficient glycolysis"))yieldEnergy*=1.35;
 if((type==="mineral"||type==="lipid")&&gene("redox chain"))yieldEnergy*=1.4;
 if((type==="spore"||type==="amino")&&gene("digestive symbiont"))yieldEnergy*=1.35;
 state.energy=clamp(state.energy+yieldEnergy);
 state.water=clamp(state.water+r.water);
 const reserveKey=type==="sugar"?"carbohydrate":type==="lipid"?"lipid":type==="amino"?"protein":null;
 if(reserveKey)state.internal[reserveKey]=clamp(state.internal[reserveKey]+1,0,12);
 log(`${r.name.toLowerCase()} automatically metabolised (+${Math.round(yieldEnergy)} energy).`);
 return true;
}
function collectResource(index){
 const obj=state.resources[index],type=obj.type,r=RESOURCES[type];
 if(!autoMetabolise(type)){
  state.inventory[type]=(state.inventory[type]||0)+1;
  log(`${r.name.toLowerCase()} stored in backpack.`);
 }
 state.potential=clamp(state.potential+r.xp*.35,0,100);
 state.resources.splice(index,1);
 if(state.resources.length<34)spawnResource(8);
}
function collectResources(){
 const radius=bodyRadius()+ (gene("chemical gradient sensing")?15:8);
 for(let i=state.resources.length-1;i>=0;i--){
  if(Math.hypot(state.resources[i].x-state.x,state.resources[i].y-state.y)<radius)collectResource(i);
 }
}
function investItem(type){
 if(!state.inventory[type]){log(`No ${RESOURCES[type].name.toLowerCase()} stored.`);return}
 const r=RESOURCES[type];
 if(type==="toxin"&&!gene("detoxification")&&Math.random()<.45){
  state.health=clamp(state.health-10);state.potential=clamp(state.potential+6);
  log("Toxin investment caused damage but increased selection pressure.");
 }else{
  state.paths[r.path]+=r.xp/5;
  state.potential=clamp(state.potential+r.xp);
  if(r.water)state.water=clamp(state.water+r.water);
  log(`${r.name.toLowerCase()} invested into ${PATHS[r.path].name.toLowerCase()} development.`);
 }
 state.inventory[type]--;
 syncThresholdGenes();renderAll();saveGame();
}

function toggleRest(){
 state.resting=!state.resting;
 if(state.resting){state.foraging=false;state.held=null;state.mode="rest";log("Rest state entered: energy and health recover; water use falls drastically.")}
 else{state.mode="manual";log("Rest state ended.")}
 renderAll();saveGame();
}
function toggleForage(){
 state.foraging=!state.foraging;
 if(state.foraging){state.resting=false;state.held=null;state.mode="forage";log("Autonomous forage activated: seek food, avoid larger predators.")}
 else{state.mode="manual";log("Autonomous forage stopped.")}
 renderAll();saveGame();
}
function divide(){
 const cost=gene("replication control")?22:30;
 const proteinBonus=Math.min(3,state.internal.protein);
 if(state.energy<cost||state.health<30){banner("INSUFFICIENT ENERGY / HEALTH");log(`Division requires ${cost} energy and stable health.`);return}
 state.energy-=cost;state.internal.protein=Math.max(0,state.internal.protein-1);
 const growth=(1.34+proteinBonus*.05)*(gene("cell adhesion")?1.10:1);
 state.mass*=growth;state.generation++;
 state.potential=clamp(state.potential+7);
 state.health=clamp(state.health-3);
 log(`Division increased biomass ${growth.toFixed(2)}×. The biome view rescaled around the larger organism.`);
 banner("GROWTH + CAMERA RESCALE");
 renderAll();saveGame();
}
function migrate(){
 const cost=gene("magnetic navigation")?5:11;
 if(state.energy<cost){banner("LOW ENERGY");return}
 state.energy-=cost;state.biome=(state.biome+1)%BIOMES.length;
 if(!state.discovered.includes(state.biome))state.discovered.push(state.biome);
 state.x=WORLD/2;state.y=WORLD/2;state.resources=[];spawnResource(48);repopulate();
 state.foraging=false;state.resting=false;state.mode="manual";
 log(`Migration reached ${BIOMES[state.biome].name}. Local resource abundance and food-web risk changed.`);
 banner(BIOMES[state.biome].name);renderAll();saveGame();
}
function evolutionCandidates(){
 const candidates=[];
 for(const path of Object.keys(PATHS)){
  for(const [level,name,desc] of PATHS[path].thresholds){
   if(rank(path)>=level&&!gene(name))candidates.push({name,path,desc,score:state.paths[path]+(path===dominantPath()?4:0)});
  }
 }
 return candidates;
}
function evolve(){
 if(state.potential<18){banner("BUILD MORE EVOLUTION POTENTIAL");log("Evolution requires 18 potential from ecological exposure and invested resources.");return}
 const candidates=evolutionCandidates();
 const lossChance=Math.max(.05,(45-biomeFit())/110);
 const rareChance=.055 + state.potential/1500 + (gene("lateral gene capture")?.03:0);
 state.potential=clamp(state.potential-18);
 state.energy=clamp(state.energy-8);
 if(state.genes.length>3&&Math.random()<lossChance){
  removeGene();banner("LOSS OF FUNCTION");
 }else if(Math.random()<rareChance){
  const available=RARE_GENES.filter(([n])=>!gene(n));
  if(available.length){const [n,,path]=choice(available);addGene(n,true);state.paths[path]+=.8;banner("RARE VARIANT")}
 }else if(candidates.length){
  candidates.sort((a,b)=>b.score-a.score);
  const pool=candidates.slice(0,Math.min(4,candidates.length));
  const c=choice(pool);addGene(c.name);banner(`GAIN: ${c.name.toUpperCase()}`);
 }else{
  const p=dominantPath();state.paths[p]+=.7;
  const adaptiveNames={
   metabolism:"substrate flexibility",structure:"body-plan plasticity",reproduction:"asymmetric budding",
   sensing:"multimodal sensing",defense:"adaptive barrier",homeostasis:"dynamic acclimation",symbiosis:"partner switching"
  };
  const n=`${adaptiveNames[p]} ${Math.floor(state.paths[p])}`;
  addGene(n);banner("NOVEL INCREMENTAL FUNCTION");
 }
 state.generation+=Math.random()<.5?1:0;
 log("Evolution changed one heritable function; phenotype and sprite were regenerated.");
 renderAll();saveGame();
}

function setDirection(dir){
 state.resting=false;state.foraging=false;state.mode="manual";
 state.held=dir==="stop"?null:dir;
 if(dir==="stop"){state.vx=state.vy=0}
 renderMode();
}
function damage(amount,source){
 const p=phenotype();amount/=p.defense;
 if(state.invulnerable>0)return;
 state.health=clamp(state.health-amount);
 state.mass=Math.max(.65,state.mass*(1-Math.min(.16,amount/180)));
 state.invulnerable=90;
 log(`${source} caused ${Math.round(amount)} effective damage and reduced biomass.`);
 if(amount>12&&state.genes.length>4&&Math.random()<.18){
  const lost=choice(state.genes.filter(g=>g!=="basal chemistry"));
  removeGene(lost);banner("TRAIT DE-EVOLVED");
 }
 if(state.health<=0)collapse();
}
function collapse(){
 if(gene("cryptobiosis")&&state.deathEscapes<1){
  state.deathEscapes++;state.health=28;state.energy=18;state.water=18;state.resting=true;state.mode="rest";
  log("Cryptobiosis prevented lineage extinction.");banner("CRYPTOBIOSIS");
  return;
 }
 state.health=35;state.energy=25;state.water=30;state.mass=Math.max(.7,state.mass*.55);
 if(state.genes.length>3)removeGene();
 state.x=WORLD/2;state.y=WORLD/2;
 log("The organism collapsed to a smaller surviving propagule.");banner("SURVIVING PROPAGULE");
}
function eatPrey(o,index){
 const gain=12+Math.min(30,o.mass*8);
 state.energy=clamp(state.energy+gain);state.mass*=1+Math.min(.06,o.mass/state.mass*.04);state.potential=clamp(state.potential+4);
 log(`Prey consumed (+${Math.round(gain)} energy).`);
 state.organisms.splice(index,1);state.organisms.push(makeOrganism("prey"));
}
function teaching(o){
 const teachable=[...o.traits,"chemical gradient sensing","stress response","water retention"].filter(Boolean);
 const taught=choice(teachable);
 if(taught&&!gene(taught)){addGene(taught);log(`A non-hostile encounter transferred behavioural information: ${taught}.`);banner("ECOLOGICAL TEACHING")}
 else state.potential=clamp(state.potential+5);
}
function interactOrganisms(){
 const radius=bodyRadius()+9;
 for(let i=state.organisms.length-1;i>=0;i--){
  const o=state.organisms[i],d=Math.hypot(o.x-state.x,o.y-state.y);
  if(d>radius+bodyRadius(o.mass)*.6)continue;
  if(o.role==="prey"){
   if((gene("chemical weapon")||gene("venom gland")||state.mass>o.mass*2.2)&&state.energy<94)eatPrey(o,i);
   else if(gene("social learning")&&Math.random()<.22)teaching(o);
   else {o.vx+=(o.x-state.x)*.02;o.vy+=(o.y-state.y)*.02}
  }else{
   if(o.mass<state.mass*.55&&(gene("chemical weapon")||gene("venom gland"))){
    o.mass*=.72;state.potential=clamp(state.potential+5);
    if(gene("cannibal metabolism"))state.energy=clamp(state.energy+20);
    log("A smaller predator was repelled and biologically exploited.");
   }else damage(7+o.mass/state.mass*8,"Predator attack");
  }
 }
}

function updateOrganisms(){
 for(const o of state.organisms){
  o.age++;o.phase+=.035;
  let tx=0,ty=0;
  if(o.role==="predator"){
   const dx=state.x-o.x,dy=state.y-o.y,d=Math.hypot(dx,dy)||1;
   const hunts=state.mass<o.mass*2.2;
   if(hunts&&d<420){tx=dx/d;ty=dy/d}else{tx=Math.sin(o.phase);ty=Math.cos(o.phase*.73)}
  }else{
   const threats=state.organisms.filter(q=>q.role==="predator");
   let nearestThreat=null,nd=Infinity;
   for(const q of threats){const d=Math.hypot(q.x-o.x,q.y-o.y);if(d<nd){nd=d;nearestThreat=q}}
   if(nearestThreat&&nd<180){tx=(o.x-nearestThreat.x)/(nd||1);ty=(o.y-nearestThreat.y)/(nd||1)}
   else{tx=Math.sin(o.phase*.8);ty=Math.cos(o.phase*.53)}
  }
  const sp=(o.traits.includes("fast")?1.5:1)*(o.role==="predator"?1.1:.85)*Math.pow(o.mass,-.12);
  o.vx=(o.vx+tx*.055*sp)*.94;o.vy=(o.vy+ty*.055*sp)*.94;
  o.x=clamp(o.x+o.vx,20,WORLD-20);o.y=clamp(o.y+o.vy,20,WORLD-20);
  o.evolveTimer--;
  if(o.evolveTimer<=0){
   o.evolveTimer=rand(900,2200);
   const up=Math.random()<.57;
   o.mass=Math.max(.25,o.mass*(up?rand(1.08,1.35):rand(.72,.94)));
   if(Math.random()<.45){
    const t=choice(["fast","armoured","social","toxic","camouflaged","photosynthetic"]);
    if(up&&!o.traits.includes(t))o.traits.push(t);
    if(!up&&o.traits.length)o.traits.splice(Math.floor(Math.random()*o.traits.length),1);
   }
  }
 }
}

function drink(){
 const b=BIOMES[state.biome];
 // Water is represented by broad procedural channels. Local sample decides whether player is in one.
 const watery=((Math.floor(state.x/160)+Math.floor(state.y/130)+state.biome)%7===0);
 if(!watery)return {active:false,rate:0,damage:0,label:""};
 if(b.waterType==="fresh"||b.waterType==="oasis")return {active:true,rate:.85,damage:0,label:"DRINKING"};
 if(b.waterType==="saline")return gene("osmoregulation")?{active:true,rate:.62,damage:0,label:"OSMOREGULATING"}:{active:true,rate:.14,damage:.025,label:"SALT STRESS"};
 if(b.waterType==="acidic")return gene("detoxification")?{active:true,rate:.48,damage:.01,label:"FILTERING"}:{active:true,rate:.08,damage:.075,label:"ACID STRESS"};
 if(b.waterType==="ice")return gene("thermal buffering")?{active:true,rate:.32,damage:0,label:"MELTING ICE"}:{active:true,rate:.04,damage:.06,label:"COLD STRESS"};
 return gene("thermal buffering")?{active:true,rate:.4,damage:.01,label:"THERMAL WATER"}:{active:true,rate:.06,damage:.07,label:"HEAT STRESS"};
}
function passiveMetabolism(){
 if(state.energy>=22||!gene("reserve cycling"))return;
 const order=[["carbohydrate",12],["lipid",18],["protein",9]];
 for(const [k,gain] of order){
  if(state.internal[k]>=1){state.internal[k]-=1;state.energy=clamp(state.energy+gain);log(`Reserve cycling consumed internal ${k}.`);break}
 }
}
function ecologyTick(){
 const b=BIOMES[state.biome],p=phenotype(),fit=biomeFit(),d=drink();
 if(state.resting){
  state.energy=clamp(state.energy+3.8);
  state.health=clamp(state.health+(gene("regeneration")?4.1:2.8));
  state.water=clamp(state.water-.10*p.waterUse); // drastically reduced
  if(state.energy>98&&state.health>98){state.resting=false;state.mode="manual";log("Rest completed automatically.")}
 }else{
  state.energy=clamp(state.energy-(1.8+Math.log2(state.mass+1)*.28));
  state.water=clamp(state.water-(b.moisture<20?4.8:1.7)*p.waterUse);
 }
 if(d.active){state.water=clamp(state.water+d.rate*5);state.health=clamp(state.health-d.damage*10)}
 if(gene("photosymbiont")&&b.light>55)state.energy=clamp(state.energy+2.5*b.light/100);
 if(gene("chemotrophy")&&b.name==="HYDROTHERMAL SHELF")state.energy=clamp(state.energy+3.2);
 if(gene("surface microbiome"))state.energy=clamp(state.energy+.65);
 if(gene("regeneration")&&!state.resting&&state.energy>45)state.health=clamp(state.health+.55);
 if(fit<35)damage((35-fit)*.08,"Poor niche fit");
 if(state.energy<5||state.water<5)damage(4,"Resource collapse");
 passiveMetabolism();
 state.cycle++;
}

function update(){
 state.tick++;
 if(state.invulnerable>0)state.invulnerable--;
 const p=phenotype();
 const acc=.085*p.speed;
 if(state.held==="up")state.vy-=acc;
 if(state.held==="down")state.vy+=acc;
 if(state.held==="left")state.vx-=acc;
 if(state.held==="right")state.vx+=acc;
 state.vx*=.91;state.vy*=.91;
 if(!state.resting){state.x=clamp(state.x+state.vx,20,WORLD-20);state.y=clamp(state.y+state.vy,20,WORLD-20)}
 if(state.foraging&&state.tick-state.lastForage>=180){state.lastForage=state.tick;forageStep();renderAll()}
 collectResources();interactOrganisms();updateOrganisms();
 if(state.tick%300===0){ecologyTick();renderAll();if(state.cycle%4===0)saveGame()}
 if(state.resources.length<38&&state.tick%90===0)spawnResource(3);
 if(state.organisms.length<BIOMES[state.biome].prey+BIOMES[state.biome].predators&&state.tick%240===0)state.organisms.push(makeOrganism(Math.random()<.7?"prey":"predator"));
}

function sx(wx){return canvas.width/2+(wx-state.x)*worldScale()}
function sy(wy){return canvas.height/2+(wy-state.y)*worldScale()}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawWorld(){
 const b=BIOMES[state.biome],z=worldScale();
 px(0,0,canvas.width,canvas.height,b.sky);
 const tile=90*z;
 const startX=-((state.x*z)%tile),startY=-((state.y*z)%tile);
 for(let yy=startY;yy<canvas.height;yy+=tile)for(let xx=startX;xx<canvas.width;xx+=tile){
  const gx=Math.floor((xx+state.x*z)/tile),gy=Math.floor((yy+state.y*z)/tile),n=Math.abs((gx*17+gy*31+state.biome*13)%9);
  px(xx,yy,tile+1,tile+1,n<2?b.water:b.base);
  if(n===3)px(xx+tile*.25,yy+tile*.55,Math.max(2,tile*.12),Math.max(2,tile*.08),"rgba(255,255,255,.18)");
  if(n===5)px(xx+tile*.68,yy+tile*.22,Math.max(2,tile*.1),Math.max(2,tile*.18),"rgba(0,0,0,.20)");
 }
 // grid-like microtexture communicates camera scaling
 ctx.strokeStyle="rgba(255,255,255,.035)";ctx.lineWidth=1;
 for(let x=startX;x<canvas.width;x+=tile){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}
 for(let y=startY;y<canvas.height;y+=tile){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}
}
function visible(wx,wy,pad=40){const x=sx(wx),y=sy(wy);return x>-pad&&x<canvas.width+pad&&y>-pad&&y<canvas.height+pad}
function drawResources(){
 const z=worldScale();
 for(const o of state.resources){if(!visible(o.x,o.y))continue;o.phase+=.035;const x=sx(o.x),y=sy(o.y)+Math.sin(o.phase)*2,r=RESOURCES[o.type],s=Math.max(3,7*z*o.size);px(x-s/2,y-s/2,s,s,r.color);px(x-s*.2,y-s*.85,s*.4,s*.35,"#fff")}
}
function drawOrganism(o){
 if(!visible(o.x,o.y,70))return;
 const x=sx(o.x),y=sy(o.y),z=worldScale(),r=Math.max(5,bodyRadius(o.mass)*z*.72);
 const dark=o.role==="predator"?"#531f2b":"#15382d";
 px(x-r,y-r*.65,r*2,r*1.3,o.color);px(x-r*.65,y-r,r*1.3,r*2,o.color);px(x-r*.35,y-r*.35,r*.7,r*.7,dark);
 if(o.role==="predator"){px(x+r*.45,y-r*.2,r*.5,r*.22,"#fff");px(x+r*.72,y-r*.13,r*.14,r*.08,"#07110d")}
 else{px(x+r*.2,y-r*.25,r*.27,r*.27,"#fff")}
 if(o.traits.includes("armoured")){px(x-r,y-r*.85,r*2,r*.22,"#d9eef0")}
 if(o.traits.includes("photosynthetic")){px(x-r*.3,y-r*1.25,r*.24,r*.55,"#ffd66a");px(x+r*.1,y-r*1.3,r*.24,r*.6,"#ffd66a")}
}
function drawPlayer(){
 const r=Math.max(9,bodyRadius()*Math.pow(worldScale(),.25)),x=canvas.width/2,y=canvas.height/2;
 const main="#8cff9c",dark="#14382a",light="#e8ffda",gold="#ffd66a",purple="#dba0ff";
 // core
 px(x-r,y-r*.65,r*2,r*1.3,main);px(x-r*.68,y-r,r*1.36,r*2,main);px(x-r*.43,y-r*.38,r*.86,r*.76,dark);
 // eye/sensor
 px(x+r*.24,y-r*.30,r*.34,r*.34,light);px(x+r*.40,y-r*.18,r*.11,r*.11,"#06100c");
 if(gene("chemical gradient sensing")){px(x-r*1.25,y-r*.12,r*.45,r*.20,light);px(x-r*1.52,y-r*.07,r*.35,r*.10,light)}
 if(gene("flexible cortex")||gene("jet propulsion")){px(x-r*1.35,y+r*.15,r*.55,r*.18,light);px(x-r*1.65,y+r*.22,r*.42,r*.12,light)}
 if(gene("protective armour")||gene("mineral scaffold")){px(x-r*1.02,y-r*.95,r*2.04,r*.24,light);px(x-r*1.12,y-r*.7,r*.22,r*1.45,light);px(x+r*.9,y-r*.7,r*.22,r*1.45,light)}
 if(gene("photosymbiont")||gene("photoreception")){px(x-r*.45,y-r*1.45,r*.28,r*.7,gold);px(x+r*.08,y-r*1.55,r*.28,r*.8,gold)}
 if(gene("segmented body")){for(let i=-2;i<=2;i++)px(x+i*r*.45-r*.12,y+r*.65,r*.24,r*.35,main)}
 if(gene("venom gland")||gene("chemical weapon")){px(x+r*.72,y+r*.18,r*.38,r*.27,purple)}
 if(gene("bioluminescence")){px(x-r*.18,y+r*.20,r*.36,r*.25,"#7de0ff")}
 if(gene("distributed colony")){px(x-r*1.45,y+r*.62,r*.55,r*.55,main);px(x+r*.95,y+r*.7,r*.48,r*.48,main)}
 if(gene("developmental zones")){px(x-r*.55,y-r*.12,r*.22,r*.22,gold);px(x+r*.05,y+r*.28,r*.22,r*.22,gold)}
 if(state.invulnerable>0&&Math.floor(state.tick/5)%2===0){ctx.strokeStyle="#fff";ctx.strokeRect(x-r*1.3,y-r*1.4,r*2.6,r*2.8)}
 px(x-r,y+r*1.35,r*2,r*.18,"rgba(0,0,0,.25)");
}
function draw(){
 drawWorld();
 for(const o of state.resources){} // update already handled
 drawResources();
 state.organisms.forEach(drawOrganism);
 drawPlayer();
}

function bar(id,value,color){
 const el=$(id);el.style.width=clamp(value)+"%";el.style.background=value<24?"var(--red)":color;
}
function renderMeters(){
 $("energyText").textContent=Math.round(state.energy);$("waterText").textContent=Math.round(state.water);$("healthText").textContent=Math.round(state.health);
 $("massText").textContent=state.mass.toFixed(1);$("potentialText").textContent=Math.round(state.potential);
 bar("energyBar",state.energy,"var(--green)");bar("waterBar",state.water,"var(--blue)");bar("healthBar",state.health,"var(--green)");
 bar("massBar",Math.min(100,Math.log2(state.mass+1)*18),"var(--gold)");bar("potentialBar",state.potential,"var(--purple)");
}
function renderHeader(){
 const b=BIOMES[state.biome];
 $("cycleLabel").textContent=`CYCLE ${state.cycle}`;$("biomeName").textContent=b.name;$("biomeDetail").textContent=b.detail;
 $("lineageName").textContent=`${bodyScaleLabel().toUpperCase()} LINEAGE`;
 $("lineageDetail").textContent=`mass ${state.mass.toFixed(1)} · zoom ${worldScale().toFixed(2)}×`;
 renderMode();
}
function renderMode(){
 const d=drink();
 let mode=state.resting?"RESTING":state.foraging?"FORAGING":state.held?"MANUAL MOVE":"MANUAL";
 if(d.active)mode+=` · ${d.label}`;
 $("modeLabel").textContent=mode;
 $("restButton").classList.toggle("active",state.resting);$("forageButton").classList.toggle("active",state.foraging);
 $("restButton").innerHTML=state.resting?"STOP REST<small>recovery active</small>":"REST<small>recover with low water loss</small>";
 $("forageButton").innerHTML=state.foraging?"STOP FORAGE<small>autonomous ecology</small>":"FORAGE<small>seek food, evade threats</small>";
}
function renderInventory(){
 $("reserveSummary").innerHTML=Object.entries(state.internal).map(([k,v])=>`<div>${k.toUpperCase()}<b>${v.toFixed(1)}</b></div>`).join("");
 $("inventoryGrid").innerHTML=Object.entries(RESOURCES).map(([k,r])=>`<button class="inventory-item" data-invest="${k}" style="color:${r.color}"><span class="qty">x${state.inventory[k]}</span>${r.icon}<small>${r.name}</small><em>→ ${PATHS[r.path].name}</em></button>`).join("");
 document.querySelectorAll("[data-invest]").forEach(b=>b.onclick=()=>investItem(b.dataset.invest));
}
function renderGenome(){
 const max=Math.max(1,...Object.values(state.paths));
 const dom=dominantPath();
 $("geneTree").innerHTML=Object.entries(PATHS).map(([k,p])=>{
  const next=p.thresholds.find(([l,n])=>rank(k)<l&&!gene(n));
  return `<div class="gene-node ${rank(k)>=1?"unlocked":""} ${k===dom?"dominant":""}">
    <b style="color:${p.color}">${p.name}</b><div class="rank">${state.paths[k].toFixed(1)}</div>
    <div class="mini"><i style="width:${Math.min(100,state.paths[k]/12*100)}%;background:${p.color}"></i></div>
    <span>${next?`next ${next[0]}: ${next[1]}`:"open-ended branch"}</span>
  </div>`}).join("");
 $("geneList").innerHTML=state.genes.map(g=>`<span class="chip gene">${g}</span>`).join("");
 $("rareList").innerHTML=state.rare.length?state.rare.map(g=>`<span class="chip rare">${g}</span>`).join(""):`<span class="chip">No rare variant fixed yet.</span>`;
}
function phenotypeDescriptions(){
 const p=phenotype(),out=[];
 out.push(["Metabolism",gene("photosymbiont")?"Light supplements collected food.":gene("chemotrophy")?"Reduced minerals supplement collected food.":"Energy depends mainly on collected substrates."]);
 out.push(["Behaviour",state.foraging?(gene("threat detection")?"Autonomous search with long-range predator avoidance.":"Autonomous search with basic threat avoidance."):"Player-directed or resting behaviour."]);
 out.push(["Movement",`${p.speed.toFixed(2)} relative speed; mass creates a ${Math.round((1-worldScale())*100)}% camera-scale expansion.`]);
 out.push(["Water balance",`${Math.round((1-p.waterUse)*100)}% reduction in baseline water use from genotype.`]);
 out.push(["Defence",`${p.defense.toFixed(2)}× damage buffering; attacks can still reduce biomass or remove functions.`]);
 return out;
}
function morphologyDescriptions(){
 const out=["central catalytic body"];
 if(gene("chemical gradient sensing"))out.push("anterior chemical-sensing processes");
 if(gene("flexible cortex")||gene("jet propulsion"))out.push("posterior locomotor apparatus");
 if(gene("protective armour")||gene("mineral scaffold"))out.push("external mineralised plates");
 if(gene("photosymbiont")||gene("photoreception"))out.push("dorsal light-harvesting organs");
 if(gene("segmented body"))out.push("repeated ventral growth modules");
 if(gene("chemical weapon")||gene("venom gland"))out.push("specialised chemical weapon compartment");
 if(gene("distributed colony"))out.push("satellite colonial bodies");
 if(gene("developmental zones"))out.push("regional developmental centres");
 return out;
}
function renderPhenotype(){
 const fit=biomeFit(),p=phenotype();
 $("generationText").textContent=state.generation;$("bodyScaleText").textContent=bodyScaleLabel();$("trophicText").textContent=p.trophic;$("fitText").textContent=`${Math.round(fit)}%`;
 $("phenotypeCards").innerHTML=phenotypeDescriptions().map(([a,b])=>`<div class="card ${fit>55?"good":"neutral"}"><b>${a}</b>${b}</div>`).join("");
 $("morphologyCards").innerHTML=morphologyDescriptions().map(m=>`<div class="card"><b>${m}</b>Visibly expressed by the current genotype and biomass.</div>`).join("");
}
function profileRows(obj,color="var(--blue)"){
 const max=Math.max(...Object.values(obj));
 return Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="profile-row"><span>${RESOURCES[k]?.name||k}</span><div class="bar"><i style="width:${v/max*100}%;background:${RESOURCES[k]?.color||color}"></i></div><b>${Math.round(v)}</b></div>`).join("");
}
function renderEcology(){
 const b=BIOMES[state.biome];
 $("resourceProfile").innerHTML=profileRows(b.abundance);
 const pressures={Heat:Math.max(0,b.temp-25)*2,Cold:Math.max(0,10-b.temp)*2,Dryness:100-b.moisture,Toxicity:b.hazard,Predation:b.predators*10};
 $("pressureProfile").innerHTML=Object.entries(pressures).map(([k,v])=>`<div class="profile-row"><span>${k}</span><div class="bar"><i style="width:${clamp(v)}%"></i></div><b>${Math.round(clamp(v))}</b></div>`).join("");
 const prey=state.organisms.filter(o=>o.role==="prey"),pred=state.organisms.filter(o=>o.role==="predator");
 $("populationCards").innerHTML=`<div class="card good"><b>${prey.length} prey organisms</b>Potential food, competitors or teachers. Their size and traits change spontaneously.</div><div class="card bad"><b>${pred.length} predators</b>Risk scales with relative biomass and defensive genotype. Predators also evolve and de-evolve.</div>`;
 $("biomeCards").innerHTML=BIOMES.map((x,i)=>`<div class="card"><b>${state.discovered.includes(i)?x.name:"UNKNOWN NICHE"}</b>${state.discovered.includes(i)?`${x.detail}<br>Water: ${x.waterType}`:"Migrate to discover."}</div>`).join("");
}
function renderLog(){$("logList").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("")}
function renderAll(){renderHeader();renderMeters();renderInventory();renderGenome();renderPhenotype();renderEcology();renderLog()}

function saveGame(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("saveStatus").textContent="saved";setTimeout(()=>$("saveStatus").textContent="autosave on",1000)}
 catch(e){$("saveStatus").textContent="save unavailable"}
}
function migrateOldSave(old){
 const s=freshState();
 if(old.energy!=null)s.energy=old.energy;if(old.water!=null)s.water=old.water;if(old.health!=null)s.health=old.health;
 if(old.generation)s.generation=old.generation;if(old.biome!=null)s.biome=Math.min(old.biome,BIOMES.length-1);
 if(old.traits)for(const t of old.traits){if(!s.genes.includes(t))s.genes.push(t)}
 if(old.inventory)for(const k of Object.keys(s.inventory))s.inventory[k]=old.inventory[k]||0;
 if(old.complexity){for(const k of Object.keys(s.paths))s.paths[k]=old.complexity/35}
 s.logs=["Version 4 lineage imported into the version 5 genotype–phenotype system."];
 return s;
}
function loadGame(){
 let raw=localStorage.getItem(SAVE_KEY);
 if(raw){try{state=Object.assign(freshState(),JSON.parse(raw));return true}catch(e){}}
 const old=localStorage.getItem("evolva-save-v4");
 if(old){try{state=migrateOldSave(JSON.parse(old));return true}catch(e){}}
 return false;
}
function start(fresh=false){
 if(fresh){localStorage.removeItem(SAVE_KEY);state=freshState()}else loadGame();
 if(!state.resources.length)spawnResource(50);
 if(!state.organisms.length)repopulate();
 if(!state.logs.length)log("A basal lineage entered a dynamic ecological niche.");
 $("startScreen").classList.remove("visible");renderAll();running=true;requestAnimationFrame(loop);
}
function reset(){localStorage.removeItem(SAVE_KEY);location.reload()}
function bind(){
 document.querySelectorAll("[data-dir]").forEach(b=>{
  const d=b.dataset.dir;
  ["pointerdown","touchstart","mousedown"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setDirection(d)},{passive:false}));
  ["pointerup","pointercancel","touchend","touchcancel","mouseup","mouseleave"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();if(state.held===d)state.held=null},{passive:false}));
 });
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
  const a=b.dataset.action;if(a==="forage")toggleForage();if(a==="rest")toggleRest();if(a==="divide")divide();if(a==="migrate")migrate();if(a==="evolve")evolve();
 });
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab,.tab-content").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active");
 });
 $("saveButton").onclick=saveGame;$("resetButton").onclick=()=>{if(confirm("Reset the entire lineage?"))reset()};
 const keys={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};
 addEventListener("keydown",e=>{const d=keys[e.key.toLowerCase()];if(d)setDirection(d)});
 addEventListener("keyup",e=>{if(keys[e.key.toLowerCase()]===state.held)state.held=null});
}
let running=false;
function loop(){if(!running)return;update();draw();requestAnimationFrame(loop)}

window.addEventListener("error",e=>{const el=$("startupError");el.hidden=false;el.textContent=`Game error: ${e.message}`});
$("continueButton").onclick=()=>start(false);$("newButton").onclick=()=>start(true);
bind();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=5").catch(()=>{});
