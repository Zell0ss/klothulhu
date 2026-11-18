'use strict';
// Pruebas del programador de la fase 10, H1 (D56). Las normativas E1-E6 están en fase10.test.js; estas cubren
// lo que ellas no miran: el filtro del IPC de main.js, y el enganche de la imagen en los dos clientes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const IMG = require('../renderer/imagen.js');

const OK = { media_type: 'image/jpeg', data: 'QUJD' };

test('X1 filtrarImagen deja pasar solo lo bien formado', () => {
  assert.deepEqual(IMG.filtrarImagen(OK), OK);
  for (const mt of ['image/png', 'image/webp', 'image/gif']) {
    assert.deepEqual(IMG.filtrarImagen({ media_type: mt, data: 'QUJD' }), { media_type: mt, data: 'QUJD' });
  }
  for (const malo of [
    null, undefined, 'x', 42, [], {},
    { media_type: 'image/bmp', data: 'QUJD' },          // tipo no admitido
    { media_type: 'image/svg+xml', data: 'QUJD' },
    { media_type: 'image/jpeg', data: '' },              // vacío
    { media_type: 'image/jpeg', data: 42 },              // no es texto
    { media_type: 'image/jpeg' },
    { data: 'QUJD' },
    { media_type: 'image/jpeg', data: 'x'.repeat(IMG.MAX_DATA_CHARS + 1) },   // demasiado grande
  ]) {
    assert.equal(IMG.filtrarImagen(malo), null, JSON.stringify(malo)?.slice(0, 60));
  }
});

test('X2 filtrarImagen: el tope es de 6 000 000 caracteres y devuelve una copia sin campos extra', () => {
  assert.equal(IMG.MAX_DATA_CHARS, 6_000_000);
  const justo = { media_type: 'image/png', data: 'x'.repeat(6_000_000) };
  assert.ok(IMG.filtrarImagen(justo));
  const con = IMG.filtrarImagen({ ...OK, extra: 'no' });
  assert.deepEqual(Object.keys(con), ['media_type', 'data']);
});

test('X3 main.js filtra la imagen del renderer y se la pasa a streamChat', () => {
  const main = read(DESKTOP, 'main.js');
  assert.match(main, /require\('\.\/renderer\/imagen'\)/);
  assert.match(main, /ipcMain\.handle\('ask', async \(_e, text, rawImage\)/);
  assert.match(main, /filtrarImagen\(rawImage\)/);
  assert.match(main, /streamChat\(\{ \.\.\.cfg, text, image,/);
  assert.match(main, /imagen descartada/);   // avisa por el log de depuración
  assert.doesNotMatch(main.match(/imagen descartada[^\n]*/)[0], /data|rawImage/);   // y nunca con el contenido
});

test('X4 ningún cliente usa innerHTML para la miniatura (D10) y la miniatura es un <img> con el data URL', () => {
  for (const [name, src] of [
    ['web/app.js', read(REPO, 'web', 'app.js')],
    ['desktop/renderer/index.html', read(DESKTOP, 'renderer', 'index.html')],
    ['desktop/renderer/imagen.js', read(DESKTOP, 'renderer', 'imagen.js')],
  ]) {
    assert.doesNotMatch(src, /innerHTML|insertAdjacentHTML|outerHTML/, name);
  }
  for (const src of [read(REPO, 'web', 'app.js'), read(DESKTOP, 'renderer', 'index.html')]) {
    assert.match(src, /thumbImg\.src = p\.vista/);
  }
});

test('X5 los dos clientes: pegar, ✕, enviar con solo imagen, y sin adjuntar mientras se espera', () => {
  for (const [name, src] of [
    ['web/app.js', read(REPO, 'web', 'app.js')],
    ['desktop/renderer/index.html', read(DESKTOP, 'renderer', 'index.html')],
  ]) {
    assert.match(src, /input\.addEventListener\('paste'/, name);
    assert.match(src, /thumbX\.addEventListener\('click'/, name);
    assert.match(src, /\(!text && !pending\)|input\.value\.trim\(\) \|\| pending/, `${name}: enviar vale con solo imagen`);
    assert.match(src, /paraHistorial\(text, Boolean\(image\)\)/, name);
    assert.match(src, /photoBtn\.disabled = (on|true)/, `${name}: sin adjuntar mientras se espera`);
    assert.match(src, /errorItem\('http_422'\)/, `${name}: si reducir falla, la línea de http_422`);
    assert.match(src, /D56/, name);
  }
});

test('X6 la web: el input de fichero admite imagen y NO lleva capture (cámara y galería en Android)', () => {
  const html = read(REPO, 'web', 'index.html');
  const input = html.match(/<input id="photoInput"[^>]*>/)[0];
  assert.match(input, /type="file"/);
  assert.match(input, /accept="image\/\*"/);
  assert.doesNotMatch(input, /capture/);
  assert.match(html, /<button id="photoBtn"/);
  assert.ok(html.indexOf('id="photoBtn"') > html.indexOf('id="bar"'), 'el 📷 va en la barra');
  assert.match(read(REPO, 'web', 'host.js'), /streamChat\(\{ apiUrl, token, text, image,/);
});

test('X7 el escritorio: botón 📷 en el escenario, junto a los otros, y cuenta como botón (no arrastra)', () => {
  const html = read(DESKTOP, 'renderer', 'index.html');
  const stage = html.match(/<div id="stage">[\s\S]*?<\/div>/)[0];
  assert.match(stage, /id="photoBtn"/);
  assert.match(html, /t === photoBtn/);
  assert.match(html, /<input id="photoInput" type="file" accept="image\/\*" hidden>/);
});
