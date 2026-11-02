/* Gzip in script envelopes works on Pages and direct file previews alike. */
window.SHROOMS_PACKED = {};
window.SHROOMS_LOAD = (() => {
  const pending = new Map(), jobs=new Map();
  let worker,sequence=0;
  function binary(key){
    const cold=new URLSearchParams(location.search).get('bench')==='1'&&new URLSearchParams(location.search).get('cold')==='1'?`&cold=${Date.now()}`:'';
    const url=new URL(`../data/${key}.json.gz?v=${window.SHROOMS_DATA_VERSION||'20261102'}${cold}`,new URL('src/',document.baseURI)).href;
    if(typeof Worker==='undefined')return fetch(url).then(async response=>{
      if(!response.ok)throw new Error('Dataset unavailable');
      return window.SHROOMS_EXPAND(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json());
    });
    if(!worker){
      worker=new Worker(new URL(`./src/data-worker.js?v=${window.SHROOMS_CODE_VERSION||'20261102-cache'}`,document.baseURI));
      worker.onmessage=({data})=>{const job=jobs.get(data.id);if(!job)return;clearTimeout(job.timer);jobs.delete(data.id);data.error?job.reject(new Error(data.error)):job.resolve(data.value);};
      worker.onerror=()=>{for(const job of jobs.values()){clearTimeout(job.timer);job.reject(new Error('Data worker failed'));}jobs.clear();worker.terminate();worker=null;};
    }
    return new Promise((resolve,reject)=>{
      const id=++sequence,timer=setTimeout(()=>{jobs.delete(id);reject(new Error(`Timed out loading ${key}`));},95000);
      jobs.set(id,{resolve,reject,timer});worker.postMessage({id,url});
    });
  }
  function load(key) {
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      if(window.SHROOMS_BINARY)return binary(key);
      if(window.SHROOMS_SERVICE&&await window.SHROOMS_SERVICE.ready){
        try{return await window.SHROOMS_SERVICE.request(`data/${key}?v=20260924h`);}catch(error){console.warn('Using bundled map data after API failure.');}
      }
      await new Promise((resolve,reject) => {
        const script=document.createElement('script');
        script.src=`./data/${key}.js?v=20260924h`;
        const timer=setTimeout(()=>{script.remove();reject(new Error(`Timed out loading ${key}`));},15000);
        script.onload=()=>{clearTimeout(timer);script.remove();resolve();};
        script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error(`Could not load ${key}`));};
        document.head.appendChild(script);
      });
      const encoded=window.SHROOMS_PACKED[key];
      if(!encoded)throw new Error(`Empty data: ${key}`);
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const value=await new Response(stream).json();
      delete window.SHROOMS_PACKED[key];
      return value;
    })();
    pending.set(key,task);
    task.catch(()=>pending.delete(key));
    return task;
  }
  load.release=key=>pending.delete(key);
  return load;
})();
