'use strict';
// Pruebas normativas de la fase 6, H1 (docs/fase6/PLAN.md, D27). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createConvo } = require('../renderer/convo.js');
const { openBounds, closeBounds, PANEL_W } = require('../layout.js');

const DESKTOP = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(DESKTOP, ...p), 'utf8');

// J1 — la conversación guarda turnos en orden, recortados, sin vacíos
test('J1 convo: orden, recorte y vacíos', () => {
  const c = createConvo();
  c.add('user', '  ¿qué hay para cenar?  ');
  c.add('klothulhu', 'No tengo estómago, mortal.');
  c.add('user', '   ');
  c.add('klothulhu', '');
  assert.deepEqual(c.entries(), [
    { role: 'user', text: '¿qué hay para cenar?' },
    { role: 'klothulhu', text: 'No tengo estómago, mortal.' },
  ]);
});

// J2 — solo dos papeles; lo demás se ignora
test('J2 convo: papeles válidos', () => {
  const c = createConvo();
  c.add('system', 'hola');
  c.add(undefined, 'hola');
  c.add('user', 42);
  assert.equal(c.entries().length, 0);
});

// J3 — tope de entradas: se van las más antiguas
test('J3 convo: tope', () => {
  const c = createConvo({ max: 3 });
  for (let i = 1; i <= 5; i++) c.add('user', `p${i}`);
  assert.deepEqual(c.entries().map((e) => e.text), ['p3', 'p4', 'p5']);
  assert.equal(createConvo().max, 200);
});

// J4 — clear vacía; entries devuelve una copia
test('J4 convo: clear y copia', () => {
  const c = createConvo();
  c.add('user', 'a');
  const snap = c.entries();
  snap[0].text = 'cambiado';
  snap.push({ role: 'user', text: 'b' });
  assert.deepEqual(c.entries(), [{ role: 'user', text: 'a' }]);
  c.clear();
  assert.deepEqual(c.entries(), []);
});

const AREA = { x: 0, y: 0, width: 1920, height: 1040 };

// J5 — abrir el panel: crece a la derecha si cabe; si no, se desplaza a la izquierda lo justo
test('J5 openBounds', () => {
  assert.equal(PANEL_W, 176);
  assert.deepEqual(openBounds({ x: 100, y: 800, width: 960, height: 236 }, AREA, 264),
    { bounds: { x: 100, y: 800, width: 1224, height: 236 }, shift: 0 });
  assert.deepEqual(openBounds({ x: 936, y: 800, width: 960, height: 236 }, AREA, 264),
    { bounds: { x: 696, y: 800, width: 1224, height: 236 }, shift: 240 });
  // más ancha que la pantalla: pegada a la izquierda del área
  assert.deepEqual(openBounds({ x: 50, y: 0, width: 1800, height: 236 }, AREA, 264),
    { bounds: { x: 0, y: 0, width: 2064, height: 236 }, shift: 50 });
  // pantalla secundaria a la izquierda (x negativas)
  assert.deepEqual(openBounds({ x: -900, y: 10, width: 960, height: 236 }, { x: -1920, y: 0, width: 1920, height: 1040 }, 264),
    { bounds: { x: -1224, y: 10, width: 1224, height: 236 }, shift: 324 });
});

// J6 — cerrar: vuelve al ancho y deshace el desplazamiento, aunque se haya movido la ventana
test('J6 closeBounds', () => {
  assert.deepEqual(closeBounds({ x: 696, y: 800, width: 1224, height: 236 }, 264, 240),
    { x: 936, y: 800, width: 960, height: 236 });
  assert.deepEqual(closeBounds({ x: 300, y: 500, width: 1224, height: 236 }, 264, 0),
    { x: 300, y: 500, width: 960, height: 236 });
});

// J7 — piezas cableadas: botón, panel, aviso de olvido, script clásico y sin innerHTML (D10)
test('J7 cableado', () => {
  const html = read('renderer', 'index.html');
  assert.match(html, /<button id="histBtn"/);
  assert.match(html, /id="history"/);
  assert.match(html, /<script src="convo\.js"><\/script>/);
  assert.doesNotMatch(html, /innerHTML|insertAdjacentHTML|outerHTML/);
  assert.match(html, /textContent/);
  const preload = read('preload.js');
  assert.match(preload, /panel:/);
  assert.match(preload, /onForgotten:/);
  const main = read('main.js');
  assert.match(main, /require\('\.\/layout'\)/);
  assert.match(main, /send\('forgotten'\)/);
  assert.match(read('package.json'), /node --check layout\.js/);
  assert.match(read('package.json'), /node --check renderer\/convo\.js/);
});
