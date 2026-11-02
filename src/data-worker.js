/* Static-host data decoding and bounded disk caching stay off the UI thread. */
if(typeof importScripts==='function')importScripts(new URL('./tile-cache.js'+self.location.search,self.location.href).href,new URL('./compact.js'+self.location.search,self.location.href).href);
const diskCache=self.SHROOMS_TILE_CACHE?.create();
async function decode(blob){const value=await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).json();return self.SHROOMS_EXPAND?self.SHROOMS_EXPAND(value):value;}
self.onmessage=async({data:{id,url}})=>{
 try{
  // Benchmark cold runs bypass every app-owned persistent cache.
  const bypass=new URL(url,'https://local.invalid').searchParams.has('cold');
  if(!bypass&&diskCache){
   const cached=await diskCache.get(url);
   if(cached){
    try{self.postMessage({id,value:await decode(cached)});return;}
    catch{await diskCache.remove(url);}
   }
  }
  const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(90000),...(bypass?{cache:'reload'}:{})});
  if(!response.ok)throw new Error(`Dataset request failed (${response.status})`);
  const blob=await response.blob(),value=await decode(blob);
  self.postMessage({id,value});
  // Only valid decoded payloads enter the cache. The UI never waits for a write.
  if(!bypass)await diskCache?.write(url,blob);
 }catch(error){self.postMessage({id,error:error.message});}
};
