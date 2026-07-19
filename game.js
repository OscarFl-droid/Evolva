"use strict";
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const choice=a=>a[Math.floor(Math.random()*a.length)];
const canvas=$("world"),ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
const SAVE_KEY="evolva-save-v7-4",LEGACY_SAVE_KEY="evolva-save-v7-3",OLDER_SAVE_KEYS=["evolva-save-v7-2","evolva-save-v7-1","evolva-save-v7"],WORLD=2200,XP_BASE=100;

const BIOMES=[
{name:"TIDAL POOL",ground:"#397a59",water:"#3b8fb3",sky:"#83cbb0",light:78,moisture:84,temp:36,hazard:26,pressure:{mobility:2,adaptability:2,communication:1}},
{name:"FUNGAL FOREST",ground:"#29482f",water:"#315f6c",sky:"#355d40",light:28,moisture:79,temp:20,hazard:25,pressure:{communication:3,innovation:2,resilience:1}},
{name:"WIND DESERT",ground:"#b47545",water:"#4e9c9f",sky:"#e4a36e",light:97,moisture:10,temp:47,hazard:68,pressure:{resilience:4,mobility:1,adaptability:2}},
{name:"ACID MARSH",ground:"#687e35",water:"#7ca43d",sky:"#90be5e",light:54,moisture:92,temp:31,hazard:75,pressure:{resilience:3,innovation:2,adaptability:2}},
{name:"FROZEN BASIN",ground:"#7ca5ad",water:"#6d93ad",sky:"#afd8de",light:46,moisture:38,temp:-17,hazard:77,pressure:{resilience:4,cognition:1,communication:1}},
{name:"HYDROTHERMAL SHELF",ground:"#205b4a",water:"#184f69",sky:"#173b35",light:8,moisture:95,temp:72,hazard:58,pressure:{power:2,resilience:3,innovation:3}}
];

const AXES={
 power:{name:"Power",icon:"◆",desc:"Force generation, feeding structures and mechanical leverage."},
 mobility:{name:"Mobility",icon:"➤",desc:"Acceleration, turning, swimming and spatial control."},
 resilience:{name:"Resilience",icon:"⬢",desc:"Tolerance of injury, toxins, heat, cold and starvation."},
 cognition:{name:"Cognition",icon:"◉",desc:"Sensing integration, memory and behavioural prediction."},
 adaptability:{name:"Adaptability",icon:"∞",desc:"Developmental plasticity and survival across changing niches."},
 communication:{name:"Communication",icon:"⌁",desc:"Chemical, visual and social information exchange."},
 innovation:{name:"Innovation",icon:"✦",desc:"Capacity to discover unusual developmental solutions."}
};

const ORIGINS=[
{id:"vesicle",name:"PERMEABLE VESICLE",desc:"A flexible ancestor that exchanges water and chemicals rapidly.",axes:{adaptability:2,mobility:1},gene:"selective membrane",color:"#8cff9c"},
{id:"crawler",name:"CONTRACTILE CRAWLER",desc:"A mechanically active ancestor built around directed movement.",axes:{power:1,mobility:2},gene:"contractile cortex",color:"#ffd66a"},
{id:"colony",name:"CHEMICAL COLONY",desc:"A cooperative ancestor that senses and exchanges metabolites.",axes:{communication:2,cognition:1},gene:"chemical sensing",color:"#7de0ff"}
];

const FOOD={
 sugar:{color:"#ffb6a6",energy:18,axis:"power",name:"Sugar",imprint:"rapid metabolism"},
 lipid:{color:"#ffd66a",energy:25,axis:"mobility",name:"Lipid",imprint:"membranes and propulsion"},
 amino:{color:"#91ff9c",energy:13,axis:"power",name:"Amino acids",imprint:"growth and contractile tissue"},
 mineral:{color:"#f18b66",energy:8,axis:"resilience",name:"Mineral",imprint:"scaffolds and armour"},
 pigment:{color:"#7de0ff",energy:3,axis:"cognition",name:"Pigment",imprint:"light sensing and signalling"},
 spore:{color:"#ddb477",energy:14,axis:"communication",name:"Spore",imprint:"symbiosis and chemical exchange"}
};


const DIET_RECIPES=[
 {id:"motile_membrane",name:"Motile Membrane",needs:{lipid:2,sugar:1},axes:{mobility:8,adaptability:3},desc:"Energy-rich membranes favour cilia and directed locomotion."},
 {id:"mineral_body",name:"Reinforced Body",needs:{mineral:2,amino:2},axes:{resilience:8,power:6},desc:"Protein laid around minerals favours armour and internal support."},
 {id:"sensory_surface",name:"Sensory Surface",needs:{pigment:2,lipid:1},axes:{cognition:9,communication:3},desc:"Pigmented membranes favour photoreception and signal processing."},
 {id:"symbiotic_metabolism",name:"Symbiotic Metabolism",needs:{spore:2,sugar:1},axes:{communication:9,innovation:6},desc:"Repeated symbiont feeding favours cooperative metabolism."},
 {id:"toxic_compartment",name:"Chemical Arsenal",needs:{spore:1,mineral:1,amino:1},axes:{innovation:7,resilience:5},desc:"Mixed chemical and structural intake favours detoxification and toxin storage."},
 {id:"plastic_generalist",name:"Plastic Generalist",needs:{sugar:1,lipid:1,amino:1,pigment:1},axes:{adaptability:10,innovation:3},desc:"A varied diet preserves developmental flexibility rather than one narrow specialisation."}
];
const ATLAS=[
{id:"selective membrane",name:"Selective Membrane",axis:"adaptability",tier:1,icon:"◌",req:[],min:{adaptability:1},desc:"Controls passive exchange and reduces water loss.",effect:"Water use −18%"},
{id:"contractile cortex",name:"Contractile Cortex",axis:"power",tier:1,icon:"◍",req:[],min:{power:1},desc:"Organised force generation beneath the membrane.",effect:"Force +15%"},
{id:"chemical sensing",name:"Chemical Sensing",axis:"cognition",tier:1,icon:"⌁",req:[],min:{cognition:1},desc:"Detects food and organisms through gradients.",effect:"Detection radius +25%"},
{id:"stress response",name:"Stress Response",axis:"resilience",tier:1,icon:"⬢",req:[],min:{resilience:2},desc:"Buffers acute environmental and injury stress.",effect:"Damage −15%"},
{id:"surface exchange",name:"Surface Exchange",axis:"communication",tier:1,icon:"≈",req:["selective membrane"],min:{communication:2},desc:"Releases and detects short-range molecular signals.",effect:"Interaction range +20%"},
{id:"cilia",name:"Coordinated Cilia",axis:"mobility",tier:2,icon:"≋",req:["selective membrane"],min:{mobility:3},desc:"Repeated surface motors generate precise swimming.",effect:"Speed +22%, turning +30%"},
{id:"pseudopods",name:"Pseudopod Network",axis:"mobility",tier:2,icon:"〰",req:["contractile cortex"],min:{mobility:3,power:2},desc:"Temporary extensions enable crawling and engulfment.",effect:"Foraging efficiency +25%"},
{id:"feeding groove",name:"Feeding Groove",axis:"power",tier:2,icon:"∨",req:["contractile cortex"],min:{power:3},desc:"Directed intake concentrates resources.",effect:"Food energy +20%"},
{id:"repair cycle",name:"Repair Cycle",axis:"resilience",tier:2,icon:"✚",req:["stress response"],min:{resilience:4},desc:"Active repair restores damaged structures during rest.",effect:"Rest healing ×1.7"},
{id:"memory loop",name:"Memory Loop",axis:"cognition",tier:2,icon:"↻",req:["chemical sensing"],min:{cognition:4},desc:"Retains recent food, hazard and organism locations.",effect:"Forage decisions improve"},
{id:"phenotypic plasticity",name:"Phenotypic Plasticity",axis:"adaptability",tier:2,icon:"∞",req:["selective membrane"],min:{adaptability:4},desc:"Temporarily tunes physiology to the current biome.",effect:"Niche penalties −25%"},
{id:"quorum signal",name:"Quorum Signalling",axis:"communication",tier:2,icon:"⋯",req:["surface exchange"],min:{communication:4},desc:"Behaviour changes in response to nearby conspecific density.",effect:"Cooperation enabled"},
{id:"mineral scaffold",name:"Mineral Scaffold",axis:"power",tier:3,icon:"▰",req:["feeding groove"],min:{power:6,resilience:4},desc:"Rigid internal supports improve leverage and body scale.",effect:"Power +30%, mass capacity +40%"},
{id:"armoured cortex",name:"Armoured Cortex",axis:"resilience",tier:3,icon:"⬡",req:["stress response"],min:{resilience:6},desc:"Layered exterior absorbs attacks and harsh chemistry.",effect:"Damage −30%, speed −8%"},
{id:"directed locomotion",name:"Directed Locomotion",axis:"mobility",tier:3,icon:"➤",req:["cilia"],min:{mobility:6,cognition:3},desc:"Sensory steering couples directly to propulsion.",effect:"Acceleration +30%"},
{id:"predatory strike",name:"Predatory Strike",axis:"power",tier:3,icon:"✦",req:["pseudopods","feeding groove"],min:{power:6,mobility:4},desc:"A rapid forceful feeding attack against smaller organisms.",effect:"Active attack unlocked"},
{id:"threat model",name:"Threat Model",axis:"cognition",tier:3,icon:"◉",req:["memory loop"],min:{cognition:6},desc:"Estimates pursuit risk from relative size, health and escape routes.",effect:"Flee/hunt forecast"},
{id:"detoxification",name:"Detoxification",axis:"resilience",tier:3,icon:"♢",req:["repair cycle"],min:{resilience:6,adaptability:3},desc:"Neutralises reactive and toxic environmental compounds.",effect:"Hazard damage −40%"},
{id:"developmental reserve",name:"Developmental Reserve",axis:"adaptability",tier:3,icon:"◇",req:["phenotypic plasticity"],min:{adaptability:6},desc:"Stores unused developmental potential between epochs.",effect:"+1 epoch candidate"},
{id:"cooperative exchange",name:"Cooperative Exchange",axis:"communication",tier:3,icon:"⇄",req:["quorum signal"],min:{communication:6},desc:"Nearby compatible organisms exchange energy and warning signals.",effect:"Symbiosis interactions"},
{id:"segmented body",name:"Segmented Body",axis:"innovation",tier:4,icon:"▥",req:["mineral scaffold","directed locomotion"],min:{innovation:6,power:6},desc:"Repeated developmental modules permit specialised regions.",effect:"Visible body modules; slot +1"},
{id:"electroreception",name:"Electroreception",axis:"innovation",tier:4,icon:"ϟ",req:["threat model"],min:{innovation:7,cognition:7},desc:"Detects weak electrical disturbances beyond chemical sensing.",effect:"Detection through obstacles"},
{id:"photosymbiosis",name:"Photosymbiosis",axis:"innovation",tier:4,icon:"☼",req:["cooperative exchange"],min:{innovation:6,communication:6},desc:"Internal symbionts convert light into usable energy.",effect:"Passive energy in light"},
{id:"toxin organelle",name:"Toxin Organelle",axis:"innovation",tier:4,icon:"†",req:["detoxification","feeding groove"],min:{innovation:7,resilience:6},desc:"Compartmentalises and releases offensive chemistry.",effect:"Toxin attack unlocked"},
{id:"distributed ganglion",name:"Distributed Ganglion",axis:"cognition",tier:4,icon:"◎",req:["threat model","segmented body"],min:{cognition:8},desc:"Regional information centres coordinate complex body modules.",effect:"Tactical behaviour unlocked"},
{id:"colonial budding",name:"Colonial Budding",axis:"communication",tier:4,icon:"❖",req:["cooperative exchange","developmental reserve"],min:{communication:8,adaptability:7},desc:"Temporary daughter units remain behaviourally coordinated.",effect:"Companion buds"},
{id:"thermal engine",name:"Thermal Engine",axis:"innovation",tier:5,icon:"♨",req:["detoxification","mineral scaffold"],min:{innovation:9,resilience:8},desc:"Exploits extreme temperature gradients for metabolism.",effect:"Energy from thermal niches"},
{id:"adaptive radiation",name:"Adaptive Radiation",axis:"adaptability",tier:5,icon:"✺",req:["developmental reserve","segmented body"],min:{adaptability:9,innovation:8},desc:"Each new biome can activate a specialised reversible form.",effect:"Biome morphs unlocked"}
];


