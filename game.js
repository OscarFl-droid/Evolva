"use strict";
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const choice=a=>a[Math.floor(Math.random()*a.length)];
const canvas=$("world"),ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
const SAVE_KEY="evolva-save-v6",WORLD=2200;

const BIOMES=[
{name:"TIDAL POOL",ground:"#397a59",water:"#3b8fb3",sky:"#83cbb0",light:78,moisture:84,temp:36,hazard:26,food:{sugar:3,lipid:3,amino:4,mineral:9,pigment:6,spore:1}},
{name:"FUNGAL FOREST",ground:"#29482f",water:"#315f6c",sky:"#355d40",light:28,moisture:79,temp:20,hazard:25,food:{sugar:6,lipid:5,amino:8,mineral:2,pigment:2,spore:10}},
{name:"WIND DESERT",ground:"#b47545",water:"#4e9c9f",sky:"#e4a36e",light:97,moisture:10,temp:47,hazard:68,food:{sugar:2,lipid:4,amino:1,mineral:5,pigment:8,spore:.4}},
{name:"ACID MARSH",ground:"#687e35",water:"#7ca43d",sky:"#90be5e",light:54,moisture:92,temp:31,hazard:75,food:{sugar:6,lipid:3,amino:6,mineral:4,pigment:2,spore:5}},
{name:"FROZEN BASIN",ground:"#7ca5ad",water:"#6d93ad",sky:"#afd8de",light:46,moisture:38,temp:-17,hazard:77,food:{sugar:2,lipid:8,amino:2,mineral:4,pigment:3,spore:1}},
{name:"HYDROTHERMAL SHELF",ground:"#205b4a",water:"#184f69",sky:"#173b35",light:8,moisture:95,temp:72,hazard:58,food:{sugar:1,lipid:5,amino:4,mineral:12,pigment:.5,spore:2}}
];

const PATHS={
metabolism:{name:"METABOLISM",color:"#ffb6a6"},
structure:{name:"STRUCTURE",color:"#ffd66a"},
growth:{name:"GROWTH",color:"#91ff9c"},
sensing:{name:"SENSING",color:"#7de0ff"},
defense:{name:"DEFENCE",color:"#dba0ff"},
homeostasis:{name:"HOMEOSTASIS",color:"#d7f7ff"},
symbiosis:{name:"SYMBIOSIS",color:"#ddb477"}
};

const GENE_LIBRARY=[
{name:"efficient glycolysis",path:"metabolism",need:1,desc:"More energy from sugar."},
{name:"redox chain",path:"metabolism",need:3,desc:"Minerals and lipids yield more energy."},
{name:"reserve cycling",path:"metabolism",need:6,desc:"Internal stores prevent starvation."},
{name:"selective membrane",path:"structure",need:1,desc:"Reduces passive water and energy loss."},
{name:"flexible cortex",path:"structure",need:3,desc:"Improves movement and turning."},
{name:"mineral armour",path:"structure",need:6,desc:"Reduces injury but slows acceleration."},
{name:"replication control",path:"growth",need:1,desc:"Growth becomes more efficient."},
{name:"cell adhesion",path:"growth",need:3,desc:"Larger bodies remain integrated."},
{name:"developmental zones",path:"growth",need:6,desc:"Visible repeated body modules."},
{name:"chemical sensing",path:"sensing",need:1,desc:"Detects closer food targets."},
{name:"threat detection",path:"sensing",need:3,desc:"Recognises danger earlier."},
{name:"photoreception",path:"sensing",need:6,desc:"Light influences movement and energy."},
{name:"stress response",path:"defense",need:1,desc:"Reduces environmental damage."},
{name:"detoxification",path:"defense",need:3,desc:"Improves survival in toxic niches."},
{name:"chemical weapon",path:"defense",need:6,desc:"Can repel or kill smaller attackers."},
{name:"water retention",path:"homeostasis",need:1,desc:"Uses less water."},
{name:"osmoregulation",path:"homeostasis",need:3,desc:"Uses saline water safely."},
{name:"thermal buffering",path:"homeostasis",need:6,desc:"Reduces heat and cold stress."},
{name:"surface microbiome",path:"symbiosis",need:1,desc:"Provides small passive energy."},
{name:"digestive symbiont",path:"symbiosis",need:3,desc:"Improves amino and spore use."},
{name:"photosymbiont",path:"symbiosis",need:6,desc:"Converts light into energy."}
];

