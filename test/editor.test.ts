import test from 'node:test';
import assert from 'node:assert/strict';
import { Fixture } from './Fixture.js';

test('no document errors, help, comments, default init and canvas', async () => {
  const f = new Fixture();
  for (const command of ['tree', 'show a', 'save a.svg', 'canvas', 'undo', 'redo', 'create g a', 'move a 1 2']) assert.equal(await f.run(command), "error: no document. use 'init' or 'read' first");
  assert.match(await f.run('help'), /addto <gid> <id>/u);
  assert.equal(await f.run('  # comment'), ''); assert.equal(await f.run(' '), '');
  assert.equal(await f.run('init'), 'canvas 800x600 created');
  assert.equal(await f.run('canvas'), 'canvas 800x600');
  assert.equal(await f.run('init 400'), 'canvas 400x600 created');
});

for (const [type, args, values] of [
  ['rect', '1 2 3 4', { x: '2', y: '4', width: '6', height: '8' }],
  ['circle', '1 2 3', { cx: '2', cy: '4', r: '6' }],
  ['ellipse', '1 2 3 4', { cx: '2', cy: '4', rx: '6', ry: '8' }],
  ['line', '1 2 3 4', { x1: '2', y1: '4', x2: '6', y2: '8' }],
  ['text', '1 2 "你好 world"', { x: '2', y: '4' }]
] as const) {
  test(type + ' geometry, scaling, moving, undo/redo and no default styles', async () => {
    const f = new Fixture(); await f.setup('create ' + type + ' a ' + args);
    assert.equal(f.editor.document.find('a').attributes().fill, undefined);
    assert.equal(f.editor.document.find('a').attributes().stroke, undefined);
    const original = f.snapshot(); await f.run('scale a 2');
    for (const [key, value] of Object.entries(values)) assert.equal(f.editor.document.find('a').attributes()[key], value);
    const scaled = f.snapshot(); await f.run('undo'); assert.equal(f.snapshot(), original);
    await f.run('redo'); assert.equal(f.snapshot(), scaled);
    await f.run('move a -0.5 1.25'); assert.notEqual(f.snapshot(), scaled);
    await f.run('undo'); assert.equal(f.snapshot(), scaled);
  });
}

test('all shape attributes, text content and common styles can be set', async () => {
  const f = new Fixture(); await f.setup('create rect r 0 0 10 20', 'create circle c 0 0 5', 'create ellipse e 0 0 3 4', 'create line l 0 0 1 1', 'create text t 0 0 "hi"', 'create g g');
  for (const [id, attrs] of [['r', ['x','y','width','height']], ['c',['cx','cy','r']], ['e',['cx','cy','rx','ry']], ['l',['x1','y1','x2','y2']], ['t',['x','y']]] as const) {
    for (const attr of attrs) { assert.match(await f.run('set ' + id + ' ' + attr + ' 3.5'), /updated/u); assert.equal(f.editor.document.find(id).attributes()[attr], '3.5'); }
  }
  for (const id of ['r','c','e','l','t','g']) {
    for (const [attr,value] of [['fill','#abcdef'],['stroke','red'],['stroke-width','2']]) assert.match(await f.run('set ' + id + ' ' + attr + ' ' + value), /updated/u);
  }
  assert.match(await f.run('set t text "<hello & 世界>"'), /updated/u); assert.equal(f.editor.document.find('t').content, '<hello & 世界>');
});

test('nested composite move and scale use descendant geometry and one undo unit', async () => {
  const f = new Fixture(); await f.setup('create g outer', 'create g inner in outer', 'create rect r 1 2 3 4 in inner', 'create text t 2 3 "in" in inner');
  const original = f.snapshot(); await f.run('move outer 10 20');
  assert.equal(f.editor.document.find('r').attributes().x, '11'); assert.equal(f.editor.document.find('t').attributes().y, '23');
  await f.run('undo'); assert.equal(f.snapshot(), original);
  await f.run('scale outer 2'); assert.equal(f.editor.document.find('r').attributes().width, '6');
  await f.run('undo'); assert.equal(f.snapshot(), original);
});

test('delete subtree and exact order/parent restoration on undo and redo', async () => {
  const f = new Fixture(); await f.setup('create g outer','create g inner in outer','create rect r 1 2 3 4 in inner','create circle c 1 2 3 in outer');
  const original = f.snapshot(); await f.run('delete inner'); assert.equal(f.editor.document.all().length, 2);
  await f.run('undo'); assert.equal(f.snapshot(), original); await f.run('redo'); assert.throws(() => f.editor.document.find('r'), /no such shape/u);
});

