const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const {unpack}=require('../server/data.cjs');
function runtime(){const c={window:{},Map,Math,Number,Object,Array,parseInt};vm.createContext(c);for(const name of ['compact','forest-raster'])vm.runInContext(fs.readFileSync(`src/${name}.js`,'utf8'),c);return c.window;}
test('compact national index preserves every original scoring input exactly',()=>{
 const original=unpack('.','regions/ch/index'),encoded=require('../scripts/compact_index.cjs')(original);
 const restored=runtime().SHROOMS_EXPAND(JSON.parse(JSON.stringify(encoded)));
 assert.deepEqual(JSON.parse(JSON.stringify(restored)),original);
 const before=zlib.gzipSync(JSON.stringify(original)).length,after=zlib.gzipSync(JSON.stringify(encoded)).length;
 assert.ok(after<before*.65,`${before} -> ${after}`);
});
test('categorical coverage preserves transparency, current score colors and map hit testing',()=>{
 const {SHROOMS_RASTER:r}=runtime();let pixels;
 const data={format:'forest-raster-v1',z:0,x:128,y:128,width:2,height:2,ids:['forest'],runs:[1,0,2,1,1,0]};
 const canvas=r.paint(data,()=> 'rgb(42,176,166)',()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>pixels=p.data})}));
 assert.deepEqual([...pixels],[0,0,0,0,42,176,166,255,42,176,166,255,0,0,0,0]);
 assert.equal(r.hit(data,0,0),null);assert.equal(r.hit(data,1.5,0),'forest');assert.equal(r.hit(data,10,10),null);
 let drawn;const ctx={drawImage:(...args)=>drawn=args};r.draw(ctx,canvas,data,{x:1,y:1,z:1});assert.deepEqual(drawn.slice(1),[0,0,4,4]);
});
test('overview mask payloads are bounded, valid and materially smaller than their vector source',()=>{
 const manifest=unpack('.','overview-forest/index');let rasterBytes=0,vectorBytes=0;
 for(const tile of manifest.tiles){
  assert.ok(tile.rasterKey);const data=unpack('.',tile.rasterKey);
  assert.equal(data.format,'forest-raster-v1');assert.ok(data.width*data.height<2e6);
  let pixels=0;for(let i=0;i<data.runs.length;i+=2){assert.ok(data.runs[i]>0);assert.ok(data.runs[i+1]>=0&&data.runs[i+1]<=data.ids.length);pixels+=data.runs[i];}
  assert.equal(pixels,data.width*data.height);
  rasterBytes+=zlib.gzipSync(JSON.stringify(data)).length;vectorBytes+=zlib.gzipSync(JSON.stringify(unpack('.',tile.coarseKey))).length;
 }
 assert.ok(rasterBytes<vectorBytes*.25,`${vectorBytes} -> ${rasterBytes}`);
});
test('data worker expands a real packaged compact index before sending it to the UI',async()=>{
 const messages=[],context={self:{postMessage:m=>messages.push(m)},URL,AbortSignal,DecompressionStream,Response,fetch:async()=>new Response(zlib.gzipSync(JSON.stringify(require('../scripts/compact_index.cjs')(unpack('.','regions/ch/index')))))};
 vm.runInNewContext(fs.readFileSync('src/compact.js','utf8'),context);vm.runInNewContext(fs.readFileSync('src/data-worker.js','utf8'),context);
 await context.self.onmessage({data:{id:1,url:'https://example.test/data/regions/ch/index.json.gz'}});
 assert.ok(!messages[0].error);assert.equal(messages[0].value.cells.length,85969);assert.deepEqual(JSON.parse(JSON.stringify(messages[0].value.cells[0])),unpack('.','regions/ch/index').cells[0]);
});
test('static release retains the legacy index alongside the smaller startup format',()=>{
 if(!fs.existsSync('_site/data/regions/ch/compact-index.json.gz'))return;
 const original=JSON.parse(zlib.gunzipSync(fs.readFileSync('_site/data/regions/ch/index.json.gz'))),compact=JSON.parse(zlib.gunzipSync(fs.readFileSync('_site/data/regions/ch/compact-index.json.gz')));
 assert.equal(original.cells.length,85969);assert.equal(compact.compactCells.count,original.cells.length);assert.ok(fs.readFileSync('_site/index.html','utf8').includes('src/compact.js'));
});
