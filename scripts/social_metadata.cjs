// Static tags are visible to crawlers that never execute JavaScript.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=function socialMetadata({url,title,description,lang='en'}){
 if(!url)return '';
 const image=new URL('social-preview.png',new URL('/',url)).href;
 const alt='Pilzradar.ch — colourful mushroom illustration; explore mushroom habitats across Switzerland.';
 const meta=(key,value)=>`<meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${esc(value)}">`;
 return Object.entries({'og:type':'website','og:site_name':'pilzradar.ch','og:title':title,'og:description':description,'og:url':url,'og:locale':lang+'_CH','og:image':image,'og:image:secure_url':image,'og:image:type':'image/png','og:image:width':'1200','og:image:height':'630','og:image:alt':alt,'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':alt}).map(([k,v])=>meta(k,v)).join('\n');
};