const AXIS_ANGLE={power:-2.65,mobility:-1.75,resilience:-.85,cognition:0,adaptability:.85,communication:1.75,innovation:2.65};
const ATLAS_POS={};
(function layoutAtlas(){
 const groups={};Object.keys(AXES).forEach(a=>groups[a]=[]);
 ATLAS.forEach(n=>groups[n.axis].push(n));
 Object.entries(groups).forEach(([axis,nodes])=>{
   nodes.sort((a,b)=>a.tier-b.tier||a.name.localeCompare(b.name));
   const byTier={};nodes.forEach(n=>(byTier[n.tier]??=[]).push(n));
   Object.entries(byTier).forEach(([tierStr,list])=>{
     const tier=Number(tierStr),base=AXIS_ANGLE[axis],spread=Math.min(.56,.13*(list.length-1));
     list.forEach((n,i)=>{
       const off=list.length===1?0:-spread/2+spread*i/(list.length-1);
       const radius=90+tier*82;
       ATLAS_POS[n.id]={x:430+Math.cos(base+off)*radius,y:360+Math.sin(base+off)*radius};
     });
   });
 });
})();
// Prevent label/node collisions in the compact mobile layout.
if(ATLAS_POS["cilia"])ATLAS_POS["cilia"].x-=24;
if(ATLAS_POS["pseudopods"])ATLAS_POS["pseudopods"].x+=24;
if(ATLAS_POS["mineral scaffold"])ATLAS_POS["mineral scaffold"].y-=22;
if(ATLAS_POS["predatory strike"])ATLAS_POS["predatory strike"].y+=22;
if(ATLAS_POS["armoured cortex"])ATLAS_POS["armoured cortex"].y-=22;
if(ATLAS_POS["detoxification"])ATLAS_POS["detoxification"].y+=22;

