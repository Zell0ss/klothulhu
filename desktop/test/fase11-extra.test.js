'use strict';
// Pruebas del programador de la fase 11, H1 (D60). Las normativas son fase11.test.js; estas miran lo que ellas
// no: que main.js rechace una URL no segura en 'open-external' (con Electron sustituido) y el enganche en los clientes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const DESKTOP = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

// Carga main.js con un Electron de mentira: recoge los manejadores IPC y apunta qué se abre.
function cargarMain() {
  const handlers = {};
  const abiertas = [];
  const fake = {
    app: { requestSingleInstanceLock: () => false, quit() {}, on() {}, whenReady: () => new Promise(() => {}) },
    ipcMain: { handle: (n, f) => { handlers[n] = f; }, on() {} },
    shell: { openExternal: async (u) => { abiertas.push(u); } },
    BrowserWindow: class {}, screen: {}, Tray: class {}, Menu: {}, nativeImage: {}, globalShortcut: {},
    dialog: {}, clipboard: {},
  };
  const load = Module._load;
  Module._load = function (request, ...rest) {
    return request === 'electron' ? fake : load.call(this, request, ...rest);
  };
  const mainPath = path.join(DESKTOP, 'main.js');
  delete require.cache[mainPath];
  try { require(mainPath); } finally { Module._load = load; delete require.cache[mainPath]; }
  return { handlers, abiertas };
}

test('X1 open-external abre solo http(s)', async () => {
  const { handlers, abiertas } = cargarMain();
  const abrir = handlers['open-external'];
  assert.equal(typeof abrir, 'function');
  for (const malo of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x', 'ftp://x.org/', '', null, undefined, 42, {}, 'no es url']) {
    assert.equal(await abrir({}, malo), false, String(malo));
  }
  assert.deepEqual(abiertas, []);
  assert.equal(await abrir({}, 'https://aemet.es/x'), true);
  assert.equal(await abrir({}, 'http://eltiempo.es/'), true);
  assert.deepEqual(abiertas, ['https://aemet.es/x', 'http://eltiempo.es/']);
});

test('X2 los dos clientes usan fuentes en el orden bueno', () => {
  for (const src of [read(DESKTOP, 'renderer', 'index.html'), read(DESKTOP, '..', 'web', 'app.js')]) {
    // el aviso solo pinta si se está esperando; las fuentes se vacían al preguntar y entran al historial con hold
    assert.match(src, /type === 'searching'\) \{[^}]*phase === 'thinking'\) play\(\{ kind: 'searching'/);
    assert.match(src, /fuentes = \[\]; consultadas = false; (awaiting = true|setAwaiting\(true\))/);
    assert.match(src, /convo\.hold\(reply, fuentes, consultadas\)/);
    assert.match(src, /textContent = s\.host/);
  }
  assert.match(read(DESKTOP, 'renderer', 'index.html'), /kl\.openExternal\(s\.url\)/);
  assert.match(read(DESKTOP, '..', 'web', 'app.js'), /a\.target = '_blank'/);
});
