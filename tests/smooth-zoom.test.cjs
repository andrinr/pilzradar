const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 let now=0,id=0,zoom=10,disabled=false;const frames=new Map(),listeners={},handlers={},commits=[],events=[];
 const wrapper={style:{},appendChild(node){node.parentNode=this;},remove(){}},parent={insertBefore(node){node.parentNode=this;}},pane={parentNode:parent};
 const classes=new Set(),container={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:(name)=>delete listeners[name]};
 const map={getContainer:()=>container,getPane:()=>pane,scrollWheelZoom:{disable(){disabled=true;}},getSize:()=>({x:800,y:600}),getZoom:()=>zoom,getMinZoom:()=>6,getMaxZoom:()=>16,
  on:(name,fn)=>handlers[name]=fn,off:name=>delete handlers[name],fire:name=>{events.push(name);handlers[name]?.();},setZoom(value,options){commits.push({value,options});this.fire('movestart');zoom=value;this.fire('moveend');}};
 const c={window:{},document:{createElement:()=>wrapper},performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),Math};
 vm.createContext(c);vm.runInContext(fs.readFileSync('src/smooth-zoom.js','utf8'),c);c.window.SHROOMS_SMOOTH_ZOOM.attach(map);
 function tick(ms=16){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}
 function wheel(deltaY,extra={}){const e={deltaY,deltaMode:0,preventDefault(){this.prevented=true;},stopPropagation(){},...extra};listeners.wheel(e);return e;}
 return {wrapper,commits,events,listeners,classes,wheel,tick,disabled:()=>disabled};
}
test('continuous wheel input scales cached layers and commits only once after settling',()=>{
 const f=fixture();assert.ok(f.disabled());
 for(let i=0;i<12;i++){assert.ok(f.wheel(-10).prevented);f.tick();assert.equal(f.commits.length,0);}
 assert.ok(f.wrapper.style.transform.startsWith('scale('));assert.ok(f.classes.has('wheel-zooming'));
 for(let i=0;i<30;i++)f.tick();
 assert.equal(f.commits.length,1);assert.ok(Math.abs(f.commits[0].value-10.3)<1e-10);assert.equal(f.commits[0].options.animate,false);assert.equal(f.wrapper.style.transform,'');assert.equal(f.classes.size,0);
 assert.equal(f.events.filter(e=>e==='wheelzoomstart').length,1);assert.equal(f.events.filter(e=>e==='wheelzoomend').length,1);
});
test('wheel zoom respects bounds, supports line units and leaves browser magnification alone',()=>{
 const f=fixture();assert.equal(f.wheel(-100,{ctrlKey:true}).prevented,undefined);assert.equal(f.classes.size,0);
 f.wheel(-400,{deltaMode:1});for(let i=0;i<40;i++)f.tick();assert.equal(f.commits[0].value,16);
 f.wheel(10000);for(let i=0;i<40;i++)f.tick();assert.equal(f.commits[1].value,6);
});
test('starting a pointer interaction settles zoom before map hit testing or dragging',()=>{
 const f=fixture();f.wheel(-200);f.tick();f.listeners.pointerdown();assert.equal(f.commits.length,1);assert.equal(f.commits[0].value,10.5);assert.equal(f.classes.size,0);
 for(let i=0;i<30;i++)f.tick();assert.equal(f.commits.length,1);
});
