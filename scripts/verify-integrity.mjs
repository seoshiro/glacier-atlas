/* global process, fetch, URL, Buffer */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target=process.argv[2];
if(!target) throw new Error('Provide the deployment URL.');
const sourceCommit=process.argv[3] || 'not provided';
const htmlResponse=await fetch(target,{cache:'no-store'});
if(!htmlResponse.ok) throw new Error(`HTML returned ${htmlResponse.status}`);
const html=await htmlResponse.text();
const paths=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg))"/g)].map(match=>match[1]);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const assets=[];
for(const reference of paths){
 const url=new URL(reference,target);
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok) throw new Error(`${url} returned ${response.status}`);
 const live=Buffer.from(await response.arrayBuffer());
 const basePath=new URL(target).pathname;
 const relative=url.pathname.startsWith(basePath)?url.pathname.slice(basePath.length):'';
 if(!/^(assets\/[\w.-]+\.(js|css)|favicon\.svg)$/.test(relative)) throw new Error(`Unexpected asset path: ${reference}`);
 const local=await readFile(`dist/${relative}`);
 const item={url:String(url),bytes:live.length,localSha256:sha256(local),liveSha256:sha256(live),matches:sha256(local)===sha256(live)};
 assets.push(item);
 if(!item.matches) throw new Error(`Deployed bytes differ for ${reference}`);
}
if(!assets.some(asset=>asset.url.endsWith('.js'))||!assets.some(asset=>asset.url.endsWith('.css'))) throw new Error('Missing application asset references.');
const report={verifiedAt:new Date().toISOString(),target,sourceCommit,htmlStatus:htmlResponse.status,htmlSha256:sha256(html),assets};
await writeFile('qa/live-integrity.json',JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify(report,null,2)+'\n');
