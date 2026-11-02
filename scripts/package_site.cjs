// Explicit allowlist: never publish raw geodata, developer caches, or repository metadata.
const fs=require('node:fs');
fs.rmSync('_site',{recursive:true,force:true});
fs.mkdirSync('_site');
for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md','index.html','privacy.html','styles.css','design.css','favicon.svg','forest-magic.svg','social-preview.png','.nojekyll','vendor','src','data']){
 fs.cpSync(name,`_site/${name}`,{recursive:true});
}
if(process.argv.includes('--static')){
 const dataHash=require('node:crypto').createHash('sha256');
 // Reuse the existing gzip payload: no re-encoding or source-data changes.
 function binary(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=`${dir}/${entry.name}`;
  if(entry.isDirectory()){binary(file);continue;}
  if(!entry.name.endsWith('.js'))continue;
  const source=fs.readFileSync(file,'utf8');
  if(!source.startsWith('window.SHROOMS_PACKED['))continue;
  const encoded=JSON.parse(source.slice(source.indexOf('=')+1).trim().replace(/;$/,''));
  let bytes=Buffer.from(encoded,'base64');
  if(file==='_site/data/regions/ch/index.js'){const z=require('node:zlib'),compact=z.gzipSync(JSON.stringify(require('./compact_index.cjs')(JSON.parse(z.gunzipSync(bytes)))),{level:9});fs.writeFileSync('_site/data/regions/ch/compact-index.json.gz',compact);dataHash.update('compact-index');dataHash.update(compact);}
  dataHash.update(file);dataHash.update(bytes);
  fs.writeFileSync(file.replace(/\.js$/,'.json.gz'),bytes);fs.unlinkSync(file);
 }}binary('_site/data');
 fs.writeFileSync('_site/src/runtime.js',`window.SHROOMS_STATIC=true;window.SHROOMS_BINARY=true;window.SHROOMS_DATA_VERSION=${JSON.stringify(dataHash.digest('hex').slice(0,16))};\n`);
}
// Worker dependencies share a release fingerprint, including model/catalog changes.
const codeHash=require('node:crypto').createHash('sha256');
for(const name of fs.readdirSync('_site/src').sort())if(name.endsWith('.js')&&name!=='runtime.js')codeHash.update(fs.readFileSync(`_site/src/${name}`));
fs.appendFileSync('_site/src/runtime.js',`window.SHROOMS_CODE_VERSION=${JSON.stringify(codeHash.digest('hex').slice(0,16))};\n`);
// Switching deployment modes must invalidate the browser's cached runtime flag.
const runtimeHash=require('node:crypto').createHash('sha256').update(fs.readFileSync('_site/src/runtime.js')).digest('hex').slice(0,12);
fs.writeFileSync('_site/index.html',fs.readFileSync('_site/index.html','utf8').replace(/src\/runtime\.js\?v=[^"']+/,`src/runtime.js?v=${runtimeHash}`));
// Content fingerprints keep long-lived browser caches from hiding a new release.
fs.writeFileSync('_site/index.html',fs.readFileSync('_site/index.html','utf8').replace(/((?:src|href)="\.\/)((?:src\/[^"?]+\.js)|(?:styles|design)\.css)(?:\?[^"]*)?"/g,(_,prefix,file)=>{
 const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(`_site/${file}`)).digest('hex').slice(0,12);
 return `${prefix}${file}?v=${hash}"`;
}));
// Search pages use explicit .html URLs, supported by private S3 without routing rules.
const siteUrl=process.env.SHROOMS_SITE_URL||(fs.existsSync('deployment/aws.json')?JSON.parse(fs.readFileSync('deployment/aws.json','utf8')).url:null);
let home=null;
if(siteUrl){
 const origin=new URL(siteUrl);
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')throw Error('SHROOMS_SITE_URL must be a public HTTPS origin');
 home=origin.origin+'/';
}
const pages=require('./build_search_pages.cjs').buildSearchPages('_site',home);
fs.writeFileSync('_site/robots.txt','User-agent: *\nAllow: /\n'+(home?`Sitemap: ${home}sitemap.xml\n`:''));
if(home){
 const xml=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const urls=['',...pages].map(p=>`<url><loc>${xml(new URL(p,home).href)}</loc></url>`).join('');
 fs.writeFileSync('_site/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
 const html=fs.readFileSync('_site/index.html','utf8');
 fs.writeFileSync('_site/index.html',html.replace('</title>','</title>\n  <link rel="canonical" href="'+xml(home)+'" />'));
}
console.log(`Site packaged in _site/ with ${pages.length} rendered reference pages.`);
// Optional public analytics configuration; no account credentials enter the release.
const analyticsFile='deployment/analytics.json';
if(fs.existsSync(analyticsFile)){
 const analytics=JSON.parse(fs.readFileSync(analyticsFile,'utf8'));
 if(analytics.enabled){
  if(!/^[a-f0-9]{32}$/.test(analytics.token||'')||!home||new URL(home).hostname!==analytics.hostname)throw Error('Analytics requires a valid public token and matching canonical hostname');
  const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync('_site/src/analytics.js')).digest('hex').slice(0,12);
  for(const file of ['index.html',...pages]){
   const prefix='../'.repeat(file.split('/').length-1)||'./';
   const tag=`<script defer src="${prefix}src/analytics.js?v=${hash}" data-token="${analytics.token}" data-host="${analytics.hostname}"></script>`;
   const target=`_site/${file}`,html=fs.readFileSync(target,'utf8');
   fs.writeFileSync(target,html.replace('</body>',`${tag}\n</body>`));
  }
 }
}

if(home){
 const target='_site/index.html',html=fs.readFileSync(target,'utf8');
 const tags=require('./social_metadata.cjs')({url:home,title:'Mushroom habitats across Switzerland · pilzradar.ch',description:'Explore Swiss mushroom habitats with forest, terrain and weather data. Compare species and keep your own field notebook. Experimental habitat estimates.'});
 fs.writeFileSync(target,html.replace('</head>',tags+'\n</head>'));
}
