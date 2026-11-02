const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {buildSearchPages}=require('../scripts/build_search_pages.cjs');
test('rendered references have complete translations, reciprocal language links and working internal paths',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shrooms-search-'));
 try{
  for(const file of ['index.html','privacy.html','favicon.svg','social-preview.png'])fs.copyFileSync(file,path.join(dir,file));
  const origin='https://example.org/',pages=buildSearchPages(dir,origin);
  assert.equal(pages.length,115);
  const titles=new Set();
  for(const file of pages){
   const html=fs.readFileSync(path.join(dir,file),'utf8'),lang=file.split('/')[0];
   assert.match(html,new RegExp(`<html lang="${lang}">`));assert.equal((html.match(/<h1>/g)||[]).length,1);
   assert.ok(!html.includes('<script src='));assert.ok(Buffer.byteLength(html)<16000,'reference pages must stay small');
   const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),`duplicate title ${title}`);titles.add(title);
   assert.ok(html.includes(`<link rel="canonical" href="${origin}${file}">`));
   const structured=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);assert.equal(structured.inLanguage,lang);assert.equal(structured.url,origin+file);
   const alternates=[...html.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];assert.equal(alternates.length,6);
   for(const [,other,url] of alternates){
    const target=new URL(url).pathname.slice(1);assert.ok(pages.includes(target));
    const sibling=fs.readFileSync(path.join(dir,target),'utf8');assert.ok(sibling.includes(`hreflang="${lang}" href="${origin}${file}"`),'hreflang must be reciprocal');
    if(other!=='x-default')assert.ok(target.startsWith(other+'/'));
   }
   for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=new URL(raw.replace(/&amp;/g,'&'),origin+file);
    if(url.origin!==new URL(origin).origin)continue;
    assert.ok(fs.existsSync(path.join(dir,url.pathname)),`${file}: missing ${raw}`);
   }
   if(lang!=='en'){assert.ok(!html.includes('Experimental habitat estimates'));assert.ok(!html.includes('Tree partners, a sheltered canopy'));}
  }
  for(const id of ['liberty_cap','wavy_cap']){
   const page=fs.readFileSync(path.join(dir,`en/species/${id}.html`),'utf8');assert.match(page,/Observation only: no habitat suitability map/);assert.match(page,/not an identification guide/);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('packaged crawl files list existing public pages without query or fragment variants',()=>{
 const robots=fs.readFileSync('_site/robots.txt','utf8');assert.match(robots,/User-agent: \*\nAllow: \/\n/);
 if(!fs.existsSync('_site/sitemap.xml'))return;
 const sitemap=fs.readFileSync('_site/sitemap.xml','utf8'),urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]));assert.equal(urls.length,116);
 for(const url of urls){assert.equal(url.search,'');assert.equal(url.hash,'');assert.ok(fs.existsSync('_site/'+(url.pathname==='/'?'index.html':url.pathname.slice(1))));}
});
test('packaged pages expose complete preview metadata and a real 1200×630 PNG without JavaScript',()=>{
 const png=fs.readFileSync('_site/social-preview.png');assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 if(!fs.existsSync('_site/sitemap.xml'))return;
 const urls=[...fs.readFileSync('_site/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]));
 for(const url of urls){
  const html=fs.readFileSync('_site/'+(url.pathname==='/'?'index.html':url.pathname.slice(1)),'utf8');
  for(const key of ['og:title','og:description','og:url','og:image','og:image:alt','twitter:card','twitter:image'])assert.equal((html.match(new RegExp(`(?:property|name)="${key}"`,'g'))||[]).length,1,`${url}: ${key}`);
  assert.ok(html.includes('content="summary_large_image"'));assert.ok(html.includes(`content="${url.origin}/social-preview.png"`));
 }
});
