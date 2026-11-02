// A portable Docker deployment archive; explicit allowlist excludes local user data.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const files=['Dockerfile','docker-compose.yml','Caddyfile','.dockerignore','.env.example','package.json','package-lock.json','index.html','styles.css','design.css','privacy.html','favicon.svg','forest-magic.svg','.nojekyll','LICENSE','THIRD_PARTY_NOTICES.md','src','vendor','data','server','scripts/package_site.cjs','scripts/build_search_pages.cjs','scripts/backup.cjs','docs/deployment.md'];
if(fs.existsSync('compose.yaml'))files[1]='compose.yaml';
function inspect(file){const info=fs.lstatSync(file);if(info.isSymbolicLink())throw Error(`Refusing symlink: ${file}`);if(info.isDirectory())for(const entry of fs.readdirSync(file)){if(entry.startsWith('.')||/\.(sqlite|pem|key)$/.test(entry))throw Error(`Unexpected private file: ${file}/${entry}`);inspect(path.join(file,entry));}}
for(const file of files)inspect(file);
fs.mkdirSync('releases',{recursive:true});
const output='releases/shrooms-server.tar.gz';
const result=spawnSync('tar',['-czf',output,...files],{stdio:'inherit',env:{...process.env,COPYFILE_DISABLE:'1'}});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
console.log(`Deployment archive: ${output} (${Math.round(fs.statSync(output).size/1024/1024)} MiB). No credentials or browser/server records included.`);
