const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('src/heatmap.js','utf8'),context);
const scale=context.window.SHROOMS_HEAT_SCALE;
test('clustered scores get contrast without outliers dominating',()=>{
 const values=[0,...Array.from({length:100},(_,i)=>60+i/5),100];
 const s=scale(values);
 assert.ok(s.low>=60&&s.high<80);
 assert.ok(s.normalize(78)-s.normalize(63)>70);
 assert.equal(s.normalize(0),0);assert.equal(s.normalize(100),100);
 for(let i=1;i<=100;i++)assert.ok(s.normalize(i)>=s.normalize(i-1));
});
test('equal and nearly equal scores are not stretched into false extremes',()=>{
 const same=scale([70,70,70]);assert.equal(same.normalize(70),50);
 const close=scale([70,71]);assert.equal(close.high-close.low,10);
 assert.ok(Math.abs(close.normalize(71)-close.normalize(70)-10)<1e-9);
 const empty=scale([]);assert.equal(empty.normalize(50),50);
});
test('integer fast path and fractional summaries preserve exact percentile colours',()=>{
 function reference(values){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);let low=sorted.length?sorted[Math.floor((sorted.length-1)*.1)]:0,high=sorted.length?sorted[Math.ceil((sorted.length-1)*.95)]:100;if(high-low<10){const midpoint=(high+low)/2;low=Math.max(0,Math.min(90,midpoint-5));high=low+10;}return {low,high};}
 for(const values of [Array.from({length:85969},(_,i)=>(i*17)%101),[NaN,Infinity,0,0,0,100],Array.from({length:5000},(_,i)=>(i*17.31)%100),[-5,0,50,105],[],[100]]){
  const expected=reference(values),actual=scale(values);assert.equal(actual.low,expected.low);assert.equal(actual.high,expected.high);
 }
});