const FOOD={
sugar:{color:"#ffb6a6",energy:18,path:"metabolism"},
lipid:{color:"#ffd66a",energy:25,path:"structure"},
amino:{color:"#91ff9c",energy:13,path:"growth"},
mineral:{color:"#f18b66",energy:8,path:"defense"},
pigment:{color:"#7de0ff",energy:3,path:"sensing"},
spore:{color:"#ddb477",energy:14,path:"symbiosis"}
};

function fresh(){
 const paths={};Object.keys(PATHS).forEach(k=>paths[k]=0);
 return {cycle:1,tick:0,biome:0,generation:1,x:WORLD/2,y:WORLD/2,vx:0,vy:0,target:null,
 energy:72,water:68,health:92,mass:1,evolution:0,mode:"observe",paths,genes:["basal chemistry"],
 resources:[],organisms:[],logs:[],cameraZoom:1,inspectId:null,lastInteraction:0};
}
let state=fresh();

function gene(n){return state.genes.includes(n)}
function log(m){state.logs.unshift(`Cycle ${state.cycle}: ${m}`);state.logs=state.logs.slice(0,70);renderLog()}
function toast(m){const e=$("toast");e.textContent=m;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2200)}
function addGene(n){if(!gene(n)){state.genes.push(n);log(`Heritable function gained: ${n}.`);toast(n.toUpperCase());return true}return false}
function phenotype(){
 return{
 speed:(gene("flexible cortex")?1.18:1)*(gene("mineral armour")?.82:1)*Math.pow(state.mass,-.14),
 waterUse:(gene("water retention")?.45:1)*(gene("selective membrane")?.86:1),
 defense:(gene("mineral armour")?1.8:1)*(gene("stress response")?1.25:1),
 trophic:gene("photosymbiont")?"photo-mixotroph":gene("chemical weapon")?"opportunistic predator":"scavenger"
 };
}
function fit(){
 const b=BIOMES[state.biome];let f=50;
 if(b.moisture<20)f+=gene("water retention")?24:-24;
 if(b.temp>45||b.temp<0)f+=gene("thermal buffering")?22:-22;
 if(b.hazard>60)f+=(gene("stress response")||gene("detoxification"))?18:-18;
 if(b.light>70&&gene("photosymbiont"))f+=15;
 return clamp(f);
}
function cameraScale(){return clamp((1/Math.pow(state.mass,.2))*state.cameraZoom,.32,1.35)}
function radius(m=state.mass){return 10+Math.log2(m+1)*5}

function weightedFood(){
 const table=Object.entries(BIOMES[state.biome].food),sum=table.reduce((s,x)=>s+x[1],0);let r=Math.random()*sum;
 for(const [k,w] of table){r-=w;if(r<=0)return k}return table[0][0];
}
function spawnFood(n=1){for(let i=0;i<n;i++)state.resources.push({x:rand(30,WORLD-30),y:rand(30,WORLD-30),type:weightedFood(),phase:rand(0,6.28)})}
function makeOrganism(){
 const mass=rand(.35,Math.max(2.2,state.mass*1.8));
 return {id:Math.random().toString(36).slice(2),x:rand(30,WORLD-30),y:rand(30,WORLD-30),vx:0,vy:0,mass,
 energy:rand(45,95),water:rand(45,95),health:rand(60,100),hunger:rand(5,70),fear:rand(.1,.9),curiosity:rand(.1,.9),
 aggression:rand(.08,.72),genes:Math.random()<.35?[choice(["fast","armoured","toxic","social","photosynthetic"])]:[],
 state:"wander",target:null,stateTimer:0,phase:rand(0,6.28),color:choice(["#7de0ff","#8cff9c","#ffd66a","#ff7777","#dba0ff"])};
}
function populate(){state.organisms=[];for(let i=0;i<18;i++)state.organisms.push(makeOrganism())}

