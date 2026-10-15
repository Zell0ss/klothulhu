'use strict';
// Pruebas añadidas por el programador (el plan permite añadir en otros ficheros).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const K = require('../renderer/scenes.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;

// Igual que P4 de fase1.test.js, pero copiando los arrays/objetos del motor al reino de Node:
// el motor corre en un contexto de `vm`, y deepStrictEqual compara prototipos, así que
// `[]` de Node nunca es "igual" a `[]` del contexto. Ver H1-informe.md, Desviaciones.
test('P4b STAGING pinta sin correcciones (comparación entre reinos)', () => {
  const plain = (x) => JSON.parse(JSON.stringify(x));
  for (const kind of [...K.EMOTIONS, 'thinking', 'idle']) {
    const scene = K.sceneFor(kind, 'Los astros aplauden, sectario.');
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look });
      assert.equal(r.ok, true, `${kind}/${look}: ${r.error}`);
      assert.deepEqual(plain(r.warnings), [], `${kind}/${look}`);
      assert.deepEqual(plain(r.scene.hero), scene.hero);
      assert.deepEqual(plain(r.scene.props), []);
      assert.deepEqual(plain(r.scene.particles || null), scene.particles || null);
      assert.equal(r.scene.backdrop, scene.backdrop);
      assert.equal(r.scene.tone, scene.tone);
      assert.equal(r.scene.caption, scene.caption);
    }
  }
});

test('beats: tramo sin terminador, comillas de cierre y puntos suspensivos', () => {
  assert.deepEqual(K.beats('Sin punto final', []).map((b) => b.caption), ['Sin punto final']);
  assert.deepEqual(K.beats('Dijo «hola». Luego calló…', []).map((b) => b.caption), ['Dijo «hola». Luego calló…']);
  assert.deepEqual(K.beats('Pi vale 3.14 más o menos.', []).map((b) => b.caption), ['Pi vale 3.14 más o menos.']);
});

test('beats: marcas fuera de rango o duplicadas en 0 no rompen', () => {
  assert.deepEqual(K.beats('Hola.', [{ at: 0, emotion: 'happy' }, { at: 99, emotion: 'smug' }]),
    [{ caption: 'Hola.', emotion: 'happy' }]);
  assert.deepEqual(K.beats('   ', [{ at: 0, emotion: 'happy' }]), []);
});

test('sceneFor no comparte estado con STAGING', () => {
  const a = K.sceneFor('happy', 'x');
  a.hero.from = 99; a.particles.density = 9;
  assert.equal(K.STAGING.happy.hero.from, 20);
  assert.equal(K.sceneFor('happy', 'x').particles.density, 0.4);
});