let atlasCanvas,atlasCtx,atlasPointer=null,atlasDrag=null,atlasHover=null,atlasLastDraw=0,atlasDirty=true;
const atlasPointers=new Map();
function atlasStatus(node){
 if(gene(node.id))return"owned";
 if(nodeAvailable(node))return"available";
 const prereqDistance=node.req.filter(r=>!gene(r)).length;
 const pressure=(state.pressures[node.axis]||0)+(BIOMES[state.biome].pressure[node.axis]||0)*5;
 if(prereqDistance<=1&&pressure>12)return"pressured";
 return"locked";
}
function atlasVisible(node){
 const status=atlasStatus(node);
 if(status!=="locked")return true;
 if(node.req.some(gene))return true;
 return node.tier<=2;
}
function sanitizeAtlasView(){
 if(!state.atlasView||![state.atlasView.x,state.atlasView.y,state.atlasView.zoom].every(Number.isFinite))state.atlasView={x:430,y:360,zoom:1};
 state.atlasView.zoom=clamp(state.atlasView.zoom,.45,2.6);clampAtlasView()
}
function clampAtlasView(){
 const margin=230/state.atlasView.zoom;
 state.atlasView.x=clamp(state.atlasView.x,-margin,860+margin);
 state.atlasView.y=clamp(state.atlasView.y,-margin,720+margin)
}
function atlasWorldFromClient(clientX,clientY){
 const rect=atlasCanvas.getBoundingClientRect(),sx=(clientX-rect.left)*(atlasCanvas.width/rect.width),sy=(clientY-rect.top)*(atlasCanvas.height/rect.height);
 return{x:(sx-atlasCanvas.width/2)/state.atlasView.zoom+state.atlasView.x,y:(sy-atlasCanvas.height/2)/state.atlasView.zoom+state.atlasView.y}
}
function atlasWorldFromEvent(e){return atlasWorldFromClient(e.clientX,e.clientY)}
function atlasNodeAt(e){
 const p=atlasWorldFromEvent(e);let best=null,d=1e9;
 for(const n of ATLAS){if(!atlasVisible(n))continue;const q=ATLAS_POS[n.id],z=Math.hypot(q.x-p.x,q.y-p.y);if(z<d){d=z;best=n}}
 return d<26/state.atlasView.zoom?best:null
}
function atlasFocusCurrent(){
 const owned=ATLAS.filter(n=>gene(n.id));
 if(!owned.length){state.atlasView={x:430,y:360,zoom:1};atlasDirty=true;return}
 const pts=owned.map(n=>ATLAS_POS[n.id]);state.atlasView.x=pts.reduce((v,p)=>v+p.x,0)/pts.length;state.atlasView.y=pts.reduce((v,p)=>v+p.y,0)/pts.length;state.atlasView.zoom=1.18;clampAtlasView();atlasDirty=true
}
function atlasZoom(delta,clientX=null,clientY=null){
 sanitizeAtlasView();const before=clientX===null?null:atlasWorldFromClient(clientX,clientY),old=state.atlasView.zoom;
 state.atlasView.zoom=clamp(old*delta,.45,2.6);
 if(before){
   const after=atlasWorldFromClient(clientX,clientY);state.atlasView.x+=before.x-after.x;state.atlasView.y+=before.y-after.y
 }
 clampAtlasView();atlasDirty=true;save()
}
function atlasPointerDown(e){
 e.preventDefault();atlasPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});atlasCanvas.setPointerCapture?.(e.pointerId);
 if(atlasPointers.size===1){atlasPointer=e.pointerId;atlasDrag={x:e.clientX,y:e.clientY,vx:state.atlasView.x,vy:state.atlasView.y,moved:false}}
 else if(atlasPointers.size===2){
   const a=[...atlasPointers.values()],dx=a[0].x-a[1].x,dy=a[0].y-a[1].y;
   atlasDrag={pinch:true,distance:Math.hypot(dx,dy),zoom:state.atlasView.zoom,midX:(a[0].x+a[1].x)/2,midY:(a[0].y+a[1].y)/2,world:atlasWorldFromClient((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2),moved:true}
 }
 $("livingAtlas").classList.add("is-dragging")
}
function atlasPointerMove(e){
 if(!atlasPointers.has(e.pointerId))return;e.preventDefault();atlasPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(atlasPointers.size===2&&atlasDrag?.pinch){
   const a=[...atlasPointers.values()],dx=a[0].x-a[1].x,dy=a[0].y-a[1].y,dist=Math.max(10,Math.hypot(dx,dy)),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;
   state.atlasView.zoom=clamp(atlasDrag.zoom*dist/atlasDrag.distance,.45,2.6);
   const after=atlasWorldFromClient(mx,my);state.atlasView.x+=atlasDrag.world.x-after.x;state.atlasView.y+=atlasDrag.world.y-after.y;clampAtlasView();atlasDirty=true;return
 }
 if(e.pointerId!==atlasPointer||!atlasDrag||atlasDrag.pinch)return;
 const rect=atlasCanvas.getBoundingClientRect(),dx=(e.clientX-atlasDrag.x)*(atlasCanvas.width/rect.width)/state.atlasView.zoom,dy=(e.clientY-atlasDrag.y)*(atlasCanvas.height/rect.height)/state.atlasView.zoom;
 if(Math.hypot(dx,dy)>4)atlasDrag.moved=true;state.atlasView.x=atlasDrag.vx-dx;state.atlasView.y=atlasDrag.vy-dy;clampAtlasView();atlasDirty=true
}
function atlasPointerUp(e){
 if(!atlasPointers.has(e.pointerId))return;e.preventDefault();
 const wasPinch=atlasPointers.size>1||atlasDrag?.pinch,moved=atlasDrag?.moved,node=!wasPinch&&!moved?atlasNodeAt(e):null;
 atlasPointers.delete(e.pointerId);atlasCanvas.releasePointerCapture?.(e.pointerId);
 if(atlasPointers.size===0){atlasPointer=null;atlasDrag=null;$("livingAtlas").classList.remove("is-dragging");if(node)showAtlasTooltip(node,e);save()}
 else if(atlasPointers.size===1){const [id,p]=[...atlasPointers.entries()][0];atlasPointer=id;atlasDrag={x:p.x,y:p.y,vx:state.atlasView.x,vy:state.atlasView.y,moved:true}}
}
function atlasWheel(e){e.preventDefault();atlasZoom(e.deltaY<0?1.12:.89,e.clientX,e.clientY)}
function showAtlasTooltip(node,e){
 const box=$("atlasTooltip"),status=atlasStatus(node),missing=node.req.filter(r=>!gene(r));
 const thresholdMissing=Object.entries(node.min||{}).filter(([a,v])=>derivedAxis(a)<v).map(([a,v])=>`${AXES[a].name} ${derivedAxis(a)}/${v}`);
 box.innerHTML=`<b>${node.icon} ${node.name}</b>${node.desc}<small>${node.effect}<br>${AXES[node.axis].name} · Tier ${node.tier}<br>${status==="owned"?"Fixed in lineage":status==="available"?"Accessible at next major evolution":[missing.length?"Requires: "+missing.join(", "):"",thresholdMissing.length?"Needs: "+thresholdMissing.join(", "):""].filter(Boolean).join("<br>")}</small>`;
 const rect=atlasCanvas.getBoundingClientRect();box.style.left=Math.min(Math.max(6,rect.width-box.offsetWidth-6),Math.max(6,e.clientX-rect.left+8))+"px";box.style.top=Math.min(Math.max(6,rect.height-125),Math.max(6,e.clientY-rect.top-15))+"px";box.hidden=false;clearTimeout(showAtlasTooltip.t);showAtlasTooltip.t=setTimeout(()=>box.hidden=true,5000)
}
function atlasNodeColor(status,node){
 if(status==="owned")return"#8cff9c";
 if(status==="available")return"#ffd66a";
 if(status==="pressured")return"#dba0ff";
 return"#294036"
}
function drawAtlas(now=performance.now()){
 if(!atlasCanvas||!$("lineageTab").classList.contains("active"))return;
 if(!atlasDirty&&now-atlasLastDraw<50)return;atlasLastDraw=now;atlasDirty=false;
 sanitizeAtlasView();
 const c=atlasCtx,w=atlasCanvas.width,h=atlasCanvas.height;c.clearRect(0,0,w,h);
 c.save();c.translate(w/2,h/2);c.scale(state.atlasView.zoom,state.atlasView.zoom);c.translate(-state.atlasView.x,-state.atlasView.y);
 c.lineWidth=1.5/state.atlasView.zoom;
 for(const n of ATLAS){
   if(!atlasVisible(n))continue;
   const to=ATLAS_POS[n.id];
   for(const rid of n.req){
     const from=ATLAS_POS[rid],req=ATLAS.find(x=>x.id===rid);if(!from||!req||!atlasVisible(req))continue;
     const active=gene(rid)&&gene(n.id),open=gene(rid)&&nodeAvailable(n);
     c.strokeStyle=active?"rgba(140,255,156,.8)":open?"rgba(255,214,106,.72)":"rgba(73,110,89,.38)";
     c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke()
   }
 }
 // Root links connect the present organism to fixed basal innovations.
 for(const n of ATLAS.filter(n=>gene(n.id)&&n.tier===1)){
   const p=ATLAS_POS[n.id];c.strokeStyle="rgba(140,255,156,.72)";c.beginPath();c.moveTo(430,360);c.lineTo(p.x,p.y);c.stroke()
 }
 // central lineage core
 c.fillStyle="#e8ffda";c.beginPath();c.arc(430,360,24,0,Math.PI*2);c.fill();
 c.fillStyle="#06100c";c.font="bold 10px monospace";c.textAlign="center";c.fillText("YOU",430,364);
 for(const n of ATLAS){
   if(!atlasVisible(n))continue;
   const p=ATLAS_POS[n.id],status=atlasStatus(n),pressure=(state.pressures[n.axis]||0)+(BIOMES[state.biome].pressure[n.axis]||0)*5;
   if((status==="available"||status==="pressured")&&pressure>8){
     c.strokeStyle=status==="available"?"rgba(255,214,106,.28)":"rgba(219,160,255,.25)";
     c.lineWidth=(8+Math.sin(performance.now()/300)*2)/state.atlasView.zoom;c.beginPath();c.arc(p.x,p.y,18,0,Math.PI*2);c.stroke()
   }
   c.fillStyle=atlasNodeColor(status,n);c.strokeStyle=status==="owned"?"#dfffdc":status==="available"?"#fff2aa":"#45604f";c.lineWidth=2/state.atlasView.zoom;
   const r=status==="owned"?13:11;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle=status==="locked"?"#7b9582":"#07120d";c.font=`${Math.max(7,10/state.atlasView.zoom)}px monospace`;c.textAlign="center";c.fillText(n.icon,p.x,p.y+3.5/state.atlasView.zoom);
   if(state.atlasView.zoom>.72){
     c.fillStyle=status==="locked"?"rgba(168,197,165,.48)":"#e8ffda";c.font=`${Math.max(6,7.5/state.atlasView.zoom)}px monospace`;
     c.fillText(n.name.toUpperCase(),p.x,p.y+24/state.atlasView.zoom)
   }
 }
 c.restore()
}
function baseAxes(){const a={};Object.keys(AXES).forEach(k=>a[k]=1);return a}
function basePressures(){const a={};Object.keys(AXES).forEach(k=>a[k]=0);return a}
function fresh(){
 return{
 cycle:1,tick:0,biome:0,generation:1,x:WORLD/2,y:WORLD/2,vx:0,vy:0,target:null,
 energy:72,water:68,health:92,mass:1,mode:"observe",
 level:1,xp:0,adaptPoints:0,origin:null,bodyPlan:"Simple vesicle",
 axes:baseAxes(),pressures:basePressures(),lifetimePressure:basePressures(),
 genes:[],pendingEpochs:0,completedEpochs:0,epochFeed:{},epochForecast:[],
 inventory:{sugar:0,lipid:0,amino:0,mineral:0,pigment:0,spore:0},
 atlasView:{x:430,y:360,zoom:1},
 dietMemory:{sugar:0,lipid:0,amino:0,mineral:0,pigment:0,spore:0},dietHistory:[],encounter:null,lastTileKey:"",
 resources:[],organisms:[],logs:[],lastInteraction:0
 };
}
let state=fresh();