function nearestResource(x,y){
 let best=null,d=Infinity;for(const r of state.resources){const q=Math.hypot(r.x-x,r.y-y);if(q<d){d=q;best=r}}return best?{o:best,d}:null;
}
function nearestOrganism(o,filter){
 let best=null,d=Infinity;for(const q of state.organisms){if(q===o||!filter(q))continue;const z=Math.hypot(q.x-o.x,q.y-o.y);if(z<d){d=z;best=q}}return best?{o:best,d}:null;
}
function chooseIntent(o){
 const pd=Math.hypot(state.x-o.x,state.y-o.y);
 const sizeRatio=state.mass/o.mass;
 const injuryRisk=sizeRatio*(state.health/100);
 const reward=state.mass/(state.mass+o.mass);
 const hungry=o.hunger>55;
 const desperate=o.energy<20||o.health<30;
 const prey=nearestOrganism(o,q=>q.mass<o.mass*.65&&q.health>0);
 const threat=nearestOrganism(o,q=>q.mass>o.mass*1.6);

 if(desperate){o.state="rest";o.stateTimer=rand(180,350);return}
 if(threat&&threat.d<150){o.state="fleeOther";o.target=threat.o.id;o.stateTimer=rand(150,300);return}
 if(pd<170&&injuryRisk>1.15-o.fear*.2){o.state="fleePlayer";o.target=null;o.stateTimer=rand(170,320);return}
 if(hungry&&prey&&prey.d<300){o.state="huntOther";o.target=prey.o.id;o.stateTimer=rand(180,360);return}
 const attackValue=reward*.8+o.aggression*.35+o.hunger/140-injuryRisk*.55;
 if(hungry&&pd<250&&attackValue>.48){o.state="huntPlayer";o.stateTimer=rand(150,280);return}
 if(pd<180&&o.curiosity>.62){o.state="inspectPlayer";o.stateTimer=rand(130,240);return}
 if(o.hunger<30&&pd<150){o.state="ignorePlayer";o.stateTimer=rand(180,360);return}
 const food=nearestResource(o.x,o.y);
 if(o.hunger>35&&food&&food.d<260){o.state="forage";o.target=state.resources.indexOf(food.o);o.stateTimer=rand(180,320);return}
 o.state="wander";o.target=null;o.stateTimer=rand(180,420);
}

function updateOrganism(o){
 o.stateTimer--;o.phase+=.025;
 if(state.tick%120===0){o.hunger=clamp(o.hunger+rand(1,2.4));o.energy=clamp(o.energy-rand(.4,1));}
 if(o.stateTimer<=0)chooseIntent(o);
 let tx=0,ty=0;
 const pdx=state.x-o.x,pdy=state.y-o.y,pd=Math.hypot(pdx,pdy)||1;
 if(o.state==="huntPlayer"||o.state==="inspectPlayer"){tx=pdx/pd;ty=pdy/pd;if(o.state==="inspectPlayer"&&pd<70){tx=-pdy/pd*.4;ty=pdx/pd*.4}}
 else if(o.state==="fleePlayer"){tx=-pdx/pd;ty=-pdy/pd}
 else if(o.state==="wander"||o.state==="ignorePlayer"){tx=Math.sin(o.phase*.8);ty=Math.cos(o.phase*.57)}
 else if(o.state==="rest"){tx=ty=0;o.energy=clamp(o.energy+.025);o.health=clamp(o.health+.012)}
 else if(o.state==="forage"){
   const r=state.resources[o.target];if(r){const dx=r.x-o.x,dy=r.y-o.y,d=Math.hypot(dx,dy)||1;tx=dx/d;ty=dy/d}else o.stateTimer=0;
 }else{
   const q=state.organisms.find(x=>x.id===o.target);
   if(q){const dx=q.x-o.x,dy=q.y-o.y,d=Math.hypot(dx,dy)||1,s=o.state==="fleeOther"?-1:1;tx=dx/d*s;ty=dy/d*s}else o.stateTimer=0;
 }
 const base=phenotype().speed; // same locomotor basis as player
 const speed=base*Math.pow(o.mass,-.14)*(o.genes.includes("fast")?1.2:1)*(o.genes.includes("armoured")?.84:1);
 o.vx=(o.vx+tx*.05*speed)*.92;o.vy=(o.vy+ty*.05*speed)*.92;
 o.x=clamp(o.x+o.vx,20,WORLD-20);o.y=clamp(o.y+o.vy,20,WORLD-20);

 if(o.state==="forage"){
   const r=state.resources[o.target];
   if(r&&Math.hypot(r.x-o.x,r.y-o.y)<radius(o.mass)+7){o.energy=clamp(o.energy+FOOD[r.type].energy);o.hunger=clamp(o.hunger-28);state.resources.splice(o.target,1);o.stateTimer=0}
 }
 if(o.state==="huntPlayer"&&pd<radius(o.mass)+radius()+5){
   const risk=(state.mass/o.mass)*(state.health/100);
   if(risk>1.25&&Math.random()>.15){o.state="fleePlayer";o.stateTimer=250}
   else{damage(4+o.mass/state.mass*4);o.energy=clamp(o.energy-5);o.hunger=clamp(o.hunger-10);o.state="fleePlayer";o.stateTimer=260}
 }
 if(o.state==="huntOther"){
   const q=state.organisms.find(x=>x.id===o.target);
   if(q&&Math.hypot(q.x-o.x,q.y-o.y)<radius(o.mass)+radius(q.mass)*.5){
      q.health-=14+o.mass/q.mass*4;o.energy=clamp(o.energy+8);o.hunger=clamp(o.hunger-18);o.stateTimer=0;
      if(q.health<=0)state.organisms=state.organisms.filter(x=>x!==q);
   }
 }
}

