const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {unpack}=require('../server/data.cjs');
function model(){const c={window:{},Intl,Date,Math,Number};vm.createContext(c);for(const file of ['data','weather','scoring'])vm.runInContext(fs.readFileSync(`src/${file}.js`,'utf8'),c);return c.window;}
test('compact scores exactly match detailed scores for all profiles, real cells and missing-data cases',()=>{
 const w=model(),national=unpack('.','regions/ch/index'),snapshot=unpack('.','national-weather'),entries=new Map(snapshot.entries),date=new Date('2026-09-23T12:00:00Z');
 const cells=national.cells.filter((_,i)=>i%211===0);
 cells.push({forest:100},{forest:0,slope:45,aspect:180,treeKnown:1,conifer:100,broadleaf:0,pine:0,fir:100,soilPh:[6,5,7]});
 for(const c of cells)for(const weather of [undefined,{rain14:0,soil:.1,temp7:-5,humidity:30},c.x?w.SHROOMS_WEATHER.interpolate(c,national.weatherPoints,entries):undefined])for(const s of Object.values(w.SHROOMS_SPECIES)){
  assert.equal(w.SHROOMS_SCORE.score(c,s,weather,date,true),w.SHROOMS_SCORE.score(c,s,weather,date).value,s.latin+' '+c.id);
 }
});
test('worker cache invalidates when weather changes and preserves transferable score values',()=>{
 const cells=unpack('.','regions/ch/index').cells.slice(0,100),messages=[];
 const c={URL,performance,Float32Array,Map,Intl,Date,Math,Number,location:{href:'https://example.test/src/scoring-worker.js?v=test'},postMessage:m=>messages.push(m)};c.self=c;c.window=c;
 vm.createContext(c);c.importScripts=(...urls)=>urls.forEach(url=>vm.runInContext(fs.readFileSync('src/'+url.split('?')[0],'utf8'),c));vm.runInContext(fs.readFileSync('src/scoring-worker.js','utf8'),c);
 const points=[{id:'2600000:1200000'}],date='2026-09-23T12:00:00Z';c.onmessage({data:{type:'init',cells,points}});
 const job={id:1,species:'porcini',date,weatherVersion:1,entries:[[0,{rain14:60,soil:.34,humidity:90,temp7:15}]],extra:[]};c.onmessage({data:job});
 const reference=messages[0].values.slice();c.onmessage({data:{...job,id:2}});assert.deepEqual(messages[1].values,reference);
 c.onmessage({data:{...job,id:3,weatherVersion:2,entries:[[0,{rain14:0,soil:.1,humidity:30,temp7:15}]]}});assert.ok(messages[2].values[0]<reference[0]);
});
test('offscreen overview preserves Web Mercator coordinates, holes, colors and obsolete generations',()=>{
 const messages=[],fills=[],paths=[];
 class Path{constructor(){this.points=[];paths.push(this);}moveTo(x,y){this.points.push([x,y]);}lineTo(x,y){this.points.push([x,y]);}closePath(){}}
 const ctx={scale(){},translate(){},fill(path,rule){fills.push({path,rule,color:this.fillStyle});},stroke(){}};
 const c={self:{postMessage:v=>messages.push(v)},Map,Path2D:Path,Math};vm.createContext(c);vm.runInContext(fs.readFileSync('src/overview-worker.js','utf8'),c);
 const send=data=>c.self.onmessage({data});send({type:'put',key:'forest',features:[{id:'a',geometry:{coordinates:[[[[0,0],[1,0],[1,1],[0,0]],[[.2,.2],[.3,.2],[.2,.3],[.2,.2]]]]}}]});
 send({type:'style',generation:1,groups:[{members:['a'],color:'#123456'}]});
 const tile={type:'tile',id:2,generation:1,canvas:{getContext:()=>ctx},coords:{x:0,y:0,z:0},ratio:1,keys:['forest']};send(tile);
 assert.equal(fills.length,1);assert.equal(fills[0].rule,'evenodd');assert.equal(fills[0].color,'#123456');assert.equal(paths[0].points.length,8);assert.deepEqual(paths[0].points[0],[128,128]);
 send({...tile,id:3,generation:0});assert.equal(fills.length,1);assert.equal(messages.at(-1).id,3);
});
test('linear score ranking preserves descending order and stable ties',()=>{
 const c={window:{},Uint32Array,Number,Math};vm.runInNewContext(fs.readFileSync('src/ranking.js','utf8'),c);
 const values=[80,5,80,100,0,5,NaN],order=c.window.SHROOMS_RANK(values);assert.deepEqual([...order],[3,0,2,1,5,4,6]);
 const national=unpack('.','regions/ch/index').cells.map((_,i)=>i%101);
 assert.deepEqual([...c.window.SHROOMS_RANK(national)],national.map((_,i)=>i).sort((a,b)=>national[b]-national[a]));
});
test('worker-less score fallback yields and retains exact scores',async()=>{
 let yields=0;const c={window:{},Intl,Date,Math,Number,Map,setTimeout:fn=>{yields++;return setTimeout(fn,0);}};vm.createContext(c);
 for(const file of ['data','weather','scoring','compute'])vm.runInContext(fs.readFileSync(`src/${file}.js`,'utf8'),c);
 const cells=unpack('.','regions/ch/index').cells.slice(0,300),points=[{id:'2600000:1200000'}],entries=new Map([[0,{rain14:50,soil:.3,humidity:80,temp7:15}]]),date=new Date('2026-09-23T12:00:00Z');
 const results=await c.window.SHROOMS_COMPUTE.create(cells,points).score('porcini',entries,date);
 assert.ok(yields>0);for(const cell of cells)assert.equal(results.get(cell.id).value,c.window.SHROOMS_SCORE.score(cell,c.window.SHROOMS_SPECIES.porcini,c.window.SHROOMS_WEATHER.interpolate(cell,points,entries),date).value);
});
