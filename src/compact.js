/* Restore exactly the original scoring inputs in the data worker. */
(function(scope){
 function column(data,count){
  if(Object.hasOwn(data,'constant'))return Array(count).fill(data.constant);
  if(data.delta){let previous=0;return data.delta.map(v=>v===null?null:(previous+=v)/data.scale);}
  if(data.arrays){const cols=data.arrays.map(c=>column(c,count));return data.nulls.map((missing,i)=>missing?null:cols.map(c=>c[i]));}
  return data.dict?data.values.map(i=>data.dict[i]):data.values;
 }
 scope.SHROOMS_EXPAND=function(data){
  const packed=data.compactCells;if(!packed)return data;
  if(packed.format!==1)throw Error('Unsupported compact cell format');
  const cells=Array.from({length:packed.count},()=>({}));
  for(const [key,encoded] of Object.entries(packed.columns)){const values=column(encoded,packed.count);for(let i=0;i<cells.length;i++)cells[i][key]=values[i];}
  const {compactCells,...rest}=data;return {...rest,cells};
 };
})(typeof window==='undefined'?self:window);