function damage(n){
 n/=phenotype().defense;state.health=clamp(state.health-n);state.mass=Math.max(.65,state.mass*(1-Math.min(.08,n/180)));
 log(`An ecological attack caused ${Math.round(n)} damage and reduced biomass.`);
 toast("ATTACK — ESCAPE");
 if(state.health<=0){state.health=35;state.energy=25;state.water=30;state.mass=Math.max(.7,state.mass*.55);state.x=WORLD/2;state.y=WORLD/2;log("The lineage survived as a smaller propagule.")}
}
function collect(){
 for(let i=state.resources.length-1;i>=0;i--){
   const r=state.resources[i];if(Math.hypot(r.x-state.x,r.y-state.y)<radius()+10){
     let e=FOOD[r.type].energy;if(r.type==="sugar"&&gene("efficient glycolysis"))e*=1.35;if((r.type==="lipid"||r.type==="mineral")&&gene("redox chain"))e*=1.35;
     state.energy=clamp(state.energy+e);state.paths[FOOD[r.type].path]+=.35;state.evolution=clamp(state.evolution+2.2);state.resources.splice(i,1);
     log(`${r.type} assimilated; ${PATHS[FOOD[r.type].path].name.toLowerCase()} development increased.`);
   }
 }
}
function movementTarget(x,y){state.target={x,y};state.mode="move";state.lastInteraction=state.tick;renderMode()}
function forageToggle(){state.mode=state.mode==="forage"?"observe":"forage";state.target=null;renderAll();log(state.mode==="forage"?"Autonomous survival behaviour activated.":"Autonomous survival behaviour stopped.")}
function restToggle(){state.mode=state.mode==="rest"?"observe":"rest";state.target=null;renderAll();log(state.mode==="rest"?"The organism entered a low-consumption repair state.":"Rest ended.")}
function evolve(){
 if(state.evolution<18){toast("MORE ECOLOGICAL EXPERIENCE NEEDED");return}
 const available=GENE_LIBRARY.filter(g=>state.paths[g.path]>=g.need&&!gene(g.name));
 state.evolution-=18;
 if(available.length){available.sort((a,b)=>state.paths[b.path]-state.paths[a.path]);const g=choice(available.slice(0,Math.min(4,available.length)));addGene(g.name)}
 else{
  const p=Object.keys(state.paths).sort((a,b)=>state.paths[b]-state.paths[a])[0];
  addGene(`${p} innovation ${Math.floor(state.paths[p])}`);
 }
 state.generation++;state.energy=clamp(state.energy-7);renderAll();save();
}
function forageAI(){
 const threats=state.organisms.filter(o=>o.mass>state.mass*1.15&&Math.hypot(o.x-state.x,o.y-state.y)<240);
 if(threats.length){
   const o=threats.sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
   const dx=state.x-o.x,dy=state.y-o.y,d=Math.hypot(dx,dy)||1;movementTarget(state.x+dx/d*180,state.y+dy/d*180);state.mode="forage";return;
 }
 const r=nearestResource(state.x,state.y);if(r)movementTarget(r.o.x,r.o.y),state.mode="forage";
}
function ecologyTick(){
 const b=BIOMES[state.biome],p=phenotype();
 if(state.mode==="rest"){state.energy=clamp(state.energy+3.8);state.health=clamp(state.health+2.8);state.water=clamp(state.water-.1*p.waterUse)}
 else{state.energy=clamp(state.energy-(1.7+Math.log2(state.mass+1)*.25));state.water=clamp(state.water-(b.moisture<20?4.7:1.7)*p.waterUse)}
 if(gene("surface microbiome"))state.energy=clamp(state.energy+.6);
 if(gene("photosymbiont")&&b.light>55)state.energy=clamp(state.energy+2.2);
 if(fit()<35)damage((35-fit())*.06);
 if(state.energy<5||state.water<5)damage(3.5);
 state.cycle++;
}