function gene(n){return state.genes.includes(n)}
function log(m){state.logs.unshift(`Cycle ${state.cycle}: ${m}`);state.logs=state.logs.slice(0,90);renderLog()}
function toast(m){const e=$("toast");e.textContent=m;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2200)}
function addPressure(axis,n=.1){state.pressures[axis]=clamp(state.pressures[axis]+n,0,100);state.lifetimePressure[axis]+=n;if(n>=.5)atlasDirty=true}
function addXP(n,reason){
 state.xp+=n;
 if(reason&&n>=2)log(`${reason} (+${Math.round(n)} evolutionary experience).`);
 while(state.xp>=xpNeeded()){
   state.xp-=xpNeeded();state.level++;state.adaptPoints++;
   toast(`LINEAGE LEVEL ${state.level}`);log(`Lineage level ${state.level} reached; one adaptation point gained.`);
   if(state.level%5===0){
     state.pendingEpochs++;
     log(`A major evolution is ready for the level ${state.level} milestone.`);
     if(!simulationPaused())setTimeout(openEpoch,250);
   }
 }
}
function xpNeeded(){return XP_BASE+Math.max(0,state.level-1)*18}
function derivedAxis(axis){
 let v=state.axes[axis]||1;
 for(const id of state.genes){const node=ATLAS.find(n=>n.id===id);if(node?.axis===axis)v+=node.tier*.35}
 return Math.round(v*10)/10;
}
function phenotype(){
 return{
 speed:(1+(derivedAxis("mobility")-1)*.055)*(gene("cilia")?1.22:1)*(gene("directed locomotion")?1.3:1)*(gene("armoured cortex")?.92:1),
 force:(1+(derivedAxis("power")-1)*.08)*(gene("contractile cortex")?1.15:1)*(gene("mineral scaffold")?1.3:1),
 defense:(1+(derivedAxis("resilience")-1)*.07)*(gene("stress response")?1.15:1)*(gene("armoured cortex")?1.3:1),
 waterUse:(gene("selective membrane")?.82:1)*(1-Math.min(.35,(derivedAxis("resilience")-1)*.025)),
 detection:130*(1+(derivedAxis("cognition")-1)*.08)*(gene("chemical sensing")?1.25:1)*(gene("electroreception")?1.55:1),
 foodYield:(gene("feeding groove")?1.2:1)*(gene("pseudopods")?1.12:1),
 interactionRange:90*(gene("surface exchange")?1.2:1)*(1+(derivedAxis("communication")-1)*.04),
 plasticity:1+(derivedAxis("adaptability")-1)*.06
 };
}
function fit(){
 const b=BIOMES[state.biome],p=phenotype();let f=55;
 if(b.moisture<20)f+=gene("selective membrane")?18:-22;
 if(b.temp>45||b.temp<0)f+=gene("thermal engine")?30:gene("stress response")?10:-20;
 if(b.hazard>60)f+=gene("detoxification")?22:gene("stress response")?8:-18;
 if(gene("phenotypic plasticity"))f+=(50-f)*.25;
 if(gene("adaptive radiation"))f+=(75-f)*.35;
 return clamp(f);
}
function cameraScale(){return clamp(1/Math.pow(state.mass,.2),.32,1.15)}
function radius(m=state.mass){return 10+Math.log2(m+1)*5}

function terrainType(gx,gy){
 let n=(Math.imul(gx,73856093)^Math.imul(gy,19349663)^Math.imul(state.biome+1,83492791))>>>0;
 n=(n^(n>>>13))*1274126177>>>0;return n%10;
}
function isWaterAt(x,y){return terrainType(Math.floor(x/95),Math.floor(y/95))<2}
function localTile(x=state.x,y=state.y){
 const gx=Math.floor(x/95),gy=Math.floor(y/95),n=terrainType(gx,gy),b=BIOMES[state.biome];
 if(n<2){
   const mineral=state.biome===3?"acidic":state.biome===5?"mineral-rich":state.biome===4?"near-freezing":"fresh";
   return{key:`${state.biome}:${gx}:${gy}:water`,name:`${mineral.toUpperCase()} WATER`,water:true,
    effect:state.biome===3?"Hydrates slowly but causes chemical stress":state.biome===5?"Hydrates and adds mineral pressure":state.biome===4?"Hydrates but imposes cold stress":"Passive hydration active"};
 }
 if(n===4)return{key:`${state.biome}:${gx}:${gy}:shelter`,name:"SHELTERED SUBSTRATE",water:false,effect:"Rest and repair are more effective here",shelter:true};
 if(n===7)return{key:`${state.biome}:${gx}:${gy}:rough`,name:"ROUGH SUBSTRATE",water:false,effect:"Movement costs more; locomotor pressure increases",rough:true};
 return{key:`${state.biome}:${gx}:${gy}:ground`,name:b.moisture>70?"MOIST SUBSTRATE":"DRY SUBSTRATE",water:false,effect:b.moisture>70?"Low water loss":"Accelerated water loss"};
}
function renderTile(){
 const t=localTile();$("tileName").textContent=t.name;$("tileEffect").textContent=t.effect;
 if(t.key!==state.lastTileKey){state.lastTileKey=t.key;renderEcology()}
}
function weightedFood(){
 const weights={sugar:3,lipid:3,amino:4,mineral:4,pigment:3,spore:2};
 if(state.biome===1)weights.spore=10;if(state.biome===2)weights.pigment=8;if(state.biome===5)weights.mineral=12;
 const table=Object.entries(weights),sum=table.reduce((s,x)=>s+x[1],0);let r=Math.random()*sum;
 for(const [k,w] of table){r-=w;if(r<=0)return k}return "sugar";
}
function spawnFood(n=1){for(let i=0;i<n;i++)state.resources.push({x:rand(30,WORLD-30),y:rand(30,WORLD-30),type:weightedFood(),phase:rand(0,6.28)})}
function makeOrganism(){
 const mass=rand(.35,Math.max(2.2,state.mass*1.8));
 return{id:Math.random().toString(36).slice(2),x:rand(30,WORLD-30),y:rand(30,WORLD-30),vx:0,vy:0,mass,energy:rand(45,95),health:rand(60,100),hunger:rand(5,70),fear:rand(.1,.9),curiosity:rand(.1,.9),aggression:rand(.08,.72),state:"wander",target:null,stateTimer:0,phase:rand(0,6.28),color:choice(["#7de0ff","#8cff9c","#ffd66a","#ff7777","#dba0ff"])};
}
function populate(){state.organisms=[];for(let i=0;i<18;i++)state.organisms.push(makeOrganism())}
function nearestResource(x,y){let best=null,d=Infinity;for(const r of state.resources){const q=Math.hypot(r.x-x,r.y-y);if(q<d){d=q;best=r}}return best?{o:best,d}:null}
function nearestOrganism(o,filter){let best=null,d=Infinity;for(const q of state.organisms){if(q===o||!filter(q))continue;const z=Math.hypot(q.x-o.x,q.y-o.y);if(z<d){d=z;best=q}}return best?{o:best,d}:null}

function chooseIntent(o){
 const pd=Math.hypot(state.x-o.x,state.y-o.y),injuryRisk=(state.mass/o.mass)*(state.health/100),reward=state.mass/(state.mass+o.mass),hungry=o.hunger>55;
 const prey=nearestOrganism(o,q=>q.mass<o.mass*.65&&q.health>0),threat=nearestOrganism(o,q=>q.mass>o.mass*1.6);
 if(threat&&threat.d<150){o.state="fleeOther";o.target=threat.o.id;o.stateTimer=220;return}
 if(pd<170&&injuryRisk>1.15-o.fear*.2){o.state="fleePlayer";o.stateTimer=220;return}
 if(hungry&&prey&&prey.d<300){o.state="huntOther";o.target=prey.o.id;o.stateTimer=250;return}
 if(hungry&&pd<250&&reward*.8+o.aggression*.35+o.hunger/140-injuryRisk*.55>.48){o.state="huntPlayer";o.stateTimer=220;return}
 if(pd<180&&o.curiosity>.62){o.state="inspectPlayer";o.stateTimer=190;return}
 if(o.energy<18||o.health<28){o.state="rest";o.target=null;o.stateTimer=rand(180,320);return}
 const food=nearestResource(o.x,o.y);
 if(o.hunger>35&&food&&food.d<260){o.state="forage";o.target=state.resources.indexOf(food.o);o.stateTimer=260;return}
 o.state="wander";o.target=null;o.stateTimer=rand(180,420);
}
function updateOrganism(o){
 o.stateTimer--;o.phase+=.025;if(state.tick%120===0){o.hunger=clamp(o.hunger+1.5);o.energy=clamp(o.energy-.7)}
 if(o.stateTimer<=0)chooseIntent(o);
 let tx=0,ty=0,pdx=state.x-o.x,pdy=state.y-o.y,pd=Math.hypot(pdx,pdy)||1;
 if(o.state==="huntPlayer"||o.state==="inspectPlayer"){tx=pdx/pd;ty=pdy/pd}
 else if(o.state==="fleePlayer"){tx=-pdx/pd;ty=-pdy/pd}
 else if(o.state==="wander"){tx=Math.sin(o.phase*.8);ty=Math.cos(o.phase*.57)}
 else if(o.state==="rest"){tx=0;ty=0;o.energy=clamp(o.energy+.025);o.health=clamp(o.health+.012)}
 else if(o.state==="forage"){const r=state.resources[o.target];if(r){const d=Math.hypot(r.x-o.x,r.y-o.y)||1;tx=(r.x-o.x)/d;ty=(r.y-o.y)/d}else o.stateTimer=0}
 else{const q=state.organisms.find(x=>x.id===o.target);if(q){const d=Math.hypot(q.x-o.x,q.y-o.y)||1,s=o.state==="fleeOther"?-1:1;tx=(q.x-o.x)/d*s;ty=(q.y-o.y)/d*s}else o.stateTimer=0}
 const speed=Math.pow(o.mass,-.14);o.vx=(o.vx+tx*.05*speed)*.92;o.vy=(o.vy+ty*.05*speed)*.92;o.x=clamp(o.x+o.vx,20,WORLD-20);o.y=clamp(o.y+o.vy,20,WORLD-20);
 if(o.state==="forage"){
   const r=state.resources[o.target];
   if(r&&Math.hypot(r.x-o.x,r.y-o.y)<radius(o.mass)+8){
     o.energy=clamp(o.energy+FOOD[r.type].energy);o.hunger=clamp(o.hunger-28);
     state.resources.splice(o.target,1);o.target=null;o.stateTimer=0;
   }
 }
 if(o.state==="huntPlayer"&&pd<radius(o.mass)+radius()+5){damage(4+o.mass/state.mass*4);addPressure("resilience",1);addPressure("mobility",.5);o.state="fleePlayer";o.stateTimer=240}
 if(o.state==="huntOther"){
   const q=state.organisms.find(x=>x.id===o.target);
   if(q&&Math.hypot(q.x-o.x,q.y-o.y)<radius(o.mass)+radius(q.mass)*.6){
     q.health-=12+o.mass/q.mass*4;o.energy=clamp(o.energy+7);o.hunger=clamp(o.hunger-18);o.stateTimer=0;
     if(q.health<=0)state.organisms=state.organisms.filter(x=>x!==q);
   }
 }
}
function damage(n){n/=phenotype().defense;state.health=clamp(state.health-n);toast("ECOLOGICAL INJURY");if(state.health<=0){state.health=35;state.energy=25;state.water=30;state.mass=Math.max(.7,state.mass*.6);state.x=WORLD/2;state.y=WORLD/2;log("The lineage persisted through a reduced surviving propagule.")}}

