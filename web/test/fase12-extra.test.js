'use strict';
// Fase 12, R1 (D68): «¿el historial estaba al final?». Pruebas propias; las normativas están en desktop/ y tests/.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const core = require(path.join(__dirname, '..', 'webcore.js'));

const caja = (scrollTop) => ({ scrollTop, scrollHeight: 800, clientHeight: 300 });   // al final: scrollTop 500

test('estabaAlFinal: abajo del todo, sí', () => {
  assert.equal(core.estabaAlFinal(caja(500)), true);
});

test('estabaAlFinal: con unos píxeles de margen (zoom, medias de píxel), también', () => {
  assert.equal(core.estabaAlFinal(caja(497)), true);
  assert.equal(core.estabaAlFinal(caja(499.5)), true);
});

test('estabaAlFinal: si has subido a leer, no', () => {
  assert.equal(core.estabaAlFinal(caja(496)), false);
  assert.equal(core.estabaAlFinal(caja(0)), false);
});

test('estabaAlFinal: sin nada que desplazar, cuenta como al final', () => {
  assert.equal(core.estabaAlFinal({ scrollTop: 0, scrollHeight: 200, clientHeight: 300 }), true);
});
