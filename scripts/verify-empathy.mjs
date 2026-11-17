import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PRESETS } from '../src/lib/presets.ts';
import { COLOR_MATRICES, mapSensoryFilters } from '../src/lib/filters.ts';
import { initialSensoryState, initialState, appReducer } from '../src/state/reducer.ts';
import { SCENES, PRESCRIPTIONS } from '../src/lib/scenes.ts';
import { luminance, contrastRatio, contrastGrade, fittsIndex, frustration, averageOffset, errorRate, comparable } from '../src/lib/metrics.ts';
import { tremorTarget, stepTremor, hitTarget } from '../src/lib/tremor.ts';

let passed = 0;
const check = (name, fn) => { fn(); console.log(`PASS ${++passed}: ${name}`); };
check('three personas match explicit sensory parameters', () => {
  assert.deepEqual(Object.keys(PRESETS), ['zhang','lin','li']);
  assert.equal(PRESETS.zhang.sensoryState.blur, 3); assert.equal(PRESETS.zhang.sensoryState.cataract, 55); assert.equal(PRESETS.zhang.sensoryState.tremorLevel, 3);
  assert.equal(PRESETS.lin.sensoryState.colorVision, 'protanopia'); assert.equal(PRESETS.lin.sensoryState.glare, true);
  assert.equal(PRESETS.li.sensoryState.hearing, 'impaired'); assert.equal(PRESETS.li.sensoryState.tremorLevel, 7);
  for (const p of Object.values(PRESETS)) { const s = appReducer(initialState, {type:'sensory/preset', name:p.name, sensoryState:p.sensoryState}); assert.deepEqual(s.sensoryState, p.sensoryState); assert.equal(s.profileName, p.name); }
});
check('all three scenes × two modes preserve filter parameters', () => {
  const s = appReducer(initialState, {type:'sensory/preset', ...PRESETS.zhang});
  for (const sceneId of Object.keys(SCENES)) for (const mode of ['before','after']) { const n = appReducer(appReducer(s,{type:'ui/scene',sceneId}),{type:'ui/mode',mode}); assert.equal(n.uiState.sceneId,sceneId); assert.equal(n.uiState.mode,mode); assert.deepEqual(n.sensoryState,s.sensoryState); assert.equal(n.liveTrial,null); }
});
check('sRGB contrast reference cases (21:1, 1:1, symmetry, thresholds)', () => {
  assert.equal(luminance('#000000'),0); assert.equal(luminance('#ffffff'),1);
  assert.equal(contrastRatio('#000000','#ffffff'),21); assert.equal(contrastRatio('#123456','#123456'),1);
  assert.equal(contrastRatio('#2563eb','#ffffff'),contrastRatio('#ffffff','#2563eb'));
  assert.ok(Math.abs(contrastRatio('#777777','#ffffff') - 4.478089) < 0.00001);
  assert.equal(contrastGrade(4.5),'AA 通过'); assert.equal(contrastGrade(7),'AAA 通过'); assert.equal(contrastGrade(4.49),'未达 AA');
});
check('scene design colors improve contrast; enhanced targets >=44px', () => { for (const scene of Object.values(SCENES)) { assert.ok(contrastRatio(scene.before.foreground,scene.before.background) < 4.5); assert.ok(contrastRatio(scene.after.foreground,scene.after.background) >=7); assert.ok(scene.after.target>=44); assert.ok(fittsIndex(240,scene.before.target)>fittsIndex(240,scene.after.target)); } assert.equal(PRESCRIPTIONS.length,5); });
check('Fitts logarithm known inputs', () => { assert.equal(fittsIndex(0,44),0); assert.equal(fittsIndex(100,100),1); assert.equal(fittsIndex(300,100),2); });
check('Machado matrices / linear luminance grayscale dimensions', () => { for (const matrix of Object.values(COLOR_MATRICES)) { assert.equal(matrix.length,20); assert.ok(matrix.every(Number.isFinite)); assert.deepEqual(matrix.slice(15),[0,0,0,1,0]); for (const i of [0,5,10]) assert.ok(Math.abs(matrix.slice(i,i+3).reduce((a,b)=>a+b,0)-1) < .000003); } assert.equal(COLOR_MATRICES.protanopia[0],.152286); });
check('Gaussian blur, contrast and mask limits', () => { const max = mapSensoryFilters({...initialSensoryState,blur:8,cataract:100,glaucoma:100}); assert.equal(max.totalBlur,8.6); assert.equal(max.contrast,.55); assert.equal(max.hazeOpacity,.28); assert.equal(max.clearRadius,12.5); assert.equal(mapSensoryFilters(initialSensoryState).totalBlur,0); });
check('tremor zero / linear intensity / time variability', () => { assert.deepEqual(tremorTarget(1,0),{x:0,y:0}); const a=tremorTarget(.2,5),b=tremorTarget(.2,10); assert.equal(b.x,a.x*2); assert.equal(b.y,a.y*2); assert.notDeepEqual(tremorTarget(.2,10),tremorTarget(.25,10)); });
check('spring integration remains finite and bounded over 60 seconds', () => { let s={x:0,y:0,vx:0,vy:0},maximum=0; for(let i=0;i<7200;i++){s=stepTremor(s,i/120,1/120,10);assert.ok(Object.values(s).every(Number.isFinite)); maximum=Math.max(maximum,Math.hypot(s.x,s.y));} assert.ok(maximum>10 && maximum<80); assert.deepEqual(stepTremor(s,61,.016,0),{x:0,y:0,vx:0,vy:0}); console.log('  measured max offset:',maximum.toFixed(3),'px'); });
check('actual offset can redirect hit into adjacent trap; buffer is bounded', () => { const targets=[{id:'safe',left:0,top:0,width:28,height:28},{id:'trap',left:32,top:0,width:28,height:28}]; assert.equal(hitTarget({x:14,y:14},targets),'safe'); assert.equal(hitTarget({x:40,y:14},targets),'trap'); assert.equal(hitTarget({x:30,y:14},targets),null); assert.equal(hitTarget({x:30,y:14},targets,12),'safe'); assert.equal(hitTarget({x:90,y:14},targets,12),null); });
check('comfort blocks cognition and clear preserves scene/mode/history', () => { let s=appReducer(initialState,{type:'ui/setComfortMode',enabled:true}); s=appReducer(s,{type:'sensory/change',patch:{cognitive:true,tremorLevel:7}});assert.equal(s.sensoryState.cognitive,false); assert.equal(s.sensoryState.tremorLevel,7);s=appReducer(s,{type:'ui/scene',sceneId:'escape'});s=appReducer(s,{type:'ui/mode',mode:'after'});const n=appReducer(s,{type:'sensory/clear'});assert.deepEqual(n.sensoryState,initialSensoryState);assert.equal(n.uiState.sceneId,'escape');assert.equal(n.uiState.mode,'after');assert.ok(n.uiState.resetKey>s.uiState.resetKey); });
const trial={sceneId:'hospital',mode:'before',status:'success',elapsed:5,clicks:4,errors:1,traps:1,offsetTotal:40,pointerClicks:4,keyboardClicks:0,profileName:'test',sensory:{...initialSensoryState},comfort:false,timestamp:1};
check('measured metrics / honest missing samples / comparable conditions', () => { assert.equal(errorRate(trial),25);assert.equal(averageOffset(trial),10);assert.equal(frustration(trial),28);assert.equal(frustration(null),0);assert.equal(comparable(trial,undefined),false);assert.equal(comparable(trial,{...trial,mode:'after'}),true);assert.equal(comparable(trial,{...trial,keyboardClicks:1}),false);assert.equal(comparable(trial,{...trial,sensory:{...initialSensoryState,blur:3}}),false); });
check('scene/mode records isolated and reset retains completed data', () => { let s=appReducer(initialState,{type:'trial/save',trial});s=appReducer(s,{type:'trial/save',trial:{...trial,mode:'after',elapsed:3}});s=appReducer(s,{type:'sensory/clear'});assert.equal(s.metricsStore['hospital:before'].elapsed,5);assert.equal(s.metricsStore['hospital:after'].elapsed,3);assert.equal(s.metricsStore['payment:before'],undefined); });
const root=fileURLToPath(new URL('../',import.meta.url));
check('four packaged offline WAV assets valid RIFF and finite size', () => { for(const clip of ['hearing','hospital','payment','escape']) {const buffer=readFileSync(join(root,'public/audio',`${clip}.wav`));assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WAVE');assert.ok(buffer.length>10000&&buffer.length<3000000);} });
check('no remote image/font/audio requests, analytics, or storage writes', () => { const files=[]; const walk=p=>{for(const entry of readdirSync(p)){const f=join(p,entry);if(statSync(f).isDirectory())walk(f);else if(/\.(tsx?|css)$/.test(f)) files.push(f);}};walk(join(root,'src'));for(const file of files){const text=readFileSync(file,'utf8');assert.ok(!/(?:src|href)\s*=\s*["']https?:|url\(["']?https?:|localStorage\.setItem|navigator\.sendBeacon/.test(text),file);} });
console.log(`\n${passed}/${passed} validation groups passed.`);
console.log('Scene contrast samples:',Object.values(SCENES).map(s=>`${s.id} ${contrastRatio(s.before.foreground,s.before.background).toFixed(3)} -> ${contrastRatio(s.after.foreground,s.after.background).toFixed(3)}`).join('; '));
