/* Rebuildable public datasets only. Notebook localStorage is never touched. */
(function(scope){
 const MAX_BYTES=64*1024*1024,MAX_ENTRIES=512;
 function create(factory=scope.indexedDB){
  let opening,queue=Promise.resolve();
  function open(){
   if(!factory)return Promise.resolve(null);
   if(!opening)opening=new Promise(resolve=>{
    let settled=false;const timer=setTimeout(()=>finish(null),1200);
    function finish(db){if(settled){db?.close();return;}settled=true;clearTimeout(timer);resolve(db);}
    let request;try{request=factory.open('shrooms-map-cache',1);}catch{return finish(null);}
    request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('entries');db.createObjectStore('lru',{keyPath:'url'});};
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=null;};finish(db);};
    request.onerror=request.onblocked=()=>finish(null);
   });
   return opening;
  }
  async function get(url){
   const db=await open();if(!db)return null;
   return new Promise(resolve=>{
    try{
     const tx=db.transaction(['entries','lru'],'readwrite'),request=tx.objectStore('entries').get(url);
     let blob=null;
     request.onsuccess=()=>{blob=request.result||null;if(blob)tx.objectStore('lru').put({url,bytes:blob.size,used:Date.now()});};
     tx.oncomplete=()=>resolve(blob);tx.onerror=tx.onabort=()=>resolve(null);
    }catch{resolve(null);}
   });
  }
  function write(url,blob){
   if(!blob||blob.size>MAX_BYTES)return Promise.resolve();
   const task=queue.then(async()=>{
    const db=await open();if(!db)return;
    await new Promise(resolve=>{
     try{
      const tx=db.transaction(['entries','lru'],'readwrite'),entries=tx.objectStore('entries'),lru=tx.objectStore('lru');
      const request=lru.getAll();
      request.onsuccess=()=>{
       const records=request.result.filter(r=>r.url!==url).sort((a,b)=>a.used-b.used);
       let total=records.reduce((sum,r)=>sum+r.bytes,0)+blob.size,count=records.length+1;
       for(const record of records){if(total<=MAX_BYTES&&count<=MAX_ENTRIES)break;entries.delete(record.url);lru.delete(record.url);total-=record.bytes;count--;}
       entries.put(blob,url);lru.put({url,bytes:blob.size,used:Date.now()});
      };
      // Quota denial aborts this cache write, never the data request.
      tx.oncomplete=tx.onerror=tx.onabort=()=>resolve();
     }catch{resolve();}
    });
   }).catch(()=>{});
   queue=task;return task;
  }
  async function remove(url){
   const db=await open();if(!db)return;
   return new Promise(resolve=>{try{const tx=db.transaction(['entries','lru'],'readwrite');tx.objectStore('entries').delete(url);tx.objectStore('lru').delete(url);tx.oncomplete=tx.onerror=tx.onabort=()=>resolve();}catch{resolve();}});
  }
  return {get,write,remove};
 }
 scope.SHROOMS_TILE_CACHE={create,MAX_BYTES,MAX_ENTRIES};
})(typeof self==='undefined'?window:self);
