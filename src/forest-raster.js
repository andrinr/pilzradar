/* Categorical low-zoom forest coverage. Colors still come from current model scores. */
(function(scope){
 function paint(data,color,makeCanvas){
  const canvas=makeCanvas(data.width,data.height),ctx=canvas.getContext('2d'),pixels=ctx.createImageData(data.width,data.height),palette=data.ids.map(id=>{
   const hex=color(id);if(!hex)return [0,0,0,0];if(hex.startsWith('rgb('))return [...hex.match(/\d+/g).map(Number),255];const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255,255];
  });palette.unshift([0,0,0,0]);let at=0;
  for(let r=0;r<data.runs.length;r+=2){const rgba=palette[data.runs[r+1]],end=at+data.runs[r]*4;while(at<end){pixels.data.set(rgba,at);at+=4;}}
  ctx.putImageData(pixels,0,0);return canvas;
 }
 function draw(ctx,canvas,data,coords){const scale=2**(coords.z-data.z);ctx.imageSmoothingEnabled=true;ctx.drawImage(canvas,data.x*scale-coords.x*256,data.y*scale-coords.y*256,data.width*scale,data.height*scale);}
 function hit(data,lon,lat){const scale=256*2**data.z,sin=Math.sin(lat*Math.PI/180),x=Math.floor(scale*(lon/360+.5)-data.x),y=Math.floor(scale*(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))-data.y);if(x<0||y<0||x>=data.width||y>=data.height)return null;const wanted=y*data.width+x;let at=0;for(let i=0;i<data.runs.length;i+=2){at+=data.runs[i];if(at>wanted)return data.ids[data.runs[i+1]-1]||null;}return null;}
 scope.SHROOMS_RASTER={paint,draw,hit};
})(typeof window==='undefined'?self:window);
