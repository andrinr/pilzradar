/* Batch model evaluation away from the UI; cooperative fallback for worker-less browsers. */
window.SHROOMS_COMPUTE={create(cells,points){
 let worker,initialization,sequence=0,weatherSource,weatherVersion=0;const pending=new Map();
 if(typeof Worker!=='undefined'&&location.protocol!=='file:'){
  try{
   worker=new Worker(new URL(`./src/scoring-worker.js?v=${window.SHROOMS_CODE_VERSION||'20261102'}`,document.baseURI));
   worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;clearTimeout(job.timer);pending.delete(data.id);data.error?job.reject(new Error(data.error)):job.resolve(data);};
   worker.onerror=()=>{worker.terminate();worker=null;for(const job of pending.values()){clearTimeout(job.timer);job.reject(new Error('Scoring worker unavailable'));}pending.clear();};
   // Structured cloning the entire national index is itself a long UI task.
   // Send bounded chunks, yielding between them; score requests wait for all chunks.
   initialization=(async()=>{
    try{
     worker.postMessage({type:'init',cells:[],points});
     for(let offset=0;offset<cells.length;offset+=2048){
      if(!worker)return;
      worker.postMessage({type:'append',cells:cells.slice(offset,offset+2048)});
      await new Promise(resolve=>setTimeout(resolve,0));
     }
    }catch{worker?.terminate();worker=null;}
   })();
  }catch{worker=null;}
 }
 return {async score(species,entries,date,extra=[]){
  await initialization;
  if(weatherSource!==entries){weatherSource=entries;weatherVersion++;}
  let result;
  if(worker)try{
   result=await new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Scoring timed out'));},30000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,species,entries:[...entries],date:date.toISOString(),weatherVersion,extra});});
   window.SHROOMS_PERF?.record('workerScore',result.ms);
  }catch(error){console.warn(error.message);}
  if(!result){
   const values=[],local=[],profile=window.SHROOMS_SPECIES[species];
   for(const [list,out] of [[cells,values],[extra,local]])for(let i=0;i<list.length;i++){
    const c=list[i],w=entries.size?window.SHROOMS_WEATHER.interpolate(c,points,entries):undefined;
    out.push(species==='all'?window.SHROOMS_SCORE.aggregate(c,w,date,true):window.SHROOMS_SCORE.score(c,profile,w,date,true));
    if(i%256===255)await new Promise(resolve=>setTimeout(resolve,0));
   }
   result={values,extra:local};
  }
  const scores=new Map();cells.forEach((c,i)=>scores.set(c.id,{value:result.values[i]}));extra.forEach((c,i)=>scores.set(c.id,{value:result.extra[i]}));scores.rank=result.order;return scores;
 }};
}};
