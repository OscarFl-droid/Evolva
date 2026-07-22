"use strict";
export const BUILD_VERSION="10.3.4",BUILD_CACHE="evolva-v10-3-4";
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const choice=a=>a[Math.floor(Math.random()*a.length)];
const canvas=$("world"),ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
const SAVE_SCHEMA=5,SAVE_KEY="evolva-save-v10-3-4",BACKUP_SAVE_KEY="evolva-save-v10-3-4-backup",LEGACY_SAVE_KEY="evolva-save-v10-3-3",OLDER_SAVE_KEYS=["evolva-save-v10-3-2","evolva-save-v10-3-1","evolva-save-v10-3-0","evolva-save-v10-2-0","evolva-save-v10-1-0","evolva-save-v10-0-0","evolva-save-v9-0-5","evolva-save-v9-0-4","evolva-save-v9-0-3","evolva-save-v9-0-2","evolva-save-v9-0-1","evolva-save-v9-0-0","evolva-save-v8-3-0","evolva-save-v8-2-2","evolva-save-v8-2-1","evolva-save-v8-2-0","evolva-save-v8-1-0","evolva-save-v8-0-0","evolva-save-v7-5-1","evolva-save-v7-5","evolva-save-v7-4","evolva-save-v7-3","evolva-save-v7-2","evolva-save-v7-1","evolva-save-v7"],WORLD=3000,XP_BASE=100;

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
{id:"vesicle",name:"PERMEABLE VESICLE",desc:"A plastic membrane lineage that survives through exchange, flexibility and rapid physiological tuning.",axes:{adaptability:2,mobility:1},gene:"selective membrane",color:"#8cff9c",affinity:{adaptability:1.14,resilience:1.06,mobility:1.04},bias:{adaptability:9,resilience:4,mobility:3},legacy:"Environmental changes become useful developmental information. Biome fit improves faster and migration stress leaves stronger adaptive pressure.",paths:["Osmotic Nomad","Armoured Generalist","Photosymbiotic Radiator"]},
{id:"crawler",name:"CONTRACTILE CRAWLER",desc:"A mechanically organised lineage that turns energy into movement, capture and structural leverage.",axes:{power:1,mobility:2},gene:"contractile cortex",color:"#ffd66a",affinity:{power:1.13,mobility:1.10,resilience:1.03},bias:{power:8,mobility:7,resilience:2},legacy:"Movement and successful feeding reinforce mechanical development. Pursuit, engulfment and carcass use generate stronger power and mobility pressure.",paths:["Pursuit Predator","Armoured Ambusher","Scavenging Colossus"]},
{id:"colony",name:"CHEMICAL COLONY",desc:"A distributed lineage that evolves through sensing, signalling, memory and stable biological partnerships.",axes:{communication:2,cognition:1},gene:"chemical sensing",color:"#7de0ff",affinity:{communication:1.15,cognition:1.11,innovation:1.06},bias:{communication:9,cognition:7,innovation:4},legacy:"Information and cooperation compound over time. Signalling, inspection and merging generate stronger cognitive, communicative and innovative pressure.",paths:["Quorum Architect","Symbiotic Intelligence","Chemical Strategist"]}
];
function originDef(){return ORIGINS.find(o=>o.id===state.origin)||null}
function originAffinity(axis){return originDef()?.affinity?.[axis]||1}
function originBias(axis){return originDef()?.bias?.[axis]||0}
function lineageStyle(){
 const a=state.lineageActions||{},g=state.genes||[],scores={
  predator:(a.hunts||0)*3+(a.engulfs||0)*2+(gene("predatory strike")?10:0)+derivedAxis("power"),
  nomad:(a.migrations||0)*4+(a.harshCycles||0)*.6+(gene("adaptive radiation")?12:0)+derivedAxis("adaptability"),
  symbiote:(a.mergers||0)*4+(a.signals||0)*2+(state.symbionts?.length||0)*5+derivedAxis("communication"),
  architect:(a.niches||0)*3+(a.rests||0)*.4+(gene("quorum signal")?8:0)+derivedAxis("resilience"),
  observer:(a.inspections||0)*1.5+(gene("threat model")?10:0)+derivedAxis("cognition"),
  scavenger:(a.scavenges||0)*3+(gene("feeding groove")?5:0)+derivedAxis("power")*.4
 };
 const [id,score]=Object.entries(scores).sort((x,y)=>y[1]-x[1])[0];
 const names={predator:"Predatory",nomad:"Nomadic",symbiote:"Symbiotic",architect:"Architectural",observer:"Observant",scavenger:"Scavenging"};
 return{id,name:names[id],score};
}
function lineageIdentity(){const o=originDef(),s=lineageStyle();return o?`${s.name} ${o.name.split(" ").slice(-1)[0]}`:"Unformed lineage"}


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


const CUISINE_STATES=[
 {id:"adaptive_biofilm",name:"Adaptive Biofilm",icon:"≈",sequence:["pigment","mineral","spore","pigment","spore","mineral"],duration:8,axes:{adaptability:1,communication:1},mods:{waterUse:.84,environment:1},morph:"iridescent biofilm",desc:"A layered pigment–mineral–spore matrix seals the body and recycles water.",discovery:"Water replenished; +1 Adaptability and Communication; reduced water use."},
 {id:"crystal_skin",name:"Crystal Skin",icon:"◇",pattern:"alternating_mineral_pigment",duration:7,axes:{resilience:1},mods:{defense:1.12},morph:"crystalline ridges",desc:"Alternating chromatic and mineral intake templates a reflective protective lattice.",discovery:"+1 Resilience and strengthened defence rolls."},
 {id:"contractile_burst",name:"Contractile Burst",icon:"◆",sequence:["amino","amino","lipid"],duration:6,axes:{power:1,mobility:1},mods:{force:1.10,speed:1.06,energyUse:1.16},morph:"contractile bands",desc:"Protein-rich fibres are energised by a lipid pulse.",discovery:"+1 Power and Mobility; stronger engulfment, but higher energy use."},
 {id:"floating_bloom",name:"Floating Bloom",icon:"◌",sequence:["lipid","lipid","pigment"],duration:7,axes:{mobility:1,adaptability:1},mods:{speed:1.04,waterUse:.92,energyUse:.90},morph:"luminous vacuoles",desc:"Pigmented lipid vacuoles create buoyancy and a low-cost drifting metabolism.",discovery:"Improved Mobility and Adaptability; lower energy and water use."},
 {id:"living_colony_cuisine",name:"Living Colony Metabolism",icon:"✺",pattern:"spore_diversity",duration:8,axes:{innovation:1,communication:1},mods:{merge:1,innovation:1.08},morph:"symbiotic spore buds",desc:"Spore-rich feeding embedded within a diverse diet stabilises multiple metabolic partners.",discovery:"+1 Innovation and Communication; merger outcomes strengthened."},
 {id:"warning_coloration",name:"Warning Colouration",icon:"◐",pattern:"pigment_dominant",duration:7,axes:{communication:1},mods:{communication:1.10,visibility:1.18},morph:"warning bands",desc:"Repeated pigments are displayed as an overt chemical warning.",discovery:"Communication strengthened, but predators detect the lineage more easily."},
 {id:"balanced_metabolism",name:"Balanced Metabolism",icon:"∞",pattern:"high_diversity",duration:6,axes:{adaptability:1},mods:{waterUse:.95,energyUse:.95},morph:"stable membrane",desc:"A highly varied sequence prevents any single metabolic pathway from dominating.",discovery:"+1 Adaptability; reduced physiological drain and faster overload recovery."}
];
const METABOLIC_DISORDERS={
 spore:{id:"spore_toxicity",name:"Spore Toxicity",icon:"☠",duration:7,axes:{innovation:1,resilience:-1},mods:{defense:.88,waterUse:1.10},desc:"Six consecutive spores destabilised digestion and removed one third of current health."},
 mineral:{id:"mineral_saturation",name:"Mineral Saturation",icon:"⬡",duration:7,axes:{resilience:1,mobility:-1},mods:{defense:1.10,speed:.88},desc:"Dense mineral loading improves armour but restricts movement."},
 amino:{id:"protein_overload",name:"Protein Overload",icon:"◆",duration:7,axes:{power:1,adaptability:-1},mods:{force:1.09,energyUse:1.20},desc:"Hypertrophic tissues generate force but consume energy rapidly."},
 lipid:{id:"lipid_storage",name:"Lipid Storage Syndrome",icon:"◉",duration:7,axes:{resilience:1,mobility:-1},mods:{energyUse:.88,speed:.86},desc:"Large reserves buffer starvation but make acceleration sluggish."},
 pigment:{id:"chromatic_overexpression",name:"Chromatic Overexpression",icon:"◈",duration:7,axes:{communication:1,cognition:-1},mods:{communication:1.09,visibility:1.28},desc:"Intense signalling improves communication while making concealment difficult."},
 sugar:{id:"glycolytic_crash",name:"Glycolytic Crash",icon:"↓",duration:5,axes:{power:1,resilience:-1},mods:{force:1.06,energyUse:1.24},desc:"Repeated sugar causes a brief energetic surge followed by unstable maintenance."}
};
function endsWithSequence(history,sequence){return history.length>=sequence.length&&sequence.every((v,i)=>history[history.length-sequence.length+i]===v)}
function sequenceCounts(history=state.nutritionSequence||[]){const c={};Object.keys(FOOD).forEach(k=>c[k]=0);history.forEach(k=>c[k]=(c[k]||0)+1);return c}
function cuisineDefinition(id){return CUISINE_STATES.find(x=>x.id===id)||null}
function activeCuisine(){return cuisineDefinition(state.metabolicState?.id)}
function activeDisorder(){return Object.values(METABOLIC_DISORDERS).find(x=>x.id===state.metabolicDisorder?.id)||null}
function metabolicAxisModifier(axis){let n=0;const c=activeCuisine(),d=activeDisorder();if(c)n+=c.axes?.[axis]||0;if(d)n+=d.axes?.[axis]||0;return n}
function metabolicModifier(key,base=1){let v=base;const c=activeCuisine(),d=activeDisorder();if(c?.mods?.[key]!=null)v*=c.mods[key];if(d?.mods?.[key]!=null)v*=d.mods[key];return v}
function recogniseCuisine(history=state.nutritionSequence||[]){
 const counts=sequenceCounts(history),last=history.at(-1),unique=new Set(history).size;
 for(const c of CUISINE_STATES)if(c.sequence&&endsWithSequence(history,c.sequence))return c;
 if(history.length>=4&&history.slice(-4).every((v,i,a)=>["mineral","pigment"].includes(v)&&(i===0||v!==a[i-1])))return cuisineDefinition("crystal_skin");
 if(history.length>=6&&counts.spore>=3&&unique>=3&&last!=="spore")return cuisineDefinition("living_colony_cuisine");
 if(history.length>=4&&history.slice(-4).every(v=>v==="pigment"))return cuisineDefinition("warning_coloration");
 if(history.length>=6&&unique>=5)return cuisineDefinition("balanced_metabolism");
 return null
}
function activateCuisine(c){
 if(!c||state.cuisinePatternLatch===c.id)return;
 state.cuisinePatternLatch=c.id;state.lastCuisineSignature=`${c.id}:${(state.nutritionSequence||[]).join(",")}`;state.metabolicState={id:c.id,meals:c.duration};state.cuisineReinforcement=state.cuisineReinforcement||{};state.cuisineReinforcement[c.id]=clamp((state.cuisineReinforcement[c.id]||0)+1,0,5);
 if(!state.discoveredCuisine.includes(c.id)){state.discoveredCuisine.push(c.id);toast(`EVOLUTIONARY CUISINE · ${c.name.toUpperCase()}`);log(`Evolutionary Cuisine discovered: ${c.name}. ${c.discovery}`);addXP(8,`Metabolic discovery: ${c.name}`)}else toast(c.name.toUpperCase());
 if(c.id==="adaptive_biofilm"){const restored=Math.round(Math.min(35,100-state.water));state.water=clamp(state.water+35);log(`Adaptive Biofilm recycled metabolites and restored ${restored} water.`)}
 burst(state.x,state.y,FOOD[(state.nutritionSequence||[]).at(-1)]?.color||"#8cff9c",18,1.8);atlasDirty=true
}
function triggerOverload(type){
 const d=METABOLIC_DISORDERS[type];if(!d)return;
 if(state.metabolicDisorder?.signature===(state.nutritionSequence||[]).join(","))return;
 state.metabolicDisorder={id:d.id,meals:d.duration,signature:(state.nutritionSequence||[]).join(",")};
 if(type==="spore"){const lost=Math.max(1,Math.round(state.health/3));state.health=clamp(state.health-lost);toast(`SPORE TOXICITY · −${lost} HEALTH`);log(`Six spores in sequence caused indigestion and removed ${lost} health.`)}else{toast(d.name.toUpperCase());log(`${d.name} developed after six consecutive ${FOOD[type].name.toLowerCase()} consumptions.`)}
 atlasDirty=true
}
function recordNutritionalConsumption(type){
 state.nutritionSequence.push(type);state.nutritionSequence=state.nutritionSequence.slice(-8);
 if(state.metabolicState?.meals>0&&--state.metabolicState.meals<=0)state.metabolicState=null;
 if(state.metabolicDisorder?.meals>0&&--state.metabolicDisorder.meals<=0)state.metabolicDisorder=null;
 const last6=state.nutritionSequence.slice(-6),prior=state.nutritionSequence.at(-7);
 if(last6.length===6&&last6.every(x=>x===type)&&prior!==type)triggerOverload(type);
 const c=recogniseCuisine();if(c)activateCuisine(c);else state.cuisinePatternLatch="";
}

