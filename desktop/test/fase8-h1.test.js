'use strict';
// Pruebas normativas de la fase 8, H1 (docs/fase8/PLAN.md, D49). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const K = require('../renderer/scenes.js');
const A = require('../renderer/avatar.js');
const S = require('../state.js');

const DESKTOP = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;
const KINDS = [...K.EMOTIONS, 'thinking', 'idle'];

// V1 — el motor de la fase 4 de claude-fables: dos avatares, el mismo esquema de escena (D49)
test('V1 motor con avatares', () => {
  assert.equal(M.SCHEMA_VERSION, 3);
  assert.deepEqual([...A.AVATARS], ['claude', 'klothulhu']);
  assert.deepEqual([...M.VOCAB.avatars], [...A.AVATARS]);   // el cliente y el motor, de acuerdo (como P7)
  assert.equal(M.VOCAB.defaults.avatar, 'claude');
  const [lo, hi] = M.VOCAB.limits.maxBytes;
  assert.ok(lo <= A.MAX_BYTES_KLOTHULHU && A.MAX_BYTES_KLOTHULHU <= hi);
  assert.equal(M.renderScene(K.sceneFor('happy', 'Hola.'), { avatar: 'cthulhu' }).ok, false);
});

// V2 — las opciones de pintado de cada avatar; el naranja, sin ninguna (fables A8: su SVG no cambia)
test('V2 avatarOptions', () => {
  assert.equal(A.MAX_BYTES_KLOTHULHU, 400000);
  const av = M.VOCAB.avatars;
  assert.deepEqual(A.avatarOptions('klothulhu', av), { avatar: 'klothulhu', maxBytes: 400000 });
  assert.deepEqual(A.avatarOptions('claude', av), {});
  assert.deepEqual(A.avatarOptions('cthulhu', av), {});
  assert.deepEqual(A.avatarOptions(undefined, av), {});
  assert.deepEqual(A.avatarOptions('klothulhu', ['claude']), {});   // un motor sin klothulhu: el naranja
});

// V3 — klothulhu pinta toda la puesta en escena sin correcciones, en pixel y en un estilo 3D, y cabe (D49)
test('V3 STAGING con klothulhu', () => {
  const opts = A.avatarOptions('klothulhu', M.VOCAB.avatars);
  for (const kind of KINDS) {
    const scene = K.sceneFor(kind, "Ph'nglui mglw'nafh, mortal.");
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look, ...opts });
      assert.equal(r.ok, true, `${kind}/${look}: ${r.error}`);
      assert.deepEqual([...r.warnings], [], `${kind}/${look}`);
      assert.deepEqual({ ...r.scene.hero }, { ...scene.hero }, `${kind}/${look}`);
      assert.ok(Buffer.byteLength(r.svg) <= A.MAX_BYTES_KLOTHULHU, `${kind}/${look}: ${Buffer.byteLength(r.svg)} bytes`);
    }
  }
});

// V4 — el naranja de siempre: pasar sus opciones no cambia ni un byte
test('V4 claude idéntico', () => {
  const scene = K.sceneFor('smug', 'Mortal.');
  for (const look of ['pixel', 'ukiyoe']) {
    const base = M.renderScene(scene, { look });
    const con = M.renderScene(scene, { look, ...A.avatarOptions('claude', M.VOCAB.avatars) });
    assert.equal(con.svg, base.svg, look);
  }
});

// V5 — estado.json guarda el avatar sin cambiar lo que ya leía (M4 y M5 de la fase 6 siguen valiendo)
test('V5 avatar en estado.json', () => {
  const av = A.AVATARS;
  const lleno = '{"version":1,"size":"narrow","x":1,"y":2,"avatar":"klothulhu"}';
  assert.equal(S.parseAvatar(lleno, av), 'klothulhu');
  assert.deepEqual(S.parseState(lleno), { size: 'narrow', x: 1, y: 2 });
  for (const t of ['', 'no es json', 'null', '[1]', '{"size":"normal"}', '{"avatar":"cthulhu"}', '{"avatar":7}']) {
    assert.equal(S.parseAvatar(t, av), 'claude', t);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kl-f8-'));
  try {
    const file = path.join(dir, 'estado.json');
    assert.equal(S.readAvatar(file, av), 'claude', 'sin fichero');
    S.writeState(file, { size: 'narrow', x: 10, y: 20, avatar: 'klothulhu' });
    assert.deepEqual(S.readState(file), { size: 'narrow', x: 10, y: 20 });
    assert.equal(S.readAvatar(file, av), 'klothulhu');
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).version, 1);
    S.writeState(file, { size: 'normal', x: null, y: null });   // sin avatar: queda el de por defecto
    assert.equal(S.readAvatar(file, av), 'claude');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
