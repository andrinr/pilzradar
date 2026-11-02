// Lossless column encoding; repeated field names, constants and strings stay off the wire.
function encode(values){
 const unique=[...new Set(values.map(JSON.stringify))];
 if(unique.length===1)return {constant:values[0]};
 if(values.every(v=>v===null||typeof v==='number')){
  let scale=1;while(scale<=1e6&&!values.every(v=>v===null||Math.round(v*scale)/scale===v))scale*=10;
  if(scale<=1e6){let previous=0;return {scale,delta:values.map(v=>{if(v===null)return null;const n=Math.round(v*scale),d=n-previous;previous=n;return d;})};}
 }
 if(values.every(v=>v===null||(Array.isArray(v)&&v.length===3)))return {arrays:[0,1,2].map(i=>encode(values.map(v=>v?.[i]??null))),nulls:values.map(v=>v===null?1:0)};
 if(unique.length<10000){const dict=unique.map(JSON.parse),map=new Map(unique.map((v,i)=>[v,i]));return {dict,values:values.map(v=>map.get(JSON.stringify(v)))}};
 return {values};
}
module.exports=data=>({...data,cells:undefined,compactCells:{format:1,count:data.cells.length,columns:Object.fromEntries(Object.keys(data.cells[0]).map(key=>[key,encode(data.cells.map(c=>c[key]))]))}});