function update(){
 state.tick++;
 if(state.mode==="forage"&&state.tick%180===0)forageAI();
 if(state.target&&state.mode!=="rest"){
   const dx=state.target.x-state.x,dy=state.target.y-state.y,d=Math.hypot(dx,dy)||1,sp=1.45*phenotype().speed;
   if(d<8){state.target=null;if(state.mode==="move")state.mode="observe"}
   else{state.vx+=(dx/d)*.09*sp;state.vy+=(dy/d)*.09*sp}
 }
 state.vx*=.9;state.vy*=.9;if(state.mode!=="rest"){state.x=clamp(state.x+state.vx,20,WORLD-20);state.y=clamp(state.y+state.vy,20,WORLD-20)}
 collect();state.organisms.forEach(updateOrganism);
 if(state.resources.length<50&&state.tick%60===0)spawnFood(3);
 if(state.organisms.length<18&&state.tick%180===0)state.organisms.push(makeOrganism());
 if(state.tick%300===0){ecologyTick();renderAll();if(state.cycle%4===0)save()}
}

function sx(x){return canvas.width/2+(x-state.x)*cameraScale()}
function sy(y){return canvas.height/2+(y-state.y)*cameraScale()}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawWorld(){
 const b=BIOMES[state.biome],z=cameraScale(),tile=95*z;
 px(0,0,canvas.width,canvas.height,b.sky);
 const ox=-((state.x*z)%tile),oy=-((state.y*z)%tile);
 for(let y=oy;y<canvas.height;y+=tile)for(let x=ox;x<canvas.width;x+=tile){
   const n=Math.abs((Math.floor((x+state.x*z)/tile)*19+Math.floor((y+state.y*z)/tile)*31+state.biome*7)%10);
   px(x,y,tile+1,tile+1,n<2?b.water:b.ground);
   if(n===4)px(x+tile*.2,y+tile*.6,Math.max(2,tile*.12),Math.max(2,tile*.08),"rgba(255,255,255,.16)");
   if(n===7)px(x+tile*.7,y+tile*.25,Math.max(2,tile*.08),Math.max(2,tile*.18),"rgba(0,0,0,.18)");
 }
}
function visible(x,y,p=40){const a=sx(x),b=sy(y);return a>-p&&a<canvas.width+p&&b>-p&&b<canvas.height+p}
function drawFood(){
 for(const r of state.resources){if(!visible(r.x,r.y))continue;r.phase+=.04;const x=sx(r.x),y=sy(r.y)+Math.sin(r.phase)*2,s=Math.max(3,7*cameraScale());px(x-s/2,y-s/2,s,s,FOOD[r.type].color);px(x-s*.2,y-s*.8,s*.4,s*.3,"#fff")}
}
function drawOrganism(o){
 if(!visible(o.x,o.y,60))return;const x=sx(o.x),y=sy(o.y),r=Math.max(5,radius(o.mass)*cameraScale()*.72),dark="#15382d";
 px(x-r,y-r*.62,r*2,r*1.24,o.color);px(x-r*.65,y-r,r*1.3,r*2,o.color);px(x-r*.32,y-r*.3,r*.64,r*.6,dark);px(x+r*.2,y-r*.25,r*.25,r*.25,"#fff");
 const c=o.state==="huntPlayer"?"#ff7777":o.state==="fleePlayer"?"#7de0ff":o.state==="inspectPlayer"?"#ffd66a":"rgba(255,255,255,.3)";
 px(x-r*.12,y-r*1.45,r*.24,r*.24,c);
}
function drawPlayer(){
 const x=canvas.width/2,y=canvas.height/2,r=Math.max(10,radius()*Math.pow(cameraScale(),.2)),main="#8cff9c",dark="#14382a",light="#e8ffda",gold="#ffd66a";
 px(x-r,y-r*.65,r*2,r*1.3,main);px(x-r*.68,y-r,r*1.36,r*2,main);px(x-r*.42,y-r*.38,r*.84,r*.76,dark);px(x+r*.24,y-r*.3,r*.34,r*.34,light);px(x+r*.4,y-r*.18,r*.1,r*.1,"#06100c");
 if(gene("chemical sensing")){px(x-r*1.25,y-r*.1,r*.45,r*.18,light);px(x-r*1.5,y-r*.05,r*.32,r*.1,light)}
 if(gene("flexible cortex")){px(x-r*1.35,y+r*.18,r*.6,r*.17,light)}
 if(gene("mineral armour")){px(x-r,y-r*.95,r*2,r*.22,light);px(x-r*1.1,y-r*.7,r*.2,r*1.4,light);px(x+r*.9,y-r*.7,r*.2,r*1.4,light)}
 if(gene("photoreception")||gene("photosymbiont")){px(x-r*.45,y-r*1.45,r*.25,r*.7,gold);px(x+r*.08,y-r*1.55,r*.25,r*.8,gold)}
 if(gene("developmental zones"))for(let i=-2;i<=2;i++)px(x+i*r*.42-r*.1,y+r*.67,r*.2,r*.3,main);
 if(gene("chemical weapon"))px(x+r*.72,y+r*.18,r*.4,r*.28,"#dba0ff");
 if(state.target){const tx=sx(state.target.x),ty=sy(state.target.y);ctx.strokeStyle="rgba(255,255,255,.35)";ctx.beginPath();ctx.arc(tx,ty,8,0,Math.PI*2);ctx.stroke()}
}
function draw(){drawWorld();drawFood();state.organisms.forEach(drawOrganism);drawPlayer()}