const MODULES=[
 {id:"flagellate",name:"Flagellate Symbiont",icon:"≋",color:"#7de0ff",axis:"mobility",effect:"speed",desc:"A retained motile cell assists propulsion."},
 {id:"phototroph",name:"Phototrophic Symbiont",icon:"☼",color:"#ffd66a",axis:"innovation",effect:"light",desc:"A living internal phototroph produces energy in bright niches."},
 {id:"mineralizer",name:"Mineralising Symbiont",icon:"⬡",color:"#f18b66",axis:"resilience",effect:"armour",desc:"Deposits protective mineral plates around its host."},
 {id:"detoxer",name:"Detoxifying Symbiont",icon:"♢",color:"#91ff9c",axis:"resilience",effect:"detox",desc:"Consumes damaging reactive chemicals."},
 {id:"signaller",name:"Signalling Symbiont",icon:"⌁",color:"#dba0ff",axis:"communication",effect:"signal",desc:"Amplifies chemical communication and recognition."},
 {id:"electrogen",name:"Electrogenic Symbiont",icon:"ϟ",color:"#8deaff",axis:"cognition",effect:"pulse",desc:"Stores charge for detection and defensive pulses."}
];
const EFFECT_TYPES={
 mucus:{name:"ADHESIVE MUCUS",color:"#8cffc4",icon:"≈"},
 toxin:{name:"TOXIN CLOUD",color:"#dba0ff",icon:"†"},
 pulse:{name:"ELECTRIC PULSE",color:"#7de0ff",icon:"ϟ"},
 nutrient:{name:"NUTRIENT PLUME",color:"#ffd66a",icon:"✚"},
 alarm:{name:"ALARM SIGNAL",color:"#ff7777",icon:"!"}
};
function moduleById(id){return MODULES.find(m=>m.id===id)}
function randomModule(){return choice(MODULES)}
const BIOCHEMICAL_PATHWAYS={
 mineral:{name:"BIOMINERALISATION",icon:"⬡",color:"#f18b66",thresholds:[20,40,60,80]},
 spore:{name:"SYMBIOTIC PLASTICITY",icon:"✺",color:"#ddb477",thresholds:[20,40,60,80]},
 pigment:{name:"CHROMATIC BIOLOGY",icon:"◈",color:"#7de0ff",thresholds:[20,40,60,80]},
 lipid:{name:"MEMBRANE ENERGETICS",icon:"◌",color:"#ffd66a",thresholds:[20,40,60,80]},
 amino:{name:"CONTRACTILE BIOSYNTHESIS",icon:"◆",color:"#91ff9c",thresholds:[20,40,60,80]}
};
const BIOCHEMICAL_NODES=[
 {id:"mineral deposition",name:"Mineral Deposition",axis:"resilience",tier:2,icon:"⬡",req:["stress response"],min:{resilience:2},resource:"mineral",threshold:20,desc:"Stored minerals are incorporated into protective matrices.",effect:"+1 Resilience; +1 defensive interactions"},
 {id:"crystal matrix",name:"Crystal Matrix",axis:"resilience",tier:3,icon:"◇",req:["mineral deposition"],min:{resilience:4},resource:"mineral",threshold:40,desc:"Ordered mineral lattices distribute impacts across the body.",effect:"+1 Resilience; defence rolls strengthened"},
 {id:"reinforced leverage",name:"Reinforced Leverage",axis:"power",tier:4,icon:"▰",req:["crystal matrix"],min:{power:4,resilience:5},resource:"mineral",threshold:60,desc:"Mineralised anchors increase mechanical leverage.",effect:"+1 Power; engulf rolls strengthened"},
 {id:"living fortress",name:"Living Fortress",axis:"resilience",tier:5,icon:"▣",req:["reinforced leverage"],min:{resilience:7},resource:"mineral",threshold:80,desc:"A continuously remodelled armour system surrounds vulnerable tissues.",effect:"+2 Resilience; major defensive advantage"},
 {id:"adaptive spores",name:"Adaptive Spores",axis:"innovation",tier:2,icon:"°",req:["chemical sensing"],min:{innovation:2},resource:"spore",threshold:20,desc:"Retained spore chemistry broadens developmental variation.",effect:"+1 Innovation; rare outcomes improved"},
 {id:"symbiotic relay",name:"Symbiotic Relay",axis:"communication",tier:3,icon:"⌁",req:["adaptive spores"],min:{communication:4},resource:"spore",threshold:40,desc:"Spore-derived signals coordinate compatible cells.",effect:"+1 Communication; signal and merge rolls strengthened"},
 {id:"distributed symbiosis",name:"Distributed Symbiosis",axis:"cognition",tier:4,icon:"◎",req:["symbiotic relay"],min:{cognition:5},resource:"spore",threshold:60,desc:"Multiple symbiotic compartments share chemical information.",effect:"+1 Cognition; organism assessment improved"},
 {id:"living colony",name:"Living Colony",axis:"communication",tier:5,icon:"❖",req:["distributed symbiosis"],min:{communication:7,innovation:6},resource:"spore",threshold:80,desc:"The body behaves as a coordinated multispecies community.",effect:"+2 Communication; major merger advantage"},
 {id:"pigment vesicles",name:"Pigment Vesicles",axis:"cognition",tier:2,icon:"◈",req:["chemical sensing"],min:{cognition:2},resource:"pigment",threshold:20,desc:"Concentrated pigments improve contrast and light detection.",effect:"+1 Cognition; inspection rolls strengthened"},
 {id:"warning display",name:"Warning Display",axis:"communication",tier:3,icon:"◐",req:["pigment vesicles"],min:{communication:3},resource:"pigment",threshold:40,desc:"Patterned coloration communicates toxicity and intent.",effect:"+1 Communication; signalling strengthened"},
 {id:"photoreactive membrane",name:"Photoreactive Membrane",axis:"adaptability",tier:4,icon:"☼",req:["warning display"],min:{adaptability:5},resource:"pigment",threshold:60,desc:"Pigments tune metabolism to changing light conditions.",effect:"+1 Adaptability; environmental interactions strengthened"},
 {id:"chromatic intelligence",name:"Chromatic Intelligence",axis:"cognition",tier:5,icon:"✧",req:["photoreactive membrane"],min:{cognition:7,communication:6},resource:"pigment",threshold:80,desc:"Dynamic body patterns become a high-bandwidth sensory language.",effect:"+2 Cognition; threat prediction strengthened"},
 {id:"lipid reservoir",name:"Lipid Reservoir",axis:"mobility",tier:2,icon:"◌",req:["selective membrane"],min:{mobility:2},resource:"lipid",threshold:20,desc:"Stored lipids stabilise membranes and fuel movement.",effect:"+1 Mobility; movement and escape strengthened"},
 {id:"elastic bilayer",name:"Elastic Bilayer",axis:"adaptability",tier:3,icon:"≈",req:["lipid reservoir"],min:{adaptability:4},resource:"lipid",threshold:40,desc:"Flexible membrane layers tolerate deformation and osmotic change.",effect:"+1 Adaptability; water economy improved"},
 {id:"energy vacuoles",name:"Energy Vacuoles",axis:"resilience",tier:4,icon:"◉",req:["elastic bilayer"],min:{resilience:5},resource:"lipid",threshold:60,desc:"Dense intracellular reserves buffer starvation and exertion.",effect:"+1 Resilience; sustained interactions improved"},
 {id:"metabolic mastery",name:"Metabolic Mastery",axis:"mobility",tier:5,icon:"∞",req:["energy vacuoles"],min:{mobility:7,adaptability:6},resource:"lipid",threshold:80,desc:"Energy storage and membrane turnover are tightly integrated.",effect:"+2 Mobility; major escape and pursuit advantage"},
 {id:"contractile proteins",name:"Contractile Proteins",axis:"power",tier:2,icon:"◆",req:["contractile cortex"],min:{power:2},resource:"amino",threshold:20,desc:"Amino-acid reserves support denser force-generating fibres.",effect:"+1 Power; engulf rolls strengthened"},
 {id:"dense cytoskeleton",name:"Dense Cytoskeleton",axis:"power",tier:3,icon:"╫",req:["contractile proteins"],min:{power:4},resource:"amino",threshold:40,desc:"Cross-linked structural proteins transmit force efficiently.",effect:"+1 Power; physical interactions strengthened"},
 {id:"feeding musculature",name:"Feeding Musculature",axis:"mobility",tier:4,icon:"∨",req:["dense cytoskeleton"],min:{power:6,mobility:4},resource:"amino",threshold:60,desc:"Specialised muscular tissues accelerate capture and ingestion.",effect:"+1 Mobility; engulf and pursuit strengthened"},
 {id:"apex contractility",name:"Apex Contractility",axis:"power",tier:5,icon:"✦",req:["feeding musculature"],min:{power:8},resource:"amino",threshold:80,desc:"The body is organised around rapid, coordinated force production.",effect:"+2 Power; major physical interaction advantage"}
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
{id:"adaptive radiation",name:"Adaptive Radiation",axis:"adaptability",tier:5,icon:"✺",req:["developmental reserve","segmented body"],min:{adaptability:9,innovation:8},desc:"Each new biome can activate a specialised reversible form.",effect:"Biome morphs unlocked"},
...BIOCHEMICAL_NODES
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
const ATLAS_LOGICAL_W=860,ATLAS_LOGICAL_H=720;
function atlasDpr(){return Math.min(2.5,window.devicePixelRatio||1)}
function resizeAtlasCanvas(){if(!atlasCanvas)return;const d=atlasDpr(),w=Math.round(ATLAS_LOGICAL_W*d),h=Math.round(ATLAS_LOGICAL_H*d);if(atlasCanvas.width!==w||atlasCanvas.height!==h){atlasCanvas.width=w;atlasCanvas.height=h;atlasDirty=true}}
const atlasPointers=new Map();
function pathwayKey(resource,threshold){return `${resource}${threshold}`}
function pathwayDiscovered(node){return !node.resource||!!state.discoveredPathways?.[pathwayKey(node.resource,node.threshold)]}
function pathwayReserveMet(node){return !node.resource||(state.inventory[node.resource]||0)>=node.threshold}
function checkDevelopmentalThresholds(announce=true){
 state.discoveredPathways=state.discoveredPathways&&typeof state.discoveredPathways==="object"?state.discoveredPathways:{};
 const found=[];
 for(const [resource,path] of Object.entries(BIOCHEMICAL_PATHWAYS))for(const threshold of path.thresholds){
  const key=pathwayKey(resource,threshold);
  if((state.inventory[resource]||0)>=threshold&&!state.discoveredPathways[key]){state.discoveredPathways[key]=true;found.push({resource,threshold,path})}
 }
 if(found.length){atlasDirty=true;const last=found.at(-1);state.newPathway=pathwayKey(last.resource,last.threshold);if(announce){toast(`NEW BIOCHEMICAL PATHWAY · ${last.path.name} ${last.threshold}`);log(`${last.path.name} threshold ${last.threshold} discovered; new Atlas tissue emerged.`);const n=BIOCHEMICAL_NODES.find(x=>x.resource===last.resource&&x.threshold===last.threshold);if(n&&ATLAS_POS[n.id]){state.atlasView.x=ATLAS_POS[n.id].x;state.atlasView.y=ATLAS_POS[n.id].y;state.atlasView.zoom=1.35;clampAtlasView()}}}
 return found.length
}
function atlasStatus(node){
 if(gene(node.id))return"owned";
 if(node.resource&&!pathwayReserveMet(node))return"reserve";
 if(nodeAvailable(node))return"available";
 const prereqDistance=node.req.filter(r=>!gene(r)).length;
 const pressure=(state.pressures[node.axis]||0)+(BIOMES[state.biome].pressure[node.axis]||0)*5;
 if(prereqDistance<=1&&pressure>12)return"pressured";
 return"locked";
}
function atlasVisible(node){
 if(node.resource&&!pathwayDiscovered(node))return false;
 const status=atlasStatus(node);
 if(status!=="locked")return true;
 if(node.req.some(gene))return true;
 return node.tier<=2;
}
function sanitizeAtlasView(){
 if(!state.atlasView||![state.atlasView.x,state.atlasView.y,state.atlasView.zoom].every(Number.isFinite))state.atlasView={x:430,y:360,zoom:1};
 state.atlasView.zoom=clamp(state.atlasView.zoom,.58,2.6);clampAtlasView()
}
function clampAtlasView(){
 const margin=230/state.atlasView.zoom;
 state.atlasView.x=clamp(state.atlasView.x,-margin,860+margin);
 state.atlasView.y=clamp(state.atlasView.y,-margin,720+margin)
}
function atlasWorldFromClient(clientX,clientY){
 const rect=atlasCanvas.getBoundingClientRect(),sx=(clientX-rect.left)*(ATLAS_LOGICAL_W/rect.width),sy=(clientY-rect.top)*(ATLAS_LOGICAL_H/rect.height);
 return{x:(sx-ATLAS_LOGICAL_W/2)/state.atlasView.zoom+state.atlasView.x,y:(sy-ATLAS_LOGICAL_H/2)/state.atlasView.zoom+state.atlasView.y}
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
 state.atlasView.zoom=clamp(old*delta,.58,2.6);
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
   state.atlasView.zoom=clamp(atlasDrag.zoom*dist/atlasDrag.distance,.58,2.6);
   const after=atlasWorldFromClient(mx,my);state.atlasView.x+=atlasDrag.world.x-after.x;state.atlasView.y+=atlasDrag.world.y-after.y;clampAtlasView();atlasDirty=true;return
 }
 if(e.pointerId!==atlasPointer||!atlasDrag||atlasDrag.pinch)return;
 const rect=atlasCanvas.getBoundingClientRect(),dx=(e.clientX-atlasDrag.x)*(ATLAS_LOGICAL_W/rect.width)/state.atlasView.zoom,dy=(e.clientY-atlasDrag.y)*(ATLAS_LOGICAL_H/rect.height)/state.atlasView.zoom;
 if(Math.hypot(dx,dy)>4)atlasDrag.moved=true;state.atlasView.x=atlasDrag.vx-dx;state.atlasView.y=atlasDrag.vy-dy;clampAtlasView();atlasDirty=true
}
function atlasPointerUp(e){
 if(!atlasPointers.has(e.pointerId))return;e.preventDefault();
 const wasPinch=atlasPointers.size>1||atlasDrag?.pinch,moved=atlasDrag?.moved,node=!wasPinch&&!moved?atlasNodeAt(e):null;
 atlasPointers.delete(e.pointerId);atlasCanvas.releasePointerCapture?.(e.pointerId);
 if(atlasPointers.size===0){atlasPointer=null;atlasDrag=null;$("livingAtlas").classList.remove("is-dragging");if(node)showAtlasTooltip(node,e);save()}
 else if(atlasPointers.size===1){const [id,p]=[...atlasPointers.entries()][0];atlasPointer=id;atlasDrag={x:p.x,y:p.y,vx:state.atlasView.x,vy:state.atlasView.y,moved:true}}
}
function atlasPointerCancel(e){
 if(!atlasPointers.has(e.pointerId))return;e.preventDefault();
 atlasPointers.delete(e.pointerId);atlasCanvas.releasePointerCapture?.(e.pointerId);
 if(atlasPointers.size===0){atlasPointer=null;atlasDrag=null;$("livingAtlas").classList.remove("is-dragging")}
 else{const [id,p]=[...atlasPointers.entries()][0];atlasPointer=id;atlasDrag={x:p.x,y:p.y,vx:state.atlasView.x,vy:state.atlasView.y,moved:true}}
}
function atlasWheel(e){e.preventDefault();atlasZoom(e.deltaY<0?1.12:.89,e.clientX,e.clientY)}
function showAtlasTooltip(node,e){
 const box=$("atlasTooltip"),status=atlasStatus(node),missing=node.req.filter(r=>!gene(r));
 const thresholdMissing=Object.entries(node.min||{}).filter(([a,v])=>derivedAxis(a)<v).map(([a,v])=>`${AXES[a].name} ${derivedAxis(a)}/${v}`);
 const reqText=node.req.length?node.req.map(r=>`${gene(r)?"✓":"○"} ${ATLAS.find(x=>x.id===r)?.name||r}`).join("<br>"):"✓ Basal innovation";
 const statText=Object.entries(node.min||{}).map(([a,v])=>`${derivedAxis(a)>=v?"✓":"○"} ${AXES[a].name}: ${derivedAxis(a)} / ${v}`).join("<br>")||"No capacity threshold";
 const reserveText=node.resource?`<br><u>BIOCHEMICAL RESERVE</u><br>${pathwayReserveMet(node)?"✓":"○"} ${FOOD[node.resource].name}: ${state.inventory[node.resource]||0} / ${node.threshold}<br>Discovery is permanent; access requires the reserve to be rebuilt.`:"";
 box.innerHTML=`<b>${node.icon} ${node.name}</b><span class="tip-tier">${AXES[node.axis].icon} ${AXES[node.axis].name} · Tier ${node.tier}</span>${node.desc}<strong>${node.effect}</strong><small><u>PREREQUISITES</u><br>${reqText}<br><u>CAPACITY THRESHOLDS</u><br>${statText}${reserveText}<br><u>STATUS</u><br>${status==="owned"?"Fixed in lineage":status==="available"?"Accessible at next major evolution":status==="reserve"?"Known pathway; biochemical reserve currently insufficient":status==="pressured"?"Developmentally favoured but still locked":"Distant developmental possibility"}</small>`;
 box.hidden=false;
 const rect=atlasCanvas.getBoundingClientRect(),bw=box.offsetWidth||210,bh=box.offsetHeight||125;
 box.style.left=clamp(e.clientX-rect.left+8,6,Math.max(6,rect.width-bw-6))+"px";
 box.style.top=clamp(e.clientY-rect.top-15,6,Math.max(6,rect.height-bh-6))+"px";
 clearTimeout(showAtlasTooltip.t);showAtlasTooltip.t=setTimeout(()=>box.hidden=true,5000)
}
function atlasNodeColor(status,node){
 if(status==="owned")return"#8cff9c";
 if(status==="available")return"#ffd66a";
 if(status==="pressured")return"#dba0ff";
 if(status==="reserve")return"#42504a";
 return"#294036"
}
function drawAtlas(now=performance.now()){
 if(!atlasCanvas||!$("lineageTab").classList.contains("active"))return;
 if(!atlasDirty&&now-atlasLastDraw<50)return;atlasLastDraw=now;atlasDirty=false;
 sanitizeAtlasView();
 resizeAtlasCanvas();const c=atlasCtx,d=atlasDpr(),w=ATLAS_LOGICAL_W,h=ATLAS_LOGICAL_H;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);
 // developmental field rings and axis labels
 c.save();c.translate(w/2,h/2);c.scale(state.atlasView.zoom,state.atlasView.zoom);c.translate(-state.atlasView.x,-state.atlasView.y);
 c.lineWidth=1.5/state.atlasView.zoom;
 c.strokeStyle="rgba(125,224,255,.08)";for(const rr of [90,170,255,340]){c.beginPath();c.arc(430,360,rr,0,Math.PI*2);c.stroke()}
 c.font="bold 9px monospace";c.textAlign="center";for(const [axis,a] of Object.entries(AXES)){const idx=Object.keys(AXES).indexOf(axis),ang=-Math.PI/2+idx/Object.keys(AXES).length*Math.PI*2;c.fillStyle="rgba(232,255,218,.42)";c.fillText(`${a.icon} ${a.name.toUpperCase()}`,430+Math.cos(ang)*315,360+Math.sin(ang)*315)}
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
   const overview=state.atlasView.zoom<.78,screenScale=1/state.atlasView.zoom;
   c.fillStyle=atlasNodeColor(status,n);c.strokeStyle=status==="owned"?"#dfffdc":status==="available"?"#fff2aa":"#45604f";c.lineWidth=2.3/state.atlasView.zoom;
   const baseR=status==="owned"?15:13,r=baseR*Math.min(1.45,screenScale);
   c.globalAlpha=.28;c.strokeStyle=AXES[n.axis]?"#7de0ff":"#45604f";c.beginPath();c.arc(p.x,p.y,r+5+n.tier*screenScale,0,Math.PI*2);c.stroke();c.globalAlpha=1;
   c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle=status==="locked"?"#9ab09d":"#07120d";c.font=`bold ${11*screenScale}px monospace`;c.textAlign="center";c.fillText(n.icon,p.x,p.y+3.8*screenScale);
   const showLabel=!overview||status!=="locked";
   if(showLabel){
     const label=n.name.toUpperCase(),fontSize=(overview?9.5:8)*screenScale,labelY=p.y+(overview?29:25)*screenScale;
     c.font=`bold ${fontSize}px monospace`;const tw=c.measureText(label).width,pad=4*screenScale;
     c.fillStyle="rgba(3,10,7,.82)";c.fillRect(p.x-tw/2-pad,labelY-fontSize,tw+pad*2,fontSize+4*screenScale);
     c.fillStyle=status==="locked"?"rgba(190,211,191,.62)":status==="available"?"#fff2aa":"#e8ffda";c.fillText(label,p.x,labelY)
   }
 }
 c.restore()
}

