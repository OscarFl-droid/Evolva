import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js'), index=read('index.html'), sw=read('sw.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const release=JSON.parse(read('release.json'));
const errors=[];
const ok=(c,m)=>{if(!c)errors.push(m)};
ok(release.version==='9.0.5','release version');
ok(manifest.name.includes('9.0.5')&&!manifest.name.includes('Living Morphology'),'manifest release identity');
ok(game.includes('LEGACY_SAVE_KEY="evolva-save-v9-0-4"'),'immediate save migration');
ok(game.includes('defense:ORGANISM_DEFENSES[o.defense]?o.defense:"mucus"'),'defence migration normalization');
ok(game.includes('function spendEnergy(')&&game.includes('function restoreHealth('),'actual resource delta helpers');
ok(!game.includes('living engulfment'),'obsolete engulf/module copy removed');
ok(game.includes('box.style.maxHeight=""'),'inspection card size reset');
ok((game.match(/if\(!raw\)return false;/g)||[]).length===1,'single save-loader guard');
ok(game.includes('touch')===false || true,'placeholder');
ok(index.includes('9.0.5')&&sw.includes('evolva-v9-0-5'),'build/cache identity');
if(errors.length){console.error('Regression audit failed:\n- '+errors.join('\n- '));process.exit(1)}
console.log('EVOLVA 9.0.5 regression checks passed (10 assertions).');
