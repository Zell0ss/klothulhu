'use strict';
// Pruebas normativas de la fase 12, H1 (docs/fase12/PLAN.md; D63, D64, D65, D66). No editar: añadir en otro fichero.
// Se copia tal cual a desktop/test/fase12.test.js y se ejecuta con `cd desktop && npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const E = require('../renderer/entrada.js');
const { createConvo, toMarkdown } = require('../renderer/convo.js');

const ev = (o = {}) => ({ key: 'Enter', shiftKey: false, ctrlKey: false, metaKey: false, isComposing: false, ...o });

// E1 — Enter en Konnos: envía; Mayús+Enter, salto de línea (D64)
test('E1 Enter en el escritorio', () => {
  assert.equal(E.teclaEnter(ev(), 'escritorio'), 'enviar');
  assert.equal(E.teclaEnter(ev({ shiftKey: true }), 'escritorio'), 'linea');
  assert.equal(E.teclaEnter(ev({ ctrlKey: true }), 'escritorio'), 'enviar');
  assert.equal(E.teclaEnter(ev({ metaKey: true }), 'escritorio'), 'enviar');
  assert.equal(E.teclaEnter(ev({ isComposing: true }), 'escritorio'), null);
  assert.equal(E.teclaEnter(ev({ key: 'a' }), 'escritorio'), null);
});

// E2 — Enter en el móvil: salto de línea; Ctrl/⌘+Enter envía (D64)
test('E2 Enter en el móvil', () => {
  assert.equal(E.teclaEnter(ev(), 'movil'), 'linea');
  assert.equal(E.teclaEnter(ev({ shiftKey: true }), 'movil'), 'linea');
  assert.equal(E.teclaEnter(ev({ ctrlKey: true }), 'movil'), 'enviar');
  assert.equal(E.teclaEnter(ev({ metaKey: true }), 'movil'), 'enviar');
  assert.equal(E.teclaEnter(ev({ ctrlKey: true, isComposing: true }), 'movil'), null);
  assert.equal(E.teclaEnter(ev({ key: 'Tab' }), 'movil'), null);
  assert.equal(E.teclaEnter(ev(), 'otro'), null);   // modo desconocido: no se toca nada
});

// E3 — la caja crece sola de 1 a MAX_LINEAS líneas (D63)
test('E3 altoCaja', () => {
  assert.equal(E.MAX_LINEAS, 6);
  const m = { linea: 18, relleno: 8 };
  assert.equal(E.altoCaja({ scrollHeight: 10, ...m }), 26);            // nunca menos de una línea
  assert.equal(E.altoCaja({ scrollHeight: 80, ...m }), 80);            // lo que pide el texto
  assert.equal(E.altoCaja({ scrollHeight: 500, ...m }), 18 * 6 + 8);   // tope: 6 líneas, luego scroll
});

// C1 — copiar la conversación: el Markdown de lo que enseña el panel (D66, D60, D61, D54)
test('C1 toMarkdown', () => {
  const c = createConvo();
  c.add('user', 'hola\nqué tal');
  c.hold('Saludos, mortal.', [{ title: 'AEMET', url: 'https://www.aemet.es/x', host: 'aemet.es' }], false);
  c.add('user', '📷 mira');   // add suelta antes la respuesta pendiente (D54)
  c.hold('Veo un gato.', [
    { title: 'Gato', url: 'https://es.wikipedia.org/wiki/Gato', host: 'es.wikipedia.org' },
    { title: 'X', url: 'https://x.org/', host: 'x.org' },
  ], true);
  c.release();
  assert.equal(toMarkdown(c.entries(), { fecha: '2026-11-26' }), [
    '# Klothulhu · 2026-11-26', '',
    '**Tú:** hola', 'qué tal', '',
    '**Klothulhu:** Saludos, mortal.', 'fuentes: [aemet.es](https://www.aemet.es/x)', '',
    '**Tú:** 📷 mira', '',
    '**Klothulhu:** Veo un gato.',
    'consultado: [es.wikipedia.org](https://es.wikipedia.org/wiki/Gato), [x.org](https://x.org/)', '',
  ].join('\n'));

  assert.equal(toMarkdown([], { fecha: '2026-11-26' }), '');   // nada que copiar
  assert.match(toMarkdown([{ role: 'user', text: 'a' }]), /^# Klothulhu\n\n\*\*Tú:\*\* a\n$/);   // sin fecha

  const p = createConvo();
  p.add('user', 'a');
  p.hold('todavía leyéndose');   // la que aún se lee no está en el panel: no se copia
  assert.doesNotMatch(toMarkdown(p.entries(), { fecha: 'x' }), /todavía/);
});

// C2 — los dos clientes: textarea con el tope nuevo, ⤢ y copiar (D63, D65, D66)
test('C2 caja y botones en los dos clientes', () => {
  const clientes = [['escritorio', read(DESKTOP, 'renderer', 'index.html')], ['web', read(REPO, 'web', 'index.html')]];
  for (const [nombre, html] of clientes) {
    assert.doesNotMatch(html, /<input id="ask"/, nombre);
    const ask = html.match(/<textarea id="ask"[^>]*>/);
    assert.ok(ask, nombre);
    assert.match(ask[0], /maxlength="4000"/, nombre);
    assert.match(html, /<button id="growBtn" type="button"[^>]*aria-pressed="false"/, nombre);
    assert.match(html, /<button id="copyAllBtn" type="button"[^>]*aria-label="Copiar la conversación"/, nombre);
    assert.match(html, /entrada\.js"><\/script>/, nombre);
  }
  assert.match(read(REPO, 'web', 'index.html').match(/<textarea id="ask"[^>]*>/)[0], /enterkeyhint="enter"/);
});

// C3 — cómo copia cada uno (D66): Konnos por la IPC; el móvil, con plan B porque :5757 va por http
test('C3 copiar en cada cliente', () => {
  const desk = read(DESKTOP, 'renderer', 'index.html');
  const web = read(REPO, 'web', 'app.js');
  for (const src of [desk, web]) {
    assert.match(src, /\btoMarkdown\(/);
    assert.match(src, /\bteclaEnter\(/);
  }
  assert.match(desk, /kl\.copy\(/);
  assert.match(web, /isSecureContext/);
  assert.match(web, /execCommand\('copy'\)/);
  assert.match(read(DESKTOP, 'package.json'), /node --check renderer\/entrada\.js/);
});
