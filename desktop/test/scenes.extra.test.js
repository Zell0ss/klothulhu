'use strict';
// Pruebas añadidas por el programador (el plan permite añadir en otros ficheros).
const test = require('node:test');
const assert = require('node:assert/strict');

const K = require('../renderer/scenes.js');

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
