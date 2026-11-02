/* Expanded only on request; independent of selection and map-render lifecycles. */
(function(){
  let lookup;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount(root,cell){
    const details=root.querySelector('.environment-details'),target=details?.querySelector('.environment-context');
    if(!details||!target)return;
    const api=window.SHROOMS_I18N,t=api.t;
    const tr=(text,values={})=>escape(Object.entries(values).reduce((copy,[key,value])=>copy.replaceAll(`{${key}}`,value),t(text)));
    const number=value=>typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat(api.locale,{maximumFractionDigits:1}).format(value):'—';
    const link=(url,title)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${escape(title)} ↗</a>`;
    let loaded=false;
    async function show(){
      if(!details.open||loaded)return;loaded=true;
      target.innerHTML=`<p>${tr('Loading environmental data…')}</p>`;
      lookup??=window.SHROOMS_ENVIRONMENT.create(window.SHROOMS_LOAD);
      const {context,weather}=await lookup(cell.x,cell.y);
      if(!target.isConnected)return;
      const parts=[`<p><small>${tr('Context only; not included in the score.')}</small></p>`];
      if(context.status==='ready'){
        const v=context.values;
        parts.push(`<p><strong>${tr('Canopy openness')}</strong><br>${tr('Summer {summer}% · winter {winter}%',{summer:number(v.skySummer),winter:number(v.skyWinter)})}<br><small>${tr('Forest-weighted 50 m mean from 5 m data; not vertical canopy cover.')} ${tr('Valid canopy coverage: {value}%',{value:number(v.skyCoverage)})}</small><br>${link(context.meta.canopy.url,'WSL / NFI VHM 2024 · CC BY 4.0')}</p>`);
        parts.push(`<p><strong>${tr('Soil texture & depth')}</strong><br>${tr('Clay: {value}%',{value:number(v.clay)})} · ${tr('Sand: {value}%',{value:number(v.sand)})}<br><small>${tr('90% prediction intervals')}: ${number(v.clayLow)}–${number(v.clayHigh)}% / ${number(v.sandLow)}–${number(v.sandHigh)}%</small><br>${tr('Minimum expected soil depth: {value} cm',{value:number(v.depth)})}<br><small>${tr('90% prediction interval')}: ${number(v.depthLow)}–${number(v.depthHigh)} cm<br>${tr('Topsoil texture (0–5 cm). Native 25 m prediction sampled at the 50 m context-cell centre.')}</small><br>${link(context.meta.soil.url,'WSL / EnviDat 2024 · CC BY-SA 4.0')}</p>`);
      }else parts.push(`<p>${tr(context.status==='error'?'Environmental data could not load.':'No canopy or soil context at this position.')}</p>`);
      if(weather.status==='ready'){
        const v=weather.values,meta=weather.meta;
        const age=(Date.now()-Date.parse(meta.endDate+'T00:00:00Z'))/86400000;
        parts.push(`<p><strong>${tr('MeteoSwiss · 1 km')}</strong><br>${tr('Preliminary analyses through {date}',{date:meta.endDate})}<br>${tr('Rain over 14 days: {value} mm',{value:number(v.rain14)})}<br>${tr('Mean temperature over 7 days: {value} °C',{value:number(v.temp7)})}<br>${tr('Relative sunshine over 7 days: {value}%',{value:number(v.sunRelative7)})}<br><small>${tr('Relative sunshine is a percentage of possible sunshine, not hours or forest-floor light.')+' '+tr('Rainfall is regional; a 1 km grid does not mean 1 km accuracy.')}${age>4?' '+tr('Older snapshot; not current conditions.'):''}</small><br>${link(meta.url,'Source: MeteoSwiss')}</p>`);
      }else parts.push(`<p>${tr('MeteoSwiss context could not load.')}</p>`);
      parts.push(`<p><small>${tr('National host-tree classes require source access; missing hosts remain unknown.')}</small> ${link('https://doi.org/10.16904/envidat.506','WSL')}</p>`);
      if(context.status==='error'||weather.status==='error')parts.push(`<button type="button" class="environment-retry">${tr('Retry')}</button>`);
      target.innerHTML=parts.join('');
      target.querySelector('.environment-retry')?.addEventListener('click',()=>{loaded=false;show();});
    }
    details.addEventListener('toggle',show);
  }
  window.SHROOMS_ENVIRONMENT_VIEW={mount};
})();
