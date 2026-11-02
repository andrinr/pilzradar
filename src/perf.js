/* Opt-in diagnostics: ?bench=1. No telemetry, persistence or network requests. */
window.SHROOMS_PERF=(()=>{
 if(new URLSearchParams(location.search).get('bench')!=='1')return {record(){}};
 const samples={},tasks=[];let frames=[],last=performance.now(),count=0;
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())tasks.push({at:Math.round(e.startTime),ms:Math.round(e.duration)});}).observe({type:'longtask',buffered:true});}catch{}
 const output=document.createElement('output');output.id='performance-report';output.style.cssText='display:block;white-space:pre-wrap;font:12px monospace;padding:12px;background:#fff;color:#222';
 document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(output));
 function publish(){output.textContent=JSON.stringify({elapsedMs:Math.round(performance.now()),samples,longTasks:tasks,frameWorstMs:frames.length?Math.max(...frames):0,frameP95Ms:frames.length?[...frames].sort((a,b)=>a-b)[Math.floor((frames.length-1)*.95)]:0},null,2);}
 function frame(now){frames.push(Math.round(now-last));if(frames.length>600)frames.shift();last=now;if(++count%60===0)publish();requestAnimationFrame(frame);}requestAnimationFrame(frame);
 return {record(name,ms){(samples[name]||=[]).push(Math.round(ms));publish();}};
})();
