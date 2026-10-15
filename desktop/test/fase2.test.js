'use strict';
// Pruebas normativas de la fase 2 (docs/fase2/PLAN.md, D13-D15). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const K = require('../renderer/scenes.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;
const plain = (x) => JSON.parse(JSON.stringify(x));
const cases = (name) => JSON.parse(fs.readFileSync(path.join(REPO, 'tests', 'fixtures', name), 'utf8')).cases;

// F1 — el vocabulario de Python es el del motor vendorizado (D15)
test('F1 server/fables_vocab.json coincide con VOCAB', () => {
  const vocab = JSON.parse(fs.readFileSync(path.join(REPO, 'server', 'fables_vocab.json'), 'utf8'));
  assert.deepEqual(vocab, plain(M.VOCAB));
});

// F2 — el troceo del cliente pasa los mismos casos que el del servidor (D13)
test('F2 beats_cases.json con scenes.js', () => {
  for (const c of cases('beats_cases.json')) {
    const got = K.beats(c.text, c.marks.map(([at, emotion]) => ({ at, emotion })));
    assert.deepEqual(got.map((b) => [b.caption, b.emotion]), c.beats, c.name);
  }
});

// F3 — lo que construye el servidor, el motor lo pinta sin corregir nada (D14)
test('F3 director_cases.json: el motor no corrige las escenas', () => {
  for (const c of cases('director_cases.json')) {
    if (!c.scene) continue;
    const r = M.renderScene(c.scene, { look: 'pixel' });
    assert.equal(r.ok, true, `${c.name}: ${r.error}`);
    assert.deepEqual(plain(r.warnings), [], c.name);
    const s = plain(r.scene);
    for (const k of ['backdrop', 'hero', 'props', 'caption', 'tone', 'particles']) {
      assert.deepEqual(s[k], c.scene[k], `${c.name}: ${k}`);
    }
  }
});
