'use strict';
// Pruebas normativas de la fase 6, H2 (docs/fase6/H2-encargo.md, D28, D30, D33). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const K = require('../renderer/scenes.js');

const DESKTOP = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;

// T1 — motor de la fase 3 de claude-fables, con las tres acciones nuevas (D33)
test('T1 motor v3', () => {
  assert.equal(M.SCHEMA_VERSION, 3);
  for (const a of ['sad', 'despair', 'emerge']) assert.ok(M.VOCAB.actions.includes(a), a);
});

// T2 — `sad` es la séptima emoción (D28; P7 vigila que coincida con el servidor)
test('T2 EMOTIONS con sad', () => {
  assert.deepEqual([...K.EMOTIONS], ['neutral', 'happy', 'annoyed', 'confused', 'smug', 'sleepy', 'sad']);
});

// T3 — la escena fija de `sad`: se acerca al mortal y le pone cara de compasión (P4 la pinta sin correcciones)
test('T3 STAGING.sad', () => {
  assert.deepEqual({ ...K.STAGING.sad.hero }, { action: 'approach', from: 30, to: 50, then: 'sad' });
  assert.equal(K.STAGING.sad.backdrop, 'desert');
  assert.equal(K.STAGING.sad.particles.kind, 'rain');
  assert.notEqual(K.STAGING.sad.backdrop, K.STAGING.sleepy.backdrop, 'que no se confunda con sleepy');
});

// T4 — las acciones nuevas se pintan sin avisos en pixel y en 3D; `emerge` en `then` lo descarta el motor
test('T4 acciones nuevas en el motor', () => {
  const base = { backdrop: 'volcano', caption: 'Temblad, mortales.', tone: 'trouble' };
  for (const hero of [
    { action: 'emerge', from: 50, to: 50, then: 'angry' },
    { action: 'sad', from: 40, to: 40 },
    { action: 'despair', from: 40, to: 40 },
    { action: 'approach', from: 30, to: 50, then: 'despair' },
  ]) {
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene({ ...base, hero }, { look, bubble: { lines: K.BUBBLE_LINES } });
      assert.equal(r.ok, true, `${hero.action}/${look}: ${r.error}`);
      assert.deepEqual([...r.warnings], [], `${hero.action}/${look}`);
      assert.deepEqual({ ...r.scene.hero }, hero);
    }
  }
});
