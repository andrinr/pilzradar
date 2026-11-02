if(typeof importScripts==='function')importScripts(new URL('./forest-raster.js'+self.location.search,self.location.href).href);
/* Offscreen overview painting. Shared forest geometry; viewport tiles remain disposable. */
const chunks=new Map(),projected=new Map(),rasterPaint=new Map();let colors=new Map(),groups=[],generation=0;
function project(key,z){
 const cacheKey=`${key}:${z}`;if(projected.has(cacheKey))return projected.get(cacheKey);
 const scale=256*2**z,values=(chunks.get(key)||[]).map(f=>{
  const path=new Path2D();let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const poly of f.geometry.coordinates)for(const ring of poly){
   ring.forEach(([lon,lat],i)=>{const sin=Math.sin(Math.max(-85.0511287798,Math.min(85.0511287798,lat))*Math.PI/180),x=scale*(lon/360+.5),y=scale*(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI));x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);i?path.lineTo(x,y):path.moveTo(x,y);});path.closePath();
  }
  return {id:f.id,path,bounds:[x0,y0,x1,y1]};
 });
 projected.set(cacheKey,values);while(projected.size>64)projected.delete(projected.keys().next().value);return values;
}
self.onmessage=({data})=>{
 try{
  if(data.type==='put'){chunks.set(data.key,data.features);return;}
  if(data.type==='style'){rasterPaint.clear();generation=data.generation;if(data.groups)groups=data.groups;colors=new Map();groups.forEach((group,i)=>{for(const id of group.members)colors.set(id,data.palette?data.palette[i]:group.color);});return;}
  if(data.type==='evict'){rasterPaint.delete(data.key);chunks.delete(data.key);for(const key of projected.keys())if(key.startsWith(data.key+':'))projected.delete(key);return;}
  const {id,canvas,coords,ratio,keys}=data;
  if(data.generation!==generation){self.postMessage({id});return;}
  const ctx=canvas.getContext('2d'),ox=coords.x*256,oy=coords.y*256;ctx.scale(ratio,ratio);ctx.translate(-ox,-oy);ctx.globalAlpha=.92;
  for(const key of keys){
   const raster=chunks.get(key);
   if(raster?.format==='forest-raster-v1'){
    if(!rasterPaint.has(key)){rasterPaint.set(key,self.SHROOMS_RASTER.paint(raster,id=>colors.get(id),(w,h)=>new OffscreenCanvas(w,h)));while(rasterPaint.size>12)rasterPaint.delete(rasterPaint.keys().next().value);}
    ctx.save();ctx.translate(ox,oy);self.SHROOMS_RASTER.draw(ctx,rasterPaint.get(key),raster,coords);ctx.restore();continue;
   }
   for(const f of project(key,coords.z)){
   const color=colors.get(f.id);if(!color)continue;const [x0,y0,x1,y1]=f.bounds;if(x1<ox-1||x0>ox+257||y1<oy-1||y0>oy+257)continue;
   ctx.fillStyle=ctx.strokeStyle=color;ctx.fill(f.path,'evenodd');if(coords.z<=10){ctx.lineWidth=.65;ctx.lineJoin='round';ctx.stroke(f.path);}
  }
  }
  self.postMessage({id});
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
