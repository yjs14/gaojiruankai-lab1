import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import ts from 'typescript';

test('source imports respect documented dependency rules and one class per file',async()=>{
  const allowed: Record<string, readonly string[]>={domain:['domain'],ports:['ports','domain'],application:['application','ports','domain'],infrastructure:['infrastructure','ports','domain'],cli:['cli','application','domain']};
  const walk=async(path:string):Promise<string[]> => (await Promise.all((await readdir(path,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(resolve(path,entry.name)):Promise.resolve([resolve(path,entry.name)])))).flat();
  const sourceRoot=resolve('src');const files=await walk(sourceRoot);
  for(const file of files.filter(path=>path.endsWith('.ts'))) {
    const source=ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true);
    const classes=source.statements.filter(ts.isClassDeclaration);assert.ok(classes.length<=1,file+' must have one class');
    if(classes.length)assert.equal(classes[0].name?.text,basename(file,'.ts'));
    if(basename(file)==='main.ts')continue;
    const layer=file.slice(sourceRoot.length+1).split(/[\\/]/u)[0];
    for(const statement of source.statements.filter(ts.isImportDeclaration)) {
      const target=(statement.moduleSpecifier as ts.StringLiteral).text;
      if(!target.startsWith('.')) {assert.ok(['cli','infrastructure'].includes(layer),'external dependency in '+layer);continue;}
      const destination=resolve(dirname(file),target).slice(sourceRoot.length+1).split(/[\\/]/u)[0];
      assert.ok(allowed[layer]?.includes(destination),layer+' must not depend on '+destination+' in '+file);
    }
  }
});
