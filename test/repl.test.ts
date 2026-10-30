import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

test('real REPL replays flowchart script through EOF and writes browser-readable SVG',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'svg-repl-test-'));
  try {
    const destination=join(directory,'flowchart.svg');
    const input=(await readFile('examples/flowchart.cli','utf8')).replace('save examples/flowchart.svg','save '+JSON.stringify(destination.replaceAll('\\','/')));
    const result=spawnSync(process.execPath,[resolve('dist/src/main.js')],{input,encoding:'utf8',windowsHide:true});
    assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');
    assert.match(result.stdout,/svg-editor 0.1/u);assert.match(result.stdout,/g#node2 moved by/u);assert.match(result.stdout,/error: undo not allowed after io command/u);
    assert.equal(result.stdout.split('error:').length-1,1);
    const {document}=new SvgCodec().decode(await readFile(destination,'utf8'));
    assert.equal(document.all().length,8);assert.equal(document.find('process').attributes().y,'100');assert.equal(document.find('process-label').content,'处理数据 v2');
  } finally {assert.equal(dirname(directory), tmpdir()); await rm(directory,{recursive:true,force:true});}
});
