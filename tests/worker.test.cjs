const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),zlib=require('node:zlib');
test('static worker decodes real gzip bytes and reports missing data without hanging',async()=>{
 const messages=[],context={self:{postMessage:message=>messages.push(message)},fetch:async url=>url==='missing'?new Response('',{status:404}):new Response(zlib.gzipSync(JSON.stringify({cells:[{id:'test'}]}))),AbortSignal,DecompressionStream,Response,URL};
 vm.runInNewContext(fs.readFileSync('src/data-worker.js','utf8'),context);
 await context.self.onmessage({data:{id:1,url:'dataset'}});
 assert.deepEqual(JSON.parse(JSON.stringify(messages[0])),{id:1,value:{cells:[{id:'test'}]}});
 await context.self.onmessage({data:{id:2,url:'missing'}});assert.match(messages[1].error,/404/);
});

test('static release has binary data, cache fingerprints and no backend discovery',{skip:!process.env.SHROOMS_VERIFY_STATIC},()=>{
 const runtime=fs.readFileSync('_site/src/runtime.js','utf8'),html=fs.readFileSync('_site/index.html','utf8');
 assert.match(runtime,/SHROOMS_BINARY=true/);assert.match(runtime,/SHROOMS_DATA_VERSION="[a-f0-9]{16}"/);
 const {unpack}=require('../server/data.cjs');
 const released=JSON.parse(zlib.gunzipSync(fs.readFileSync('_site/data/national-weather.json.gz')));
 assert.deepEqual(released,unpack('.','national-weather'));
 assert.ok(!fs.existsSync('_site/data/national-weather.js'));
 for(const match of html.matchAll(/(?:src|href)="\.\/(src\/[^"?]+\.js|styles\.css)\?v=([a-f0-9]+)"/g)){
  const hash=require('crypto').createHash('sha256').update(fs.readFileSync(`_site/${match[1]}`)).digest('hex').slice(0,12);assert.equal(match[2],hash);
 }
});