test('group preserves original document order rather than argument order', async () => {
  const f = new Fixture(); await f.setup('create rect a 0 0 1 1','create rect b 0 0 1 1','create rect c 0 0 1 1');
  const original = f.snapshot(); await f.run('group g c a');
  assert.deepEqual(f.editor.document.find('g').children.map(s=>s.id), ['a','c']);
  assert.deepEqual(f.editor.document.children.map(s=>s.id), ['g','b']);
  await f.run('undo'); assert.equal(f.snapshot(),original); await f.run('redo'); assert.equal(f.editor.document.find('g').children.length,2);
});

test('cross-parent grouping uses lowest common ancestor and restores all parents', async () => {
  const f = new Fixture(); await f.setup('create g scene','create g left in scene','create g right in scene','create rect a 0 0 1 1 in left','create rect b 0 0 1 1 in right');
  const original = f.snapshot(); await f.run('group pair b a');
  assert.equal(f.editor.document.parentLabel('pair'), 'g#scene');
  assert.deepEqual(f.editor.document.find('pair').children.map(s=>s.id),['a','b']);
  await f.run('undo'); assert.equal(f.snapshot(),original);
});

test('ungroup nested container replaces it in-place and is undoable', async () => {
  const f = new Fixture(); await f.setup('create g scene','create rect before 0 0 1 1 in scene','create g inner in scene','create rect a 0 0 1 1 in inner','create rect b 0 0 1 1 in inner','create rect after 0 0 1 1 in scene');
  const original=f.snapshot(); assert.equal(await f.run('ungroup inner'),'g#inner ungrouped');
  assert.deepEqual(f.editor.document.find('scene').children.map(s=>s.id),['before','a','b','after']);
  await f.run('undo');assert.equal(f.snapshot(),original);
});

test('addto reparents to last child and restores source position', async () => {
  const f = new Fixture(); await f.setup('create g g','create rect a 0 0 1 1','create rect b 0 0 1 1 in g');
  const original=f.snapshot(); await f.run('addto g a'); assert.deepEqual(f.editor.document.find('g').children.map(s=>s.id),['b','a']); await f.run('undo'); assert.equal(f.snapshot(),original);
});

test('front/back operate within siblings and SVG painter order', async () => {
  const f = new Fixture(); await f.setup('create g g','create rect a 0 0 1 1 in g','create rect b 0 0 1 1 in g','create rect c 0 0 1 1 in g');
  const original=f.snapshot();await f.run('front a');assert.deepEqual(f.editor.document.find('g').children.map(s=>s.id),['b','c','a']);await f.run('back c');assert.deepEqual(f.editor.document.find('g').children.map(s=>s.id),['c','b','a']);await f.run('undo');await f.run('undo');assert.equal(f.snapshot(),original);
});

for (const [command, error] of [
  ['create rect a 0 0 1 1', 'id already exists: a'],
  ['delete absent', 'no such shape: absent'],
  ['create g child in absent', 'no such container: absent'],
  ['create g child in a', 'not a container: a'],
  ['create hexagon h', 'unknown shape type: hexagon (is the plugin loaded?)'],
  ['create box b 0 0 1 1 "title"', 'unknown shape type: box (is the plugin loaded?)'],
  ['group bad a g', 'cannot group a container into its own descendant: g'],
  ['addto g g', 'cannot group a container into its own descendant: g'],
  ['addto nested g', 'cannot group a container into its own descendant: g'],
  ['ungroup g', 'cannot ungroup top-level container: g'],
  ['scale g 0', 'scale factor must be positive'],
  ['scale a -2', 'scale factor must be positive'],
  ['set a id changed', 'unknown attribute: id'],
  ['set a r 3', 'unknown attribute: r'],
  ['set g x 3', 'unknown attribute: x'],
  ['set a width -1', 'width must be non-negative'],
  ['set g stroke-width -1', 'stroke-width must be non-negative'],
  ['group bad a a', 'duplicate group member'],
  ['create rect bad 0 0 -1 1', 'width must be non-negative']
]) {
  test('atomic error: ' + command, async () => {
    const f=new Fixture();await f.setup('create g g','create rect a 0 0 1 1 in g','create g nested in g','move a 2 3');
    const before=f.snapshot();await f.run('undo');const undone=f.snapshot();
    assert.equal(await f.run(command),'error: '+error);assert.equal(f.snapshot(),undone);
    await f.run('redo');assert.equal(f.snapshot(),before);
  });
}

