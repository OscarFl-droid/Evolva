import fs from "node:fs";
const root=new URL("../",import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),"utf8");
const html=read("index.html"),main=read("js/main.js"),game=read("js/game.js"),sw=read("sw.js"),release=JSON.parse(read("release.json"));
const checks=[
 [html.includes('content="10.3.3"'),"HTML build metadata"],
 [html.includes('js/main.js?v=10.3.3'),"HTML module version"],
 [html.includes('styles.css?v=10.3.3'),"HTML stylesheet version"],
 [main.includes('./game.js?v=10.3.3'),"main/game version coherence"],
 [main.includes('showBootFailure'),"visible boot failure reporting"],
 [game.indexOf('continueButton.onclick')<game.indexOf('bind();'),"launch controls bind before heavy UI"],
 [game.includes('LEGACY_SAVE_KEY="evolva-save-v10-3-2"')&&game.includes('"evolva-save-v10-3-1"'),"v10.3.2 and v10.3.1 save migration"],
 [html.includes('window.evolvaLaunch')&&html.includes('getRegistrations'),"inline clean-boot launcher"],
 [main.includes('evolva-runtime-ready')&&main.includes('window.__EVOLVA_START__'),"queued runtime handoff"],
 [release.version==="10.3.3"&&release.saveSchema===5,"release metadata"]
];
for(const [ok,label] of checks){if(!ok)throw new Error(`Startup regression failed: ${label}`)}
console.log(`Startup regression: ${checks.length} assertions passed`);
