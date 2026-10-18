'use strict';
// Pruebas normativas de la fase 5 (docs/fase5/PLAN.md, D24-D25). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const K = require('../renderer/scenes.js');
const { createFeed } = require('../renderer/feed.js');

const DESKTOP = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;
const LONG = 'Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a preguntarme por la hora, como si el tiempo significara algo para un ser que ya estaba aquí antes de las estrellas.';

// I1 — tramos() con los casos compartidos con tramos() del servidor (D24)
test('I1 tramos_cases.json con scenes.js', () => {
  const file = path.join(DESKTOP, '..', 'tests', 'fixtures', 'tramos_cases.json');
  for (const c of JSON.parse(fs.readFileSync(file, 'utf8')).cases) {
    const got = K.tramos(c.text, c.marks.map(([at, emotion]) => ({ at, emotion })));
    assert.deepEqual(got.map((b) => [b.caption, b.emotion]), c.tramos, c.name);
  }
});

// I2 — motor de la fase 2 de claude-fables (D25)
test('I2 motor v2 y TRAMO_MAX', () => {
  assert.equal(M.SCHEMA_VERSION, 3);  // D33: motor v3
  assert.equal(K.TRAMO_MAX, M.VOCAB.limits.maxLongCaption);
  assert.equal(K.BUBBLE_LINES, 2);
});

// I3 — tiempo en pantalla: typedAfter más el margen de la última línea (D25)
test('I3 holdMs', () => {
  assert.equal(K.holdMs(7.67, 0.03), 7670 + 1920);
  assert.equal(K.holdMs(0.5, 0.03), 500 + 1920);
  assert.equal(K.holdMs(1, 0.01), 1000 + 1200);
  assert.equal(K.holdMs(2, 0.12), 2000 + 7680);
});

// I4 — readSpeed mueve secondsPerChar, dentro de lo que admite el motor (D25)
test('I4 secondsPerChar', () => {
  const base = M.VOCAB.defaults.secondsPerChar;
  assert.equal(K.secondsPerChar(1, base), 0.03);
  assert.equal(K.secondsPerChar(0.5, base), 0.015);
  assert.equal(K.secondsPerChar(0.25, base), 0.01);   // 0.0075 -> mínimo del motor
  assert.equal(K.secondsPerChar(4, base), 0.12);
  assert.equal(K.secondsPerChar(undefined, base), 0.03);
});

// I5 — las escenas fijas y los textos fijos se pintan con el bocadillo de scroll y un tramo largo
test('I5 STAGING y LINES con bubble', () => {
  const opts = { look: 'pixel', bubble: { lines: K.BUBBLE_LINES }, secondsPerChar: 0.03 };
  for (const e of K.EMOTIONS) {
    const r = M.renderScene(K.sceneFor(e, LONG), opts);
    assert.ok(r.ok, e);
    assert.ok(r.typedAfter > 5, `${e}: ${r.typedAfter}`);
    assert.equal(r.scene.caption, LONG, e);
  }
  assert.ok(M.renderScene(K.sceneFor('happy', K.LINES.boot('Control+Alt+K')), opts).ok);
});

// I6 — el feed no recorta un tramo y, sin escenas del servidor, trocea por tramos (D24)
test('I6 feed con tramos', () => {
  const f = createFeed();
  const it = f.onScene({ index: 0, total: 1, emotion: 'smug', caption: 'x'.repeat(600), scene: null });
  assert.equal(it.caption.length, K.TRAMO_MAX);
  const g = createFeed();
  assert.deepEqual(g.onDone(LONG, [{ at: 0, emotion: 'annoyed' }]).map((i) => i.caption), [LONG]);
});

// I7 — el renderer pinta con bubble y secondsPerChar, y mide con holdMs (D25)
test('I7 index.html usa bubble, secondsPerChar y holdMs', () => {
  const html = fs.readFileSync(path.join(DESKTOP, 'renderer', 'index.html'), 'utf8');
  assert.match(html, /bubble:\s*\{\s*lines:\s*BUBBLE_LINES\s*\}/);
  assert.match(html, /secondsPerChar/);
  assert.match(html, /holdMs\(/);
  assert.doesNotMatch(html, /readMs\(/);
});
