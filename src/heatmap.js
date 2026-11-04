(function () {
  const stops=[[0,[0,70,49]],[25,[45,137,65]],[50,[146,199,31]],[75,[237,211,25]],[100,[239,91,53]]];
  window.SHROOMS_COLOR = score => {
    const value=Math.max(0,Math.min(100,score));
    const index=stops.findIndex(([stop])=>value<=stop);
    if(index<=0)return `rgb(${stops[0][1].join(',')})`;
    const [low,a]=stops[index-1], [high,b]=stops[index];
    const t=(value-low)/(high-low);
    return `rgb(${a.map((channel,i)=>Math.round(channel+(b[i]-channel)*t)).join(',')})`;
  };
  // Viewport endpoints follow the displayed tiles. A minimum span avoids
  // exaggerating tiny differences when all cells have nearly equal scores.
  window.SHROOMS_HEAT_SCALE = values => {
    // Model scores are bounded integers: count them in linear time instead of
    // sorting tens of thousands of cells during every viewport update.
    // Area-weighted summaries retain their exact fractional quantiles.
    const finite=values.filter(Number.isFinite);
    let low=0,high=100;
    if(finite.length){
      const lowIndex=Math.floor((finite.length-1)*.1),highIndex=Math.ceil((finite.length-1)*.95);
      if(finite.every(v=>Number.isInteger(v)&&v>=0&&v<=100)){
        const bins=new Uint32Array(101);for(const value of finite)bins[value]++;
        let count=0,foundLow=false;
        for(let value=0;value<=100;value++){
          count+=bins[value];
          if(!foundLow&&count>lowIndex){low=value;foundLow=true;}
          if(count>highIndex){high=value;break;}
        }
      }else{
        finite.sort((a,b)=>a-b);low=finite[lowIndex];high=finite[highIndex];
      }
    }
    if(high-low<10){const midpoint=(high+low)/2;low=Math.max(0,Math.min(90,midpoint-5));high=low+10;}
    return {low,high,normalize:score=>Math.max(0,Math.min(100,(score-low)/(high-low)*100))};
  };
})();