const ECO_CONFIG={targetOrganisms:30,maxOrganisms:44,targetFood:82,maxCarcasses:36,maxPatches:34,viewMultiplier:.82};
const WEATHER=[
 {id:"calm",name:"CALM CURRENT",icon:"≈",duration:[1800,3200],light:1,moisture:1,drift:.18},
 {id:"rain",name:"NUTRIENT RAIN",icon:"⋮",duration:[1100,1900],light:.82,moisture:1.35,drift:.35},
 {id:"bloom",name:"MICROBIAL BLOOM",icon:"✦",duration:[900,1600],light:1.08,moisture:1.1,drift:.12},
 {id:"heat",name:"THERMAL SURGE",icon:"≋",duration:[850,1450],light:1.18,moisture:.66,drift:.24},
 {id:"spores",name:"SPORE FRONT",icon:"°",duration:[950,1750],light:.9,moisture:1.05,drift:.55}
];
function makeWeather(id="calm"){const w=WEATHER.find(x=>x.id===id)||WEATHER[0];return{id:w.id,timer:Math.round(rand(...w.duration)),phase:rand(0,6.28),windX:rand(-1,1),windY:rand(-1,1)}}
function weatherDef(){return WEATHER.find(w=>w.id===state.weather?.id)||WEATHER[0]}
function makePatch(type,x,y,strength=10){return{id:Math.random().toString(36).slice(2),type,x,y,strength,age:0,biome:state.biome,phase:rand(0,6.28)}}
function patchAt(x,y,range=105){return state.patches.find(p=>p.biome===state.biome&&Math.hypot(p.x-x,p.y-y)<range)}
function addPatch(type,x,y,amount=8){let p=patchAt(x,y);if(!p){if(state.patches.length>=ECO_CONFIG.maxPatches)state.patches.sort((a,b)=>a.age-b.age).pop();p=makePatch(type,x,y,0);state.patches.push(p)}p.type=type;p.strength=clamp(p.strength+amount,0,100);p.age=0;return p}
function makeCarcass(o,cause="natural"){return{id:Math.random().toString(36).slice(2),x:o.x,y:o.y,mass:Math.max(.2,o.mass*.75),nutrition:Math.max(8,o.mass*18),age:0,biome:state.biome,cause,color:o.color,module:o.module||null,phase:rand(0,6.28)}}
function killOrganism(o,cause="ecological competition"){if(!o||!state.organisms.includes(o))return;state.carcasses.push(makeCarcass(o,cause));if(state.carcasses.length>ECO_CONFIG.maxCarcasses)state.carcasses.shift();state.organisms=state.organisms.filter(x=>x!==o);burst(o.x,o.y,o.color,14,2);addPatch("detritus",o.x,o.y,6)}
function organismRole(o){if(o.module==="phototroph")return"producer";if(o.aggression>.57&&o.mass>1)return"predator";if(o.module==="detoxer")return"decomposer";if(o.curiosity>.68)return"social";return"grazer"}
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
 discoveredPathways:{},newPathway:null,
 atlasView:{x:430,y:360,zoom:1},
 dietMemory:{sugar:0,lipid:0,amino:0,mineral:0,pigment:0,spore:0},dietHistory:[],nutritionSequence:[],metabolicState:null,metabolicDisorder:null,discoveredCuisine:[],cuisineReinforcement:{},lastCuisineSignature:"",cuisinePatternLatch:"",encounter:null,interactionTarget:null,lastTileKey:"",
 symbionts:[],effects:[],niches:[],patches:[],carcasses:[],particles:[],ambient:[],restAnchor:null,weather:makeWeather(),camera:{lookX:0,lookY:0,zoom:1,eventX:null,eventY:null,eventTimer:0},ecosystem:{births:0,deaths:0,mergers:0,hunts:0},lineageActions:{hunts:0,engulfs:0,migrations:0,mergers:0,signals:0,inspections:0,niches:0,rests:0,scavenges:0,harshCycles:0},buildVersion:BUILD_VERSION,saveSchema:SAVE_SCHEMA,migrationReport:"New lineage · schema 5",resources:[],organisms:[],logs:[],lastInteraction:0
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
function biochemicalAxisBonus(axis){return BIOCHEMICAL_NODES.filter(n=>n.axis===axis&&gene(n.id)).reduce((sum,n)=>sum+(n.threshold===80?2:1),0)}
function derivedAxis(axis){
 let v=(state.axes[axis]||1)+biochemicalAxisBonus(axis)+metabolicAxisModifier(axis);
 for(const id of state.genes){const node=ATLAS.find(n=>n.id===id);if(node?.axis===axis)v+=node.tier*.35}
 for(const id of state.symbionts||[]){const m=moduleById(id);if(m?.axis===axis)v+=.45}
 const diet=dietAxisBonus(axis);v+=Math.min(1.5,diet*.035);
 // Origin affinity is a permanent architecture, not a temporary starting bonus.
 v=1+(v-1)*originAffinity(axis);
 return Math.round(v*10)/10;
}
function capacityEffects(axis){const v=derivedAxis(axis),n=Math.max(0,v-1);return{
 power:`+${Math.round(n*8)}% mechanical force; +${Math.round(n*5)}% engulfment and intimidation`,
 mobility:`+${Math.round(n*5.5)}% movement; +${Math.round(n*4)}% escape control`,
 resilience:`+${Math.round(n*7)}% defence; −${Math.round(Math.min(35,n*2.5))}% water use and environmental attrition`,
 cognition:`+${Math.round(n*8)}% detection; organism readout depth ${inspectionTier()}/5`,
 adaptability:`+${Math.round(n*6)}% plasticity; improved biome fit and stress recovery`,
 communication:`+${Math.round(n*4)}% interaction range; stronger signalling, merger and social outcomes`,
 innovation:`+${Math.round(n*3.5)}% living-module retention; improves rare developmental outcomes`
}[axis]||""}
function moduleCount(effect){return state.symbionts.filter(id=>moduleById(id)?.effect===effect).length}
function phenotype(){
 const flag=moduleCount("speed"),armour=moduleCount("armour"),detox=moduleCount("detox"),signal=moduleCount("signal");
 return{
 speed:(1+(derivedAxis("mobility")-1)*.055)*(gene("cilia")?1.22:1)*(gene("directed locomotion")?1.3:1)*(gene("armoured cortex") ? 0.92 : 1)*(1+flag*.09)*metabolicModifier("speed"),
 force:(1+(derivedAxis("power")-1)*.08)*(gene("contractile cortex")?1.15:1)*(gene("mineral scaffold")?1.3:1)*metabolicModifier("force"),
 defense:(1+(derivedAxis("resilience")-1)*.07)*(gene("stress response")?1.15:1)*(gene("armoured cortex")?1.3:1)*(1+armour*.12)*metabolicModifier("defense"),
 waterUse:(gene("selective membrane") ? 0.82 : 1)*(1-Math.min(.35,(derivedAxis("resilience")-1)*.025))*metabolicModifier("waterUse"),
 energyUse:metabolicModifier("energyUse"),
 detection:130*(1+(derivedAxis("cognition")-1)*.08)*(gene("chemical sensing")?1.25:1)*(gene("electroreception")?1.55:1),
 foodYield:(gene("feeding groove")?1.2:1)*(gene("pseudopods")?1.12:1)*(state.origin==="crawler"?1.08:1),
 interactionRange:90*(gene("surface exchange")?1.2:1)*(1+(derivedAxis("communication")-1)*.04)*(1+signal*.1),
 plasticity:(1+(derivedAxis("adaptability")-1)*.06)*(state.origin==="vesicle"?1.10:1),
 innovation:(1+(derivedAxis("innovation")-1)*.045)*metabolicModifier("innovation"),
 communication:(1+(derivedAxis("communication")-1)*.05)*(state.origin==="colony"?1.08:1)*metabolicModifier("communication"),
 cognition:(1+(derivedAxis("cognition")-1)*.06)*(state.origin==="colony"?1.06:1)
 };
}
function fit(){
 const b=BIOMES[state.biome],p=phenotype();let f=55;
 if(b.moisture<20)f+=gene("selective membrane")?18:-22;
 if(b.temp>45||b.temp<0)f+=gene("thermal engine")?30:gene("stress response")?10:-20;
 if(b.hazard>60)f+=gene("detoxification")?22:gene("stress response")?8:-18;
 if(gene("phenotypic plasticity"))f+=(50-f)*.25;
 if(gene("adaptive radiation"))f+=(75-f)*.35;
 f+=(100-f)*Math.min(.22,(derivedAxis("adaptability")-1)*.018);f+=activeCuisine()?.mods?.environment?8:0;
 return clamp(f);
}
function cameraScale(){const base=1/Math.pow(state.mass,.2);return clamp(base*ECO_CONFIG.viewMultiplier*(state.camera?.zoom||1),.25,.94)}
function cameraCenter(){return{x:state.x+(state.camera?.lookX||0),y:state.y+(state.camera?.lookY||0)}}
function focusEvent(x,y,duration=180){if(!state.camera)return;state.camera.eventX=x;state.camera.eventY=y;state.camera.eventTimer=Math.max(state.camera.eventTimer||0,duration)}
function radius(m=state.mass){return 10+Math.log2(m+1)*5}
function morphologyComplexity(){
 const level=Math.max(1,Number(state.level)||1),epochs=Math.max(0,Number(state.completedEpochs)||0);
 const geneScore=(state.genes||[]).reduce((sum,id)=>sum+(ATLAS.find(n=>n.id===id)?.tier||1)*2.2,0);
 const capacityScore=Object.keys(AXES).reduce((sum,a)=>sum+Math.max(0,Number(derivedAxis(a))||1)-1,0)*.72;
 const score=level*1.4+geneScore+capacityScore+(state.symbionts?.length||0)*3+epochs*2;
 return Math.max(0,Math.round(Number.isFinite(score)?score:0));
}
function morphologyStage(){const c=morphologyComplexity();return c<8?0:c<18?1:c<32?2:c<50?3:c<72?4:5}
function biochemicalMorphologyLevel(resource){
 const ids=BIOCHEMICAL_NODES.filter(n=>n.resource===resource).map(n=>n.id);
 return ids.reduce((sum,id)=>sum+(gene(id)?1:0),0);
}
function morphologyProfile(){
 const levels={mineral:biochemicalMorphologyLevel("mineral"),spore:biochemicalMorphologyLevel("spore"),pigment:biochemicalMorphologyLevel("pigment"),lipid:biochemicalMorphologyLevel("lipid"),amino:biochemicalMorphologyLevel("amino")};
 const reinforced=Object.entries(state.cuisineReinforcement||{}).filter(([,n])=>n>=3).map(([id])=>id);
 const traits=[];
 if(levels.mineral)traits.push(levels.mineral>=4?"fortress carapace":levels.mineral>=2?"crystalline armour":"mineral nodules");
 if(levels.amino)traits.push(levels.amino>=4?"apex feeding limbs":levels.amino>=2?"dense contractile frame":"contractile fibres");
 if(levels.lipid)traits.push(levels.lipid>=4?"integrated energy lobes":levels.lipid>=2?"elastic vacuolar body":"lipid vesicles");
 if(levels.spore)traits.push(levels.spore>=4?"multispecies brood crown":levels.spore>=2?"distributed symbiotic buds":"spore pores");
 if(levels.pigment)traits.push(levels.pigment>=4?"dynamic chromatic language":levels.pigment>=2?"photoreactive bands":"pigment vesicles");
 for(const id of reinforced){const c=cuisineDefinition(id);if(c)traits.push(`conditioned ${c.morph}`)}
 return{levels,reinforced,traits:[...new Set(traits)]};
}
function morphologyName(){
 const stage=morphologyStage(),style=lineageStyle().id;
 const base=["Ancestral Cell","Differentiated Microform","Specialised Organism","Integrated Body Plan","Chitinous Ascendant","Brood Apex"][stage];
 const suffix={predator:"Hunter",nomad:"Drifter",symbiote:"Collective",architect:"Niche-Builder",observer:"Seer",scavenger:"Reclaimer"}[style]||"Lineage";
 return `${base} · ${suffix}`;
}
function drawMorphology(x,y,r,main,isPlayer=true,entity=null){
 const stage=isPlayer?morphologyStage():Math.min(4,Math.max(0,Math.floor(Math.log2((entity?.mass||1)+1))));
 const phase=isPlayer?state.tick*.035:(entity?.phase||0),dark="#10271f",light="#e8ffda";
 const has=id=>isPlayer?gene(id):false;
 const sym=isPlayer?(state.symbionts||[]):entity?.module?[entity.module]:[];const profile=isPlayer?morphologyProfile():{levels:{mineral:0,spore:0,pigment:0,lipid:0,amino:0},reinforced:[]};
 ctx.save();ctx.translate(x,y);ctx.rotate(isPlayer?Math.atan2(state.vy,state.vx||.001)*.12:Math.atan2(entity?.vy||0,entity?.vx||.001)*.16);
 const breathe=1+Math.sin(phase)*.025;ctx.scale(breathe,1/breathe);
 ctx.shadowBlur=isPlayer?13:6;ctx.shadowColor=main;
 // Late morphology becomes an original chitinous swarm body, assembled from progression.
 if(stage>=4){
   ctx.fillStyle=main;ctx.beginPath();ctx.moveTo(r*1.35,0);ctx.bezierCurveTo(r*.55,-r*1.05,-r*.7,-r*.9,-r*1.25,-r*.25);ctx.bezierCurveTo(-r*.85,r*.85,r*.55,r*1.05,r*1.35,0);ctx.fill();
   ctx.fillStyle="#18251f";for(let i=0;i<4;i++){const px=-r*.55+i*r*.32;ctx.beginPath();ctx.ellipse(px,0,r*.28,r*.78,0,0,Math.PI*2);ctx.fill()}
   ctx.strokeStyle=light;ctx.lineWidth=Math.max(1,r*.07);for(let i=-2;i<=2;i++){const px=i*r*.27;ctx.beginPath();ctx.moveTo(px,-r*.62);ctx.lineTo(px-r*.16,-r*(1.08+Math.abs(i)*.08));ctx.stroke()}
   // Hooked forelimbs / feeding claws.
   ctx.strokeStyle=main;ctx.lineWidth=Math.max(2,r*.13);for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(r*.55,side*r*.35);ctx.quadraticCurveTo(r*1.25,side*r*.75,r*1.05,side*r*1.25);ctx.quadraticCurveTo(r*.75,side*r*1.05,r*.68,side*r*.74);ctx.stroke()}
   if(stage>=5){
     // Brood buds and dorsal crown make the final body unmistakably transformed.
     for(let i=-1;i<=1;i++)circle(-r*.82+i*r*.22,-r*.54-Math.abs(i)*r*.12,r*.18,main,light,1);
     ctx.strokeStyle="#d8b5ff";ctx.globalAlpha=.7+.2*Math.sin(phase*1.7);ctx.beginPath();ctx.arc(-r*.1,0,r*.56,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
   }
 }else if(stage===3){
   ctx.fillStyle=main;ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rr=r*(i%2?1:.82);const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();
 }else if(stage===2){
   ctx.fillStyle=main;ctx.beginPath();ctx.ellipse(0,0,r*1.15,r*.82,0,0,Math.PI*2);ctx.fill();
 }else{circle(0,0,r,main,light,isPlayer?2:1)}
 ctx.shadowBlur=0;
 // Progressive anatomy, all driven by actual genes.
 if(stage>=1||has("chemical sensing")){ctx.strokeStyle=light;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-r*.72,side*r*.18);ctx.quadraticCurveTo(-r*1.22,side*r*.45,-r*1.45,side*r*.2);ctx.stroke()}}
 if(has("cilia")){ctx.strokeStyle=light;for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(i*r*.18,r*.72);ctx.lineTo(i*r*.21,r*(1.05+(i%2)*.08));ctx.stroke()}}
 if(has("pseudopods")||stage>=3){ctx.fillStyle=main;for(const side of [-1,1])ctx.fillRect(-r*.15+side*r*.75,r*.42,r*.7*side,r*.16)}
 if(has("armoured cortex")||stage>=4){ctx.strokeStyle="#f2d4a8";ctx.lineWidth=Math.max(2,r*.1);ctx.setLineDash([r*.28,r*.12]);ctx.beginPath();ctx.arc(0,0,r*.84,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
 if(has("toxin organelle")){ctx.shadowBlur=8;ctx.shadowColor="#dba0ff";circle(-r*.18,r*.3,r*.22,"#dba0ff","#f5ddff",1);ctx.shadowBlur=0}
 if(has("photosymbiosis")){for(let i=0;i<4;i++){const a=i/4*Math.PI*2;circle(Math.cos(a)*r*.48,Math.sin(a)*r*.48,r*.12,"#ffd66a")}}
 if(has("segmented body")&&stage<4){ctx.strokeStyle=dark;ctx.lineWidth=Math.max(1,r*.08);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.25,-r*.65);ctx.lineTo(i*r*.25,r*.65);ctx.stroke()}}
 // Permanent biochemical anatomy: fixed Atlas nodes physically remodel the body.
 if(isPlayer&&profile.levels.mineral){const n=profile.levels.mineral;ctx.strokeStyle=n>=3?"#fff0d1":"#f2b38d";ctx.lineWidth=Math.max(1.5,r*(.055+n*.012));for(let i=0;i<4+n;i++){const a=i/(4+n)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.76,Math.sin(a)*r*.76);ctx.lineTo(Math.cos(a)*r*(.94+n*.07),Math.sin(a)*r*(.94+n*.07));ctx.stroke()}}
 if(isPlayer&&profile.levels.amino){const n=profile.levels.amino;ctx.strokeStyle="#91ff9c";ctx.lineWidth=Math.max(2,r*(.07+n*.018));for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(r*.22,side*r*.42);ctx.quadraticCurveTo(r*(.85+n*.1),side*r*(.58+n*.05),r*(.92+n*.08),side*r*(.92+n*.08));ctx.stroke()}}
 if(isPlayer&&profile.levels.lipid){const n=profile.levels.lipid;for(let i=0;i<Math.min(6,2+n);i++){const a=i/Math.min(6,2+n)*Math.PI*2+phase*.08;circle(Math.cos(a)*r*.52,Math.sin(a)*r*.52,r*(.09+n*.018),"rgba(255,214,106,.72)","#fff4bd",1)}}
 if(isPlayer&&profile.levels.spore){const n=profile.levels.spore;for(let i=0;i<2+n;i++){const a=Math.PI+(i/(1+n)-.5)*1.45;const rr=r*(.82+n*.035);circle(Math.cos(a)*rr,Math.sin(a)*rr,r*(.07+n*.014),"#ddb477","#fff0cd",1)}}
 if(isPlayer&&profile.levels.pigment){const n=profile.levels.pigment;ctx.strokeStyle=n>=4?`hsl(${(state.tick*2)%360} 90% 72%)`:"#7de0ff";ctx.globalAlpha=.55+.15*Math.sin(phase*1.4);ctx.lineWidth=Math.max(1.5,r*.065);for(let i=0;i<n+1;i++){ctx.beginPath();ctx.arc(0,0,r*(.34+i*.12),-.8,.8);ctx.stroke()}ctx.globalAlpha=1}
 // Sensor cluster replaces the old static cartoon eye as complexity rises.
 const eyes=stage>=4?3:1;for(let i=0;i<eyes;i++){const ey=-r*.26+i*r*.26-(eyes-1)*r*.13;circle(r*.48,ey,r*(stage>=4?.11:.16),light);circle(r*.51,ey,r*.045,"#06100c")}
 sym.forEach((id,i)=>drawModuleAt(0,0,r,id,i,sym.length));
 if((isPlayer&&(moduleCount("pulse")||has("electroreception")))){ctx.strokeStyle="#7de0ff";ctx.globalAlpha=.45+.2*Math.sin(state.tick*.08);ctx.beginPath();ctx.arc(0,0,r*1.45,0,Math.PI*2);ctx.stroke()}
 if(isPlayer){
  const cuisine=activeCuisine(),disorder=activeDisorder();
  if(cuisine?.id==="crystal_skin"){ctx.strokeStyle="#e8fbff";ctx.lineWidth=Math.max(1,r*.08);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r*1.18,Math.sin(a)*r*1.18);ctx.stroke()}}
  if(cuisine?.id==="adaptive_biofilm"){ctx.strokeStyle="#8cffc4";ctx.globalAlpha=.5;ctx.lineWidth=Math.max(2,r*.12);ctx.beginPath();ctx.arc(0,0,r*1.08,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  if(cuisine?.id==="contractile_burst"){ctx.strokeStyle="#91ff9c";ctx.lineWidth=Math.max(1,r*.06);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-r*.6,i*r*.2);ctx.lineTo(r*.65,i*r*.16);ctx.stroke()}}
  if(cuisine?.id==="floating_bloom"){for(let i=0;i<4;i++){const a=i/4*Math.PI*2+phase*.2;circle(Math.cos(a)*r*.58,Math.sin(a)*r*.58,r*.13,"#ffd66a","#fff4bd",1)}}
  if(cuisine?.id==="living_colony_cuisine"){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;circle(Math.cos(a)*r*.92,Math.sin(a)*r*.92,r*.1,"#ddb477")}}
  if(cuisine?.id==="warning_coloration"||disorder?.id==="chromatic_overexpression"){ctx.strokeStyle="#ffb6e8";ctx.lineWidth=Math.max(2,r*.12);for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*r*.25,-r*.72);ctx.lineTo(i*r*.25,r*.72);ctx.stroke()}}
  if(disorder?.id==="spore_toxicity"){for(let i=0;i<7;i++){const a=i/7*Math.PI*2+phase*.15;circle(Math.cos(a)*r*1.12,Math.sin(a)*r*1.12,r*.055,"#b89a6a")}}
  if(disorder?.id==="mineral_saturation"){ctx.fillStyle="#c77c5d";for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.fillRect(Math.cos(a)*r*.72-2,Math.sin(a)*r*.72-2,r*.22,r*.22)}}
  if(disorder?.id==="protein_overload"){ctx.strokeStyle="#ff9b8b";ctx.lineWidth=Math.max(2,r*.1);ctx.beginPath();ctx.ellipse(0,0,r*1.12,r*.72,0,0,Math.PI*2);ctx.stroke()}
  if(disorder?.id==="lipid_storage"){ctx.fillStyle="rgba(255,214,106,.28)";ctx.beginPath();ctx.ellipse(-r*.2,0,r*.92,r*.78,0,0,Math.PI*2);ctx.fill()}
  if(disorder?.id==="glycolytic_crash"){ctx.globalAlpha=.4+.25*Math.sin(phase*4);ctx.fillStyle="#ffb6a6";ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(disorder){ctx.strokeStyle="#ff7777";ctx.globalAlpha=.35+.18*Math.sin(phase*2);ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(0,0,r*1.28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}
 }
 ctx.restore();
}

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
 const module=Math.random()<.72?randomModule().id:null;
 const moduleAxis=moduleById(module)?.axis;
 const defense=moduleAxis==="resilience"?choice(["shell","mucus"]):moduleAxis==="innovation"?choice(["pulse","toxin"]):moduleAxis==="adaptability"?"camouflage":mass>1.45?"shell":choice(["mucus","toxin","camouflage","pulse"]);
 return{id:Math.random().toString(36).slice(2),x:rand(30,WORLD-30),y:rand(30,WORLD-30),vx:0,vy:0,mass,energy:rand(45,95),health:rand(60,100),hunger:rand(5,70),fear:rand(.1,.9),curiosity:rand(.1,.9),aggression:rand(.08,.72),state:"wander",target:null,stateTimer:0,phase:rand(0,6.28),color:choice(["#7de0ff","#8cff9c","#ffd66a","#ff7777","#dba0ff"]),module,defense,stuck:0,stunned:0,flash:0,age:rand(0,1800),fertility:rand(.2,1),cooldown:rand(0,700),lineage:Math.floor(rand(1,9999)),role:null,school:null,signal:0};
}
function populate(){state.organisms=[];for(let i=0;i<ECO_CONFIG.targetOrganisms;i++)state.organisms.push(makeOrganism())}
function nearestResource(x,y){let best=null,d=Infinity;for(const r of state.resources){const q=Math.hypot(r.x-x,r.y-y);if(q<d){d=q;best=r}}return best?{o:best,d}:null}
function nearestCarcass(x,y){let best=null,d=Infinity;for(const c of state.carcasses){if(c.biome!==state.biome)continue;const q=Math.hypot(c.x-x,c.y-y);if(q<d){d=q;best=c}}return best?{o:best,d}:null}
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
 const corpse=nearestCarcass(o.x,o.y),role=o.role||organismRole(o);o.role=role;
 if(o.hunger>38&&corpse&&corpse.d<330&&role!=="producer"){o.state="scavenge";o.target=corpse.o.id;o.stateTimer=300;return}
 const partner=nearestOrganism(o,q=>q.health>45&&q.module&&q.module!==o.module&&q.curiosity>.45&&Math.abs(q.mass-o.mass)<Math.max(.5,o.mass*.7));
 if(o.curiosity>.72&&o.energy>58&&partner&&partner.d<220&&Math.random()<.16){o.state="mergeOther";o.target=partner.o.id;o.stateTimer=240;return}
 const mate=nearestOrganism(o,q=>q.health>55&&q.energy>55&&q.cooldown<=0&&Math.abs(q.mass-o.mass)<Math.max(.35,o.mass*.45));
 if(o.energy>72&&o.health>65&&o.cooldown<=0&&mate&&mate.d<250&&Math.random()<.32){o.state="court";o.target=mate.o.id;o.stateTimer=260;return}
 if((role==="social"||o.school)&&Math.random()<.35){const peer=nearestOrganism(o,q=>(q.school&&q.school===o.school)||(!o.school&&q.role==="social"));if(peer&&peer.d<340){o.state="school";o.target=peer.o.id;o.stateTimer=260;return}}
 const food=nearestResource(o.x,o.y);
 if(o.hunger>35&&food&&food.d<300){o.state="forage";o.target=state.resources.indexOf(food.o);o.stateTimer=260;return}
 if(role==="producer"&&Math.random()<.35){o.state="settle";o.target=null;o.stateTimer=rand(260,520);return}
 o.state="wander";o.target=null;o.stateTimer=rand(180,420);
}
function updateOrganism(o){
 if(o.flash>0)o.flash--;if(o.stunned>0){o.stunned--;o.vx*=.7;o.vy*=.7;return}if(o.stuck>0)o.stuck--;
 o.stateTimer--;o.phase+=.025;o.age++;o.cooldown=Math.max(0,(o.cooldown||0)-1);o.signal=Math.max(0,(o.signal||0)-1);if(state.tick%120===0){o.hunger=clamp(o.hunger+1.5);o.energy=clamp(o.energy-.7);if(o.age>7200)o.health-=.8}
 if(o.stateTimer<=0)chooseIntent(o);
 let tx=0,ty=0,pdx=state.x-o.x,pdy=state.y-o.y,pd=Math.hypot(pdx,pdy)||1;
 if(o.state==="huntPlayer"||o.state==="inspectPlayer"){tx=pdx/pd;ty=pdy/pd}
 else if(o.state==="fleePlayer"){tx=-pdx/pd;ty=-pdy/pd}
 else if(o.state==="wander"){tx=Math.sin(o.phase*.8);ty=Math.cos(o.phase*.57)}
 else if(o.state==="rest"||o.state==="settle"){tx=0;ty=0;o.energy=clamp(o.energy+(o.state==="settle"?.04:.025));o.health=clamp(o.health+.012);if(o.state==="settle"&&state.tick%180===0)addPatch("microbial",o.x,o.y,1.2);if(o.state==="rest"&&state.tick%420===0)addPatch(o.module==="phototroph"?"microbial":"conditioned",o.x,o.y,.5)}
 else if(o.state==="forage"){const r=state.resources[o.target];if(r){const d=Math.hypot(r.x-o.x,r.y-o.y)||1;tx=(r.x-o.x)/d;ty=(r.y-o.y)/d}else o.stateTimer=0}
 else if(o.state==="scavenge"){const c=state.carcasses.find(x=>x.id===o.target);if(c){const d=Math.hypot(c.x-o.x,c.y-o.y)||1;tx=(c.x-o.x)/d;ty=(c.y-o.y)/d}else o.stateTimer=0}
 else if(o.state==="court"||o.state==="school"||o.state==="mergeOther"){const q=state.organisms.find(x=>x.id===o.target);if(q){const d=Math.hypot(q.x-o.x,q.y-o.y)||1;tx=(q.x-o.x)/d;ty=(q.y-o.y)/d;if(o.state==="school"&&d<55){tx+=(q.vx-o.vx)*.15;ty+=(q.vy-o.vy)*.15}}else o.stateTimer=0}
 else{const q=state.organisms.find(x=>x.id===o.target);if(q){const d=Math.hypot(q.x-o.x,q.y-o.y)||1,s=o.state==="fleeOther"?-1:1;tx=(q.x-o.x)/d*s;ty=(q.y-o.y)/d*s}else o.stateTimer=0}
 const speed=Math.pow(o.mass,-.14)*(o.stuck>0?.28:1);o.vx=(o.vx+tx*.05*speed)*.92;o.vy=(o.vy+ty*.05*speed)*.92;o.x=clamp(o.x+o.vx,20,WORLD-20);o.y=clamp(o.y+o.vy,20,WORLD-20);
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
     q.health-=12+o.mass/q.mass*4;q.flash=8;o.energy=clamp(o.energy+7);o.hunger=clamp(o.hunger-18);o.stateTimer=0;state.ecosystem.hunts++;focusEvent((o.x+q.x)/2,(o.y+q.y)/2,130);
     if(q.health>0&&Math.random()<.24){const defensive=q.module==="electrogen"?"pulse":q.module==="detoxer"?"toxin":"mucus";addEffect(defensive,q.x,q.y,defensive==="pulse"?105:78,.7,defensive==="pulse"?110:320,"other");o.stuck=defensive==="mucus"?24:o.stuck;o.stunned=defensive==="pulse"?20:o.stunned;if(defensive==="toxin")o.health-=4;q.state="fleeOther";q.target=o.id;q.stateTimer=200}
     if(q.health<=0){killOrganism(q,"predation");state.ecosystem.deaths++}
   }
 }
 if(o.state==="scavenge"){
   const c=state.carcasses.find(x=>x.id===o.target);
   if(c&&Math.hypot(c.x-o.x,c.y-o.y)<radius(o.mass)+10){const bite=Math.min(c.nutrition,8+o.mass*3);c.nutrition-=bite;o.energy=clamp(o.energy+bite);o.hunger=clamp(o.hunger-bite*1.4);o.stateTimer=0;burst(c.x,c.y,"#d7a66b",4,1);if(c.nutrition<=0)state.carcasses=state.carcasses.filter(x=>x!==c)}
 }
 if(o.state==="mergeOther"){
   const q=state.organisms.find(x=>x.id===o.target);
   if(q&&Math.hypot(q.x-o.x,q.y-o.y)<radius(o.mass)+radius(q.mass)+7){
     const success=(o.curiosity+q.curiosity+Math.random())>(o.aggression+q.aggression+.65);
     if(success){const host=o.mass>=q.mass?o:q,guest=host===o?q:o;host.mass=clamp(host.mass+guest.mass*.22,.25,8);if(!host.module&&guest.module)host.module=guest.module;else if(host.module&&guest.module&&Math.random()<.4)host.color=guest.color;removeOrganism(guest);state.ecosystem.mergers++;addPatch("nursery",host.x,host.y,4);burst(host.x,host.y,moduleById(host.module)?.color||"#dba0ff",20,2.3);focusEvent(host.x,host.y,190)}
     else{addEffect("alarm",(o.x+q.x)/2,(o.y+q.y)/2,90,.7,180,"shared");o.state="fleeOther";o.target=q.id;q.state="fleeOther";q.target=o.id;o.stateTimer=q.stateTimer=180}
   }
 }
 if(o.state==="court"){
   const q=state.organisms.find(x=>x.id===o.target);
   if(q&&q.cooldown<=0&&Math.hypot(q.x-o.x,q.y-o.y)<radius(o.mass)+radius(q.mass)+8&&state.organisms.length<ECO_CONFIG.maxOrganisms){
     const child=makeOrganism();child.x=(o.x+q.x)/2+rand(-20,20);child.y=(o.y+q.y)/2+rand(-20,20);child.mass=clamp((o.mass+q.mass)/2*rand(.72,.9),.25,5);child.color=Math.random()<.5?o.color:q.color;child.module=Math.random()<.46?(o.module||q.module):null;child.aggression=clamp((o.aggression+q.aggression)/2+rand(-.1,.1),0,1);child.curiosity=clamp((o.curiosity+q.curiosity)/2+rand(-.1,.1),0,1);child.school=o.school||q.school||`s${Math.floor(rand(1,999))}`;child.lineage=o.lineage;o.cooldown=q.cooldown=1200;state.organisms.push(child);state.ecosystem.births++;addPatch("nursery",child.x,child.y,3);burst(child.x,child.y,"#e8ffda",16,1.8);focusEvent(child.x,child.y,180);o.stateTimer=q.stateTimer=0
   }
 }
 if(o.health<=0||o.energy<=0){killOrganism(o,o.age>7200?"senescence":"starvation");state.ecosystem.deaths++}
}
function damage(n){n/=phenotype().defense;state.health=clamp(state.health-n);toast("ECOLOGICAL INJURY");if(state.health<=0){state.health=35;state.energy=25;state.water=30;state.mass=Math.max(.7,state.mass*.6);state.x=WORLD/2;state.y=WORLD/2;if(state.camera){state.camera.lookX=0;state.camera.lookY=0;state.camera.eventTimer=0}log("The lineage persisted through a reduced surviving propagule.")}}

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
   else{state.inventory[r.type]++;checkDevelopmentalThresholds();log(`${FOOD[r.type].name} stored for future development.`)}
   rememberDiet(r.type,.55);addPressure(FOOD[r.type].axis,.5);addXP(gene("pseudopods")?6:5,`Resource acquired: ${FOOD[r.type].name}`);state.resources.splice(i,1);save();
  }
 }
}
let lastPackConsumeAt=0;
function consumeResource(type){
 const now=performance.now();if(now-lastPackConsumeAt<240)return;
 if(!state.inventory[type]){toast("PACK RESOURCE DEPLETED");return}
 lastPackConsumeAt=now;
 const beforeEnergy=state.energy;
 state.inventory[type]--;checkDevelopmentalThresholds(false);state.energy=clamp(state.energy+FOOD[type].energy*phenotype().foodYield);rememberDiet(type,1.5);recordNutritionalConsumption(type);addPressure(FOOD[type].axis,1.1);
 const gained=Math.max(0,Math.round(state.energy-beforeEnergy));log(`${FOOD[type].name} consumed from Pack · +${gained} energy.`);renderAll();save()
}
function spendAdapt(axis){
 if(state.adaptPoints<=0)return;state.adaptPoints--;state.axes[axis]++;atlasDirty=true;log(`${AXES[axis].name} permanently increased.`);renderAll();save()
}
function movementTarget(x,y){state.target={x,y};state.mode="move";renderMode()}
function forageToggle(){state.mode=state.mode==="forage"?"observe":"forage";state.target=null;renderAll()}
function restToggle(){state.mode=state.mode==="rest"?"observe":"rest";state.target=null;renderAll();if(state.mode==="rest")addPressure("resilience",.2)}

