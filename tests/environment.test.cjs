const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {unpack,createData}=require('../server/data.cjs');
const context={window:{},atob,Uint8Array,DataView};vm.createContext(context);vm.runInContext(fs.readFileSync('src/environment.js','utf8'),context);
const api=context.window.SHROOMS_ENVIRONMENT,meta=unpack('.','environment/index'),climate=unpack('.','environment/climate');
const plain=value=>JSON.parse(JSON.stringify(value));
test('environment lookup respects boundaries, little endian encoding, and unknown values',()=>{
 const m={origin:[100,200],width:2,height:2,resolutionMeters:50,tileSize:2,channels:['a','b'],scale:10,noData:65535};
 assert.equal(api.address(m,99,200),null);assert.equal(api.address(m,100,201),null);assert.equal(api.address(m,200,200),null);
 assert.equal(api.address(m,125,175).offset,0);assert.equal(api.address(m,175,125).offset,12);
 const bytes=new Uint8Array(16),view=new DataView(bytes.buffer);view.setUint16(0,723,true);view.setUint16(2,65535,true);
 assert.deepEqual(plain(api.decode(m,bytes,0)),{a:72.3,b:null});assert.throws(()=>api.decode(m,bytes.subarray(2),0),/Invalid/);
});
test('climate keeps different source grids, signed temperatures, dates, and missing pixels',()=>{
 const m={scale:10,noData:-32768,fields:{rain14:{origin:[100,200],width:1,height:1,resolutionMeters:1000},temp7:{origin:[100,1200],width:1,height:1,resolutionMeters:1000}}};
 const rain=new Uint8Array([123,0]),temp=new Uint8Array([236,255]);
 assert.deepEqual(plain(api.sampleClimate(m,{rain14:rain,temp7:temp},150,150)),{rain14:12.3,temp7:null});
 assert.deepEqual(plain(api.sampleClimate(m,{rain14:rain,temp7:temp},150,1150)),{rain14:null,temp7:-2});
 assert.equal((Date.parse(climate.endDate)-Date.parse(climate.startDate))/86400000,13);
 assert.equal(climate.quality,'preliminary');assert.equal(climate.source,'Source: MeteoSwiss');
 const buffers=Object.fromEntries(Object.entries(climate.fields).map(([k,f])=>[k,Buffer.from(f.values,'base64')]));
 for(const [name,f] of Object.entries(climate.fields)){
  assert.equal(buffers[name].length,f.width*f.height*2);assert.equal(f.resolutionMeters,1000);
  let valid=0;for(let i=0;i<buffers[name].length;i+=2){const v=buffers[name].readInt16LE(i);if(v===-32768)continue;valid++;if(name==='sunRelative7')assert.ok(v>=0&&v<=1000);if(name==='rain14')assert.ok(v>=0);}
  assert.ok(valid>1000);
 }
 assert.equal(climate.sources.length,28);assert.ok(climate.sources.every(s=>s.sha256.length===64&&s.url.startsWith('https://data.geo.admin.ch/')));
});
test('real bundles retain coverage, physical ranges, soil intervals and provenance',()=>{
 assert.equal(meta.resolutionMeters,50);assert.equal(meta.canopy.sourceResolutionMeters,5);assert.equal(meta.soil.sourceResolutionMeters,25);
 assert.equal(meta.hostTrees.status,'access-required');assert.equal(meta.tiles.length,new Set(meta.tiles).size);assert.ok(meta.tiles.length>1000);
 let count=0;
 // Spread the checks across the national grid, not just one canton.
 for(let n=0;n<meta.tiles.length;n+=79){
  const tile=Buffer.from(unpack('.',meta.tiles[n]).values,'base64');
  assert.equal(tile.length,meta.tileSize**2*meta.channels.length*2);
  for(let i=0;i<tile.length;i+=meta.channels.length*2){
   const v=api.decode(meta,tile,i);
   for(const k of ['skySummer','skyWinter','skyCoverage','clay','sand'])if(v[k]!==null)assert.ok(v[k]>=0&&v[k]<=100,k);
   for(const k of ['clay','sand','depth'])if([v[k],v[k+'Low'],v[k+'High']].every(x=>x!==null)){assert.ok(v[k+'Low']<=v[k]&&v[k]<=v[k+'High']);count++;}
  }
 }
 assert.ok(count>10000);assert.ok(meta.sources.every(s=>s.sha256.length===64&&s.url.startsWith('https://www.envidat.ch/')));
});
test('optional context deduplicates tile loads, retries errors and stays off the scoring path',async()=>{
 const key=meta.tiles[400], [row,col]=key.split('/').at(-1).split('-').map(Number),x=meta.origin[0]+col*128*50+25,y=meta.origin[1]-row*128*50-25;
 let calls=[],fail=true;
 const load=async key=>{calls.push(key);if(fail&&key==='environment/climate')throw Error('offline');return unpack('.',key);};
 const lookup=api.create(load);
 assert.equal(calls.length,0);let result=await lookup(x,y);assert.equal(result.weather.status,'error');
 fail=false;result=await lookup(x,y);assert.equal(result.weather.status,'ready');await lookup(x,y);
 assert.equal(calls.filter(k=>k===key).length,1);assert.equal(calls.filter(k=>k==='environment/index').length,1);
 assert.equal(calls.filter(k=>k==='environment/climate').length,2);
 assert.doesNotMatch(fs.readFileSync('src/scoring.js','utf8'),/SHROOMS_ENVIRONMENT/);
 const server=createData('.');assert.ok(server.get('environment/index'));assert.ok(server.get('environment/climate'));assert.ok(server.get(key));assert.equal(server.get('environment/tiles/999-999'),null);
});
