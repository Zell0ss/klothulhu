'use strict';
// Pruebas de la fase 3 (docs/fase3/PLAN.md, D21): del programador, no normativas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const K = require('../renderer/scenes.js');
const { createFeed } = require('../renderer/feed.js');
const { appendLog, formatLine, MAX_BYTES, MAX_LINE } = require('../debug-log.js');

const ev = (index, extra = {}) => ({ index, total: 3, emotion: 'smug', caption: `frase ${index}`, scene: { backdrop: 'city' }, ...extra });
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };

test('C1 scene válida -> item con esa escena y su emoción', () => {
  const it = createFeed().onScene(ev(0));
  assert.deepEqual(it, { kind: 'smug', caption: 'frase 0', scene: { backdrop: 'city' }, fromServer: true });
});

test('C2 scene:null -> item con scene null y el caption del evento', () => {
  const it = createFeed().onScene(ev(0, { scene: null }));
  assert.equal(it.scene, null);
  assert.equal(it.caption, 'frase 0');
  assert.equal(it.fromServer, true);
});

test('C3 emoción desconocida -> neutral; caption largo recortado', () => {
  const it = createFeed().onScene(ev(0, { emotion: 'furious', caption: 'x'.repeat(200) }));
  assert.equal(it.kind, 'neutral');
  assert.equal(it.caption.length, K.CAPTION_MAX);
});

test('C4 index repetido y datos inválidos se ignoran', () => {
  const f = createFeed();
  assert.ok(f.onScene(ev(0)));
  assert.equal(f.onScene(ev(0)), null);
  for (const bad of [null, 'x', {}, ev(-1), ev(1.5), ev('1'), ev(2, { caption: '' }), ev(2, { caption: 7 })]) {
    assert.equal(f.onScene(bad), null);
  }
  assert.equal(f.count, 1);
});

test('C5 index fuera de orden: se emiten en orden de llegada', () => {
  const f = createFeed();
  const got = quiet(() => [f.onScene(ev(1)), f.onScene(ev(0)), f.onScene(ev(2))]);
  assert.deepEqual(got.map((i) => i.caption), ['frase 1', 'frase 0', 'frase 2']);
});

test('C6 done: con escenas -> []; sin ninguna -> beats()', () => {
  const marks = [{ at: 0, emotion: 'happy' }];
  const text = 'Hola. Adiós.';
  const a = createFeed(); a.onScene(ev(0));
  assert.deepEqual(a.onDone(text, marks), []);
  const b = createFeed();
  const items = b.onDone(text, marks);
  assert.deepEqual(items.map((i) => [i.caption, i.kind]), K.beats(text, marks).map((x) => [x.caption, x.emotion]));
  assert.ok(items.every((i) => i.scene === null && i.fromServer === false));
});

test('C6b done con respuesta vacía -> []', () => {
  assert.deepEqual(createFeed().onDone('', []), []);
});

test('C7 scene tras done o tras error se ignora', () => {
  const a = createFeed(); a.onDone('Hola.', []);
  assert.equal(a.onScene(ev(0)), null);
  const b = createFeed(); b.onError();
  assert.equal(b.onScene(ev(0)), null);
  assert.deepEqual(b.onDone('Hola.', []), []);   // tras un error no se trocea
});

test('C8 escenas de servidor y fallback son excluyentes', () => {
  const f = createFeed();
  const live = f.onScene(ev(0));
  const after = f.onDone('Una frase. Otra frase.', []);
  assert.equal(live.fromServer, true);
  assert.equal(after.length, 0);
  const g = createFeed();
  const fb = g.onDone('Una frase.', []);
  assert.ok(fb.length > 0 && fb.every((i) => !i.fromServer));
  assert.equal(g.onScene(ev(0)), null);
});

test('C9 appendLog: una línea, recorte, truncado a 256 KB (carpeta temporal)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kl-log-'));
  try {
    const file = path.join(dir, 'x.log');
    const fixed = new Date('2026-10-16T10:00:00Z');
    assert.equal(formatLine('a\nb\r\n  c', fixed), '2026-10-16T10:00:00.000Z a b c\n');
    assert.equal(formatLine('y'.repeat(2000), fixed).length, 25 + MAX_LINE + 1);
    assert.equal(appendLog(file, 'uno', fixed), true);
    assert.equal(appendLog(file, 'dos', fixed), true);
    assert.equal(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length, 2);
    fs.writeFileSync(file, 'z'.repeat(MAX_BYTES + 1));
    appendLog(file, 'tras', fixed);
    assert.equal(fs.readFileSync(file, 'utf8'), '2026-10-16T10:00:00.000Z tras\n');
    assert.equal(appendLog(path.join(dir, 'no', 'existe', 'x.log'), 'q'), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
