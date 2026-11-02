/* Optional selected-cell context. No extra work in the heatmap/scoring path. */
(function(){
  function address(meta,x,y){
    const col=Math.floor((x-meta.origin[0])/meta.resolutionMeters),row=Math.floor((meta.origin[1]-y)/meta.resolutionMeters);
    if(!Number.isFinite(col)||!Number.isFinite(row)||col<0||row<0||col>=meta.width||row>=meta.height)return null;
    const size=meta.tileSize;
    return {key:`environment/tiles/${Math.floor(row/size)}-${Math.floor(col/size)}`,offset:((row%size)*size+col%size)*meta.channels.length*2};
  }
  function decode(meta,bytes,offset){
    if(bytes.byteLength!==meta.tileSize**2*meta.channels.length*2)throw Error('Invalid environmental tile');
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),result={};
    for(let i=0;i<meta.channels.length;i++){
      const v=view.getUint16(offset+i*2,true);result[meta.channels[i]]=v===meta.noData?null:v/meta.scale;
    }
    return result;
  }
  function sampleClimate(meta,buffers,x,y){
    const result={};
    for(const [name,field] of Object.entries(meta.fields)){
      const col=Math.floor((x-field.origin[0])/field.resolutionMeters),row=Math.floor((field.origin[1]-y)/field.resolutionMeters);
      result[name]=null;
      if(!Number.isFinite(col)||!Number.isFinite(row)||col<0||row<0||col>=field.width||row>=field.height)continue;
      const bytes=buffers[name];
      if(bytes.byteLength!==field.width*field.height*2)throw Error('Invalid climate grid');
      const value=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getInt16((row*field.width+col)*2,true);
      if(value!==meta.noData)result[name]=value/meta.scale;
    }
    return result;
  }
  const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  function create(load){
    let manifest,climate;const cache=new Map();
    async function metadata(){
      if(!manifest){manifest=load('environment/index');manifest.catch(()=>{manifest=null;});}
      return manifest;
    }
    async function climateData(){
      if(!climate){climate=load('environment/climate').then(meta=>({meta,buffers:Object.fromEntries(Object.entries(meta.fields).map(([k,f])=>[k,bytes(f.values)]))}));climate.catch(()=>{climate=null;});}
      return climate;
    }
    async function local(x,y){
      try{
        const meta=await metadata(),at=address(meta,x,y);
        if(!at||!meta.tiles.includes(at.key))return {status:'missing',meta};
        if(!cache.has(at.key)){
          const task=load(at.key).then(tile=>bytes(tile.values));cache.set(at.key,task);
          task.catch(()=>{cache.delete(at.key);load.release?.(at.key);});
        }
        const tile=await cache.get(at.key),values=decode(meta,tile,at.offset);
        while(cache.size>8){const key=cache.keys().next().value;cache.delete(key);load.release?.(key);}
        return {status:Object.values(values).some(v=>v!==null)?'ready':'missing',meta,values};
      }catch{return {status:'error'};}
    }
    return async(x,y)=>{
      const [context,weather]=await Promise.all([local(x,y),climateData().then(({meta,buffers})=>({status:'ready',meta,values:sampleClimate(meta,buffers,x,y)})).catch(()=>({status:'error'}))]);
      return {context,weather};
    };
  }
  window.SHROOMS_ENVIRONMENT={address,decode,sampleClimate,create};
})();
