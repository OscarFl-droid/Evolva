import fs from "node:fs";
import path from "node:path";
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),game=read("js/game.js"),main=read("js/main.js"),sw=read("sw.js");
const errors=[];
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
for(const id of new Set(ids))if(ids.filter(x=>x===id).length>1)errors.push(`duplicate id: ${id}`);
const refs=[...game.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
for(const id of new Set(refs))if(!ids.includes(id))errors.push(`missing DOM id: ${id}`);
for(const [file,text] of Object.entries({html,game,main,sw}))if(!text.includes("8.0.0")&&file!=="main")errors.push(`${file} lacks build identity`);
if(!html.includes('type="module" src="js/main.js?v=8.0.0"'))errors.push("module bootstrap mismatch");
if(fs.existsSync(path.join(root,"game.js")))errors.push("obsolete root game.js still present");
if(!game.includes('LEGACY_SAVE_KEY="evolva-save-v7-5-1"'))errors.push("v7.5.1 migration key missing");
if(!sw.includes('CACHE="evolva-v8-0-0"'))errors.push("service worker cache mismatch");
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log("EVOLVA v8 static release audit passed");
