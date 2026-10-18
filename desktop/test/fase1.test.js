'use strict';
// Pruebas normativas de la fase 1 (docs/fase1/PLAN.md, D10-D12). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const K = require('../renderer/scenes.js');
const VENDOR = path.join(DESKTOP, 'renderer', 'vendor');
const IIFE = path.join(VENDOR, 'fables-motor.iife.js');

function loadMotor() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(IIFE, 'utf8'), ctx);
  return ctx.FablesMotor;
}
const M = loadMotor();
const KINDS = [...K.EMOTIONS, 'thinking', 'idle'];
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// P1 — frases cortas del mismo tramo se juntan
test('P1 beats junta frases cortas del mismo tramo', () => {
  assert.deepEqual(K.beats('Hola.   Qué tal.', [{ at: 0, emotion: 'happy' }]),
    [{ caption: 'Hola. Qué tal.', emotion: 'happy' }]);
  assert.deepEqual(K.beats('', [{ at: 0, emotion: 'happy' }]), []);
  assert.deepEqual(K.beats('Sin marcas.', []), [{ caption: 'Sin marcas.', emotion: 'neutral' }]);
});

// P2 — ningún caption pasa de CAPTION_MAX y no se pierden palabras
test('P2 beats respeta CAPTION_MAX y conserva las palabras', () => {
  assert.equal(K.CAPTION_MAX, 70);
  const text = 'No tengo reloj, mortal, solo eternidad. Pero Tokio va siete horas por delante de Madrid en verano, ' +
    'y eso lo sabe hasta el más torpe de mis sectarios aunque lo niegue. ¿Algo más?';
  const out = K.beats(text, [{ at: 0, emotion: 'smug' }]);
  assert.ok(out.length >= 3);
  for (const b of out) {
    assert.ok(b.caption.length > 0 && b.caption.length <= K.CAPTION_MAX, b.caption);
    assert.equal(b.emotion, 'smug');
    assert.equal(b.caption, b.caption.trim());
  }
  assert.equal(out.map((b) => b.caption).join(' '), norm(text));
  assert.deepEqual(K.beats('x'.repeat(100), []).map((b) => b.caption), ['x'.repeat(70), 'x'.repeat(30)]);
});

// P3 — las marcas de emoción parten tramos y nunca se juntan entre sí
test('P3 beats no junta frases de emociones distintas', () => {
  const text = 'Los astros duermen. Pero yo no.';
  const at = text.indexOf('Pero');
  assert.deepEqual(K.beats(text, [{ at: 0, emotion: 'confused' }, { at, emotion: 'smug' }]), [
    { caption: 'Los astros duermen.', emotion: 'confused' },
    { caption: 'Pero yo no.', emotion: 'smug' },
  ]);
  assert.deepEqual(K.beats('Antes. Después.', [{ at: 7, emotion: 'happy' }]), [
    { caption: 'Antes.', emotion: 'neutral' },
    { caption: 'Después.', emotion: 'happy' },
  ]);
});

// P4 — toda la puesta en escena es válida: el motor la pinta sin corregir nada
// (H1-revision §2.1: los arrays del motor viven en el reino de vm; se copian antes de comparar)
test('P4 STAGING pinta sin correcciones en pixel y en un estilo 3D', () => {
  for (const kind of KINDS) assert.ok(K.STAGING[kind], `falta STAGING.${kind}`);
  for (const kind of KINDS) {
    const scene = K.sceneFor(kind, 'Los astros aplauden, sectario.');
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look });
      assert.equal(r.ok, true, `${kind}/${look}: ${r.error}`);
      assert.deepEqual([...r.warnings], [], `${kind}/${look}`);
      assert.equal(r.scene.caption, scene.caption);
      assert.equal(r.scene.backdrop, scene.backdrop);
      assert.deepEqual({ ...r.scene.hero }, { ...scene.hero });
      assert.equal(r.scene.tone, scene.tone);
      assert.deepEqual([...r.scene.props], []);
      if (scene.particles) assert.deepEqual({ ...r.scene.particles }, { ...scene.particles });
    }
  }
});

