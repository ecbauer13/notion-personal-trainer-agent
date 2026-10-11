const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const workflow=JSON.parse(fs.readFileSync(path.join(root,'workflows/weekly-fitness-review.json'),'utf8'));
assert.equal(workflow.active,false);
assert.deepEqual(workflow.pinData,{});
for(const field of ['id','versionId','meta','tags','nodeGroups','staticData'])assert(!Object.hasOwn(workflow,field));
const names=new Set(workflow.nodes.map(n=>n.name));
for(const n of workflow.nodes)assert(!n.credentials,'Credential references must be removed');
for(const [from,connections] of Object.entries(workflow.connections)){
 assert(names.has(from));
 for(const ports of Object.values(connections))for(const targets of ports)for(const target of targets)assert(names.has(target.node));
}
const byName=Object.fromEntries(workflow.nodes.map(n=>[n.name,n]));
const placeholders={
 'Get many database pages':['dataSourceId','REPLACE_WITH_WORKOUT_HISTORY_DATA_SOURCE_ID'],
 'Read Body Metrics':['dataSourceId','REPLACE_WITH_BODY_METRICS_DATA_SOURCE_ID'],
 'Create Weekly Fitness Review':['pageId','REPLACE_WITH_REVIEW_PARENT_PAGE_ID']};
for(const [name,[field,value]] of Object.entries(placeholders))assert.equal(byName[name].parameters[field].value,value);
for(const [name,file] of Object.entries({'Prepare Review Data':'prepare-review-data.js','Calculate Workout Trends':'calculate-workout-trends.js','Calculate Body Trends':'calculate-body-trends.js','Prepare AI Review Input':'prepare-ai-review-input.js'})){
 const code=fs.readFileSync(path.join(root,'src',file),'utf8');
 assert.equal(byName[name].parameters.jsCode,code);new Function('$input',code);
}
assert(byName['Prepare AI Review Input'].parameters.jsCode.includes(fs.readFileSync(path.join(root,'src/longer-assessments.js'),'utf8')));
assert.equal(byName['Create Weekly Fitness Review'].parameters.blocksJson,fs.readFileSync(path.join(root,'src/notion-review-expression.txt'),'utf8'));
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.name==='.git'?[]:entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]);
const forbidden=[new RegExp('sk'+'-or-v1-[A-Za-z0-9]{12,}'),new RegExp('Bearer '+'[A-Za-z0-9._-]{20,}'),new RegExp('https?://(?:app\\.|www\\.)?notion\\.(?:com|so)/(?:native/)?(?:p/)?[A-Za-z0-9-]*[a-f0-9]{32}'),new RegExp('/Users/'+ '[A-Za-z]'),new RegExp('[A-Za-z0-9_-]+\\.app\\.n8n\\.cloud')];
let files=0;
for(const file of walk(root)){
 const text=fs.readFileSync(file,'utf8');
 for(const pattern of forbidden)assert(!pattern.test(text),'Sensitive-looking content in '+path.relative(root,file));
 if(file.endsWith('.md'))for(const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const target=match[1];if(!/^(https?:|#)/.test(target))assert(fs.existsSync(path.resolve(path.dirname(file),target.split('#')[0])),'Broken link '+target);
 }
 files++;
}
console.log(`Package checks passed: ${files} files, inactive export, placeholders, connections, exact code, relative links, and secret-pattern scan.`);
