const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('src/analytics.js','utf8');
function run({href='https://www.pilzradar.ch/?lang=de#explore',navigator={},token='a'.repeat(32),existing=false}={}){
 const requests=[];
 const forbidden=()=>{throw Error('Private browser data must not be accessed');};
 const context={URL,location:new URL(href),navigator,window:{},localStorage:new Proxy({},{get:forbidden}),indexedDB:new Proxy({},{get:forbidden}),document:{currentScript:{dataset:{token,host:'www.pilzradar.ch'}},querySelector:()=>existing,createElement:()=>({dataset:{},setAttribute(k,v){this[k]=v;}}),head:{appendChild:s=>requests.push(s)}}};
 vm.runInNewContext(source,context);return requests;
}
test('analytics honours browser privacy signals before any external request',()=>{
 for(const navigator of [{doNotTrack:'1'},{doNotTrack:'yes'},{msDoNotTrack:'1'},{globalPrivacyControl:true}])assert.equal(run({navigator}).length,0);
});
test('analytics excludes previews, foreign hosts and potentially private URLs',()=>{
 for(const href of ['http://www.pilzradar.ch/','https://localhost/','https://dml79psi3sb8a.cloudfront.net/','file:///tmp/index.html','https://www.pilzradar.ch/?preview=lod','https://www.pilzradar.ch/?lat=47.2','https://www.pilzradar.ch/?lang=secret','https://www.pilzradar.ch/#47.2,8.5'])assert.equal(run({href}).length,0,href);
 assert.equal(run({token:null}).length,0);assert.equal(run({existing:true}).length,0);
});
test('production loads only the official beacon with automatic SPA tracking disabled',()=>{
 const [beacon]=run();assert.ok(beacon);assert.equal(beacon.src,'https://static.cloudflareinsights.com/beacon.min.js');assert.equal(beacon.referrerPolicy,'no-referrer');assert.equal(JSON.parse(beacon['data-cf-beacon']).spa,false);
});
test('enabled release includes exactly one privacy-gated loader on all public entry pages',()=>{
 const config=JSON.parse(fs.readFileSync('deployment/analytics.json','utf8'));
 if(!config.enabled)return;
 const xml=fs.readFileSync('_site/sitemap.xml','utf8');
 for(const [,raw] of xml.matchAll(/<loc>(.*?)<\/loc>/g)){
  const url=new URL(raw),file='_site/'+(url.pathname==='/'?'index.html':url.pathname.slice(1)),html=fs.readFileSync(file,'utf8');
  const loaders=[...html.matchAll(/<script defer src="([^"]*src\/analytics.js[^\"]*)" data-token="([^"]+)" data-host="([^"]+)"><\/script>/g)];
  assert.equal(loaders.length,1,file);assert.equal(loaders[0][2],config.token);assert.equal(loaders[0][3],config.hostname);
  assert.equal(new URL(loaders[0][1],url).pathname,'/src/analytics.js');assert.ok(!html.includes('src="https://static.cloudflareinsights.com'),'external script must remain gated');
 }
 assert.ok(!fs.readFileSync('_site/privacy.html','utf8').includes('src/analytics.js'));
});
