const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {unpack}=require('../server/data.cjs');
function model(){const c={window:{},Intl,Date,Math,Number};vm.createContext(c);for(const name of ['data','weather','scoring'])vm.runInContext(fs.readFileSync(`src/${name}.js`,'utf8'),c);return c.window;}
test('combined score is the equal mean of every modeled species, excluding observation-only entries',()=>{
 const w=model(),date=new Date('2026-09-23T12:00:00Z'),cells=unpack('.','regions/ch/index').cells,profiles=w.SHROOMS_SCORE.modelled();assert.equal(profiles.length,20);assert.ok(!profiles.some(([id])=>['liberty_cap','wavy_cap'].includes(id)));
 for(const cell of [cells[0],cells[4000],cells[20000],{...cells[0],treeKnown:0,canopy:null,soilPh:null}])for(const weather of [undefined,{rain14:60,soil:.3,temp7:15,humidity:80}]){
  const expected=profiles.reduce((sum,[,p])=>sum+w.SHROOMS_SCORE.score(cell,p,weather,date,true),0)/profiles.length,result=w.SHROOMS_SCORE.aggregate(cell,weather,date);
  assert.equal(result.value,Math.round(expected));assert.equal(result.mean,expected);assert.equal(w.SHROOMS_SCORE.aggregate(cell,weather,date,true),result.value);assert.equal(result.breakdown.length,20);assert.ok(Math.abs(result.breakdown.reduce((n,p)=>n+p.contribution,0)-expected)<1e-10);assert.ok(result.breakdown.every(p=>p.weight===.05));
 }
});
test('worker aggregate and selected species agree with the shared model, including extra local cells',()=>{
 const w=model(),national=unpack('.','regions/ch/index'),cells=national.cells.slice(0,100),extra=[national.cells[4000]],messages=[];
 const c={URL,performance,Float32Array,Map,WeakMap,Intl,Date,Math,Number,location:{href:'https://example.test/src/scoring-worker.js?v=test'},postMessage:m=>messages.push(m)};c.self=c;c.window=c;vm.createContext(c);c.importScripts=(...urls)=>urls.forEach(url=>vm.runInContext(fs.readFileSync('src/'+url.split('?')[0],'utf8'),c));vm.runInContext(fs.readFileSync('src/scoring-worker.js','utf8'),c);
 c.onmessage({data:{type:'init',cells,points:national.weatherPoints}});const date='2026-09-23T12:00:00Z';
 c.onmessage({data:{id:1,species:'all',entries:[],weatherVersion:1,date,extra}});assert.ok(!messages[0].error,messages[0].error);cells.forEach((cell,i)=>assert.equal(messages[0].values[i],w.SHROOMS_SCORE.aggregate(cell,undefined,new Date(date),true)));assert.equal(messages[0].extra[0],w.SHROOMS_SCORE.aggregate(extra[0],undefined,new Date(date),true));
 c.onmessage({data:{id:2,species:'porcini',entries:[],weatherVersion:1,date,extra:[]}});assert.equal(messages[1].values[0],w.SHROOMS_SCORE.score(cells[0],w.SHROOMS_SPECIES.porcini,undefined,new Date(date),true));
});
test('worker-less combined scoring preserves the same average for local detail',async()=>{
 const c={window:{},Intl,Date,Math,Number,Map,setTimeout};vm.createContext(c);for(const name of ['data','weather','scoring','compute'])vm.runInContext(fs.readFileSync(`src/${name}.js`,'utf8'),c);
 const national=unpack('.','regions/ch/index'),cells=national.cells.slice(0,8),entries=new Map(),date=new Date('2026-09-23T12:00:00Z');
 const result=await c.window.SHROOMS_COMPUTE.create(cells,national.weatherPoints).score('all',entries,date);
 for(const cell of cells)assert.equal(result.get(cell.id).value,c.window.SHROOMS_SCORE.aggregate(cell,undefined,date,true));
});

test('panning into fine forest cells uses the same selected-profile score as the detail panel',async()=>{
 const w=model(),source=fs.readFileSync('src/app.js','utf8');
 const functions=source.slice(source.indexOf('  function fullScore(c)'),source.indexOf('  async function recompute()'))+source.slice(source.indexOf('  async function loadVisibleTiles()'),source.indexOf('  async function serverWeather()'));
 const weather={rain14:50,soil:.3,humidity:75,temp7:12},date=new Date('2026-11-02T12:00:00Z');
 const sample={canopy:null,canopyKnown:0,treeKnown:1,broadleaf:70,conifer:30,slope:8,aspect:0,lat:47,lon:8,tile:'local'};
 const features=[100,50,25].map((forest,i)=>({properties:{...sample,forest,id:'edge-'+i}}));
 const bounds={pad(){return this;},getSouth:()=>46,getWest:()=>7,getNorth:()=>48,getEast:()=>9};
 const context={requestAnimationFrame:fn=>fn(),window:{...w,SHROOMS_ADAPTIVE:{resolution:()=>100},SHROOMS_WEATHER:{interpolate:()=>weather}},Map,Math,Date,
  state:{species:'all',weather:new Map([[0,weather]]),scores:new Map(),map:{getZoom:()=>15,getBounds:()=>bounds,removeLayer(){}}},
  species:{all:{name:'All mushrooms'},...w.SHROOMS_SPECIES},data:{weatherPoints:[]},today:date,cellWeather:new Map(),byId:new Map(),localFeatures:new Map(),pendingSpot:null,
  habitat:{view:async()=>({features})},detailTiles:{update:async()=>({count:features.length})},
  updateResolution(){},renderList(){},$(){return {dataset:{}};}};
 context.scored=c=>context.state.scores.get(c.id);vm.createContext(context);vm.runInContext(functions,context);
 // Exercise the actual newly loaded-cell path, rather than only the scoring worker.
 for(const id of ['all','porcini','all']){
  context.state.species=id;context.state.scores.clear();await context.loadVisibleTiles();
  for(const f of features){const c=f.properties,expected=id==='all'?w.SHROOMS_SCORE.aggregate(c,weather,date).value:w.SHROOMS_SCORE.score(c,w.SHROOMS_SPECIES[id],weather,date).value;
   assert.equal(context.state.scores.get(c.id).value,expected,`${id}, ${c.forest}% forest`);
  }
 }
 const values=features.map(f=>context.state.scores.get(f.properties.id).value);
 assert.ok(Math.max(...values)-Math.min(...values)<=1,'Partial forest masks must not create the placeholder-profile edge bonus');
});
