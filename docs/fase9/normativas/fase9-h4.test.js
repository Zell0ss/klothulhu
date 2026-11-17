'use strict';
// Pruebas normativas de la fase 9, H4 (docs/fase9/H4-encargo.md, D54). No editar: añadir en otro fichero.
// Se copia tal cual a desktop/test/fase9-h4.test.js y se ejecuta con `cd desktop && npm test`.
// La respuesta de klothulhu se guarda aparte (hold) y entra en el historial cuando acaba de decirla
// (release). Cualquier add() suelta antes lo pendiente, para que el orden no se altere nunca.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createConvo } = require('../renderer/convo.js');

const texts = (c) => c.entries().map((e) => `${e.role}:${e.text}`);

// M1 — lo guardado no se ve hasta que se suelta
test('M1 hold: no aparece hasta release', () => {
  const c = createConvo();
  c.add('user', 'hola');
  c.hold('  Saludos, mortal.  ');
  assert.deepEqual(texts(c), ['user:hola']);
  assert.equal(c.release(), true);
  assert.deepEqual(texts(c), ['user:hola', 'klothulhu:Saludos, mortal.']);
});

// M2 — soltar dos veces no duplica; soltar sin nada pendiente no hace nada
test('M2 release: una sola vez', () => {
  const c = createConvo();
  assert.equal(c.release(), false);
  c.hold('Uno.');
  assert.equal(c.release(), true);
  assert.equal(c.release(), false);
  assert.deepEqual(texts(c), ['klothulhu:Uno.']);
});

// M3 — si escribes antes de que acabe, su respuesta entra antes que tu mensaje
test('M3 add suelta antes lo pendiente', () => {
  const c = createConvo();
  c.add('user', 'a');
  c.hold('Respuesta a.');
  c.add('user', 'b');
  assert.deepEqual(texts(c), ['user:a', 'klothulhu:Respuesta a.', 'user:b']);
  assert.equal(c.release(), false);
});

// M4 — un hold sobre otro pendiente no pierde el primero
test('M4 hold sobre pendiente: el primero entra', () => {
  const c = createConvo();
  c.hold('Primera.');
  c.hold('Segunda.');
  assert.deepEqual(texts(c), ['klothulhu:Primera.']);
  c.release();
  assert.deepEqual(texts(c), ['klothulhu:Primera.', 'klothulhu:Segunda.']);
});

// M5 — «Olvidar» descarta también lo pendiente
test('M5 clear descarta lo pendiente', () => {
  const c = createConvo();
  c.add('user', 'a');
  c.hold('Respuesta.');
  c.clear();
  assert.equal(c.release(), false);
  assert.deepEqual(c.entries(), []);
});

// M6 — vacíos y no-textos no quedan pendientes
test('M6 hold: vacíos', () => {
  const c = createConvo();
  for (const v of ['', '   ', undefined, null, 42]) {
    c.hold(v);
    assert.equal(c.release(), false);
  }
  assert.deepEqual(c.entries(), []);
});

// M7 — el tope se aplica también al soltar
test('M7 release respeta el tope', () => {
  const c = createConvo({ max: 2 });
  c.add('user', 'p1');
  c.add('user', 'p2');
  c.hold('r');
  c.release();
  assert.deepEqual(texts(c), ['user:p2', 'klothulhu:r']);
});