function rememberDiet(type,amount=1){
 state.dietMemory[type]=clamp((state.dietMemory[type]||0)+amount,0,30);
 state.dietHistory.push(type);state.dietHistory=state.dietHistory.slice(-12);
 // old imprints slowly fade, but feeding choices remain meaningful
 for(const k of Object.keys(state.dietMemory))if(k!==type)state.dietMemory[k]=Math.max(0,state.dietMemory[k]-.08);
}
function recipeStrength(recipe,source=state.dietMemory){
 return Math.min(...Object.entries(recipe.needs).map(([k,n])=>(source[k]||0)/n));
}
function activeRecipes(source=state.dietMemory){return DIET_RECIPES.filter(r=>recipeStrength(r,source)>=1)}
function dietAxisBonus(axis,source=state.dietMemory){
 let v=0;
 for(const [type,n] of Object.entries(source))if(FOOD[type].axis===axis)v+=n*1.35;
 for(const r of activeRecipes(source))v+=(r.axes[axis]||0);
 return v
}
function collect(){
 for(let i=state.resources.length-1;i>=0;i--){
  const r=state.resources[i];
  if(Math.hypot(r.x-state.x,r.y-state.y)<radius()+10){
   const e=FOOD[r.type].energy*phenotype().foodYield;
   if(state.energy<58){state.energy=clamp(state.energy+e);log(`${FOOD[r.type].name} metabolised (+${Math.round(e)} energy).`)}
   else{state.inventory[r.type]++;log(`${FOOD[r.type].name} stored for future development.`)}
   rememberDiet(r.type,.55);addPressure(FOOD[r.type].axis,.5);addXP(gene("pseudopods")?6:5,`Resource acquired: ${FOOD[r.type].name}`);state.resources.splice(i,1);save();
  }
 }
}
function consumeResource(type){
 if(!state.inventory[type])return;
 state.inventory[type]--;state.energy=clamp(state.energy+FOOD[type].energy*phenotype().foodYield);rememberDiet(type,1.5);addPressure(FOOD[type].axis,1.1);log(`${FOOD[type].name} consumed from backpack.`);renderAll();save()
}
function spendAdapt(axis){
 if(state.adaptPoints<=0)return;state.adaptPoints--;state.axes[axis]++;atlasDirty=true;log(`${AXES[axis].name} permanently increased.`);renderAll();save()
}
function movementTarget(x,y){state.target={x,y};state.mode="move";renderMode()}
function forageToggle(){state.mode=state.mode==="forage"?"observe":"forage";state.target=null;renderAll()}
function restToggle(){state.mode=state.mode==="rest"?"observe":"rest";state.target=null;renderAll();if(state.mode==="rest")addPressure("resilience",.2)}
function d20(){return Math.floor(Math.random()*20)+1}
function encounterModifier(axis){return Math.floor((derivedAxis(axis)-1)/2)}
function relationScore(o){
 return (derivedAxis("communication")*1.4+derivedAxis("cognition")*.9+state.health/25)
       -(o.aggression*7+o.hunger/18)+(gene("quorum signal")?3:0)+(gene("cooperative exchange")?4:0);
}
function showEncounter(title,odds,playerRoll,otherRoll,text,playerGood=true){
 state.encounter={title,odds,playerRoll,otherRoll,text};
 $("encounterTitle").textContent=title;$("encounterOdds").textContent=odds;
 $("encounterRolls").innerHTML=`<div class="roll-card ${playerGood?"good":"bad"}"><span>YOUR RESPONSE</span><b>${playerRoll}</b></div><div class="roll-card ${playerGood?"bad":"good"}"><span>OTHER ORGANISM</span><b>${otherRoll}</b></div>`;
 $("encounterText").textContent=text;$("encounterPanel").hidden=false;
}
function closeEncounter(){$("encounterPanel").hidden=true;state.encounter=null;save()}
function fleeFrom(o){
 const d=Math.hypot(state.x-o.x,state.y-o.y)||1;
 movementTarget(clamp(state.x+(state.x-o.x)/d*220,20,WORLD-20),clamp(state.y+(state.y-o.y)/d*220,20,WORLD-20));
 state.mode="move";addPressure("mobility",1.5);
}
function interact(){
 if(state.encounter)return;
 const near=[...state.organisms].sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
 const range=phenotype().interactionRange;
 if(!near||Math.hypot(near.x-state.x,near.y-state.y)>range){toast("NO ORGANISM IN RANGE");return}
 const hostileIntent=(gene("predatory strike")||gene("toxin organelle"))&&near.mass<state.mass*1.2&&state.energy<82;
 const pRoll=d20()+(hostileIntent?encounterModifier("power"):encounterModifier("communication"))+(gene("chemical sensing")?2:0);
 const oRoll=d20()+Math.floor(near.aggression*5)+Math.floor(near.mass/state.mass*2);
 if(hostileIntent){
   if(pRoll>=oRoll){
     const hit=Math.round(8*phenotype().force*(gene("toxin organelle")?1.35:1));near.health-=hit;state.energy=clamp(state.energy-4);
     addPressure("power",1.8);addPressure("innovation",gene("toxin organelle")?1:.15);
     if(near.health<=0){state.organisms=state.organisms.filter(o=>o!==near);state.energy=clamp(state.energy+16);addXP(14,"Predation changed the lineage");showEncounter("PREDATORY SUCCESS","advantage",pRoll,oRoll,`Your attack overwhelmed the smaller organism for ${hit} damage. It was consumed, restoring energy.`)}
     else{near.state="fleePlayer";near.stateTimer=300;showEncounter("SUCCESSFUL STRIKE","advantage",pRoll,oRoll,`Your attack inflicted ${hit} damage. The organism released an alarm chemical and fled.`)}
   }else{
     const harm=Math.round((5+near.mass/state.mass*4)/phenotype().defense);state.health=clamp(state.health-harm);addPressure("resilience",1.8);fleeFrom(near);
     showEncounter("COUNTERATTACK","danger",pRoll,oRoll,`The organism anticipated your attack and released a damaging chemical response. You lost ${harm} health and fled.`,false)
   }
 }else{
   const socialTarget=Math.round(relationScore(near));
   if(pRoll+socialTarget>=oRoll+7){
     const gain=gene("cooperative exchange")?12:5;state.energy=clamp(state.energy+gain);addPressure("communication",2.4);addPressure("cognition",.8);addXP(10,"A cooperative chemical exchange shaped the lineage");
     near.state="inspectPlayer";near.stateTimer=260;showEncounter("COOPERATIVE EXCHANGE","favourable",pRoll+socialTarget,oRoll,`Signals were interpreted successfully. Metabolites were exchanged, restoring ${gain} energy and strengthening communication pressure.`)
   }else if(pRoll+socialTarget>=oRoll){
     addPressure("communication",1);addPressure("cognition",1);addXP(5,"A neutral encounter was interpreted");
     near.state="wander";near.stateTimer=220;showEncounter("CAUTIOUS CONTACT","balanced",pRoll+socialTarget,oRoll,"Both organisms exchanged information but neither committed resources or attacked.")
   }else{
     const chemical=near.aggression>.45||near.hunger>60;
     if(chemical){
       const harm=Math.max(2,Math.round((4+near.aggression*8)/phenotype().defense));state.health=clamp(state.health-harm);addPressure("resilience",1.5);addPressure("cognition",.6);fleeFrom(near);
       showEncounter("CHEMICAL REJECTION","danger",pRoll+socialTarget,oRoll,`Your signal was misread or rejected. A defensive secretion caused ${harm} damage and your organism fled.`,false)
     }else{
       near.state="fleePlayer";near.stateTimer=260;addPressure("communication",.7);
       showEncounter("CONTACT FAILED","uncertain",pRoll+socialTarget,oRoll,"The other organism interpreted the contact as risky and escaped before exchange could occur.",false)
     }
   }
 }
 renderAll();save()
}
function forageAI(){
 const threat=state.organisms.find(o=>o.mass>state.mass*1.2&&Math.hypot(o.x-state.x,o.y-state.y)<220);
 if(threat){const d=Math.hypot(state.x-threat.x,state.y-threat.y)||1;movementTarget(state.x+(state.x-threat.x)/d*180,state.y+(state.y-threat.y)/d*180);state.mode="forage";addPressure("mobility",.15);return}
 const r=nearestResource(state.x,state.y);if(r){movementTarget(r.o.x,r.o.y);state.mode="forage";addPressure("cognition",.05)}
}
function ecologyTick(){
 const b=BIOMES[state.biome],p=phenotype(),tile=localTile(),beforeWater=state.water;
 const roughCost=tile.rough?1.22:1;
 if(state.mode==="rest"){
   const shelter=tile.shelter?1.5:1;
   state.energy=clamp(state.energy+3.8*shelter);state.health=clamp(state.health+(gene("repair cycle")?4.8:2.8)*shelter);state.water=clamp(state.water-.1*p.waterUse)
 }else{
   state.energy=clamp(state.energy-(1.6+Math.log2(state.mass+1)*.22)*roughCost);
   state.water=clamp(state.water-(b.moisture<20?4.5:1.6)*p.waterUse)
 }
 if(tile.water){
   let uptake=gene("selective membrane")?5.5:7.5;
   if(state.biome===3)uptake=3.2;if(state.biome===4)uptake=4.5;
   state.water=clamp(state.water+uptake);addPressure("adaptability",.18);
   if(state.biome===5)addPressure("resilience",.22);
   if(state.biome===3){damage(.7);addPressure("resilience",.25)}
   const gained=Math.round((state.water-beforeWater)*10)/10;
   if(gained>0)toast(`DRINKING +${gained} WATER`);
 }
 if(tile.rough)addPressure("mobility",.2);
 if(gene("photosymbiosis")&&b.light>55)state.energy=clamp(state.energy+2.4);
 if(gene("thermal engine")&&(b.temp>45||b.temp<0))state.energy=clamp(state.energy+2.8);
 const lowFit=Math.max(0,35-fit());if(lowFit>0)damage(lowFit*.05*(gene("detoxification")?.6:1));
 if(state.energy<5||state.water<5)damage(3.5);
 Object.entries(b.pressure).forEach(([k,v])=>addPressure(k,v*.04));
 state.cycle++;
}

