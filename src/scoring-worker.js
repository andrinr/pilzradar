/* Shared numerical model, compact transferable output. No GPU/device dependency. */
self.window=self;
const version=new URL(self.location.href).searchParams.get('v')||'';
importScripts(...['data','weather','scoring','ranking'].map(name=>`${name}.js?v=${version}`));
let cells,points,weather,weatherVersion,dateKey;const cache=new Map(),orders=new WeakMap();
self.onmessage=({data})=>{
 const started=performance.now();
 try{
  if(data.type==='init'){cells=data.cells;points=data.points;return;}
  if(data.type==='append'){for(const cell of data.cells)cells.push(cell);return;}
  if(dateKey!==data.date){cache.clear();dateKey=data.date;}
  if(weatherVersion!==data.weatherVersion){
   cache.clear();
   const entries=new Map(data.entries);
   weather=cells.map(c=>entries.size?SHROOMS_WEATHER.interpolate(c,points,entries):undefined);
   weatherVersion=data.weatherVersion;
  }
  const species=SHROOMS_SPECIES[data.species],date=new Date(data.date),entries=new Map(data.entries);
  let values=cache.get(data.species);
  if(!values){
   values=new Float32Array(cells.length);
   if(data.species==='all'){
    const profiles=SHROOMS_SCORE.modelled();
    for(const [id,p] of profiles){let scores=cache.get(id);if(!scores){scores=new Float32Array(cells.length);for(let i=0;i<cells.length;i++)scores[i]=SHROOMS_SCORE.score(cells[i],p,weather[i],date,true);cache.set(id,scores);}for(let i=0;i<cells.length;i++)values[i]+=scores[i];}
    for(let i=0;i<cells.length;i++)values[i]=Math.round(values[i]/profiles.length);
   }else for(let i=0;i<cells.length;i++)values[i]=species.mapping===false?NaN:SHROOMS_SCORE.score(cells[i],species,weather[i],date,true);
   cache.set(data.species,values);while(cache.size>SHROOMS_SCORE.modelled().length+1)cache.delete(cache.keys().next().value);
  }
  let order=orders.get(values);if(!order){order=SHROOMS_RANK(values);orders.set(values,order);}
  values=values.slice();order=order.slice();
  const extra=data.extra.map(c=>data.species==='all'?SHROOMS_SCORE.aggregate(c,entries.size?SHROOMS_WEATHER.interpolate(c,points,entries):undefined,date,true):SHROOMS_SCORE.score(c,species,entries.size?SHROOMS_WEATHER.interpolate(c,points,entries):undefined,date,true));
  self.postMessage({id:data.id,values,order,extra,ms:performance.now()-started},[values.buffer,order.buffer]);
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
