// Read-only smoke checks for the configured public static release.
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const deployment=require('../deployment/aws.json');
const base=deployment.url,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(path){const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,`${path}: HTTP ${response.status}`);return {response,bytes:Buffer.from(await response.arrayBuffer())};}
(async()=>{
 const {response,bytes}=await get('/');assert.equal(hash(bytes),hash(fs.readFileSync('_site/index.html')),'Released homepage differs');
 assert.match(response.headers.get('cache-control'),/no-cache/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.ok(response.headers.get('strict-transport-security'));
 const redirect=await fetch(base.replace('https:','http:'),{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.ok([301,302,307,308].includes(redirect.status));assert.equal(redirect.headers.get('location'),base+'/');
 const canonical=new URL(base);
 if(canonical.hostname.startsWith('www.')){
  const apex=canonical.hostname.slice(4);
  for(const protocol of ['http:','https:'])for(const path of ['/','/en/species/porcini.html?lang=en&species=porcini']){
   const response=await fetch(`${protocol}//${apex}${path}`,{redirect:'manual',signal:AbortSignal.timeout(30000)});
   assert.ok([301,308].includes(response.status),`Apex must permanently redirect: ${protocol}//${apex}${path}`);
   assert.equal(response.headers.get('location'),base+path,'Apex redirect must preserve path and query');
  }
 }
 const runtime=fs.readFileSync('_site/src/runtime.js','utf8');assert.match(runtime,/SHROOMS_STATIC=true/);assert.match(runtime,/SHROOMS_BINARY=true/);
 const manifest=JSON.parse(zlib.gunzipSync(fs.readFileSync('_site/data/habitat/index.json.gz')));
 const keys=['regions','regions/ch/index','regions/ch/compact-index','habitat/index','overview-forest/index','national-weather','national-protected','environment/index','environment/climate','environment/tiles/8-34',manifest.tiles[0].key,'overview-forest/raster/0-3'];
 await Promise.all(keys.map(async key=>{
  const file=`data/${key}.json.gz`,{response,bytes}=await get('/'+file);
  assert.equal(response.headers.get('content-encoding'),null,`${file}: browser would decompress twice`);
  JSON.parse(zlib.gunzipSync(bytes));assert.equal(hash(bytes),hash(fs.readFileSync('_site/'+file)),`${file}: release differs`);
 }));
 for(const file of ['src/runtime.js','src/data-worker.js','src/tile-cache.js','src/compact.js','src/forest-raster.js','src/overview.js','src/overview-worker.js','src/loader.js','src/scoring.js','src/scoring-worker.js','src/compute.js','src/heatmap.js','src/smooth-zoom.js','src/basemap.js','src/environment.js','src/app.js','styles.css','design.css']){
  const {bytes}=await get('/'+file);assert.equal(hash(bytes),hash(fs.readFileSync('_site/'+file)),file);
 }
 const robots=await get('/robots.txt');assert.match(robots.bytes.toString(),/Allow: \//);assert.ok(robots.bytes.toString().includes(base+'/sitemap.xml'));
 const sitemap=await get('/sitemap.xml');assert.equal(hash(sitemap.bytes),hash(fs.readFileSync('_site/sitemap.xml')));
 const pages=[...sitemap.bytes.toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]));assert.equal(pages.length,116);
 let next=0;
 await Promise.all(Array.from({length:8},async()=>{while(next<pages.length){const url=pages[next++];assert.equal(url.origin,new URL(base).origin);const {response,bytes}=await get(url.pathname);assert.match(response.headers.get('content-type'),/text\/html/);assert.equal(hash(bytes),hash(fs.readFileSync('_site/'+(url.pathname==='/'?'index.html':url.pathname.slice(1)))),'Search page differs: '+url.pathname);}}));
 for(const file of ['privacy.html','favicon.svg','social-preview.png','src/analytics.js','guide.css','src/i18n.js','src/locales.js','src/donations.js']){const {bytes}=await get('/'+file);assert.equal(hash(bytes),hash(fs.readFileSync('_site/'+file)));}
 const origin=await fetch(`https://${deployment.bucket}.s3.${deployment.region}.amazonaws.com/data/regions.json.gz`,{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.equal(origin.status,403,'S3 origin must block anonymous access');
 console.log(`Public static release verified: HTTPS, permanent apex redirects, cache/security headers, ${keys.length} real datasets, worker/code fingerprints, 116 crawlable pages, and private S3 origin.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
