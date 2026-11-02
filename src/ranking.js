/* Stable descending order for integer 0–100 scores; unknown values follow last. */
window.SHROOMS_RANK=values=>{
 const counts=new Uint32Array(102),offsets=new Uint32Array(102),order=new Uint32Array(values.length);
 const bucket=value=>Number.isFinite(value)?Math.max(0,Math.min(100,value)):101;
 for(let i=0;i<values.length;i++)counts[bucket(values[i])]++;
 let offset=0;for(let score=100;score>=0;score--){offsets[score]=offset;offset+=counts[score];}offsets[101]=offset;
 for(let i=0;i<values.length;i++)order[offsets[bucket(values[i])]++]=i;
 return order;
};