function nodeAvailable(node){
 return !gene(node.id)&&node.req.every(gene)&&Object.entries(node.min||{}).every(([a,v])=>derivedAxis(a)>=v)
}
function epochNumber(){return state.completedEpochs+1}
function simulationPaused(){
 return $("start").classList.contains("visible")||$("originModal").classList.contains("visible")||$("epochModal").classList.contains("visible")
}
function openEpoch(){
 if(state.pendingEpochs<=0||!state.origin||$("epochModal").classList.contains("visible"))return;
 state.epochFeed={};
 const n=epochNumber(),roman=["I","II","III","IV","V","VI","VII","VIII","IX","X"][n-1]||n;
 $("epochTitle").textContent=`EPOCH ${roman}`;
 $("epochLevelLabel").textContent=`MILESTONE ${n*5}`;
 $("epochFeedStage").hidden=false;$("epochForecastStage").hidden=true;
 $("epochModal").classList.add("visible");renderEpochInventory();save()
}
function feedTotal(){return Object.values(state.epochFeed).reduce((a,b)=>a+b,0)}
function toggleEpochFeed(type){
 const current=state.epochFeed[type]||0;
 if(current>=state.inventory[type]||feedTotal()>=6){
   if(current>0)state.epochFeed[type]=0;
 }else{
   state.epochFeed[type]=current+1;
 }
 renderEpochInventory()
}
function renderEpochInventory(){
 $("epochInventory").innerHTML=Object.entries(FOOD).map(([k,f])=>`<button class="inventory-item" data-feed="${k}" ${state.inventory[k]<=0?"disabled":""}><em>x${state.inventory[k]} · feed ${state.epochFeed[k]||0}</em><b style="color:${f.color}">◆</b><span>${f.name.toUpperCase()}</span><small>tap repeatedly · ${AXES[f.axis].name}</small></button>`).join("");
 document.querySelectorAll("[data-feed]").forEach(b=>b.onclick=()=>toggleEpochFeed(b.dataset.feed));$("feedCount").textContent=`${feedTotal()} / 6`
}
function scoreNode(node){
 let s=derivedAxis(node.axis)*2+(state.pressures[node.axis]||0)*.45+(BIOMES[state.biome].pressure[node.axis]||0)*4+dietAxisBonus(node.axis)*.9;
 for(const [type,n] of Object.entries(state.epochFeed))if(FOOD[type].axis===node.axis)s+=n*10;
 s+=node.req.filter(gene).length*4;s-=node.tier*3;
 return s
}
function fallbackEvolution(){
 const axis=Object.keys(AXES).sort((a,b)=>{
   const av=(state.pressures[a]||0)+(BIOMES[state.biome].pressure[a]||0)*5;
   const bv=(state.pressures[b]||0)+(BIOMES[state.biome].pressure[b]||0)*5;
   return bv-av;
 })[0];
 return{id:`fallback:${axis}`,name:`${AXES[axis].name} Consolidation`,axis,tier:1,icon:AXES[axis].icon,req:[],min:{},desc:`The lineage consolidates accumulated ${AXES[axis].name.toLowerCase()} pressure when no new anatomical prerequisite is yet accessible.`,effect:`+1 ${AXES[axis].name}; prerequisite recovery`}
}
function buildForecast(){
 const eligible=ATLAS.filter(nodeAvailable).map(n=>({node:n,score:scoreNode(n)+Math.random()*7}));
 eligible.sort((a,b)=>b.score-a.score);
 const count=gene("developmental reserve")?4:3;
 state.epochForecast=eligible.slice(0,count).map(x=>x.node);
 if(!state.epochForecast.length)state.epochForecast=[fallbackEvolution()];
 renderForecast();save()
}
function renderForecast(){
 $("epochFeedStage").hidden=true;$("epochForecastStage").hidden=false;
 const combined={};Object.keys(AXES).forEach(a=>combined[a]=(state.pressures[a]||0)+(BIOMES[state.biome].pressure[a]||0)*5);
 Object.entries(state.epochFeed).forEach(([t,n])=>combined[FOOD[t].axis]+=n*12);
 Object.keys(AXES).forEach(a=>combined[a]+=dietAxisBonus(a));
 const ranked=Object.entries(combined).sort((a,b)=>b[1]-a[1]);
 $("pressureSummary").innerHTML=ranked.slice(0,4).map(([a,v])=>`<div class="pressure-chip">${AXES[a].name}<b>${Math.round(v)}</b></div>`).join("");
 $("epochAtlasHint").innerHTML=`<b>Illuminated Atlas regions:</b> ${ranked.slice(0,3).map(([a])=>AXES[a].name).join(" · ")}. These pressures bias the accessible nodes shown below; locked prerequisites are never bypassed.`;
 $("forecastChoices").innerHTML=state.epochForecast.map(n=>`<button class="forecast-choice" data-choose="${n.id}"><b>${n.icon} ${n.name}</b><span>${n.desc}</span><small>${n.effect} · ${AXES[n.axis].name} · tier ${n.tier}</small></button>`).join("");
 document.querySelectorAll("[data-choose]").forEach(b=>b.onclick=()=>completeEpoch(b.dataset.choose))
}
function completeEpoch(id){
 const node=state.epochForecast.find(n=>n.id===id);
 if(!node)return;
 if(!id.startsWith("fallback:")&&!nodeAvailable(node)){toast("EVOLUTION NO LONGER ACCESSIBLE");buildForecast();return}
 Object.entries(state.epochFeed).forEach(([t,n])=>state.inventory[t]=Math.max(0,state.inventory[t]-n));
 if(id.startsWith("fallback:")){
   state.axes[node.axis]++;state.bodyPlan=node.name;atlasDirty=true;
 }else{
   state.genes.push(node.id);state.axes[node.axis]+=.5;state.bodyPlan=node.name;atlasDirty=true;
 }
 state.generation++;state.mass*=1.08+node.tier*.025;state.completedEpochs++;state.pendingEpochs=Math.max(0,state.pendingEpochs-1);
 state.epochFeed={};state.epochForecast=[];
 Object.keys(state.pressures).forEach(k=>state.pressures[k]*=.28);
 Object.keys(state.dietMemory).forEach(k=>state.dietMemory[k]*=.42);
 log(`Major evolution fixed: ${node.name}. ${node.effect}.`);toast(node.name.toUpperCase());
 $("epochModal").classList.remove("visible");renderAll();save();
 if(state.pendingEpochs>0)setTimeout(openEpoch,350)
}
function migrate(){
 if(state.energy<10){toast("NOT ENOUGH ENERGY");return}
 state.energy-=10;state.biome=(state.biome+1)%BIOMES.length;state.x=WORLD/2;state.y=WORLD/2;state.target=null;state.resources=[];spawnFood(58);populate();
 Object.entries(BIOMES[state.biome].pressure).forEach(([a,v])=>addPressure(a,v*2));
 addXP(15,`Migration into ${BIOMES[state.biome].name}`);renderAll();save()
}
function chooseOrigin(id){
 const o=ORIGINS.find(x=>x.id===id);state.origin=id;state.bodyPlan=o.name;Object.entries(o.axes).forEach(([a,v])=>state.axes[a]+=v);state.genes=[o.gene];atlasFocusCurrent();atlasDirty=true;
 $("originModal").classList.remove("visible");log(`Lineage founded as ${o.name}.`);renderAll();save()
}