function bar(id,v,c){const e=$(id);e.style.width=clamp(v)+"%";e.style.background=v<24?"var(--red)":c}
function renderMode(){
 $("stateLabel").textContent=state.mode.toUpperCase();$("forageBtn").classList.toggle("active",state.mode==="forage");$("restBtn").classList.toggle("active",state.mode==="rest");
}
function renderMeters(){
 $("energyText").textContent=Math.round(state.energy);$("waterText").textContent=Math.round(state.water);$("healthText").textContent=Math.round(state.health);$("evoText").textContent=Math.round(state.evolution);
 bar("energyBar",state.energy,"var(--green)");bar("waterBar",state.water,"var(--blue)");bar("healthBar",state.health,"var(--green)");bar("evoBar",state.evolution,"var(--purple)");
}
function renderLineage(){
 const p=phenotype();$("massText").textContent=state.mass.toFixed(1);$("generationText").textContent=state.generation;$("trophicText").textContent=p.trophic;$("fitText").textContent=Math.round(fit())+"%";
 $("phenotypeCards").innerHTML=[
 ["Movement",`${p.speed.toFixed(2)} relative speed. Tap or hold the world to direct movement.`],
 ["Water balance",`${Math.round((1-p.waterUse)*100)}% reduction in water use from current genotype.`],
 ["Defence",`${p.defense.toFixed(2)}× buffering against injury.`],
 ["Body scale",`Camera scale ${cameraScale().toFixed(2)}×; growth expands the visible ecological field.`]
 ].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("");
}
function renderGenome(){
 $("pathGrid").innerHTML=Object.entries(PATHS).map(([k,p])=>`<div class="path-node"><b style="color:${p.color}">${p.name}</b><strong>${state.paths[k].toFixed(1)}</strong><i><em style="width:${Math.min(100,state.paths[k]/8*100)}%;background:${p.color}"></em></i></div>`).join("");
 $("geneList").innerHTML=state.genes.map(g=>`<span class="chip">${g}</span>`).join("");
}
function renderEcology(){
 const near=state.organisms.filter(o=>Math.hypot(o.x-state.x,o.y-state.y)<300);
 const states={};near.forEach(o=>states[o.state]=(states[o.state]||0)+1);
 $("ecologyCards").innerHTML=[
 ["Nearby organisms",`${near.length} currently within the local ecological field.`],
 ["Observed behaviour",Object.entries(states).map(([k,v])=>`${k}: ${v}`).join(" · ")||"No nearby behaviour detected."],
 ["Biome resources",Object.entries(BIOMES[state.biome].food).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join(", ")],
 ["Selection pressure",`Niche fit ${Math.round(fit())}%. Poor fit increases physiological damage rather than arbitrary penalties.`]
 ].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("");
}
function renderLog(){$("logList").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("")}
function renderAll(){$("cycleLabel").textContent=`CYCLE ${state.cycle}`;$("biomeLabel").textContent=BIOMES[state.biome].name;renderMode();renderMeters();renderLineage();renderGenome();renderEcology();renderLog()}

