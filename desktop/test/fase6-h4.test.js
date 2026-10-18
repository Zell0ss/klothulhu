'use strict';
// Pruebas normativas de la fase 6, H4 (docs/fase6/H4-encargo.md, D31-D32). No editar: añadir en otro fichero.
// Versión 2 (H4-revision.md §4, D32): sin el tamaño `half`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const L = require('../layout.js');
const S = require('../state.js');

const DESKTOP = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(DESKTOP, ...p), 'utf8');
const AREA = { x: 0, y: 0, width: 1920, height: 1040 };
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kl-h4-'));

// M1 — los dos tamaños, su geometría y el orden del botón (D32: sin `half`)
test('M1 tamaños', () => {
  assert.equal(L.STAGE_W, 640);
  assert.equal(L.STAGE_H, 128);
  assert.equal(L.INPUT_H, 44);
  assert.deepEqual([...L.SIZE_ORDER], ['normal', 'narrow']);
  assert.deepEqual(L.sizeGeometry('normal', 1.5), { size: 'normal', zoom: 1.5, stageW: 640, width: 960, height: 236 });
  assert.deepEqual(L.sizeGeometry('narrow', 1.5), { size: 'narrow', zoom: 1.5, stageW: 320, width: 480, height: 236 });
  assert.deepEqual(L.sizeGeometry('normal', 1), { size: 'normal', zoom: 1, stageW: 640, width: 640, height: 172 });
  // un nombre desconocido, también el `half` retirado, es 'normal'
  assert.deepEqual(L.sizeGeometry('half', 1.5), L.sizeGeometry('normal', 1.5));
  assert.deepEqual(L.sizeGeometry('enorme', 1.5), L.sizeGeometry('normal', 1.5));
  assert.equal(L.nextSize('normal'), 'narrow');
  assert.equal(L.nextSize('narrow'), 'normal');
  assert.equal(L.nextSize('half'), 'normal');
  assert.equal(L.nextSize('enorme'), 'normal');
});

// M2 — cambiar de tamaño deja fija la esquina de abajo a la derecha y no se sale del área
test('M2 resizeBounds', () => {
  // a un tamaño menor, abajo a la derecha (geometría genérica)
  assert.deepEqual(L.resizeBounds({ x: 936, y: 796, width: 960, height: 236 }, AREA, 480, 140),
    { x: 1416, y: 892, width: 480, height: 140 });
  // y de vuelta: crece hacia arriba y a la izquierda
  assert.deepEqual(L.resizeBounds({ x: 1416, y: 892, width: 480, height: 140 }, AREA, 960, 236),
    { x: 936, y: 796, width: 960, height: 236 });
  // pegada arriba a la izquierda: al crecer se queda dentro
  assert.deepEqual(L.resizeBounds({ x: 10, y: 5, width: 480, height: 140 }, AREA, 960, 236),
    { x: 0, y: 0, width: 960, height: 236 });
  // pantalla secundaria con x negativas
  assert.deepEqual(L.resizeBounds({ x: -1000, y: 100, width: 960, height: 236 }, { x: -1920, y: 0, width: 1920, height: 1040 }, 480, 236),
    { x: -520, y: 100, width: 480, height: 236 });
});

// M3 — dónde arranca: donde se dejó si sigue en una pantalla; si no, abajo a la derecha de la principal
test('M3 startBounds', () => {
  const size = { width: 960, height: 236 };
  const def = { x: 1920 - 960 - 24, y: 1040 - 236 - 8, width: 960, height: 236 };
  assert.deepEqual(L.startBounds({ x: null, y: null }, size, [AREA], AREA), def);
  assert.deepEqual(L.startBounds({ x: 200, y: 300 }, size, [AREA], AREA), { x: 200, y: 300, width: 960, height: 236 });
  // la pantalla donde estaba ya no existe: no se solapa con ninguna
  assert.deepEqual(L.startBounds({ x: 3000, y: 300 }, size, [AREA], AREA), def);
  // asoma por el borde derecho: se mete dentro
  assert.deepEqual(L.startBounds({ x: 1500, y: 300 }, size, [AREA], AREA), { x: 960, y: 300, width: 960, height: 236 });
  // en la secundaria
  const left = { x: -1920, y: 0, width: 1920, height: 1040 };
  assert.deepEqual(L.startBounds({ x: -1500, y: 400 }, size, [AREA, left], AREA), { x: -1500, y: 400, width: 960, height: 236 });
});

// M4 — leer estado.json nunca falla: lo que no vale se queda en su valor por defecto
test('M4 parseState', () => {
  const DEF = { size: 'normal', x: null, y: null };
  assert.deepEqual(S.parseState('{"version":1,"size":"narrow","x":120,"y":-40}'), { size: 'narrow', x: 120, y: -40 });
  assert.deepEqual(S.parseState(''), DEF);
  assert.deepEqual(S.parseState('no es json'), DEF);
  assert.deepEqual(S.parseState('null'), DEF);
  assert.deepEqual(S.parseState('[1,2]'), DEF);
  assert.deepEqual(S.parseState('{"size":"enorme","x":1,"y":2}'), { size: 'normal', x: 1, y: 2 });
  // un estado.json guardado con `half` (antes de D32) arranca en normal y conserva la posición
  assert.deepEqual(S.parseState('{"version":1,"size":"half","x":1416,"y":892}'), { size: 'normal', x: 1416, y: 892 });
  // la posición va entera o no va
  assert.deepEqual(S.parseState('{"size":"narrow","x":1.5,"y":2}'), { size: 'narrow', x: null, y: null });
  assert.deepEqual(S.parseState('{"size":"narrow","x":"1","y":2}'), { size: 'narrow', x: null, y: null });
  assert.deepEqual(S.parseState('{"size":"narrow","x":1}'), { size: 'narrow', x: null, y: null });
});

// M5 — escribir y volver a leer, en una carpeta temporal; sin restos y sin tocar nada más
test('M5 writeState y readState', () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, 'estado.json');
    assert.deepEqual(S.readState(file), { size: 'normal', x: null, y: null }, 'sin fichero');
    S.writeState(file, { size: 'narrow', x: 10, y: 20 });
    assert.deepEqual(S.readState(file), { size: 'narrow', x: 10, y: 20 });
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).version, 1);
    S.writeState(file, { size: 'normal', x: null, y: null });
    assert.deepEqual(S.readState(file), { size: 'normal', x: null, y: null });
    assert.deepEqual(fs.readdirSync(dir), ['estado.json'], 'no deja ficheros temporales');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// M6 — piezas cableadas: estado aparte de config.json, botón, tray, motor con el ancho del tamaño
test('M6 cableado', () => {
  const main = read('main.js');
  assert.match(main, /app\.getPath\('userData'\)/);
  assert.match(main, /estado\.json/);
  assert.doesNotMatch(main, /writeFile\w*\([^)]*config/, 'main.js no escribe config.json');
  assert.match(main, /'size-request'/);
  const pre = read('preload.js');
  assert.match(pre, /size:\s*\(/);
  assert.match(pre, /onSizeRequest:/);
  const html = read('renderer', 'index.html');
  assert.match(html, /<button id="sizeBtn"/);
  assert.match(html, /onButton = \(t\) =>[^\n]*sizeBtn/);
  assert.match(html, /width:\s*geom\.stageW/);
  assert.doesNotMatch(html, /innerHTML|insertAdjacentHTML|outerHTML/);
  assert.match(read('package.json'), /node --check state\.js/);
});
