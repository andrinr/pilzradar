// Real national cells, deterministic weather/date. No HTTP or synthetic cell loops.
const fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),{performance}=require('node:perf_hooks');
const {unpack}=require('../server/data.cjs');
const model={window:{},Intl,Date,Math,Number};vm.createContext(model);
for(const name of ['data','weather','scoring','adaptive','heatmap','ranking'])vm.runInContext(fs.readFileSync(`src/${name}.js`,'utf8'),model);
const index=unpack('.','regions/ch/index'),cells=index.cells,snapshot=unpack('.','national-weather'),entries=new Map(snapshot.entries),date=new Date('2026-09-23T12:00:00Z'),w=model.window;
const iterations=Number(process.env.BENCH_ITERATIONS||5),results={};let weather,scores;
function run(name,fn){const times=[];for(let i=0;i<iterations;i++){const start=performance.now();fn();times.push(performance.now()-start);}const sorted=[...times].sort((a,b)=>a-b);results[name]={medianMs:+sorted[Math.floor(sorted.length/2)].toFixed(2),p95Ms:+sorted[Math.ceil(sorted.length*.95)-1].toFixed(2),samplesMs:times.map(v=>+v.toFixed(2))};}
run('weather_interpolation',()=>{weather=cells.map(c=>w.SHROOMS_WEATHER.interpolate(c,index.weatherPoints,entries));});
for(const id of ['porcini','chanterelle','salmon_milkcap'])run(`score_${id}`,()=>{scores=new Map(cells.map((c,i)=>[c.id,w.SHROOMS_SCORE.score(c,w.SHROOMS_SPECIES[id],weather[i],date)]));});
for(const id of ['porcini','chanterelle','salmon_milkcap'])run(`compact_${id}`,()=>{cells.forEach((c,i)=>w.SHROOMS_SCORE.score(c,w.SHROOMS_SPECIES[id],weather[i],date,true));});
run('ranking_sort',()=>[...cells].sort((a,b)=>scores.get(b.id).value-scores.get(a.id).value));
run('ranking_buckets',()=>w.SHROOMS_RANK([...scores.values()].map(s=>s.value)));
run('heat_scale',()=>w.SHROOMS_HEAT_SCALE([...scores.values()].map(s=>s.value)));
run('overview_1000m',()=>w.SHROOMS_ADAPTIVE.group(cells,1000).map(g=>w.SHROOMS_ADAPTIVE.summarize(g,scores)));
const output={node:process.version,cpu:os.cpus()[0].model,platform:process.platform,cellCount:cells.length,weatherPoints:index.weatherPoints.length,iterations,date:date.toISOString(),results};
const file=process.argv[2];if(file)fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
