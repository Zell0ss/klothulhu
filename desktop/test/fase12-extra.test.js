'use strict';
// Pruebas de regresión de la fase 12, H1 (se pueden ampliar; las normativas están en fase12.test.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { toMarkdown } = require('../renderer/convo.js');

// D66: el texto sale tal cual, sin escapar nada de lo que Markdown interpretaría.
test('toMarkdown no escapa asteriscos ni corchetes', () => {
  const md = toMarkdown([{ role: 'user', text: 'esto es **fuerte** y [esto](no)' }]);
  assert.match(md, /\*\*Tú:\*\* esto es \*\*fuerte\*\* y \[esto\]\(no\)\n/);
});

test('toMarkdown con una fuente sin host enseña la URL', () => {
  const md = toMarkdown([{ role: 'klothulhu', text: 'x', sources: [{ title: 'T', url: 'https://x.org/a' }] }]);
  assert.match(md, /^fuentes: \[https:\/\/x\.org\/a\]\(https:\/\/x\.org\/a\)$/m);
});

// D63: la fila de entrada va anclada sobre la escena. Si el contenedor se queda con el ratón, con la caja crecida
// deja huecos que no son klothulhu, y con la caja cerrada (Esc con un borrador) lo tapa y no se le puede ni pinchar.
test('la fila de entrada solo recibe el ratón en sus piezas, y solo abierta', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
  assert.match(html, /#entry \{[^}]*pointer-events: none;/);
  assert.match(html, /#entry\.on > \* \{ pointer-events: auto; \}/);
});
