const {fail}=require('./accounts.cjs');
const {observations}=require('../src/notebook-store.js');
function createContributions(db,species,now){
 db.exec(`CREATE TABLE IF NOT EXISTS habitat_contributions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, received_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS feature_requests (id TEXT PRIMARY KEY, feature TEXT NOT NULL, received_at TEXT NOT NULL);`);
 function id(value){if(typeof value!=='string'||!(/^[a-f0-9]{64}$/.test(value)||/^[a-f0-9-]{36}$/.test(value)))throw fail(400,'Invalid request identifier.');return value;}
 function save(input){
  const key=id(input.requestId);
  if(input.consent!=='habitat-research-v1')throw fail(400,'Explicit sharing consent is required.');
  if(!Number.isFinite(input.lat)||!Number.isFinite(input.lon)||input.lat<45.7||input.lat>47.9||input.lon<5.9||input.lon>10.6)throw fail(400,'Choose a location in Switzerland.');
  let records;try{records=observations(input.observations);}catch{throw fail(400,'Invalid sightings.');}
  if(!records.length||records.some(o=>o.species!=='unknown'&&!Object.hasOwn(species,o.species)))throw fail(400,'Record a supported mushroom species first.');
  // Only explicitly shared fields are retained. Never retain notebook names or notes.
  const payload=JSON.stringify({lat:input.lat,lon:input.lon,observations:records.map(({id,species,date,count})=>({id,species,date,count})),consent:input.consent});
  const prior=db.prepare('SELECT payload FROM habitat_contributions WHERE id=?').get(key);
  if(prior&&prior.payload!==payload)throw fail(409,'This request identifier was already used.');
  db.prepare('INSERT OR IGNORE INTO habitat_contributions VALUES (?,?,?)').run(key,payload,now().toISOString());
  return {ok:true,requestId:key};
 }
 function request(input){const key=id(input.requestId);if(input.feature!=='accounts-and-sync')throw fail(400,'Unknown feature request.');db.prepare('INSERT OR IGNORE INTO feature_requests VALUES (?,?,?)').run(key,input.feature,now().toISOString());return {ok:true};}
 return {save,request};
}
module.exports={createContributions};