test('failed multi-descendant overflow cannot change state or history', async () => {
  const f=new Fixture();await f.setup('create g g','create rect a 1 2 3 4 in g','create rect b 1e308 0 1 1 in g');const original=f.snapshot();
  assert.match(await f.run('scale g 2'), /^error: invalid number/u);assert.equal(f.snapshot(),original);
  await f.run('undo');assert.throws(()=>f.editor.document.find('b'), /no such shape/u);
});

test('successful new edit clears redo; display and invalid commands preserve it', async () => {
  const f=new Fixture();await f.setup('create rect a 0 0 1 1','move a 2 3');await f.run('undo');
  for(const line of ['tree','show a','help','canvas','move a 0','set a invalid x'])await f.run(line);
  assert.match(await f.run('redo'),/^redone:/u);await f.run('undo');await f.run('set a fill blue');assert.equal(await f.run('redo'),'error: nothing to redo');
});

for (const io of ['init 100 200','read x.svg','save x.svg','canvas 100 200']) {
  test('IO barrier: ' + io, async () => {
    const f=new Fixture();await f.setup('create rect a 0 0 1 1','move a 2 3');f.files.files.set('x.svg',f.snapshot());
    assert.doesNotMatch(await f.run(io), /^error:/u);
    assert.equal(await f.run('undo'),'error: undo not allowed after io command');assert.equal(await f.run('redo'),'error: undo not allowed after io command');
    await f.run('create g new');assert.match(await f.run('undo'),/^undone:/u);assert.equal(await f.run('undo'),'error: nothing to undo');
  });
}

test('failed IO/init/resize preserves document and undo/redo', async () => {
  const f=new Fixture();await f.setup('create rect a 0 0 1 1','move a 2 3');const original=f.snapshot();
  f.files.failWrite=true;f.files.files.set('bad.svg','<svg>');
  for(const line of ['read absent.svg','read bad.svg','save x.svg','init -1 2','canvas 0 200']) { assert.match(await f.run(line),/^error:/u);assert.equal(f.snapshot(),original); }
  await f.run('undo');assert.equal(f.editor.document.find('a').attributes().x,'0');
});

test('save default path, save-as updates path and init resets it', async () => {
  const f=new Fixture();await f.setup();assert.equal(await f.run('save'),'error: no file path. use save <file.svg>');
  await f.run('save "a file.svg"');await f.run('create g g');assert.match(await f.run('save'),/^saved to a file.svg/u);
  await f.run('read "a file.svg"');await f.run('save b.svg');assert.match(await f.run('save'),/^saved to b.svg/u);
  await f.run('init');assert.match(await f.run('save'),/^error: no file path/u);
});

test('lexing quotes, escaped quotes, Unicode, colors and literal in', async () => {
  const f=new Fixture();await f.setup('create text t 0 0 "in"','create rect r 0 0 1 1 #fff','create text empty 0 0 ""');
  assert.equal(f.editor.document.find('t').content,'in');assert.equal(f.editor.document.find('empty').content,'');assert.equal(f.editor.document.find('r').attributes().fill,'#fff');
  assert.match(await f.run('set t text ' + JSON.stringify('a "quote"')),/updated/u);assert.equal(f.editor.document.find('t').content,'a "quote"');
  const original=f.snapshot();assert.match(await f.run('set t text "broken'),/^error: unterminated/u);assert.equal(f.snapshot(),original);
});

test('invalid arguments and finite decimal validation', async () => {
  const f=new Fixture();await f.setup('create rect a 0 0 1 1');const original=f.snapshot();
  for(const line of ['move a NaN 1','scale a Infinity','move a 0x10 0','move a 1e999 1','canvas 100','create g','create circle c 0 0','tree a extra','set a x 2 extra','bogus']) { assert.match(await f.run(line),/^error:/u);assert.equal(f.snapshot(),original); }
});

test('id case sensitivity, subtree tree and show contain geometry and parent', async () => {
  const f=new Fixture();await f.setup('create g scene','create rect r 1 2 3 4 in scene','create rect R 5 6 7 8','create text t 0 0 "a" in scene');
  assert.equal(f.editor.document.all().length,4);assert.match(await f.run('tree'),/svg \(800x600\)/u);assert.match(await f.run('tree scene'),/rect#r.*x=1 y=2 width=3 height=4/u);assert.doesNotMatch(await f.run('tree scene'),/rect#R/u);assert.match(await f.run('show r'),/parent=g#scene/u);assert.match(await f.run('show t'),/text="a"/u);
});
