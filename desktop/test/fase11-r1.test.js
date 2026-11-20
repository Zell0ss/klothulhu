'use strict';
// Pruebas normativas del retoque R1 de la fase 11 (docs/fase11/H1-revision.md §5, D61). No editar: añadir en otro fichero.
// Se copia tal cual a desktop/test/fase11-r1.test.js y se ejecuta con `cd desktop && npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const { createConvo } = require('../renderer/convo.js');

// B5 — el historial distingue lo consultado de lo citado, y solo cuando hay fuentes (D61)
test('B5 convo con consultadas', () => {
  const c = createConvo();
  const src = [{ title: 'A', url: 'https://a.es/', host: 'a.es' }];
  c.hold('Lloverá.', src, true);
  c.release();
  assert.deepEqual(c.entries()[0], { role: 'klothulhu', text: 'Lloverá.', sources: src, consultadas: true });
  c.hold('Citado.', src);
  c.release();
  assert.deepEqual(c.entries()[1], { role: 'klothulhu', text: 'Citado.', sources: src });   // como en B2
  c.hold('Sin nada.', [], true);
  c.release();
  assert.deepEqual(c.entries()[2], { role: 'klothulhu', text: 'Sin nada.' });   // sin fuentes, sin marca
});

// B6 — los dos clientes leen `kind` y rotulan «consultado:» en vez de «fuentes:»
test('B6 clientes con consultadas', () => {
  for (const [nombre, src] of [['escritorio', read(DESKTOP, 'renderer', 'index.html')], ['web', read(REPO, 'web', 'app.js')]]) {
    assert.match(src, /['"]consultadas['"]/, `${nombre}: no mira kind === 'consultadas'`);
    assert.match(src, /consultado: /, `${nombre}: falta el rótulo «consultado:»`);
    assert.match(src, /fuentes: /, `${nombre}: falta el rótulo «fuentes:»`);
    assert.doesNotMatch(src, /innerHTML/, `${nombre}: innerHTML (D10)`);
  }
});