function burst(x,y,color,count=12,speed=2.2){
 for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),v=rand(.4,speed);state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(25,60),color,size:rand(1.5,4)})}
}
function addEffect(type,x,y,radius=95,power=1,life=600,owner="player"){
 state.effects.push({id:Math.random().toString(36).slice(2),type,x,y,radius,power,life,owner,phase:rand(0,6.28)});
 burst(x,y,EFFECT_TYPES[type].color,14,2.6)
}
function nearestNiche(x,y,range=90){return state.niches.find(n=>n.biome===state.biome&&Math.hypot(n.x-x,n.y-y)<range)}
function conditionNiche(){
 let n=nearestNiche(state.x,state.y,75);
 if(!n){n={id:Math.random().toString(36).slice(2),x:state.x,y:state.y,biome:state.biome,strength:0,rests:0,type:moduleCount("light")?"PHOTIC MAT":moduleCount("detox")?"DETOX BED":"MUCUS NEST"};state.niches.push(n);log(`A new ${n.type.toLowerCase()} began forming.`)}
 n.strength=clamp(n.strength+.24,0,100);addPatch("conditioned",n.x,n.y,.35);n.rests++;n.milestones=Array.isArray(n.milestones)?n.milestones:[];
 for(const mark of [10,25,50,75,100])if(n.strength>=mark&&!n.milestones.includes(mark)){n.milestones.push(mark);addXP(mark===100?8:3,`The local niche reached ${mark}% conditioning`);burst(n.x,n.y,"#8cff9c",9+Math.floor(mark/10),1.1)}
}
function nicheBonus(){
 const n=nearestNiche(state.x,state.y,110);return n?1+n.strength/125:1
}
function removeOrganism(o){state.organisms=state.organisms.filter(q=>q!==o)}
function integrateModule(o,forced=false){
 const id=o.module||randomModule().id,m=moduleById(id);
 if(state.symbionts.length>=6){state.energy=clamp(state.energy+12);log(`${m.name} was digested because all integration sites were occupied.`);return false}
 if(state.symbionts.filter(x=>x===id).length>=2){state.energy=clamp(state.energy+10);log(`${m.name} could not establish another stable copy and was metabolised.`);return false}
 state.symbionts.push(id);state.mass*=1.08;addPressure(m.axis,3);addXP(18,`${m.name} became a visible living module`);
 burst(state.x,state.y,m.color,24,3.2);toast(`${m.name.toUpperCase()} INTEGRATED`);return true
}
function loseModule(toOrganism){
 if(!state.symbionts.length)return false;
 const i=Math.floor(Math.random()*state.symbionts.length),id=state.symbionts.splice(i,1)[0],m=moduleById(id);
 if(toOrganism&&!toOrganism.module)toOrganism.module=id;
 burst(state.x,state.y,m.color,20,2.8);log(`${m.name} was captured by another organism.`);toast("LIVING MODULE LOST");return true
}
function nearbyOrganism(){
 return [...state.organisms].sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0]
}
function d20(){return Math.floor(Math.random()*20)+1}
function spendEnergy(requested){
 const before=state.energy;state.energy=clamp(state.energy-Math.max(0,requested));return Math.round(before-state.energy)
}
function restoreHealth(requested){
 const before=state.health;state.health=clamp(state.health+Math.max(0,requested));return Math.round(state.health-before)
}
function encounterModifier(axis){return Math.floor((derivedAxis(axis)-1)/2)}
function mergeSupplyType(o){
 const moduleAxis=moduleById(o?.module)?.axis;
 if(moduleAxis==="power")return"amino";
 if(moduleAxis==="resilience")return"mineral";
 if(moduleAxis==="communication"||moduleAxis==="cognition")return"pigment";
 if(moduleAxis==="innovation")return"spore";
 if(moduleAxis==="adaptability")return"lipid";
 return o?.mass>state.mass?"amino":o?.curiosity>.6?"pigment":"sugar"
}
function addMergeSupplies(o,count=2){
 const primary=mergeSupplyType(o),pool=[primary,primary,"sugar","lipid","amino","mineral","pigment","spore"],gained={};
 for(let i=0;i<count;i++){const type=choice(pool);state.inventory[type]=(state.inventory[type]||0)+1;gained[type]=(gained[type]||0)+1}
 checkDevelopmentalThresholds();return Object.entries(gained).map(([type,n])=>`${n}× ${FOOD[type].name}`).join(", ")
}
function relationScore(o){
 return (derivedAxis("communication")*1.4+derivedAxis("cognition")*.9+state.health/25)
       -(o.aggression*7+o.hunger/18)+(gene("quorum signal")?3:0)+(gene("cooperative exchange")?4:0);
}
const ORGANISM_DEFENSES={
 shell:{name:"MINERAL SHELL",roll:3,desc:"Rigid plating resists enclosure and impact."},
 mucus:{name:"ADHESIVE MUCUS",roll:2,desc:"A viscous secretion impedes pursuit and capture."},
 toxin:{name:"REACTIVE TOXIN",roll:2,desc:"Contact triggers a damaging chemical discharge."},
 pulse:{name:"BIOELECTRIC PULSE",roll:2,desc:"A rapid field discharge disrupts nearby membranes."},
 camouflage:{name:"CHROMATIC EVASION",roll:1,desc:"The organism breaks target lock and escapes."}
};
function organismDefense(o){return ORGANISM_DEFENSES[o?.defense]||ORGANISM_DEFENSES.mucus}
function applyOrganismDefense(o){
 const d=organismDefense(o);let detail=d.desc;
 if(o.defense==="toxin"){const harm=Math.max(2,Math.round((3+o.aggression*6)/phenotype().defense));state.health=clamp(state.health-harm);detail+=` The discharge removed ${harm} health.`;addEffect("toxin",o.x,o.y,70,Math.max(.7,o.aggression),260,"other")}
 else if(o.defense==="mucus"){const loss=3;state.energy=clamp(state.energy-loss);state.vx*=.4;state.vy*=.4;detail+=` Escaping the adhesive field cost ${loss} energy.`;addEffect("mucus",o.x,o.y,78,1,300,"other")}
 else if(o.defense==="pulse"){const loss=4;state.energy=clamp(state.energy-loss);state.vx*=.25;state.vy*=.25;detail+=` Membrane recovery cost ${loss} energy.`;addEffect("pulse",o.x,o.y,90,1,120,"other")}
 else if(o.defense==="camouflage"){o.state="fleePlayer";o.stateTimer=380;detail+=" Its outline dissolved into the substrate pattern."}
 else{o.flash=8;detail+=" The plating absorbed much of the force."}
 return `${d.name}: ${detail}`
}
function showEncounter(title,odds,playerRoll,otherRoll,text,playerGood=true,icon="⌁",playerLabel="YOUR RESPONSE",otherLabel="OTHER ORGANISM"){
 state.encounter={title,odds,playerRoll,otherRoll,text};
 $("encounterTitle").textContent=title;$("encounterOdds").textContent=odds;
 $("encounterRolls").innerHTML=`<div class="roll-card ${playerGood?"good":"bad"}"><span>${playerLabel}</span><b>${playerRoll}</b></div><div class="roll-card ${playerGood?"bad":"good"}"><span>${otherLabel}</span><b>${otherRoll}</b></div>`;
 $("encounterText").textContent=text;$("encounterOutcomeIcon").textContent=icon;$("encounterPanel").hidden=false;
}
function closeEncounter(){$("encounterPanel").hidden=true;state.encounter=null;save()}
function fleeFrom(o){
 const d=Math.hypot(state.x-o.x,state.y-o.y)||1;
 movementTarget(clamp(state.x+(state.x-o.x)/d*220,20,WORLD-20),clamp(state.y+(state.y-o.y)/d*220,20,WORLD-20));
 state.mode="move";addPressure("mobility",1.5);
}
function interact(){
 if(state.encounter||state.interactionTarget)return;
 const near=nearbyOrganism(),range=phenotype().interactionRange;
 if(!near||Math.hypot(near.x-state.x,near.y-state.y)>range){toast("NO ORGANISM IN RANGE");return}
 state.interactionTarget=near.id;
 const mod=moduleById(near.module);
 $("interactionTargetName").textContent=mod?`${mod.icon} ${mod.name.toUpperCase()}`:"UNSPECIALISED ORGANISM";
 const tier=inspectionTier();
 $("interactionTargetInfo").textContent=tier>=3?`mass ${near.mass.toFixed(1)} · health ${Math.round(near.health)} · ${near.aggression>.5?"reactive":"cautious"}`:tier>=2?`${near.health>75?"vigorous":near.health>40?"impaired":"critically weakened"} · ${near.aggression>.5?"reactive":"cautious"}`:`${near.mass<state.mass*.7?"smaller":near.mass>state.mass*1.35?"larger":"similar-sized"} organism · chemistry unresolved`;
 $("interactionMenu").hidden=false;state.mode="observe"
}
function cancelInteraction(){$("interactionMenu").hidden=true;state.interactionTarget=null}
function resolveIntent(intent){
 const near=state.organisms.find(o=>o.id===state.interactionTarget);cancelInteraction();
 if(!near){toast("TARGET MOVED AWAY");return}
 const size=state.mass/(near.mass||1),chem=encounterModifier("communication")+encounterModifier("cognition")+(gene("chemical sensing")?2:0)+moduleCount("signal");
 const force=encounterModifier("power")+Math.floor(size*2)+(gene("pseudopods")?2:0);
 const defense=organismDefense(near);
 const p=d20()+(intent==="signal"||intent==="merge"?chem:force),o=d20()+Math.floor(near.aggression*5)+Math.floor(near.mass/state.mass*2)+defense.roll;
 let title="",text="",icon="⌁",good=true;
 if(intent==="signal"){state.lineageActions.signals++;
   if(p>=o+3){const gain=6+moduleCount("signal")*2;state.energy=clamp(state.energy+gain);addPressure("communication",2);near.state="inspectPlayer";near.stateTimer=260;title="RECIPROCAL SIGNAL";text=`Molecular patterns matched. Metabolites and hazard information were exchanged, restoring ${gain} energy.`;icon="⇄";addEffect("nutrient",near.x,near.y,70,1,300,"shared");addXP(6,"Reciprocal communication succeeded")}
   else if(p>=o-2){title="UNCERTAIN RECOGNITION";text="Both organisms circled and sampled each other's chemistry, but neither committed to exchange.";icon="?"
   }else{const harm=Math.round((3+near.aggression*5)/phenotype().defense);state.health=clamp(state.health-harm);fleeFrom(near);title="CHEMICAL REJECTION";text=`Recognition failed. You lost ${harm} health and retreated. ${applyOrganismDefense(near)}`;icon="†";good=false}
 }else if(intent==="merge"){state.lineageActions.mergers++;
   const compatibility=chem+Math.floor((1-Math.abs(1-size))*4)+(near.curiosity>.55?2:0);
   if(p+compatibility>=o+7){const requestedEnergy=Math.round(clamp(9+near.mass*2,10,18)),energySpent=spendEnergy(requestedEnergy),supplies=addMergeSupplies(near,3);integrateModule(near,true);removeOrganism(near);state.ecosystem.mergers++;addXP(10,"Stable endosymbiosis succeeded");title="STABLE ENDOSYMBIOSIS";text=`Fusion consumed ${energySpent} energy. The organism persists as a living module, while transferable reserves added ${supplies} to your pack.`;icon="◉"}
   else if(p+compatibility>=o+1){const energySpent=spendEnergy(7),supplies=addMergeSupplies(near,1);state.health=clamp(state.health-3);addPressure("innovation",1.5);near.state="fleePlayer";near.stateTimer=300;addXP(4,"Transient biological exchange succeeded");title="TRANSIENT FUSION";text=`The membranes separated after exchanging cytoplasm. You spent ${energySpent} energy and retained ${supplies} in your pack.`;icon="∞"}
   else{const energyCost=5;state.energy=clamp(state.energy-energyCost);const stolen=near.mass>state.mass*.9&&Math.random()<.45&&loseModule(near);const harm=Math.round((7+near.mass/state.mass*6)/phenotype().defense);state.health=clamp(state.health-harm);fleeFrom(near);title=stolen?"REVERSE ASSIMILATION":"FUSION REJECTED";text=(stolen?`The larger organism reversed the membrane flow, captured one of your living modules, cost ${energyCost} energy and inflicted ${harm} damage.`:`Fusion cost ${energyCost} energy, destabilised your membrane and caused ${harm} damage.`)+` ${applyOrganismDefense(near)}`;icon="◐";good=false}
 }else if(intent==="engulf"){state.lineageActions.engulfs++;
   if(p>=o){const requestedEnergy=Math.round(clamp(5+near.mass*2,6,14)),requestedHealth=Math.round(clamp(7+near.mass*7,8,28)),energySpent=spendEnergy(requestedEnergy),healthRestored=restoreHealth(requestedHealth);addPressure("power",2.2);state.lineageActions.hunts++;removeOrganism(near);state.ecosystem.hunts++;addXP(Math.round(7+near.mass*2),"Complete engulfment succeeded");title="COMPLETE ENGULFMENT";text=`The organism was enclosed and digested. Biomass restored ${healthRestored} health, while capture and digestion consumed ${energySpent} energy.`;icon="∨"
   }else{const energyCost=4,harm=Math.round((5+near.mass/state.mass*5)/phenotype().defense);state.energy=clamp(state.energy-energyCost);state.health=clamp(state.health-harm);if(Math.random()<.28)loseModule(near);fleeFrom(near);title="ENGULFMENT REVERSED";text=`The failed capture cost ${energyCost} energy. The target resisted and damaged your membrane for ${harm} health. ${applyOrganismDefense(near)}`;icon="◑";good=false}
 }else{
   const type=moduleCount("pulse")?"pulse":gene("toxin organelle")?"toxin":"mucus";
   addEffect(type,state.x,state.y,(type==="pulse"?135:105)*(1+(derivedAxis("communication")-1)*.025),1+derivedAxis("resilience")*.06,(type==="pulse"?150:620)*(1+(derivedAxis("innovation")-1)*.025),"player");
   addPressure(type==="mucus"?"resilience":"innovation",1.7);addXP(Math.round(4+near.aggression*3),"A defensive field was deployed successfully");title=EFFECT_TYPES[type].name;text=type==="mucus"?"A persistent adhesive field now slows and traps organisms entering this area.":type==="pulse"?"A bioelectric wave stunned nearby organisms and interrupted pursuit.":"A defensive toxin cloud now damages and deters nearby organisms.";icon=EFFECT_TYPES[type].icon;
   showEncounter(title,"deployed",Math.max(1,Math.round(derivedAxis("resilience"))),Math.max(1,Math.round(near.aggression*10)),text,true,icon,"FIELD STRENGTH","LOCAL THREAT");renderAll();save();return
 }
 showEncounter(title,good?"favourable":"danger",p,o,text,good,icon);renderAll();save()
}
function forageAI(){
 const threat=state.organisms.find(o=>o.mass>state.mass*1.2&&Math.hypot(o.x-state.x,o.y-state.y)<220);
 if(threat){const d=Math.hypot(state.x-threat.x,state.y-threat.y)||1;movementTarget(state.x+(state.x-threat.x)/d*180,state.y+(state.y-threat.y)/d*180);state.mode="forage";addPressure("mobility",.15);return}
 const r=nearestResource(state.x,state.y);if(r){movementTarget(r.o.x,r.o.y);state.mode="forage";addPressure("cognition",.05)}
}