function inspectAt(wx,wy){
 let best=null,d=Infinity;for(const o of state.organisms){const q=Math.hypot(o.x-wx,o.y-wy);if(q<d){d=q;best=o}}
 const box=$("inspect");
 if(best&&d<70/cameraScale()){
   box.hidden=false;box.innerHTML=`<b style="color:${best.color}">ORGANISM</b><br>mass ${best.mass.toFixed(1)}<br>health ${Math.round(best.health)}<br>state ${best.state}<br>genes ${best.genes.join(", ")||"basal"}`;
   clearTimeout(inspectAt.t);inspectAt.t=setTimeout(()=>box.hidden=true,3500);
 }
}
function worldPoint(ev){
 const r=canvas.getBoundingClientRect(),t=ev.touches?ev.touches[0]:ev;
 return{x:state.x+(t.clientX-r.left-r.width/2)/cameraScale()*(canvas.width/r.width),y:state.y+(t.clientY-r.top-r.height/2)/cameraScale()*(canvas.height/r.height)};
}
let holdTimer=null,longTimer=null,lastTap=0,pointerDown=false;
function pointerStart(e){
 e.preventDefault();pointerDown=true;const p=worldPoint(e),now=Date.now();
 if(now-lastTap<300){state.cameraZoom=clamp(state.cameraZoom*.82,.6,1.3);toast("VIEW EXPANDED")}lastTap=now;
 longTimer=setTimeout(()=>inspectAt(p.x,p.y),520);
 movementTarget(p.x,p.y);
 holdTimer=setInterval(()=>{if(pointerDown){const q=worldPoint(e);movementTarget(q.x,q.y)}},140);
}
function pointerMove(e){if(!pointerDown)return;e.preventDefault();const p=worldPoint(e);movementTarget(p.x,p.y)}
function pointerEnd(e){pointerDown=false;clearInterval(holdTimer);clearTimeout(longTimer)}
function bind(){
 ["pointerdown","touchstart"].forEach(ev=>canvas.addEventListener(ev,pointerStart,{passive:false}));
 ["pointermove","touchmove"].forEach(ev=>canvas.addEventListener(ev,pointerMove,{passive:false}));
 ["pointerup","pointercancel","touchend","touchcancel"].forEach(ev=>canvas.addEventListener(ev,pointerEnd,{passive:false}));
 $("forageBtn").onclick=forageToggle;$("restBtn").onclick=restToggle;$("evolveBtn").onclick=evolve;$("saveBtn").onclick=save;$("resetBtn").onclick=()=>{if(confirm("Reset the lineage?")){localStorage.removeItem(SAVE_KEY);location.reload()}};
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab,.tab-content").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active")});
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("saveStatus").textContent="saved";setTimeout(()=>$("saveStatus").textContent="autosave on",900)}catch(e){}}
function load(){const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;try{state=Object.assign(fresh(),JSON.parse(raw));return true}catch(e){return false}}
function start(freshGame=false){
 if(freshGame){localStorage.removeItem(SAVE_KEY);state=fresh()}else load();
 if(!state.resources.length)spawnFood(58);if(!state.organisms.length)populate();if(!state.logs.length)log("The lineage entered a living ecosystem.");
 $("start").classList.remove("visible");renderAll();running=true;requestAnimationFrame(loop);
}
let running=false;function loop(){if(!running)return;update();draw();requestAnimationFrame(loop)}
window.addEventListener("error",e=>{const x=$("error");x.hidden=false;x.textContent=e.message});
$("continue").onclick=()=>start(false);$("newGame").onclick=()=>start(true);bind();
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=6").catch(()=>{});
