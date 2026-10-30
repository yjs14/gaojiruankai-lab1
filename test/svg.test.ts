import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Fixture } from './Fixture.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { NodeFileStore } from '../src/infrastructure/NodeFileStore.js';

test('all six types, nesting, text escaping and style round-trip', async () => {
  const f=new Fixture();await f.setup('create g scene','create rect r -1.5 2 30 40 red in scene','create circle c 2 3 4 in scene','create ellipse e 1 2 3 4','create line l 1 2 3 4 black','create text t 10 20 "<你好 & world>" in scene','set scene stroke blue','set r stroke-width 2');
  const original=f.snapshot();const result=f.codec.decode(original);assert.equal(f.codec.encode(result.document),original);assert.deepEqual(result.warnings,[]);assert.match(original,/&lt;你好 &amp; world&gt;/u);
});

test('missing ids reserve all explicit ids before automatic naming', () => {
  const codec=new SvgCodec();const result=codec.decode('<svg width="400" height="300"><rect/><rect id="rect1"/><g><circle/></g></svg>');
  assert.deepEqual(result.warnings,['warning: assigned id rect2 to unnamed <rect>','warning: assigned id g1 to unnamed <g>','warning: assigned id circle1 to unnamed <circle>']);assert.equal(result.document.all().length,4);
});

test('nested translate and uniform scale normalize into geometry in SVG order', () => {
  const codec=new SvgCodec();const {document}=codec.decode('<svg><g id="outer" transform="translate(60,40)"><g id="inner" transform="translate(200,0) scale(0.8)"><rect id="r" x="0" y="0" width="120" height="60"/></g></g></svg>');
  assert.deepEqual(document.find('r').attributes(),{id:'r',x:'260',y:'40',width:'96',height:'48'});
  assert.equal(codec.encode(codec.decode(codec.encode(document)).document),codec.encode(document));
});

test('unregistered box marker downgrades to normal g', () => {
  const {document}=new SvgCodec().decode('<svg><g id="b" data-kind="box"><rect id="b-rect"/><text id="b-label">Title</text></g></svg>');assert.equal(document.find('b').kind,'g');assert.equal(document.find('b').children.length,2);
});

for(const source of [
  '', '<svg>', '<html/>', '<svg><rect id="a"/><circle id="a"/></svg>',
  '<svg><polygon id="p"/></svg>', '<svg><rect id="a" onclick="alert(1)"/></svg>',
  '<svg><rect id="r" width="-1"/></svg>', '<svg><rect id="r" x="NaN"/></svg>',
  '<svg><text id="t">&unknown;</text></svg>', '<!DOCTYPE svg [<!ENTITY x "expanded">]><svg/>',
  '<svg><g id="g" transform="rotate(30)"/></svg>', '<svg viewBox="0 0 100 200"/>',
  '<svg xmlns="invalid"/>','<svg><rect id="r"><circle id="c"/></rect></svg>',
  '<svg/><svg/>','<svg><g id="g">unexpected</g></svg>'
]) test('reject invalid/unsupported SVG atomically: '+source.slice(0,65), async()=>{
  const f=new Fixture();await f.setup('create rect a 1 2 3 4');const original=f.snapshot();f.files.files.set('bad.svg',source);
  assert.match(await f.run('read bad.svg'),/^error:/u);assert.equal(f.snapshot(),original);assert.match(await f.run('undo'),/^undone:/u);
});

test('real file adapter overwrites atomically and reports read/write errors',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'svg-lab-test-'));const store=new NodeFileStore();
  try {const path=join(directory,'图 file.svg');await store.write(path,'first');await store.write(path,'second');assert.equal(await store.read(path),'second');assert.equal(await readFile(path,'utf8'),'second');await assert.rejects(store.read(join(directory,'missing.svg')),/cannot read file/u);await assert.rejects(store.write(join(directory,'missing','a.svg'),'x'),/cannot write file/u);}
  finally {await rm(directory,{recursive:true,force:true});}
});