// P5 — sceneFor: tipo desconocido cae a neutral; opts.tone manda
test('P5 sceneFor', () => {
  assert.deepEqual(K.sceneFor('nope', 'Hola.'), K.sceneFor('neutral', 'Hola.'));
  assert.equal(K.sceneFor('happy', 'Hola.', { tone: 'trouble' }).tone, 'trouble');
  assert.equal(K.sceneFor('happy', 'Hola.').caption, 'Hola.');
});

// P6 — readMs reproduce la fórmula de upstream más la espera de la burbuja
test('P6 readMs', () => {
  const c40 = 'x'.repeat(40);
  assert.equal(K.readMs(c40, 0.5, true), 500 + 600 + 200 + 1200 + 2000 + 1800);
  assert.equal(K.readMs(c40, 0, false), 200 + 1200 + 2000 + 1800);
});

// P7 — las emociones del cliente son las del servidor, en el mismo orden
test('P7 EMOTIONS sincronizadas con server/emotion_parser.py', () => {
  const py = fs.readFileSync(path.join(REPO, 'server', 'emotion_parser.py'), 'utf8');
  const m = py.match(/^EMOTIONS = \(([^)]*)\)/m);
  assert.ok(m, 'no encuentro EMOTIONS en emotion_parser.py');
  assert.deepEqual([...K.EMOTIONS], [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]));
});

// P8 — los textos fijos caben en un caption y los errores usan emociones conocidas
test('P8 LINES', () => {
  const fixed = [K.LINES.boot('Control+Alt+K'), K.LINES.thinking, K.LINES.idle];
  assert.match(K.LINES.boot('Control+Alt+K'), /klothulhu/);
  assert.doesNotMatch(K.LINES.boot('Control+Alt+K'), /Claudthulhu/);
  for (const code of ['unreachable', 'timeout', 'http_401', 'http_409', 'upstream_error', 'stream_broken']) {
    const [emotion, text] = K.LINES.errors[code];
    assert.ok(K.EMOTIONS.includes(emotion), code);
    fixed.push(text);
  }
  for (const t of fixed) assert.ok(t.length > 0 && t.length <= K.CAPTION_MAX, t);
});

// P9 — motor vendorizado: el fichero registrado, con sus licencias, y solo el IIFE (D10)
test('P9 vendor', () => {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(IIFE)).digest('hex');
  assert.ok(fs.readFileSync(path.join(VENDOR, 'VENDOR.md'), 'utf8').includes(sha), 'VENDOR.md no lleva el sha256 del IIFE');
  const head = fs.readFileSync(IIFE, 'utf8').slice(0, 4000);
  assert.match(head, /MIT License/);
  assert.match(head, /SIL Open Font License/);
  assert.equal(fs.existsSync(path.join(VENDOR, 'fables-motor.js')), false);
  assert.equal(M.SCHEMA_VERSION, 3);  // D33: motor v3
});

// P10 — CSP y pintado (D10)
test('P10 CSP y sin innerHTML', () => {
  const html = fs.readFileSync(path.join(DESKTOP, 'renderer', 'index.html'), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(dir['default-src'], ["'none'"]);
  assert.deepEqual(dir['img-src'], ['data:']);
  assert.deepEqual(dir['script-src'].sort(), ["'self'", "'unsafe-inline'"]);
  assert.doesNotMatch(csp, /unsafe-eval|https?:/);
  assert.doesNotMatch(html, /innerHTML/);
  assert.match(html, /<script src="vendor\/fables-motor\.iife\.js"><\/script>/);
  assert.match(html, /<script src="scenes\.js"><\/script>/);
});

// P11 — Electron fijado (D11)
test('P11 electron fijado con lockfile', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies.electron, '44.4.5');
  const lock = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/electron'].version, '44.4.5');
});
