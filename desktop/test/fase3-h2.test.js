'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../renderer/scenes.js');
const { normalizeConfig } = require('../config.js');

const c40 = 'x'.repeat(40);

// N1 — sin opts, readMs es la de la fase 1 (D22 no cambia P6)
test('N1 readMs sin opts no cambia', () => {
  assert.equal(K.readMs(c40, 0.5, true), 500 + 600 + 200 + 1200 + 2000 + 1800);
  assert.equal(K.readMs(c40, 0, false, {}), 200 + 1200 + 2000 + 1800);
});

// N2 — golpe cortado: sin los 2 s y con media lectura (D22a)
test('N2 readMs cortado', () => {
  assert.equal(K.readMs(c40, 0, false, { cut: true }), 200 + 1200 + 900);
  assert.equal(K.readMs(c40, 0.5, true, { cut: true }), 500 + 600 + 200 + 1200 + 900);
});

// N3 — readSpeed multiplica solo la lectura (D22b)
test('N3 readMs speed', () => {
  assert.equal(K.readMs(c40, 0, false, { speed: 0.5 }), 200 + 1200 + 1900);
  assert.equal(K.readMs(c40, 0, false, { cut: true, speed: 0.5 }), 200 + 1200 + 450);
  assert.equal(K.readMs(c40, 0, false, { speed: 2 }), 200 + 1200 + 7600);
});

// N4 — isCut
test('N4 isCut', () => {
  for (const c of ['Hola, mortal. Sigo atrapado en tu escritorio,', 'lo dice así:', 'sin punto', 'uno; dos;'])
    assert.equal(K.isCut(c), true, c);
  for (const c of ['Fin.', 'Fin. ', '¿Sí?', '¡Ya!', 'Bueno…', 'Bueno...', '«Hola.»', '"Hola."', '(así.)'])
    assert.equal(K.isCut(c), false, c);
});

// N5 — readSpeed en config
test('N5 normalizeConfig readSpeed', () => {
  assert.equal(normalizeConfig({}).cfg.readSpeed, 1);
  assert.equal(normalizeConfig({}).warnings.length, 0);
  assert.equal(normalizeConfig({ readSpeed: 0.7 }).cfg.readSpeed, 0.7);
  for (const v of [0, 0.1, 5, '0.7', null, NaN, Infinity]) {
    const r = normalizeConfig({ readSpeed: v });
    assert.equal(r.cfg.readSpeed, 1, String(v));
    assert.ok(r.warnings.some((w) => w.includes('readSpeed')), String(v));
  }
});

// N6 — debug solo con true; lo demás avisa
test('N6 normalizeConfig debug', () => {
  assert.equal(normalizeConfig({ debug: true }).cfg.debug, true);
  assert.equal(normalizeConfig({ debug: false }).warnings.length, 0);
  assert.equal(normalizeConfig({}).cfg.debug, false);
  for (const v of ['true', 1, 'yes']) {
    const r = normalizeConfig({ debug: v });
    assert.equal(r.cfg.debug, false, String(v));
    assert.ok(r.warnings.some((w) => w.includes('debug')), String(v));
  }
});

// N7 — el motor vendorizado sale sin conversión de finales de línea (P9 en Windows)
test('N7 .gitattributes protege vendor', () => {
  const ga = fs.readFileSync(path.join(__dirname, '..', '..', '.gitattributes'), 'utf8');
  assert.match(ga, /^desktop\/renderer\/vendor\/\*\* -text$/m);
});
