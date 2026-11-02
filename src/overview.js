/* Real forest footprints on canvas tiles; no Leaflet object per overview cell. */
(function(){
  function inside(point,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
  const contains=(geometry,point)=>geometry.coordinates.some(poly=>inside(point,poly[0])&&!poly.slice(1).some(r=>inside(point,r)));
  function create(L,map,{manifest,load,onError=()=>{}}){
    let summaries=[],size,color=()=>'',click=()=>{},version='',generation=0;
    const rasterPaint=new Map(),pendingTiles=new Map();
    const members=new Map(),cache=new Map(),projected=new Map(),queue=[];let running=0;
    let painter,paintId=0;const paintedChunks=new Set(),paintJobs=new Map();
    if(typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&location.protocol!=='file:')try{
      painter=new Worker(new URL(`./src/overview-worker.js?v=${window.SHROOMS_CODE_VERSION||'20261102'}`,document.baseURI));
      painter.onmessage=({data})=>{const job=paintJobs.get(data.id);if(!job)return;paintJobs.delete(data.id);clearTimeout(job.timer);if(data.error){onError(new Error(data.error));painter?.terminate();painter=null;paintedChunks.clear();for(const other of paintJobs.values()){clearTimeout(other.timer);other.done(null,other.tile);}paintJobs.clear();setTimeout(()=>{if(map.hasLayer(layer))layer.redraw();},0);}job.done(null,job.tile);};
      painter.onerror=()=>{painter.terminate();painter=null;paintedChunks.clear();for(const job of paintJobs.values()){clearTimeout(job.timer);job.done(null,job.tile);}paintJobs.clear();onError(new Error('Overview worker failed; retrying without it.'));setTimeout(()=>{if(map.hasLayer(layer))layer.redraw();},0);};
    }catch{painter=null;}
    function drain(){while(running<3&&queue.length){const job=queue.shift();running++;job().finally(()=>{running--;drain();});}}
    function get(key){
      if(!cache.has(key)){
        const promise=new Promise((resolve,reject)=>{queue.push(async()=>{try{resolve(await load(key));}catch(e){cache.delete(key);reject(e);}});drain();});cache.set(key,promise);
        while(cache.size>48){const oldest=cache.keys().next().value;cache.delete(oldest);load.release?.(oldest);paintedChunks.delete(oldest);painter?.postMessage({type:'evict',key:oldest});}
      }return cache.get(key);
    }
    function tilesAt(bounds){return manifest.tiles.filter(t=>t.bounds[0][0]<=bounds[1][0]&&t.bounds[1][0]>=bounds[0][0]&&t.bounds[0][1]<=bounds[1][1]&&t.bounds[1][1]>=bounds[0][1]);}
    function project(key,features,z){
      const id=`${key}:${z}`;if(projected.has(id))return projected.get(id);
      const values=features.map(f=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
        const polygons=f.geometry.coordinates.map(poly=>poly.map(ring=>ring.map(([lon,lat])=>{const p=map.project([lat,lon],z);x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);return [p.x,p.y];})));
        let path;
        if(typeof Path2D!=='undefined'){
          path=new Path2D();for(const poly of polygons)for(const ring of poly){ring.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();}
        }
        return {id:f.id,polygons,path,bounds:[x0,y0,x1,y1]};});
      projected.set(id,values);while(projected.size>64)projected.delete(projected.keys().next().value);return values;
    }
    const Tiles=L.GridLayer.extend({
      redraw(){
        // GridLayer normally deletes every painted tile before asynchronous redraw.
        // Keep one bounded visual buffer underneath until the replacement loads.
        const container=this.getContainer?.();
        if(container?.isConnected&&!this.retainedTiles){
          const copy=container.cloneNode(true),originals=container.querySelectorAll('canvas'),copies=copy.querySelectorAll('canvas');
          try{originals.forEach((canvas,i)=>copies[i].getContext('2d').drawImage(canvas,0,0));
            copy.style.pointerEvents='none';copy.setAttribute('aria-hidden','true');copy.setAttribute('data-lod-buffer','true');container.parentNode.insertBefore(copy,container);this.retainedTiles=copy;
          }catch{/* The normal renderer remains available if a browser cannot copy a canvas. */}
        }
        return L.GridLayer.prototype.redraw.call(this);
      },
      dropBuffer(){this.retainedTiles?.remove();this.retainedTiles=null;},
      releaseBuffer(){
        const ready=generation,buffer=this.retainedTiles;
        // OffscreenCanvas placeholders may reach the compositor after tileload.
        requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ready===generation&&this.retainedTiles===buffer)this.dropBuffer();}));
      },
      createTile(coords,done){
        const tile=document.createElement('canvas'),ratio=Math.min(window.devicePixelRatio||1,2),current=generation;
        const slot=`${coords.z}:${coords.x}:${coords.y}`,complete=done;pendingTiles.set(slot,tile);
        done=(error,canvas)=>{if(pendingTiles.get(slot)!==tile)return;pendingTiles.delete(slot);complete(error,canvas);};
        tile.width=tile.height=256*ratio;
        if(painter&&tile.transferControlToOffscreen){
          const ox=coords.x*256,oy=coords.y*256,nw=map.unproject([ox-1,oy-1],coords.z),se=map.unproject([ox+257,oy+257],coords.z);
          const keys=tilesAt([[se.lat,nw.lng],[nw.lat,se.lng]]).map(meta=>coords.z<=10?(meta.rasterKey||meta.coarseKey):meta.key);
          Promise.all(keys.map(async key=>{const features=await get(key);if(!painter||current!==generation)return;if(!paintedChunks.has(key)){painter.postMessage({type:'put',key,features});paintedChunks.add(key);}})).then(()=>{
            if(!painter||current!==generation){done(null,tile);return;}
            const id=++paintId,canvas=tile.transferControlToOffscreen(),timer=setTimeout(()=>{paintJobs.delete(id);onError(new Error('Overview render timed out'));done(null,tile);},30000);paintJobs.set(id,{tile,done,timer});
            painter.postMessage({type:'tile',id,canvas,coords:{x:coords.x,y:coords.y,z:coords.z},ratio,keys,generation:current},[canvas]);
          }).catch(error=>{onError(error);done(null,tile);});return tile;
        }
        const ctx=tile.getContext('2d');ctx.scale(ratio,ratio);
        const ox=coords.x*256,oy=coords.y*256,nw=map.unproject([ox-1,oy-1],coords.z),se=map.unproject([ox+257,oy+257],coords.z);
        Promise.all(tilesAt([[se.lat,nw.lng],[nw.lat,se.lng]]).map(async meta=>{
          const key=coords.z<=10?(meta.rasterKey||meta.coarseKey):meta.key;
          const features=await get(key);if(current!==generation)return;
          if(features.format==='forest-raster-v1'){
            if(!rasterPaint.has(key)){rasterPaint.set(key,window.SHROOMS_RASTER.paint(features,id=>{const i=members.get(id);return i===undefined?null:color(summaries[i]);},(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}));while(rasterPaint.size>12)rasterPaint.delete(rasterPaint.keys().next().value);}
            ctx.globalAlpha=.92;window.SHROOMS_RASTER.draw(ctx,rasterPaint.get(key),features,coords);return;
          }
          let batch=0;for(const f of project(key,features,coords.z)){
            if(++batch%200===0){await new Promise(resolve=>setTimeout(resolve,0));if(current!==generation)return;}
            const group=members.get(f.id);if(group===undefined)continue;
            const [x0,y0,x1,y1]=f.bounds;if(x1<ox-1||x0>ox+257||y1<oy-1||y0>oy+257)continue;
            ctx.fillStyle=ctx.strokeStyle=color(summaries[group]);ctx.globalAlpha=.92;
            if(f.path){
              ctx.save();ctx.translate(-ox,-oy);ctx.fill(f.path,'evenodd');
              if(coords.z<=10){ctx.lineWidth=.65;ctx.lineJoin='round';ctx.stroke(f.path);}ctx.restore();continue;
            }
            ctx.beginPath();for(const poly of f.polygons)for(const ring of poly){ring.forEach(([x,y],i)=>i?ctx.lineTo(x-ox,y-oy):ctx.moveTo(x-ox,y-oy));ctx.closePath();}
            ctx.fill('evenodd');
            // A subpixel outline keeps narrow woodland legible in the national view.
            if(coords.z<=10){ctx.lineWidth=.65;ctx.lineJoin='round';ctx.stroke();}
          }
        })).then(()=>done(null,tile)).catch(error=>{if(current===generation)onError(error);done(null,tile);});
        return tile;
      },
      onAdd(map){this.on('load',this.releaseBuffer,this);painter?.postMessage({type:'style',generation,groups:summaries.map(item=>({members:item.members,color:color(item)}))});L.GridLayer.prototype.onAdd.call(this,map);map.on('click',inspect);},
      onRemove(map){this.off('load',this.releaseBuffer,this);this.dropBuffer();pendingTiles.clear();generation++;map.off('click',inspect);L.GridLayer.prototype.onRemove.call(this,map);}
    });
    async function inspect(event){
      const current=generation,point=[event.latlng.lng,event.latlng.lat];
      for(const meta of tilesAt([[point[1],point[0]],[point[1],point[0]]])){
        try{const data=await get(Math.round(map.getZoom())<=10?(meta.rasterKey||meta.coarseKey):meta.key);if(current!==generation)return;if(data.format==='forest-raster-v1'){const id=window.SHROOMS_RASTER.hit(data,point[0],point[1]),group=members.get(id);if(group!==undefined){click(summaries[group],group);return;}continue;}for(const f of data){if(current!==generation)return;const group=members.get(f.id);if(group!==undefined&&contains(f.geometry,point)){click(summaries[group],group);return;}}}catch(e){onError(e);}
      }
    }
    const layer=new Tiles({pane:'overviewHeat',tileSize:256,keepBuffer:1,updateWhenIdle:true,updateWhenZooming:false,noWrap:true});
    layer.setData=(items,meters,paint,onClick,key)=>{
      const changed=items!==summaries||meters!==size||key!==version;
      const layoutChanged=meters!==size||items.length!==summaries.length||items.some((item,i)=>item.members!==summaries[i]?.members);
      if(layoutChanged){members.clear();items.forEach((item,i)=>item.members.forEach(id=>members.set(id,i)));}
      summaries=items;size=meters;color=paint;click=onClick;version=key;
      if(changed){rasterPaint.clear();generation++;painter?.postMessage({type:'style',generation,...(layoutChanged?{groups:items.map(item=>({members:item.members,color:paint(item)}))}:{palette:items.map(paint)})});if(map.hasLayer(layer))layer.redraw();}
    };
    return layer;
  }
  window.SHROOMS_OVERVIEW={create,contains};
})();
