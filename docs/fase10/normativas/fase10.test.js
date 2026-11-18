'use strict';
// Pruebas normativas de la fase 10, H1 (docs/fase10/PLAN.md, D56, D57). No editar: añadir en otro fichero.
// Se copia tal cual a desktop/test/fase10.test.js y se ejecuta con `cd desktop && npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const IMG = require('../renderer/imagen.js');
const K = require('../renderer/scenes.js');
const { streamChat } = require('../sse-client.js');

// E1 — medidas: el lado largo no pasa de MAX_LADO, se conserva la proporción y nunca se amplía
test('E1 medidas', () => {
  assert.equal(IMG.MAX_LADO, 1280);
  assert.deepEqual(IMG.medidas(4000, 3000), { w: 1280, h: 960 });
  assert.deepEqual(IMG.medidas(3000, 4000), { w: 960, h: 1280 });
  assert.deepEqual(IMG.medidas(800, 600), { w: 800, h: 600 });
  assert.deepEqual(IMG.medidas(1280, 1280), { w: 1280, h: 1280 });
  assert.deepEqual(IMG.medidas(5000, 2, 1280), { w: 1280, h: 1 });   // nunca 0
  assert.deepEqual(IMG.medidas(2000, 1000, 500), { w: 500, h: 250 });
});

// E2 — deDataUrl: de lo que da el canvas a lo que va en la petición
test('E2 deDataUrl', () => {
  assert.deepEqual(IMG.deDataUrl('data:image/jpeg;base64,QUJD'), { media_type: 'image/jpeg', data: 'QUJD' });
  for (const malo of ['', 'data:text/plain;base64,QUJD', 'data:image/jpeg,QUJD', 'http://x/y.jpg', null, 42]) {
    assert.equal(IMG.deDataUrl(malo), null, String(malo));
  }
});

// E3 — lo que sale en el panel de historial por tu mensaje (el historial local no guarda la imagen)
test('E3 paraHistorial', () => {
  assert.equal(IMG.paraHistorial('mira', true), '📷 mira');
  assert.equal(IMG.paraHistorial('', true), '📷');
  assert.equal(IMG.paraHistorial('  ', true), '📷');
  assert.equal(IMG.paraHistorial('hola', false), 'hola');
});

// E4 — streamChat manda la imagen solo si la hay; sin ella, el cuerpo es el de siempre
test('E4 cuerpo de /chat', async () => {
  const bodies = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (_url, init) => { bodies.push(JSON.parse(init.body)); return { ok: false, status: 500 }; };
  try {
    const signal = new AbortController().signal;
    const onEvent = () => {};
    await streamChat({ apiUrl: 'http://x', token: 't', text: 'hola', signal, onEvent });
    const image = { media_type: 'image/jpeg', data: 'QUJD' };
    await streamChat({ apiUrl: 'http://x', token: 't', text: '', image, signal, onEvent });
  } finally {
    globalThis.fetch = orig;
  }
  assert.deepEqual(bodies[0], { text: 'hola' });
  assert.deepEqual(bodies[1], { text: '', image: { media_type: 'image/jpeg', data: 'QUJD' } });
});

// E5 — líneas fijas para lo que el servidor rechaza (D56)
test('E5 errores de imagen', () => {
  for (const code of ['http_413', 'http_422']) {
    const [emotion, text] = K.LINES.errors[code];
    assert.ok(K.EMOTIONS.includes(emotion), code);
    assert.ok(text.length > 0 && text.length <= K.CAPTION_MAX, code);
  }
});

// E6 — los dos clientes cargan imagen.js, y los checks lo incluyen
test('E6 carga y checks', () => {
  const desk = read(DESKTOP, 'renderer', 'index.html');
  assert.match(desk, /<script src="imagen\.js"><\/script>/);
  const web = read(REPO, 'web', 'index.html');
  assert.match(web, /<script src="\/shared\/imagen\.js"><\/script>/);
  assert.match(read(DESKTOP, 'package.json'), /node --check renderer\/imagen\.js/);
  assert.match(read(DESKTOP, 'preload.js'), /ask: \(text, image\)/);
});
