/* Transparent ecological heuristics, not a model trained on mushroom observations. */
(function () {
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const known = value => typeof value === 'number' && Number.isFinite(value);
  const monthFormatter=new Intl.DateTimeFormat('en', {timeZone:'Europe/Zurich',month:'numeric'});
  let cachedDate, cachedMonth;
  function soilFactor(cell, species, baseWeight) {
    const p=species.soil, v=cell.soilPh;
    const missing={value:null,weight:0,confidence:0};
    if(!p||!Array.isArray(v)||v.length!==3||!v.every(known))return missing;
    const [ph,lower,upper]=v;
    if(lower<0||upper>14||lower>ph||ph>upper)return missing;
    // Broad acid preference; numerical curve is provisional on the CaCl2 scale.
    // Average three support points, without treating the interval as a probability distribution.
    const suitability=x=>1-.4*clamp((x-p.acidUntil)/(p.fadeUntil-p.acidUntil));
    const confidence=1/(1+(upper-lower)**2);
    if(!confidence)return missing;
    const share=p.maxShare*confidence;
    return {value:(suitability(lower)+suitability(ph)+suitability(upper))/3,weight:baseWeight*share/(1-share),confidence};
  }
  function score(cell, species, weather, date = new Date(), compact = false) {
    if(species.mapping===false)return compact?null:{value:null,factors:{},completeness:0,live:false};
    const timestamp=date.getTime();
    if(timestamp!==cachedDate){cachedDate=timestamp;cachedMonth=Number(monthFormatter.format(date));}
    const month=cachedMonth;
    const distance = species.months?Math.min(...species.months.map(m => Math.min(Math.abs(month-m),12-Math.abs(month-m)))):null;
    const season = distance===null?null:distance === 0 ? 1 : distance === 1 ? .4 : .06;
    let tree = null;
    if (!species.host) tree = .7 + .3 * (1-cell.forest/100);
    else if (cell.treeKnown >= .5 && known(cell.conifer) && known(cell.broadleaf)) {
      const beech = Math.min(cell.broadleaf, cell.beech || 0);
      const oak = Math.min(cell.broadleaf-beech, cell.oak || 0);
      const other = Math.max(0,cell.broadleaf-beech-oak);
      const total = cell.conifer + cell.broadleaf;
      if (total > 0) tree = (beech*species.host.beech + oak*species.host.oak + cell.conifer*species.host.conifer + other*species.host.other)/total;
    }
    if(species.requiredTree) tree=cell.treeKnown>=.5 && known(cell[species.requiredTree]) ? clamp(cell[species.requiredTree]/100) : null;
    const canopy = species.canopy && known(cell.canopy) && cell.canopyKnown >= .5
      ? species.canopy === 'open' ? clamp(1-cell.canopy/120,.1,1) : clamp(cell.canopy/85,.1,1)
      : null;
    let moisture = null, temperature = null;
    if (weather) {
      const inputs=[];
      if (known(weather.soil)) inputs.push([clamp((weather.soil-.12)/.24),.5]);
      // Reference evaporation is an atmospheric drying proxy, not forest water loss.
      const rainSupply=known(weather.et014)?Math.max(0,weather.rain14-.5*weather.et014):weather.rain14;
      if (known(weather.rain14)) inputs.push([clamp(rainSupply/60) * (weather.rain14>150 ? clamp(1-(weather.rain14-150)/200,.3,1) : 1),.3]);
      if (known(weather.humidity)) inputs.push([clamp((weather.humidity-45)/45),.2]);
      if (inputs.length) moisture=inputs.reduce((sum,[value,weight])=>sum+value*weight,0)/inputs.reduce((sum,[,weight])=>sum+weight,0);
      if (species.temp && known(weather.temp7)) {
        const [low,high]=species.temp;
        temperature=weather.temp7<low ? clamp(1-(low-weather.temp7)/12) : weather.temp7>high ? clamp(1-(weather.temp7-high)/12) : 1;
      }
    }
    let terrain=null;
    if (known(cell.slope)) {
      const shade=known(cell.aspect) && cell.slope>5 ? .85+.15*Math.cos(cell.aspect*Math.PI/180) : 1;
      terrain=clamp((1-.55*clamp(cell.slope/45))*shade,.15,1);
    }
    if(compact){
      const values=[tree,canopy,moisture,temperature,terrain,season],weights=[.2,.1,.35,.15,.1,.1];
      let weight=0,log=0;
      for(let i=0;i<6;i++)if(known(values[i])){weight+=weights[i];log+=weights[i]*Math.log(Math.max(.02,values[i]));}
      const soil=soilFactor(cell,species,weight);
      if(known(soil.value)){weight+=soil.weight;log+=soil.weight*Math.log(Math.max(.02,soil.value));}
      return clamp(Math.round(100*Math.exp(log/weight)),0,100);
    }
    const factors={tree:{value:tree,weight:.2},canopy:{value:canopy,weight:.1},moisture:{value:moisture,weight:.35},temperature:{value:temperature,weight:.15},terrain:{value:terrain,weight:.1},season:{value:season,weight:.1}};
    const baseWeight=Object.values(factors).filter(f=>known(f.value)).reduce((sum,f)=>sum+f.weight,0);
    factors.soil=soilFactor(cell,species,baseWeight);
    const available=Object.values(factors).filter(f=>known(f.value));
    const weight=available.reduce((sum,f)=>sum+f.weight,0);
    const value=Math.round(100*Math.exp(available.reduce((sum,f)=>sum+f.weight*Math.log(Math.max(.02,f.value)),0)/weight));
    if(compact)return clamp(value,0,100);
    for(const f of Object.values(factors)){
      f.share=known(f.value)?f.weight/weight:0;
      f.multiplier=f.share?Math.pow(Math.max(.02,f.value),f.share):1;
    }
    return {value:clamp(value,0,100),factors,completeness:weight,live:known(moisture)||known(temperature)};
  }
  let modelCatalog,modelProfiles;
  function modelled(){
    if(modelCatalog!==window.SHROOMS_SPECIES){modelCatalog=window.SHROOMS_SPECIES;modelProfiles=Object.entries(modelCatalog||{}).filter(([,p])=>p.mapping!==false);}
    return modelProfiles;
  }
  function aggregate(cell,weather,date=new Date(),compact=false){
    const profiles=modelled();let total=0;const breakdown=compact?null:[];
    for(const [id,p] of profiles){const value=score(cell,p,weather,date,true);total+=value;if(breakdown)breakdown.push({id,name:p.name,latin:p.latin,value,weight:1/profiles.length,contribution:value/profiles.length});}
    const mean=profiles.length?total/profiles.length:0,value=Math.round(mean);
    return compact?value:{value,mean,count:profiles.length,breakdown,factors:{},completeness:1,live:!!weather&&['soil','rain14','humidity','temp7'].some(k=>known(weather[k]))};
  }
  window.SHROOMS_SCORE={score,soilFactor,aggregate,modelled};
})();
