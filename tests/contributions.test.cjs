const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createApp}=require('../server/app.cjs');
test('opt-in research intake is private, validated, idempotent and persistent; account requests contain no places',async()=>{
 const storage=await fs.mkdtemp(path.join(os.tmpdir(),'shrooms-intake-'));
 const create=()=>createApp({storageDir:storage,scheduler:false,logger:{info(){},warn(){},error(){}}});
 let app=await create();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 const call=async(route,body,origin=base)=>{const r=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,value:await r.json()};};
 const payload={requestId:'a'.repeat(64),consent:'habitat-research-v1',lat:47,lon:8,name:'DO NOT RETAIN',notes:'PRIVATE NOTE',observations:[{id:'observation-1',species:'porcini',date:'2026-01-01',count:2,notes:'PRIVATE SIGHTING'}]};
 try{
  const config=(await call('config')).value;assert.equal(config.accounts,false);assert.equal(config.contributions,true);assert.equal(config.featureRequests,true);
  assert.equal((await call('contributions',payload,'https://other.invalid')).status,403);
  assert.equal((await call('contributions',{...payload,consent:false})).status,400);
  assert.equal((await call('contributions',{...payload,lat:0})).status,400);
  assert.equal((await call('contributions',{...payload,observations:[{...payload.observations[0],species:'invalid'}]})).status,400);
  assert.equal((await call('contributions',payload)).status,200);
  assert.equal((await call('contributions',payload)).status,200);
  assert.equal((await call('contributions',{...payload,lon:9})).status,409);
  assert.equal((await call('contributions')).status,404);
  const rows=app.accounts.db.prepare('SELECT * FROM habitat_contributions').all();assert.equal(rows.length,1);assert.doesNotMatch(rows[0].payload,/PRIVATE|RETAIN|notes|name/);assert.equal(JSON.parse(rows[0].payload).observations[0].count,2);
  const vote={requestId:crypto.randomUUID(),feature:'accounts-and-sync',lat:47,notes:'PRIVATE'};
  assert.equal((await call('feature-requests',vote)).status,200);assert.equal((await call('feature-requests',vote)).status,200);
  assert.equal(app.accounts.db.prepare('SELECT count(*) AS n FROM feature_requests').get().n,1);
  assert.equal((await call('feature-requests')).status,404);
  await app.close();app=await create();assert.equal(app.accounts.db.prepare('SELECT count(*) AS n FROM habitat_contributions').get().n,1);assert.equal(app.accounts.db.prepare('SELECT count(*) AS n FROM feature_requests').get().n,1);
 }finally{await app.close();await fs.rm(storage,{recursive:true,force:true});}
});