function updateEffects(){
 for(const e of state.effects){
   e.life--;e.phase+=.08;
   const affected=state.organisms.filter(o=>Math.hypot(o.x-e.x,o.y-e.y)<e.radius);
   for(const o of affected){
     if(e.owner==="player"){
       if(e.type==="mucus"){o.stuck=Math.max(o.stuck,16);o.state="fleePlayer"}
       if(e.type==="pulse"){o.stunned=Math.max(o.stunned,18);o.flash=8}
       if(e.type==="toxin"&&state.tick%25===0){o.health-=2.5*e.power;o.flash=5}
       if(e.type==="alarm"){o.state="fleeOther";o.stateTimer=160}
     }
   }
   if(e.owner==="other"&&Math.hypot(state.x-e.x,state.y-e.y)<e.radius&&state.tick%30===0){
     if(e.type==="toxin")damage(1.3*e.power);
     if(e.type==="mucus"){state.vx*=.65;state.vy*=.65;addPressure("mobility",.15)}
   }
 }
 state.effects=state.effects.filter(e=>e.life>0);
 state.organisms=state.organisms.filter(o=>o.health>0);
}
function updateParticles(){
 for(const q of state.particles){q.x+=q.vx;q.y+=q.vy;q.vx*=.96;q.vy*=.96;q.life--}
 state.particles=state.particles.filter(q=>q.life>0)
}
function ecologyTick(){
 const b=BIOMES[state.biome],p=phenotype(),tile=localTile(),beforeWater=state.water;
 const roughCost=tile.rough?1.22:1;
 if(state.mode==="rest"){
   const shelter=(tile.shelter?1.5:1)*nicheBonus();
   state.energy=clamp(state.energy+3.8*shelter);state.health=clamp(state.health+(gene("repair cycle")?4.8:2.8)*shelter);state.water=clamp(state.water-.1*p.waterUse)
 }else{
   state.energy=clamp(state.energy-(1.6+Math.log2(state.mass+1)*.22)*roughCost*p.energyUse);
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
 if((gene("photosymbiosis")||moduleCount("light"))&&b.light>55)state.energy=clamp(state.energy+2.4+moduleCount("light")*1.2);
 if(gene("thermal engine")&&(b.temp>45||b.temp<0))state.energy=clamp(state.energy+2.8);
 const lowFit=Math.max(0,35-fit());if(lowFit>0){state.lineageActions.harshCycles+=.01}if(lowFit>0)damage(lowFit*.05*(gene("detoxification") ? 0.6 : 1));
 if(state.energy<5||state.water<5)damage(3.5);
 Object.entries(b.pressure).forEach(([k,v])=>addPressure(k,v*.04));
 state.cycle++;
}

function nodeAvailable(node){
 return !gene(node.id)&&pathwayDiscovered(node)&&pathwayReserveMet(node)&&node.req.every(gene)&&Object.entries(node.min||{}).every(([a,v])=>derivedAxis(a)>=v)
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
 let s=derivedAxis(node.axis)*2+(state.pressures[node.axis]||0)*.45+(BIOMES[state.biome].pressure[node.axis]||0)*4+dietAxisBonus(node.axis)*.9+originBias(node.axis);
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
 Object.entries(state.epochFeed).forEach(([t,n])=>state.inventory[t]=Math.max(0,state.inventory[t]-n));checkDevelopmentalThresholds(false);
 if(id.startsWith("fallback:")){
   state.axes[node.axis]++;state.bodyPlan=node.name;atlasDirty=true;
 }else{
   state.genes.push(node.id);state.axes[node.axis]+=.5;state.bodyPlan=node.name;atlasDirty=true;
 }
 state.generation++;state.mass*=1.08+node.tier*.025;state.completedEpochs++;state.pendingEpochs=Math.max(0,state.pendingEpochs-1);
 state.epochFeed={};state.epochForecast=[];
 Object.keys(state.pressures).forEach(k=>state.pressures[k]*=.28);
 Object.keys(state.dietMemory).forEach(k=>state.dietMemory[k]*=.42);
 log(`Major evolution fixed: ${node.name}. ${node.effect}.`);toast(`NEW MORPHOLOGY · ${node.name.toUpperCase()}`);for(let i=0;i<22;i++)state.particles.push({x:state.x+rand(-20,20),y:state.y+rand(-20,20),vx:rand(-.7,.7),vy:rand(-.7,.7),life:30,size:rand(2,5),color:ORIGINS.find(o=>o.id===state.origin)?.color||"#8cff9c"});focusEvent(state.x,state.y,90);
 $("epochModal").classList.remove("visible");renderAll();save();
 if(state.pendingEpochs>0)setTimeout(openEpoch,350)
}
function migrate(){
 if(state.energy<10){toast("NOT ENOUGH ENERGY");return}
 state.energy-=10;state.lineageActions.migrations++;state.biome=(state.biome+1)%BIOMES.length;state.x=WORLD/2;state.y=WORLD/2;state.target=null;if(state.camera){state.camera.lookX=0;state.camera.lookY=0;state.camera.eventTimer=0}state.effects=[];state.resources=[];spawnFood(ECO_CONFIG.targetFood);populate();
 Object.entries(BIOMES[state.biome].pressure).forEach(([a,v])=>addPressure(a,v*2));
 addXP(15,`Migration into ${BIOMES[state.biome].name}`);renderAll();save()
}
function chooseOrigin(id){
 const o=ORIGINS.find(x=>x.id===id);state.origin=id;state.bodyPlan=o.name;Object.entries(o.axes).forEach(([a,v])=>state.axes[a]+=v);state.genes=[o.gene];atlasFocusCurrent();atlasDirty=true;
 $("originModal").classList.remove("visible");log(`Lineage founded as ${o.name}.`);renderAll();save()
}


function systemWeather(){
 const w=weatherDef();state.weather.timer--;state.weather.phase+=.006;
 if(state.weather.timer<=0){const choices=WEATHER.filter(x=>x.id!==w.id);const next=choice(choices);state.weather=makeWeather(next.id);log(`${next.name.toLowerCase()} moved across the ecosystem.`);toast(`${next.icon} ${next.name}`);if(next.id==="bloom")for(let i=0;i<Math.min(18,ECO_CONFIG.targetFood+20-state.resources.length);i++)spawnFood(1)}
 if(w.id==="rain"&&state.tick%100===0&&state.resources.length<ECO_CONFIG.targetFood+16)spawnFood(1);
 if(w.id==="spores"&&state.tick%150===0)addPatch("spore",rand(40,WORLD-40),rand(40,WORLD-40),5);
 if(w.id==="heat"&&state.tick%300===0)for(const o of state.organisms)o.energy=clamp(o.energy-.8);
}
function systemCarcasses(){
 for(const c of state.carcasses){c.age++;c.phase+=.02;c.nutrition=Math.max(0,c.nutrition-.002);if(c.age%500===0)addPatch("detritus",c.x,c.y,1)}
 state.carcasses=state.carcasses.filter(c=>c.nutrition>0&&c.age<9000)
}
function systemSuccession(){
 if(state.tick%180!==0)return;
 for(const p of state.patches){p.age++;p.phase+=.04;if(p.biome!==state.biome)continue;
   if(p.type==="detritus"&&p.strength>28)p.type="microbial";
   else if(p.type==="microbial"&&p.strength>55)p.type="mat";
   else if(p.type==="spore"&&p.strength>40)p.type="fungal";
   p.strength=clamp(p.strength+((p.type==="microbial"||p.type==="spore") ? 0.35 : 0.08),0,100)
 }
 state.patches=state.patches.filter(p=>p.age<9000||p.strength>45)
}
function systemCamera(){
 const c=state.camera;if(!c)return;
 // Keep the player centred. Idle awareness is represented by zoom, never unpredictable panning.
 c.eventX=c.eventY=null;c.eventTimer=0;
 c.lookX+=(0-c.lookX)*.12;c.lookY+=(0-c.lookY)*.12;
 const idle=state.mode==="rest"||(!state.target&&Math.hypot(state.vx,state.vy)<.12);
 const awareness=clamp((derivedAxis("communication")-1)/14,0,.28);
 const desired=idle?(state.mode==="rest"?.78-awareness:.88-awareness*.55):1;
 c.zoom+=(desired-c.zoom)*.025
}
function systemClock(){
 if(simulationPaused()||state.encounter||state.interactionTarget)return false;
 state.tick++;
 if(state.tick%20===0)renderTile();
 if(state.mode==="forage"&&state.tick%180===0)forageAI();
 return true
}
function systemPlayerMovement(){
 if(state.target&&state.mode!=="rest"){
  const dx=state.target.x-state.x,dy=state.target.y-state.y,d=Math.hypot(dx,dy)||1,sp=1.45*phenotype().speed;
  if(d<8){state.target=null;if(state.mode==="move")state.mode="observe"}
  else{state.vx+=(dx/d)*.09*sp;state.vy+=(dy/d)*.09*sp;addPressure("mobility",.001)}
 }
 state.vx*=.9;state.vy*=.9;
 if(state.mode!=="rest"){state.x=clamp(state.x+state.vx,20,WORLD-20);state.y=clamp(state.y+state.vy,20,WORLD-20)}
}
function systemWorldInteractions(){collect();updateEffects();updateParticles()}
function systemOrganismAI(){for(const organism of [...state.organisms])updateOrganism(organism)}
function systemNicheConditioning(){if(state.mode==="rest"&&state.tick%300===0)conditionNiche()}
function systemPopulation(){
 if(state.resources.length<ECO_CONFIG.targetFood&&state.tick%60===0)spawnFood(3);
 if(state.organisms.length<ECO_CONFIG.targetOrganisms&&state.tick%150===0)state.organisms.push(makeOrganism())
}
function systemPhysiology(){if(state.tick%300===0){ecologyTick();renderAll();save()}}
function simulateStep(){
 if(!systemClock())return;
 systemWeather();systemCamera();systemPlayerMovement();systemWorldInteractions();systemOrganismAI();systemCarcasses();systemSuccession();systemNicheConditioning();systemPopulation();systemPhysiology()
}

function sx(x){const c=cameraCenter();return canvas.width/2+(x-c.x)*cameraScale()}
function sy(y){const c=cameraCenter();return canvas.height/2+(y-c.y)*cameraScale()}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function circle(x,y,r,fill,stroke=null,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function worldLabel(x,y,text,color="#e8ffda"){ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.fillStyle="rgba(3,9,6,.72)";ctx.fillRect(x-ctx.measureText(text).width/2-3,y-8,ctx.measureText(text).width+6,11);ctx.fillStyle=color;ctx.fillText(text,x,y)}
function drawWorld(){
 const b=BIOMES[state.biome],z=cameraScale(),tile=95,halfW=canvas.width/(2*z),halfH=canvas.height/(2*z);
 const grad=ctx.createLinearGradient(0,0,0,canvas.height);grad.addColorStop(0,b.sky);grad.addColorStop(1,b.ground);ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let gy=Math.floor((state.y-halfH)/tile)-1;gy<=Math.ceil((state.y+halfH)/tile)+1;gy++)for(let gx=Math.floor((state.x-halfW)/tile)-1;gx<=Math.ceil((state.x+halfW)/tile)+1;gx++){
  const wx=gx*tile,wy=gy*tile,n=terrainType(gx,gy),x=sx(wx),y=sy(wy),size=tile*z+1;
  ctx.fillStyle=n<2?b.water:b.ground;ctx.fillRect(x,y,size,size);
  if(n<2){ctx.strokeStyle="rgba(255,255,255,.14)";ctx.beginPath();ctx.moveTo(x+size*.08,y+size*.3);ctx.quadraticCurveTo(x+size*.45,y+size*.2,x+size*.82,y+size*.34);ctx.stroke()}
  if(n===4){circle(x+size*.3,y+size*.68,Math.max(2,size*.09),"rgba(255,255,255,.16)");circle(x+size*.62,y+size*.58,Math.max(2,size*.06),"rgba(255,255,255,.12)")}
  if(n===7){ctx.fillStyle="rgba(0,0,0,.18)";for(let i=0;i<3;i++)ctx.fillRect(x+size*(.2+i*.22),y+size*(.25+(i%2)*.35),Math.max(2,size*.08),Math.max(2,size*.16))}
 }
 drawPatches();drawNiches();drawEffects();drawAmbient()
}

function patchStyle(type){return({detritus:["#8f6744","DETRITUS"],microbial:["#7fbf75","MICROBIAL FILM"],mat:["#4fcf8a","LIVING MAT"],spore:["#d4b07a","SPORE BED"],fungal:["#c99ee8","MYCELIAL PATCH"],nursery:["#ffd3e2","NURSERY"],conditioned:["#8cffc4","CONDITIONED GROUND"]})[type]||["#789b78",type.toUpperCase()]}
function drawPatches(){for(const p of state.patches){if(p.biome!==state.biome||!visible(p.x,p.y,130))continue;const [color,label]=patchStyle(p.type),x=sx(p.x),y=sy(p.y),r=(14+p.strength*.34)*cameraScale();ctx.save();ctx.globalAlpha=.12+p.strength/650;ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rr=r*(.76+.18*Math.sin(i*2.7+p.phase));const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.globalAlpha=.34;ctx.strokeStyle=color;ctx.setLineDash([2,5]);ctx.stroke();ctx.restore();if(p.strength>55)worldLabel(x,y-r-3,label,color)}}
function drawCarcasses(){for(const c of state.carcasses){if(c.biome!==state.biome||!visible(c.x,c.y,60))continue;const x=sx(c.x),y=sy(c.y),r=Math.max(4,radius(c.mass)*cameraScale()*.6);ctx.save();ctx.globalAlpha=clamp(1-c.age/9000,.25,1);ctx.translate(x,y);ctx.rotate(Math.sin(c.phase)*.12);ctx.fillStyle="#7f5b47";ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.62,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d5a06e";ctx.setLineDash([3,3]);ctx.stroke();ctx.restore()}}
function drawAmbient(){const w=weatherDef(),t=state.tick;ctx.save();if(w.id==="rain"){ctx.strokeStyle="rgba(170,220,255,.23)";for(let i=0;i<34;i++){const x=(i*83+t*.65)%canvas.width,y=(i*47+t*1.7)%canvas.height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+9);ctx.stroke()}}else if(w.id==="spores"||w.id==="bloom"){ctx.fillStyle=w.id==="bloom"?"rgba(255,230,140,.22)":"rgba(225,196,145,.22)";for(let i=0;i<28;i++){const x=(i*101+t*.12*(i%3+1))%canvas.width,y=(i*61+Math.sin(t*.01+i)*18)%canvas.height;circle(x,y,1+(i%3),ctx.fillStyle)}}else if(w.id==="heat"){ctx.strokeStyle="rgba(255,190,120,.12)";for(let y=20;y<canvas.height;y+=45){ctx.beginPath();for(let x=0;x<canvas.width;x+=16)ctx.lineTo(x,y+Math.sin(x*.035+t*.03)*4);ctx.stroke()}}ctx.restore()}
function drawNiches(){for(const n of state.niches){if(n.biome!==state.biome||!visible(n.x,n.y,140))continue;const x=sx(n.x),y=sy(n.y),r=(24+n.strength*.42)*cameraScale(),alpha=.12+n.strength/500;ctx.save();ctx.globalAlpha=alpha;circle(x,y,r,n.type==="PHOTIC MAT"?"#ffd66a":"#8cff9c");ctx.globalAlpha=.45;ctx.strokeStyle=n.type==="DETOX BED"?"#91ff9c":n.type==="PHOTIC MAT"?"#ffd66a":"#8cffc4";ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();if(n.strength>28)worldLabel(x,y-r-4,n.type,n.type==="PHOTIC MAT"?"#ffd66a":"#8cff9c")}}
function drawEffects(){for(const e of state.effects){if(!visible(e.x,e.y,e.radius+30))continue;const x=sx(e.x),y=sy(e.y),r=e.radius*cameraScale(),d=EFFECT_TYPES[e.type];ctx.save();ctx.globalAlpha=.13+.06*Math.sin(e.phase);circle(x,y,r,d.color);ctx.globalAlpha=.8;ctx.strokeStyle=d.color;ctx.lineWidth=2;ctx.setLineDash(e.type==="pulse"?[2,6]:e.type==="mucus"?[7,3]:[3,5]);ctx.beginPath();ctx.arc(x,y,r*(.82+.08*Math.sin(e.phase)),0,Math.PI*2);ctx.stroke();ctx.restore();worldLabel(x,y-r-5,`${d.icon} ${d.name}`,d.color)}}
function visible(x,y,p=40){const a=sx(x),b=sy(y);return a>-p&&a<canvas.width+p&&b>-p&&b<canvas.height+p}
function drawFood(){for(const r of state.resources){if(!visible(r.x,r.y))continue;r.phase+=.04;const x=sx(r.x),y=sy(r.y)+Math.sin(r.phase)*2,s=Math.max(4,7*cameraScale()),f=FOOD[r.type];ctx.save();ctx.shadowBlur=8;ctx.shadowColor=f.color;circle(x,y,s,f.color,"rgba(255,255,255,.65)",1);ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.fillRect(x-s*.15,y-s*.9,s*.3,s*.35);ctx.restore()}}
function drawModuleAt(x,y,r,id,index=0,total=1){const m=moduleById(id);if(!m)return;const a=-Math.PI/2+(index/Math.max(1,total))*Math.PI*2,rr=r*1.05,mx=x+Math.cos(a)*rr,my=y+Math.sin(a)*rr;ctx.save();ctx.shadowBlur=7;ctx.shadowColor=m.color;circle(mx,my,Math.max(3,r*.22),m.color,"#e8ffda",1);ctx.shadowBlur=0;ctx.fillStyle="#07120d";ctx.font=`bold ${Math.max(5,r*.18)}px monospace`;ctx.textAlign="center";ctx.fillText(m.icon,mx,my+2);ctx.restore()}
function drawOrganism(o){
 if(!visible(o.x,o.y,90))return;const x=sx(o.x),y=sy(o.y),r=Math.max(5.5,radius(o.mass)*cameraScale()*.72),flash=o.flash>0&&o.flash%2===0,role=o.role||organismRole(o),pulse=.94+Math.sin(o.phase*2)*.05;
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(o.vy,o.vx||.001)*.18);ctx.scale(pulse,1/pulse);ctx.shadowBlur=o.module?9:4;ctx.shadowColor=o.module?moduleById(o.module).color:o.color;
 if(role==="predator"){ctx.fillStyle=flash?"#fff":o.color;ctx.beginPath();ctx.moveTo(r*1.2,0);ctx.quadraticCurveTo(r*.25,-r,r*-1,0);ctx.quadraticCurveTo(r*.25,r,r*1.2,0);ctx.fill()}
 else if(role==="producer"){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;circle(Math.cos(a)*r*.7,Math.sin(a)*r*.7,r*.46,flash?"#fff":o.color)}circle(0,0,r*.7,"#163b2b")}
 else{ctx.fillStyle=flash?"#fff":o.color;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=r*(.9+.12*Math.sin(i*3+o.phase));const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill()}
 ctx.shadowBlur=0;circle(-r*.2,-r*.06,r*.36,"#15382d");circle(r*.34,-r*.24,r*.14,"#fff");circle(r*.38,-r*.24,r*.055,"#06100c");
 if(role==="decomposer"){ctx.strokeStyle="#91ff9c";for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-r*.5,i*r*.18);ctx.quadraticCurveTo(-r*1.2,i*r*.25,-r*1.45,i*r*.08);ctx.stroke()}}
 if(role==="social"||o.school){ctx.strokeStyle="rgba(219,160,255,.65)";ctx.beginPath();ctx.arc(0,0,r*1.28+Math.sin(o.phase*3)*2,0,Math.PI*2);ctx.stroke()}
 if(o.module)drawModuleAt(0,0,r,o.module,0,1);
 if(o.stuck>0){ctx.strokeStyle="#8cffc4";ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,r*1.45,0,Math.PI*2);ctx.stroke()}
 if(o.stunned>0){ctx.fillStyle="#7de0ff";ctx.font="bold 11px monospace";ctx.fillText("ϟ",r*.7,-r*.8)}
 if(o.state==="court"){ctx.fillStyle="#ffd3e2";ctx.font="bold 9px monospace";ctx.fillText("∞",-3,-r*1.4)}
 ctx.restore()
}
function drawParticles(){for(const q of state.particles){if(!visible(q.x,q.y))continue;ctx.save();ctx.globalAlpha=clamp(q.life/30,0,1);circle(sx(q.x),sy(q.y),q.size*cameraScale(),q.color);ctx.restore()}}
function drawPlayer(){
 const x=sx(state.x),y=sy(state.y),r=Math.max(11,radius()*Math.pow(cameraScale(),.2)),main=ORIGINS.find(o=>o.id===state.origin)?.color||"#8cff9c";
 drawMorphology(x,y,r,main,true,null);
 if(state.target){const tx=sx(state.target.x),ty=sy(state.target.y);ctx.strokeStyle="rgba(255,255,255,.75)";ctx.beginPath();ctx.arc(tx,ty,9,0,Math.PI*2);ctx.stroke()}
}

