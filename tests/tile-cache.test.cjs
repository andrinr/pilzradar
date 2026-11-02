const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const {IDBFactory}=require('fake-indexeddb');
function cacheRuntime(factory=new IDBFactory()){
 let clock=0;const self={indexedDB:factory};vm.runInNewContext(fs.readFileSync('src/tile-cache.js','utf8'),{self,Date:{now:()=>++clock},setTimeout,clearTimeout});
 return {api:self.SHROOMS_TILE_CACHE,factory};
}
test('compressed cache persists across clients, isolates release URLs and removes corrupt entries',async()=>{
 const {api}=cacheRuntime(),a=api.create(),b=api.create(),url='https://example.org/shrooms/data/a.gz?v=one';
 await a.write(url,new Blob(['compressed']));assert.equal(await(await b.get(url)).text(),'compressed');
 assert.equal(await b.get(url.replace('one','two')),null);await b.remove(url);assert.equal(await a.get(url),null);
});
test('cache evicts least-recently-used blobs at 64 MiB and metadata at 512 entries',async()=>{
 const {api}=cacheRuntime(),cache=api.create(),blob=new Blob([new Uint8Array(24*1024*1024)]);
 await cache.write('a',blob);await cache.write('b',blob);await cache.get('a');await cache.write('c',blob);
 assert.equal(await cache.get('b'),null);assert.equal((await cache.get('a')).size,blob.size);assert.equal((await cache.get('c')).size,blob.size);
 const small=cacheRuntime().api.create();for(let i=0;i<513;i++)await small.write(String(i),new Blob(['x']));
 assert.equal(await small.get('0'),null);assert.equal((await small.get('512')).size,1);
});
test('unavailable or denied storage gracefully becomes a network-only cache',async()=>{
 for(const factory of [null,{open(){throw Error('denied');}}]){
  const cache=cacheRuntime(factory).api.create();assert.equal(await cache.get('x'),null);await cache.write('x',new Blob(['x']));await cache.remove('x');
 }
});
test('worker reuses validated gzip, heals corruption and bypasses disk in cold benchmarks',async()=>{
 const {api}=cacheRuntime(),cache=api.create(),messages=[];let requests=0;
 const worker={self:{postMessage:m=>messages.push(m),SHROOMS_TILE_CACHE:{create:()=>cache}},URL,AbortSignal,DecompressionStream,Response,
  fetch:async()=>{requests++;return new Response(zlib.gzipSync(JSON.stringify({valid:true})));}};
 vm.runInNewContext(fs.readFileSync('src/data-worker.js','utf8'),worker);
 const url='https://example.org/data/index.json.gz?v=one',send=(id,url)=>worker.self.onmessage({data:{id,url}});
 await send(1,url);await send(2,url);assert.equal(requests,1);assert.equal(messages[1].value.valid,true);
 await cache.write(url,new Blob(['invalid gzip']));await send(3,url);assert.equal(requests,2);assert.equal(messages[2].value.valid,true);
 await send(4,url+'&cold=1');await send(5,url+'&cold=1');assert.equal(requests,4);assert.equal(await cache.get(url+'&cold=1'),null);
 await send(6,url.replace('one','two'));assert.equal(requests,5);
});
