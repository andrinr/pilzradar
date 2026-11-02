/* Scale the existing map during a wheel gesture; commit one data view on idle. */
(function(){
 function attach(map){
  const container=map.getContainer(),pane=map.getPane('mapPane'),wrapper=document.createElement('div');
  wrapper.className='wheel-zoom-preview';pane.parentNode.insertBefore(wrapper,pane);wrapper.appendChild(pane);
  map.scrollWheelZoom.disable();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let active=false,committing=false,start=0,target=0,visual=0,lastWheel=0,lastFrame=0,frame;
  function reset(){active=false;cancelAnimationFrame(frame);frame=null;wrapper.style.transform='';wrapper.style.willChange='';container.classList.remove('wheel-zooming');}
  function finish(){
   if(!active)return;
   const zoom=target;reset();committing=true;
   try{map.setZoom(zoom,{animate:false});}finally{committing=false;map.fire('wheelzoomend');}
  }
  function draw(now){
   if(!active)return;
   const elapsed=Math.max(0,Math.min(64,now-lastFrame));lastFrame=now;
   visual=reduced?target:visual+(target-visual)*(1-Math.exp(-elapsed/35));
   wrapper.style.transform=`scale(${2**(visual-start)})`;
   if(now-lastWheel>=180&&Math.abs(target-visual)<.002){finish();return;}
   frame=requestAnimationFrame(draw);
  }
  function wheel(event){
   // Leave browser page magnification (Ctrl/Cmd + wheel) to the browser.
   if(event.ctrlKey||event.metaKey)return;
   event.preventDefault();event.stopPropagation();
   const now=performance.now(),size=map.getSize();
   if(!active){
    active=true;start=target=visual=map.getZoom();lastFrame=now;
    wrapper.style.transformOrigin=`${size.x/2}px ${size.y/2}px`;wrapper.style.willChange='transform';container.classList.add('wheel-zooming');map.fire('wheelzoomstart');
   }
   const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.y:1);
   target=Math.max(map.getMinZoom(),Math.min(map.getMaxZoom(),target-pixels/400));lastWheel=now;
   if(!frame)frame=requestAnimationFrame(draw);
  }
  function externalMove(){if(active&&!committing){reset();map.fire('wheelzoomend');}}
  function remove(){reset();container.removeEventListener('wheel',wheel);container.removeEventListener('pointerdown',finish,true);map.off('movestart',externalMove);pane.parentNode===wrapper&&wrapper.parentNode.insertBefore(pane,wrapper);wrapper.remove();}
  container.addEventListener('wheel',wheel,{passive:false});container.addEventListener('pointerdown',finish,true);
  map.on('movestart',externalMove);map.on('unload',remove);
  return {finish};
 }
 window.SHROOMS_SMOOTH_ZOOM={attach};
})();