function update(){
 if(simulationPaused()||state.encounter)return;
 state.tick++;
 if(state.tick%20===0)renderTile();
 if(state.mode==="forage"&&state.tick%180===0)forageAI();
 if(state.target&&state.mode!=="rest"){const dx=state.target.x-state.x,dy=state.target.y-state.y,d=Math.hypot(dx,dy)||1,sp=1.45*phenotype().speed;if(d<8){state.target=null;if(state.mode==="move")state.mode="observe"}else{state.vx+=(dx/d)*.09*sp;state.vy+=(dy/d)*.09*sp;addPressure("mobility",.001)}}
 state.vx*=.9;state.vy*=.9;if(state.mode!=="rest"){state.x=clamp(state.x+state.vx,20,WORLD-20);state.y=clamp(state.y+state.vy,20,WORLD-20)}
 collect();state.organisms.forEach(updateOrganism);
 if(state.resources.length<50&&state.tick%60===0)spawnFood(3);
 if(state.organisms.length<18&&state.tick%180===0)state.organisms.push(makeOrganism());
 if(state.tick%300===0){ecologyTick();renderAll();save()}
}

function sx(x){return canvas.width/2+(x-state.x)*cameraScale()}
function sy(y){return canvas.height/2+(y-state.y)*cameraScale()}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawWorld(){
 const b=BIOMES[state.biome],z=cameraScale(),tile=95,halfW=canvas.width/(2*z),halfH=canvas.height/(2*z);
 px(0,0,canvas.width,canvas.height,b.sky);
 for(let gy=Math.floor((state.y-halfH)/tile)-1;gy<=Math.ceil((state.y+halfH)/tile)+1;gy++)for(let gx=Math.floor((state.x-halfW)/tile)-1;gx<=Math.ceil((state.x+halfW)/tile)+1;gx++){
  const wx=gx*tile,wy=gy*tile,n=terrainType(gx,gy),x=sx(wx),y=sy(wy),size=tile*z+1;px(x,y,size,size,n<2?b.water:b.ground);
  if(n===4)px(x+size*.2,y+size*.6,Math.max(2,size*.12),Math.max(2,size*.08),"rgba(255,255,255,.16)");
  if(n===7)px(x+size*.7,y+size*.25,Math.max(2,size*.08),Math.max(2,size*.18),"rgba(0,0,0,.18)")
 }
}
function visible(x,y,p=40){const a=sx(x),b=sy(y);return a>-p&&a<canvas.width+p&&b>-p&&b<canvas.height+p}
function drawFood(){for(const r of state.resources){if(!visible(r.x,r.y))continue;r.phase+=.04;const x=sx(r.x),y=sy(r.y)+Math.sin(r.phase)*2,s=Math.max(3,7*cameraScale());px(x-s/2,y-s/2,s,s,FOOD[r.type].color);px(x-s*.2,y-s*.8,s*.4,s*.3,"#fff")}}
function drawOrganism(o){if(!visible(o.x,o.y,60))return;const x=sx(o.x),y=sy(o.y),r=Math.max(5,radius(o.mass)*cameraScale()*.72);px(x-r,y-r*.62,r*2,r*1.24,o.color);px(x-r*.65,y-r,r*1.3,r*2,o.color);px(x-r*.32,y-r*.3,r*.64,r*.6,"#15382d");px(x+r*.2,y-r*.25,r*.25,r*.25,"#fff")}
function drawPlayer(){
 const x=canvas.width/2,y=canvas.height/2,r=Math.max(10,radius()*Math.pow(cameraScale(),.2)),main=ORIGINS.find(o=>o.id===state.origin)?.color||"#8cff9c",dark="#14382a",light="#e8ffda";
 px(x-r,y-r*.65,r*2,r*1.3,main);px(x-r*.68,y-r,r*1.36,r*2,main);px(x-r*.42,y-r*.38,r*.84,r*.76,dark);px(x+r*.24,y-r*.3,r*.34,r*.34,light);px(x+r*.4,y-r*.18,r*.1,r*.1,"#06100c");
 if(gene("chemical sensing")){px(x-r*1.3,y-r*.1,r*.5,r*.18,light);px(x-r*1.55,y-r*.05,r*.3,r*.1,light)}
 if(gene("cilia"))for(let i=-3;i<=3;i++)px(x+i*r*.28,y+r*.65+(i%2)*2,r*.08,r*.5,light);
 if(gene("pseudopods")){px(x-r*1.35,y+r*.15,r*.7,r*.2,light);px(x+r*.7,y+r*.28,r*.65,r*.2,light)}
 if(gene("armoured cortex")){px(x-r,y-r*.95,r*2,r*.22,light);px(x-r*1.1,y-r*.7,r*.2,r*1.4,light);px(x+r*.9,y-r*.7,r*.2,r*1.4,light)}
 if(gene("segmented body"))for(let i=-2;i<=2;i++)px(x+i*r*.42-r*.1,y+r*.67,r*.2,r*.38,main);
 if(gene("electroreception")){ctx.strokeStyle="#7de0ff";ctx.beginPath();ctx.arc(x,y,r*1.6,0,Math.PI*2);ctx.stroke()}
 if(gene("photosymbiosis")){px(x-r*.4,y-r*.5,r*.25,r*.25,"#ffd66a");px(x+r*.1,y+r*.2,r*.25,r*.25,"#ffd66a")}
 if(gene("toxin organelle"))px(x+r*.72,y+r*.18,r*.4,r*.28,"#dba0ff");
 if(state.target){const tx=sx(state.target.x),ty=sy(state.target.y);ctx.strokeStyle="rgba(255,255,255,.75)";ctx.beginPath();ctx.arc(tx,ty,9,0,Math.PI*2);ctx.stroke()}
}
function draw(){drawWorld();drawFood();state.organisms.forEach(drawOrganism);drawPlayer()}

