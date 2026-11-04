const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/app.js','utf8');
for(const requested of ['ch','ti','unknown'])test(`basemap starts while habitat and weather remain unresolved (${requested})`,async()=>{
 const calls=[],bounds=[[46,8],[47,9]],national=[[45,5],[48,11]];
 const map={fitBounds(value){calls.push(['bounds',value]);return this;}};
 const elements=new Map(),document={getElementById(id){if(!elements.has(id))elements.set(id,{});return elements.get(id);}};
 const pending=new Promise(()=>{});
 const context={performance,document,URLSearchParams,location:{search:`?region=${requested}`},setTimeout,console,L:{map(){calls.push(['map']);return map;}},window:{
  SHROOMS_BINARY:true,SHROOMS_PERF:{record(name){calls.push([name]);}},
  SHROOMS_BASEMAP_TILES:{mount(_L,instance,callback){assert.equal(instance,map);return {mode(enabled){calls.push(['tiles',enabled]);callback(true,false);}};}},
  SHROOMS_LOAD(key){calls.push(['load',key]);if(key==='regions')return Promise.resolve({regions:[]});if(key==='habitat/index')return Promise.resolve({regions:[{id:'ti',bounds}]});if(key==='switzerland-map')return Promise.resolve({bounds:national});return pending;}
 }};
 context.window.L=context.L;
 vm.runInNewContext(source,context);
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.ok(calls.some(c=>c[0]==='tiles'&&c[1]===true));
 assert.deepEqual(calls.find(c=>c[0]==='bounds')[1],requested==='ti'?bounds:national);
 assert.ok(calls.findIndex(c=>c[0]==='tiles')<calls.findIndex(c=>c[0]==='load'&&c[1]==='regions/ch/compact-index'));
 assert.ok(!elements.get('map')?.textContent);
});
