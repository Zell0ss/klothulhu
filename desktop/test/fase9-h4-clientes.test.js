'use strict';
// Pruebas del programador de la fase 9, H4 (D54): el enganche de convo.hold/release en los dos clientes.
// Las normativas M1-M7 (fase9-h4.test.js) fijan el módulo; estas fijan que los clientes lo usan bien.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
const CLIENTS = {
  'web/app.js': fs.readFileSync(path.join(__dirname, '..', '..', 'web', 'app.js'), 'utf8'),
  'desktop/renderer/index.html': read('renderer', 'index.html'),
};

for (const [name, src] of Object.entries(CLIENTS)) {
  test(`H4 ${name}: la respuesta ya no entra con convo.add al llegar done`, () => {
    assert.doesNotMatch(src, /convo\.add\(\s*'klothulhu'/);
  });

  test(`H4 ${name}: hold va antes de enqueue(feed.onDone(...))`, () => {
    const hold = src.indexOf('convo.hold(reply');   // fase 11: con las fuentes, `convo.hold(reply, fuentes)` (D60)
    const enq = src.indexOf('enqueue(feed.onDone(');
    assert.ok(hold > -1, 'falta convo.hold(reply…)');
    assert.ok(enq > -1, 'falta enqueue(feed.onDone(...))');
    assert.ok(hold < enq, 'hold tiene que ir antes de enqueue: con la cola vacía, enqueue llega a lingering en esa llamada');
  });

  test(`H4 ${name}: pump suelta lo pendiente al pasar a lingering`, () => {
    const body = src.slice(src.indexOf('function pump()'), src.indexOf('function enqueue('));
    assert.match(body, /phase = 'lingering';\s*\n\s*if \(convo\.release\(\)\) renderHistory\(\);/);
  });

  test(`H4 ${name}: cita D54`, () => {
    assert.match(src, /D54/);
  });
}