function bar(id,v,c){const e=$(id);e.style.width=clamp(v)+"%";e.style.background=v<24?"var(--red)":c}
function renderMode(){$("stateLabel").textContent=isWaterAt(state.x,state.y)?"HYDRATING":state.mode.toUpperCase();$("forageBtn").classList.toggle("active",state.mode==="forage");$("restBtn").classList.toggle("active",state.mode==="rest")}
function renderMeters(){
 $("energyText").textContent=Math.round(state.energy);$("waterText").textContent=Math.round(state.water);$("healthText").textContent=Math.round(state.health);$("levelText").textContent=state.level;
 bar("energyBar",state.energy,"var(--green)");bar("waterBar",state.water,"var(--blue)");bar("healthBar",state.health,"var(--green)");bar("xpBar",state.xp/xpNeeded()*100,"var(--purple)")
}
function renderLineage(){
 atlasDirty=true;const o=ORIGINS.find(x=>x.id===state.origin);
 $("originLabel").textContent=o?.name||"UNFORMED ANCESTOR";$("bodyPlanLabel").textContent=state.bodyPlan.toUpperCase();
 $("lineageMeta").textContent=`Generation ${state.generation} · Epoch ${state.completedEpochs}`;
 $("lineageLevel").textContent=state.level;$("xpText").textContent=`${Math.floor(state.xp)} / ${xpNeeded()}`;
 bar("lineageXpBar",state.xp/xpNeeded()*100,"var(--purple)");
 $("epochHint").textContent=state.pendingEpochs>0?`${state.pendingEpochs} major evolution${state.pendingEpochs>1?"s":""} ready`:`Next major evolution at level ${Math.ceil((state.level+1)/5)*5}`;
 $("adaptPointLabel").textContent=`${state.adaptPoints} AP`;
 $("attributeStrip").innerHTML=Object.entries(AXES).map(([k,a])=>`<div class="attribute-mini" title="${a.desc}"><button data-axis="${k}" ${state.adaptPoints?"":"disabled"}>+</button><span>${a.icon}</span><b>${a.name}</b><strong>${derivedAxis(k)}</strong></div>`).join("");
 document.querySelectorAll("[data-axis]").forEach(b=>b.onclick=()=>spendAdapt(b.dataset.axis));
 const p=phenotype();$("phenotypeCards").innerHTML=[["Locomotion",`${p.speed.toFixed(2)}× movement performance`],["Mechanical force",`${p.force.toFixed(2)}× feeding and attack force`],["Stress defence",`${p.defense.toFixed(2)}× injury buffering`],["Ecological fit",`${Math.round(fit())}% in ${BIOMES[state.biome].name}`]].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("");
 $("pressureBars").innerHTML=Object.entries(state.pressures).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pressure-row"><span>${AXES[k].name}<b>${Math.round(v)}</b></span><i><em style="width:${clamp(v)}%"></em></i></div>`).join("");
 $("atlasSummary").textContent=`${state.genes.length} fixed innovations · ${ATLAS.filter(nodeAvailable).length} accessible · biome pressure is illuminating nearby branches`;
}function renderInventory(){
 const recent=state.dietHistory.slice(-6).map(t=>FOOD[t].name).join(" → ")||"No recent feeding";
 const strongest=Object.entries(state.dietMemory).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${FOOD[k].name} ${v.toFixed(1)}`).join(" · ");
 $("dietReadout").innerHTML=`<b>NUTRITIONAL MEMORY</b><br>${recent}<br>Dominant imprints: ${strongest||"none yet"}`;
 $("inventoryGrid").innerHTML=Object.entries(FOOD).map(([k,f])=>`<button class="inventory-item" data-resource="${k}" ${state.inventory[k]?"":"disabled"}><em>x${state.inventory[k]}</em><b style="color:${f.color}">◆</b><span>${f.name.toUpperCase()}</span><small>energy +${Math.round(f.energy*phenotype().foodYield)}<br><span class="imprint">${f.imprint}</span></small></button>`).join("");
 document.querySelectorAll("[data-resource]").forEach(b=>b.onclick=()=>consumeResource(b.dataset.resource));
 $("recipeCards").innerHTML=DIET_RECIPES.map(r=>{const strength=recipeStrength(r),active=strength>=1;return`<div class="recipe-card ${active?"active":""}"><b>${active?"◆":"◇"} ${r.name}</b>${r.desc}<br><small>${Object.entries(r.needs).map(([k,n])=>`${n} ${FOOD[k].name}`).join(" + ")} · ${active?"ACTIVE IMPRINT":Math.round(strength*100)+"% formed"}</small></div>`}).join("")
}
function renderEcology(){
 const tile=localTile(),p=phenotype();
 const hydration=tile.water?(state.biome===3?3.2:state.biome===4?4.5:gene("selective membrane")?5.5:7.5):0;
 $("ecologyCards").innerHTML=[
  ["Biome",BIOMES[state.biome].name],
  ["Exact tile",`${tile.name}<br>${tile.effect}`],
  ["Water exchange",tile.water?`Approximately +${hydration} hydration each physiology cycle before normal water use`:"No environmental uptake on this tile"],
  ["Nearby organisms",`${state.organisms.filter(o=>Math.hypot(o.x-state.x,o.y-state.y)<300).length} detected locally`],
  ["Niche fit",`${Math.round(fit())}% compatibility`]
 ].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("")
}
function renderLog(){$("logList").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("")}
function renderAll(){renderTile();$("cycleLabel").textContent=`CYCLE ${state.cycle}`;$("biomeLabel").textContent=BIOMES[state.biome].name;renderMode();renderMeters();renderLineage();renderInventory();renderEcology();renderLog()}

function inspectAt(wx,wy){let best=null,d=Infinity;for(const o of state.organisms){const q=Math.hypot(o.x-wx,o.y-wy);if(q<d){d=q;best=o}}const box=$("inspect");if(best&&d<70/cameraScale()){box.hidden=false;box.innerHTML=`<b style="color:${best.color}">ORGANISM</b><br>mass ${best.mass.toFixed(1)}<br>health ${Math.round(best.health)}<br>state ${best.state}`;clearTimeout(inspectAt.t);inspectAt.t=setTimeout(()=>box.hidden=true,3500)}}
function worldPoint(ev){const rect=canvas.getBoundingClientRect(),cx=(ev.clientX-rect.left)*(canvas.width/rect.width),cy=(ev.clientY-rect.top)*(canvas.height/rect.height);return{x:clamp(state.x+(cx-canvas.width/2)/cameraScale(),0,WORLD),y:clamp(state.y+(cy-canvas.height/2)/cameraScale(),0,WORLD)}}
let activePointer=null,longTimer=null,startPoint=null,moved=false;
function pointerStart(e){e.preventDefault();activePointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);startPoint={x:e.clientX,y:e.clientY};moved=false;const p=worldPoint(e);movementTarget(p.x,p.y);longTimer=setTimeout(()=>{if(!moved)inspectAt(p.x,p.y)},560)}
function pointerMove(e){if(activePointer!==e.pointerId)return;e.preventDefault();if(startPoint&&Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y)>9)moved=true;const p=worldPoint(e);movementTarget(p.x,p.y)}
function pointerEnd(e){if(activePointer!==e.pointerId)return;e.preventDefault();clearTimeout(longTimer);canvas.releasePointerCapture?.(e.pointerId);activePointer=null}
function bind(){
 atlasCanvas=$("atlasCanvas");atlasCtx=atlasCanvas.getContext("2d");
 atlasCanvas.addEventListener("pointerdown",atlasPointerDown,{passive:false});
 atlasCanvas.addEventListener("pointermove",atlasPointerMove,{passive:false});
 atlasCanvas.addEventListener("pointerup",atlasPointerUp,{passive:false});
 atlasCanvas.addEventListener("pointercancel",atlasPointerUp,{passive:false});
 atlasCanvas.addEventListener("wheel",atlasWheel,{passive:false});
 $("atlasHomeBtn").onclick=()=>{atlasFocusCurrent();save();drawAtlas()};
 $("atlasMinusBtn").onclick=()=>{atlasZoom(.82);drawAtlas()};
 $("atlasPlusBtn").onclick=()=>{atlasZoom(1.22);drawAtlas()};
 canvas.addEventListener("pointerdown",pointerStart,{passive:false});canvas.addEventListener("pointermove",pointerMove,{passive:false});canvas.addEventListener("pointerup",pointerEnd,{passive:false});canvas.addEventListener("pointercancel",pointerEnd,{passive:false});
 $("forageBtn").onclick=forageToggle;$("restBtn").onclick=restToggle;$("interactBtn").onclick=interact;$("migrateBtn").onclick=migrate;$("encounterCloseBtn").onclick=closeEncounter;
 $("forecastBtn").onclick=buildForecast;$("backToFeedBtn").onclick=()=>{$("epochFeedStage").hidden=false;$("epochForecastStage").hidden=true};
 $("restartBtn").onclick=()=>{if(confirm("End this lineage and erase its autosave?")){[SAVE_KEY,LEGACY_SAVE_KEY,...OLDER_SAVE_KEYS].forEach(k=>localStorage.removeItem(k));location.reload()}};
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab,.tab-content").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active");$("atlasTooltip").hidden=true;atlasDirty=true;if(t.dataset.tab==="lineage")requestAnimationFrame(drawAtlas)})
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("saveStatus").textContent="saved";setTimeout(()=>$("saveStatus").textContent="autosaving",700)}catch(e){}}
function load(){
 const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY)||OLDER_SAVE_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);
 if(!raw)return false;
 try{
  const b=fresh(),x=JSON.parse(raw);state=Object.assign(b,x);
  state.axes=Object.assign(b.axes,x.axes||{});state.pressures=Object.assign(b.pressures,x.pressures||{});
  state.lifetimePressure=Object.assign(b.lifetimePressure,x.lifetimePressure||{});state.inventory=Object.assign(b.inventory,x.inventory||{});state.dietMemory=Object.assign(b.dietMemory,x.dietMemory||{});state.dietHistory=Array.isArray(x.dietHistory)?x.dietHistory.filter(t=>FOOD[t]).slice(-12):[];state.encounter=null;state.atlasView=Object.assign(b.atlasView,x.atlasView||{});sanitizeAtlasView();
  state.genes=Array.isArray(x.genes)?[...new Set(x.genes.filter(g=>ATLAS.some(n=>n.id===g)))]:[];
  state.resources=Array.isArray(x.resources)?x.resources:[];state.organisms=Array.isArray(x.organisms)?x.organisms:[];state.logs=Array.isArray(x.logs)?x.logs:[];
  state.completedEpochs=Number.isFinite(x.completedEpochs)?x.completedEpochs:Math.max(0,(x.genes||[]).length-1);
  state.pendingEpochs=Math.max(0,Math.floor(Number.isFinite(x.pendingEpochs)?x.pendingEpochs:(x.epochPending?1:0)));
  state.target=null;state.mode="observe";state.epochForecast=[];state.epochFeed={};
  return true;
 }catch(e){return false}
}
function renderOrigins(){$("originChoices").innerHTML=ORIGINS.map(o=>`<button class="origin-choice" data-origin="${o.id}"><b style="color:${o.color}">${o.name}</b><span>${o.desc}</span><small>Begins with ${o.gene}; ${Object.entries(o.axes).map(([a,v])=>`+${v} ${AXES[a].name}`).join(", ")}</small></button>`).join("");document.querySelectorAll("[data-origin]").forEach(b=>b.onclick=()=>chooseOrigin(b.dataset.origin))}
function start(newLineage=false){
 if(newLineage){[SAVE_KEY,LEGACY_SAVE_KEY,...OLDER_SAVE_KEYS].forEach(k=>localStorage.removeItem(k));state=fresh()}else load();
 if(!state.resources.length)spawnFood(58);if(!state.organisms.length)populate();$("start").classList.remove("visible");renderAll();running=true;requestAnimationFrame(loop);
 if(!state.origin){renderOrigins();$("originModal").classList.add("visible")}else if(state.pendingEpochs>0)setTimeout(openEpoch,500)
}
let running=false;function loop(now){if(!running)return;update();draw();drawAtlas(now);requestAnimationFrame(loop)}
window.addEventListener("error",e=>{const x=$("error");x.hidden=false;x.textContent=e.message});
$("continue").onclick=()=>start(false);$("newGame").onclick=()=>start(true);bind();
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=7.4").catch(()=>{});