function draw(){drawWorld();drawCarcasses();drawFood();state.organisms.forEach(drawOrganism);drawParticles();drawPlayer()}

function bar(id,v,c){const e=$(id);e.style.width=clamp(v)+"%";e.style.background=v<24?"var(--red)":c}
function renderMode(){$("stateLabel").textContent=isWaterAt(state.x,state.y)?"HYDRATING":state.mode.toUpperCase();$("forageBtn").classList.toggle("active",state.mode==="forage");$("restBtn").classList.toggle("active",state.mode==="rest")}
function renderMeters(){
 $("energyText").textContent=Math.round(state.energy);$("waterText").textContent=Math.round(state.water);$("healthText").textContent=Math.round(state.health);$("levelText").textContent=state.level;
 bar("energyBar",state.energy,"var(--green)");bar("waterBar",state.water,"var(--blue)");bar("healthBar",state.health,"var(--green)");bar("xpBar",state.xp/xpNeeded()*100,"var(--purple)")
}
function renderLineage(){
 atlasDirty=true;const o=ORIGINS.find(x=>x.id===state.origin);
 $("originLabel").textContent=o?.name||"UNFORMED ANCESTOR";$("bodyPlanLabel").textContent=state.bodyPlan.toUpperCase();
 $("lineageMeta").textContent=`Generation ${state.generation} · Epoch ${state.completedEpochs} · Complexity ${morphologyComplexity()} · ${morphologyName()}`;const mp=morphologyProfile(),activeMorph=[activeCuisine()?.morph,activeDisorder()?.name].filter(Boolean).join(" · ");$("morphologyReadout").innerHTML=`<b>${morphologyName().toUpperCase()}</b><br>${mp.traits.length?mp.traits.join(" · "):"No specialised biochemical anatomy fixed yet."}${activeMorph?`<br><span class="morph-active">ACTIVE TRANSFORMATION · ${activeMorph}</span>`:""}<br><small>Cuisine transformations become conditioned anatomy after three separate activations.</small>`;
 $("lineageLevel").textContent=state.level;$("xpText").textContent=`${Math.floor(state.xp)} / ${xpNeeded()}`;
 bar("lineageXpBar",state.xp/xpNeeded()*100,"var(--purple)");
 $("epochHint").textContent=state.pendingEpochs>0?`${state.pendingEpochs} major evolution${state.pendingEpochs>1?"s":""} ready`:`Next major evolution at level ${Math.ceil((state.level+1)/5)*5}`;
 $("adaptPointLabel").textContent=`${state.adaptPoints} AP`;
 $("attributeStrip").innerHTML=Object.entries(AXES).map(([k,a])=>`<div class="attribute-mini" title="${a.desc}"><button data-axis="${k}" ${state.adaptPoints?"":"disabled"}>+</button><span>${a.icon}</span><b>${a.name}</b><strong>${derivedAxis(k)}</strong><small>${capacityEffects(k)}</small></div>`).join("");
 document.querySelectorAll("[data-axis]").forEach(b=>b.onclick=()=>spendAdapt(b.dataset.axis));
 const p=phenotype();$("phenotypeCards").innerHTML=[["Locomotion",`${p.speed.toFixed(2)}× movement performance`],["Mechanical force",`${p.force.toFixed(2)}× feeding and attack force`],["Stress defence",`${p.defense.toFixed(2)}× injury buffering`],["Ecological fit",`${Math.round(fit())}% in ${BIOMES[state.biome].name}`]].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("");
 $("pressureBars").innerHTML=Object.entries(state.pressures).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pressure-row"><span>${AXES[k].name}<b>${Math.round(v)}</b></span><i><em style="width:${clamp(v)}%"></em></i></div>`).join("");
 const discovered=Object.keys(state.discoveredPathways||{}).length;
 $("atlasSummary").textContent=`${lineageIdentity()} · ${state.genes.length} fixed innovations · ${ATLAS.filter(nodeAvailable).length} accessible · ${discovered}/20 biochemical thresholds discovered · origin resonance favours ${Object.keys(originDef()?.bias||{}).slice(0,3).map(a=>AXES[a].name).join(" / ")}`;
}function renderInventory(){
 const recent=(state.nutritionSequence||[]).map((t,i)=>`<span class="nutrition-chip" style="--nutrient:${FOOD[t].color}" title="${i+1}. ${FOOD[t].name}"><i></i>${FOOD[t].name}</span>`).join("")||`<span class="nutrition-empty">No deliberate Pack consumption</span>`;
 const strongest=Object.entries(state.dietMemory).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${FOOD[k].name} ${v.toFixed(1)}`).join(" · ");
 const cuisine=activeCuisine(),disorder=activeDisorder();
 $("dietReadout").innerHTML=`<div class="diet-heading"><b>NUTRITIONAL MEMORY</b><span>${(state.nutritionSequence||[]).length}/8</span></div><div class="nutrition-chain">${recent}</div><b>${cuisine?`${cuisine.icon} ${cuisine.name} · ${state.metabolicState.meals} meals remaining`:"No active cuisine state"}</b>${cuisine?`<br>${cuisine.desc}`:""}${disorder?`<br><span class="danger"><b>${disorder.icon} ${disorder.name} · ${state.metabolicDisorder.meals} meals remaining</b><br>${disorder.desc}</span>`:""}<br>Long-term imprints: ${strongest||"none yet"}`;
 $("inventoryGrid").innerHTML=Object.entries(FOOD).map(([k,f])=>{const path=BIOCHEMICAL_PATHWAYS[k],next=path?.thresholds.find(v=>!state.discoveredPathways?.[pathwayKey(k,v)]);return `<button class="inventory-item" data-resource="${k}" ${state.inventory[k]?"":"disabled"}><em>x${state.inventory[k]}${next?` · next ${next}`:path?" · complete":""}</em><b style="color:${f.color}">◆</b><span>${f.name.toUpperCase()}</span><small>energy +${Math.round(f.energy*phenotype().foodYield)}<br><span class="imprint">${f.imprint}</span>${path?`<br><span class="imprint">${path.name}</span>`:""}</small></button>`}).join("");
 document.querySelectorAll("[data-resource]").forEach(b=>b.onclick=()=>consumeResource(b.dataset.resource));
 $("recipeCards").innerHTML=`<div class="recipe-card active"><b>EVOLUTIONARY CUISINE CODEX · ${state.discoveredCuisine.length}/${CUISINE_STATES.length}</b>Consume Pack resources in deliberate sequences. Exact recipes and broader dietary patterns can produce temporary physiology and visible morphology. Six identical consumptions trigger overload.</div>`+CUISINE_STATES.map(r=>{const known=state.discoveredCuisine.includes(r.id),active=state.metabolicState?.id===r.id;return`<div class="recipe-card ${active?"active":""}"><b>${known?(active?"◆":"◇"):"?"} ${known?r.name:"UNDISCOVERED METABOLIC STATE"}</b>${known?r.desc:"Its nutritional sequence remains unknown."}<br><small>${known?r.discovery:"Experiment with order, diversity and repetition."}${active?` · ACTIVE FOR ${state.metabolicState.meals} MORE MEALS`:""}</small></div>`}).join("")
}
function renderEcology(){
 const tile=localTile(),p=phenotype();
 const hydration=tile.water?(state.biome===3?3.2:state.biome===4?4.5:gene("selective membrane")?5.5:7.5):0;
 $("ecologyCards").innerHTML=[
  ["Biome",BIOMES[state.biome].name],
  ["Exact tile",`${tile.name}<br>${tile.effect}`],
  ["Water exchange",tile.water?`Approximately +${hydration} hydration each physiology cycle before normal water use`:"No environmental uptake on this tile"],
  ["Nearby organisms",`${state.organisms.filter(o=>Math.hypot(o.x-state.x,o.y-state.y)<420).length} detected locally`],
  ["Living world",`${weatherDef().icon} ${weatherDef().name}<br>${state.ecosystem.births} births · ${state.ecosystem.deaths} deaths · ${state.ecosystem.hunts} hunts`],
  ["Succession",`${state.patches.filter(p=>p.biome===state.biome).length} habitat patches · ${state.carcasses.length} carcasses`],
  ["Niche fit",`${Math.round(fit())}% compatibility`]
 ].map(([a,b])=>`<div class="card"><b>${a}</b>${b}</div>`).join("");
 $("symbiontCards").innerHTML=state.symbionts.length?state.symbionts.map((id,i)=>{const m=moduleById(id);return`<div class="module-card"><i style="color:${m.color}">${m.icon}</i><b>${m.name}</b>${m.desc}<br>Visible module ${i+1} · biases ${AXES[m.axis].name}</div>`}).join(""):`<div class="card"><b>No integrated organisms</b>Successful stable merger can add visible functional modules.</div>`;
 const here=state.niches.filter(n=>n.biome===state.biome);
 $("nicheCards").innerHTML=here.length?here.sort((a,b)=>b.strength-a.strength).slice(0,6).map(n=>`<div class="niche-card"><b>${n.type}</b>${Math.round(n.strength)}% conditioned · ${n.rests} rest deposits<div class="niche-meter"><em style="width:${n.strength}%"></em></div></div>`).join(""):`<div class="card"><b>No conditioned niche</b>Rest repeatedly in one location to create a persistent healing environment.</div>`
}
function renderLog(){const m=$("migrationStatus");if(m)m.innerHTML=`<b>SAVE INTEGRITY</b><span>${state.migrationReport||"Current save verified"}</span><small>Build ${BUILD_VERSION} · schema ${state.saveSchema||SAVE_SCHEMA}</small>`;$("logList").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("")}
function renderAll(){renderTile();$("cycleLabel").textContent=`CYCLE ${state.cycle}`;$("biomeLabel").textContent=BIOMES[state.biome].name;const h=$("cycleHistory");if(h)h.textContent=state.logs[0]?.replace(/^Cycle \d+: /,"")||"Lineage newly emerged";renderMode();renderMeters();renderLineage();renderInventory();renderEcology();renderLog()}

function inspectionTier(){
 const c=derivedAxis("cognition"),comm=derivedAxis("communication"),sens=(gene("chemical sensing")?1:0)+(gene("threat model")?1:0)+(gene("electroreception")?1:0);
 return clamp(Math.floor((c+comm*.35)/2.4)+sens,1,5)
}
function threatAssessment(o){
 const p=phenotype(),distance=Math.hypot(o.x-state.x,o.y-state.y),ourCombat=p.force*p.defense*state.mass*(state.health/100),theirCombat=(.65+o.aggression*.8)*o.mass*(o.health/100)*1.35;
 const escape=p.speed/(.7+o.speed*.55);const ratio=ourCombat/Math.max(.1,theirCombat);
 if(ratio>2.15)return{label:"EASY TARGET",className:"easy",confidence:Math.min(98,65+inspectionTier()*6)};
 if(ratio>1.15)return{label:escape>1.15?"FAVOURABLE":"MANAGEABLE",className:"favourable",confidence:Math.min(94,58+inspectionTier()*6)};
 if(ratio>.7)return{label:"RISKY",className:"risky",confidence:Math.min(90,52+inspectionTier()*6)};
 if(ratio>.38)return{label:escape>1.2?"AVOIDABLE THREAT":"SEVERE THREAT",className:"severe",confidence:Math.min(88,48+inspectionTier()*6)};
 return{label:"OVERWHELMING",className:"impossible",confidence:Math.min(85,45+inspectionTier()*6)}
}
function organismLabel(o){const m=moduleById(o.module),role=o.role||organismRole(o);return m?`${m.icon} ${m.name}`:`${role.toUpperCase()} ORGANISM`}
function inspectionHitRadius(o,wideScan=false){
 const body=Math.max(10,radius(o.mass)*.72);
 return (body+(wideScan?30:16))/cameraScale()
}
function inspectAt(wx,wy,clientX=null,clientY=null,wideScan=false){
 let best=null,d=Infinity;for(const o of state.organisms){const q=Math.hypot(o.x-wx,o.y-wy);if(q<d){d=q;best=o}}
 const box=$("inspect"),tileBox=$("tileReadout");if(!best||d>=inspectionHitRadius(best,wideScan)){box.hidden=true;if(tileBox)tileBox.hidden=false;return false}
 const tier=inspectionTier(),assessment=threatAssessment(best),m=moduleById(best.module),distance=Math.round(Math.hypot(best.x-state.x,best.y-state.y));
 const size=best.mass<state.mass*.7?"smaller":best.mass>state.mass*1.35?"larger":"similar";
 const condition=best.health>75?"vigorous":best.health>40?"impaired":"critical";
 const behaviour=String(best.state||"unknown").replaceAll("Other","");
 const lines=[`<div class="inspect-head"><b style="color:${best.color}">${organismLabel(best)}</b><span class="threat ${assessment.className}">${assessment.label}</span></div>`,`<small>readout ${tier}/5 · confidence ${assessment.confidence}%</small>`];
 lines.push(`<div class="inspect-row">${size} · ${distance} away${tier>=2?` · ${condition}`:""}</div>`);
 if(tier>=2)lines.push(`<div class="inspect-row">${behaviour}${tier>=3?` · mass ${best.mass.toFixed(1)} · health ${Math.round(best.health)}`:""}</div>`);
 if(tier>=4)lines.push(`<div class="inspect-row">${best.role||organismRole(best)} · ${organismDefense(best).name.toLowerCase()} · ${best.aggression>.6?"reactive":best.aggression>.35?"conditional":"cautious"}</div>`);
 if(tier>=5)lines.push(`<div class="inspect-row">${m?m.name:"no stable module"} · predicted ${assessment.label.toLowerCase()}</div>`);
 else if(m&&tier>=3)lines.push(`<div class="inspect-row">specialised organ detected</div>`);
 box.style.maxHeight="";box.innerHTML=lines.join("");box.hidden=false;if(tileBox)tileBox.hidden=true;
 const rect=canvas.getBoundingClientRect(),bw=box.offsetWidth||176,bh=box.offsetHeight||80;
 const targetScreenX=clientX===null?rect.left+rect.width/2:clientX;
 const placeLeft=targetScreenX>rect.left+rect.width*.56;
 box.style.left=placeLeft?"7px":"auto";box.style.right=placeLeft?"auto":"7px";box.style.top="34px";
 if(bh>rect.height*.34)box.style.maxHeight=Math.max(68,Math.floor(rect.height*.3))+"px";
 clearTimeout(inspectAt.t);inspectAt.t=setTimeout(()=>{box.hidden=true;if(tileBox)tileBox.hidden=false},3500);return true
}
function worldPoint(ev){const rect=canvas.getBoundingClientRect(),cx=(ev.clientX-rect.left)*(canvas.width/rect.width),cy=(ev.clientY-rect.top)*(canvas.height/rect.height);return{x:clamp(cameraCenter().x+(cx-canvas.width/2)/cameraScale(),0,WORLD),y:clamp(cameraCenter().y+(cy-canvas.height/2)/cameraScale(),0,WORLD)}}
let activePointer=null,longTimer=null,startPoint=null,moved=false,scrollGesture=false;
function pointerStart(e){activePointer=e.pointerId;startPoint={x:e.clientX,y:e.clientY};moved=false;scrollGesture=false;const p=worldPoint(e);longTimer=setTimeout(()=>{if(!moved&&!scrollGesture)inspectAt(p.x,p.y,e.clientX,e.clientY,true)},560)}
function pointerMove(e){if(activePointer!==e.pointerId||!startPoint)return;const dx=e.clientX-startPoint.x,dy=e.clientY-startPoint.y;
 if(!moved&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.15){scrollGesture=true;clearTimeout(longTimer);activePointer=null;startPoint=null;return}
 if(Math.hypot(dx,dy)>9)moved=true;if(moved){e.preventDefault();try{canvas.setPointerCapture?.(e.pointerId)}catch{}const p=worldPoint(e);movementTarget(p.x,p.y)}}
function resetWorldPointer(e){clearTimeout(longTimer);longTimer=null;try{canvas.releasePointerCapture?.(e.pointerId)}catch{}activePointer=null;startPoint=null;moved=false;scrollGesture=false}
function pointerEnd(e){if(activePointer!==e.pointerId)return;clearTimeout(longTimer);if(!moved&&!scrollGesture){e.preventDefault();const p=worldPoint(e);if(!inspectAt(p.x,p.y,e.clientX,e.clientY,false))movementTarget(p.x,p.y)}resetWorldPointer(e)}
function pointerCancel(e){if(activePointer!==e.pointerId)return;e.preventDefault();resetWorldPointer(e)}
function applyBuildIdentity(){
 document.title=`EVOLVA v${BUILD_VERSION}`;
 document.querySelectorAll("[data-build-version]").forEach(el=>el.textContent=`v${BUILD_VERSION}`);
 document.querySelectorAll("[data-build-number]").forEach(el=>el.textContent=BUILD_VERSION);
 const meta=document.querySelector('meta[name="evolva-build"]');if(meta)meta.content=BUILD_VERSION
}
function bind(){
 atlasCanvas=$("atlasCanvas");atlasCtx=atlasCanvas.getContext("2d");resizeAtlasCanvas();window.addEventListener("resize",()=>{resizeAtlasCanvas();atlasDirty=true});
 atlasCanvas.addEventListener("pointerdown",atlasPointerDown,{passive:false});
 atlasCanvas.addEventListener("pointermove",atlasPointerMove,{passive:false});
 atlasCanvas.addEventListener("pointerup",atlasPointerUp,{passive:false});
 atlasCanvas.addEventListener("pointercancel",atlasPointerCancel,{passive:false});
 atlasCanvas.addEventListener("wheel",atlasWheel,{passive:false});
 $("atlasHomeBtn").onclick=()=>{atlasFocusCurrent();save();drawAtlas()};
 $("atlasMinusBtn").onclick=()=>{atlasZoom(.82);drawAtlas()};
 $("atlasPlusBtn").onclick=()=>{atlasZoom(1.22);drawAtlas()};
 canvas.addEventListener("pointerdown",pointerStart,{passive:false});canvas.addEventListener("pointermove",pointerMove,{passive:false});canvas.addEventListener("pointerup",pointerEnd,{passive:false});canvas.addEventListener("pointercancel",pointerCancel,{passive:false});
 $("forageBtn").onclick=forageToggle;$("restBtn").onclick=restToggle;$("interactBtn").onclick=interact;$("migrateBtn").onclick=migrate;$("encounterCloseBtn").onclick=closeEncounter;$("interactionCancelBtn").onclick=cancelInteraction;document.querySelectorAll("[data-intent]").forEach(b=>b.onclick=()=>resolveIntent(b.dataset.intent));
 $("forecastBtn").onclick=buildForecast;$("backToFeedBtn").onclick=()=>{$("epochFeedStage").hidden=false;$("epochForecastStage").hidden=true};
 $("restartBtn").onclick=()=>{if(confirm("End this lineage and erase its autosave?")){[SAVE_KEY,BACKUP_SAVE_KEY,LEGACY_SAVE_KEY,...OLDER_SAVE_KEYS].forEach(k=>localStorage.removeItem(k));location.reload()}};
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab,.tab-content").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active");$("atlasTooltip").hidden=true;atlasDirty=true;if(t.dataset.tab==="lineage")requestAnimationFrame(drawAtlas)})
}
function save(){try{state.buildVersion=BUILD_VERSION;state.saveSchema=SAVE_SCHEMA;const encoded=JSON.stringify(state);const existing=localStorage.getItem(SAVE_KEY);if(existing)localStorage.setItem(BACKUP_SAVE_KEY,existing);localStorage.setItem(SAVE_KEY,encoded);$("saveStatus").textContent="saved · schema 5";setTimeout(()=>$("saveStatus").textContent="autosaving",900)}catch(e){$("saveStatus").textContent="save unavailable"}}
function load(){
 const keys=[SAVE_KEY,BACKUP_SAVE_KEY,LEGACY_SAVE_KEY,...OLDER_SAVE_KEYS];
 for(const sourceKey of keys){
  const raw=localStorage.getItem(sourceKey);if(!raw)continue;
  try{
   const b=fresh(),x=JSON.parse(raw);state=Object.assign(b,x);
   state.axes=Object.assign(b.axes,x.axes||{});Object.keys(AXES).forEach(a=>state.axes[a]=Math.max(1,Number(state.axes[a])||1));
   state.pressures=Object.assign(b.pressures,x.pressures||{});Object.keys(AXES).forEach(a=>state.pressures[a]=Math.max(0,Number(state.pressures[a])||0));
   state.lifetimePressure=Object.assign(b.lifetimePressure,x.lifetimePressure||{});Object.keys(AXES).forEach(a=>state.lifetimePressure[a]=Math.max(0,Number(state.lifetimePressure[a])||0));
   state.inventory=Object.assign(b.inventory,x.inventory||{});Object.keys(FOOD).forEach(k=>state.inventory[k]=Math.max(0,Math.floor(Number(state.inventory[k])||0));
   const validPathways=new Set(BIOCHEMICAL_NODES.map(n=>pathwayKey(n.resource,n.threshold)));state.discoveredPathways={};for(const [key,value] of Object.entries(x.discoveredPathways||{}))if(validPathways.has(key)&&value)state.discoveredPathways[key]=true;
   state.dietMemory=Object.assign(b.dietMemory,x.dietMemory||{});Object.keys(FOOD).forEach(k=>state.dietMemory[k]=Math.max(0,Number(state.dietMemory[k])||0));
   state.dietHistory=Array.isArray(x.dietHistory)?x.dietHistory.filter(t=>FOOD[t]).slice(-12):[];state.nutritionSequence=Array.isArray(x.nutritionSequence)?x.nutritionSequence.filter(t=>FOOD[t]).slice(-8):[];
   state.metabolicState=x.metabolicState&&cuisineDefinition(x.metabolicState.id)?{id:x.metabolicState.id,meals:clamp(Math.floor(Number(x.metabolicState.meals)||0),0,20)}:null;
   const migratedDisorder=Object.values(METABOLIC_DISORDERS).find(d=>d.id===x.metabolicDisorder?.id);state.metabolicDisorder=migratedDisorder?{id:migratedDisorder.id,meals:clamp(Math.floor(Number(x.metabolicDisorder.meals)||0),0,20),signature:String(x.metabolicDisorder.signature||"")}:null;
   state.discoveredCuisine=Array.isArray(x.discoveredCuisine)?[...new Set(x.discoveredCuisine.filter(id=>cuisineDefinition(id)))]:[];state.cuisineReinforcement={};for(const [id,value] of Object.entries(x.cuisineReinforcement||{}))if(cuisineDefinition(id))state.cuisineReinforcement[id]=clamp(Math.floor(Number(value)||0),0,5);state.lastCuisineSignature=String(x.lastCuisineSignature||"");state.cuisinePatternLatch=cuisineDefinition(x.cuisinePatternLatch)?x.cuisinePatternLatch:"";state.encounter=null;state.atlasView=Object.assign(b.atlasView,x.atlasView||{});sanitizeAtlasView();
   state.genes=Array.isArray(x.genes)?[...new Set(x.genes.filter(g=>ATLAS.some(n=>n.id===g)))]:[];
   if(!ORIGINS.some(o=>o.id===state.origin))state.origin=null;const origin=ORIGINS.find(o=>o.id===state.origin);if(origin&&!state.genes.includes(origin.gene))state.genes.unshift(origin.gene);
   state.level=Math.max(1,Math.floor(Number(state.level)||1));state.mass=Math.max(.2,Number(state.mass)||1);state.generation=Math.max(1,Math.floor(Number(state.generation)||1));state.energy=clamp(Number(state.energy)||0);state.water=clamp(Number(state.water)||0);state.health=clamp(Number(state.health)||0);
   state.resources=Array.isArray(x.resources)?x.resources.filter(r=>r&&FOOD[r.type]&&Number.isFinite(r.x)&&Number.isFinite(r.y)).map(r=>Object.assign({phase:0},r)):[];
   state.organisms=Array.isArray(x.organisms)?x.organisms.filter(o=>o&&Number.isFinite(o.x)&&Number.isFinite(o.y)).map(o=>Object.assign(makeOrganism(),o,{module:moduleById(o.module)?o.module:null,defense:ORGANISM_DEFENSES[o.defense]?o.defense:"mucus",stuck:Math.max(0,Number(o.stuck)||0),stunned:Math.max(0,Number(o.stunned)||0),flash:0})):[];
   state.symbionts=Array.isArray(x.symbionts)?x.symbionts.filter(id=>moduleById(id)).slice(0,6):[];state.effects=Array.isArray(x.effects)?x.effects.filter(e=>e&&EFFECT_TYPES[e.type]&&[e.x,e.y,e.radius,e.life].every(Number.isFinite)).map(e=>Object.assign({power:1,owner:"player",phase:0},e)):[];
   state.niches=Array.isArray(x.niches)?x.niches.filter(n=>n&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.biome)).map(n=>Object.assign({strength:0,rests:0,type:"MUCUS NEST",milestones:[]},n,{strength:clamp(Number(n.strength)||0),rests:Math.max(0,Number(n.rests)||0),milestones:Array.isArray(n.milestones)?n.milestones.filter(v=>[10,25,50,75,100].includes(v)):[]})):[];
   state.patches=Array.isArray(x.patches)?x.patches.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>Object.assign(makePatch("microbial",p.x,p.y),p)).slice(0,ECO_CONFIG.maxPatches):[];state.carcasses=Array.isArray(x.carcasses)?x.carcasses.filter(c=>c&&Number.isFinite(c.x)&&Number.isFinite(c.y)&&Number.isFinite(c.nutrition)).map(c=>Object.assign({age:0,phase:0,biome:state.biome},c)).slice(0,ECO_CONFIG.maxCarcasses):[];
   state.weather=x.weather&&WEATHER.some(w=>w.id===x.weather.id)?Object.assign(makeWeather(x.weather.id),x.weather):makeWeather();state.camera=Object.assign(b.camera,x.camera||{}, {eventX:null,eventY:null,eventTimer:0});state.ecosystem=Object.assign(b.ecosystem,x.ecosystem||{});state.lineageActions=Object.assign(b.lineageActions,x.lineageActions||{});
   state.particles=[];state.ambient=[];state.interactionTarget=null;state.buildVersion=BUILD_VERSION;state.saveSchema=SAVE_SCHEMA;state.migrationReport=sourceKey===SAVE_KEY?"Current save verified · schema 5":sourceKey===BACKUP_SAVE_KEY?"Recovered from rolling backup · schema 5":`Migrated from ${sourceKey} · schema 5`;state.logs=Array.isArray(x.logs)?x.logs.slice(0,120):[];
   state.completedEpochs=Number.isFinite(x.completedEpochs)?x.completedEpochs:Math.max(0,(x.genes||[]).length-1);state.pendingEpochs=Math.max(0,Math.floor(Number.isFinite(x.pendingEpochs)?x.pendingEpochs:(x.epochPending?1:0)));state.target=null;state.mode="observe";state.epochForecast=[];state.epochFeed={};checkDevelopmentalThresholds(false);return true;
  }catch(e){try{localStorage.setItem(`${SAVE_KEY}-corrupt-${sourceKey}-${Date.now()}`,raw)}catch{}}
 }
 return false
}
function renderOrigins(){$("originChoices").innerHTML=ORIGINS.map(o=>`<button class="origin-choice" data-origin="${o.id}"><b style="color:${o.color}">${o.name}</b><span>${o.desc}</span><small><strong>Permanent architecture:</strong> ${o.legacy}<br><strong>Begins:</strong> ${o.gene}; ${Object.entries(o.axes).map(([a,v])=>`+${v} ${AXES[a].name}`).join(", ")}<br><strong>Possible identities:</strong> ${o.paths.join(" · ")}</small></button>`).join("");document.querySelectorAll("[data-origin]").forEach(b=>b.onclick=()=>chooseOrigin(b.dataset.origin))}
function start(newLineage=false){
 try{
  if(newLineage){[SAVE_KEY,BACKUP_SAVE_KEY,LEGACY_SAVE_KEY,...OLDER_SAVE_KEYS].forEach(k=>{try{localStorage.removeItem(k)}catch{}});state=fresh()}else load();
  checkDevelopmentalThresholds(false);if(!state.resources.length)spawnFood(ECO_CONFIG.targetFood);if(!state.organisms.length)populate();$("start").classList.remove("visible");renderAll();
  if(!state.origin){renderOrigins();$("originModal").classList.add("visible")}else if(state.pendingEpochs>0)setTimeout(openEpoch,500);
 }catch(error){showRuntimeError(error);throw error}
}
export function createGameRuntime(engine){
 applyBuildIdentity();
 // Bind launch controls before the heavier canvas/UI setup. A non-critical
 // initialization fault must never leave the first screen unresponsive.
 const continueButton=$("continue"),newGameButton=$("newGame");
 if(!continueButton||!newGameButton)throw new Error("Launch controls are missing from this deployment");
 continueButton.onclick=()=>start(false);
 newGameButton.onclick=()=>start(true);
 bind();
 engine.addSystem({id:"simulation",priority:10,update:simulateStep});
 engine.addRenderer({id:"world",priority:10,render:()=>draw()});
 engine.addRenderer({id:"atlas",priority:20,render:({now})=>drawAtlas(now)});
 engine.events.on("engine:error",error=>showRuntimeError(error));
 return{
  start,
  stop:()=>engine.stop(),
  state:()=>state,
  save,
  build:BUILD_VERSION,
  diagnostics(){return{build:BUILD_VERSION,tick:state.tick,cycle:state.cycle,organisms:state.organisms.length,resources:state.resources.length,effects:state.effects.length,niches:state.niches.length,symbionts:state.symbionts.length,carcasses:state.carcasses.length,patches:state.patches.length,weather:state.weather.id,births:state.ecosystem.births,deaths:state.ecosystem.deaths}}
 }
}
function showRuntimeError(error){
 const x=$("error");if(!x)return;
 x.hidden=false;x.textContent=`Build ${BUILD_VERSION}: ${error?.message||error||"Unknown runtime error"}`
}
window.addEventListener("error",e=>showRuntimeError(e.error||e.message));
window.addEventListener("unhandledrejection",e=>showRuntimeError(e.reason||"Unhandled promise rejection"));

