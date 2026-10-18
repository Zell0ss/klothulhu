'use strict';
// Pruebas normativas de la fase 6, H3 (docs/fase6/H3-encargo.md, D29). No editar: añadir en otro fichero.
// Versión 2 (docs/fase6/H2-encargo.md, D29, D30): la escena 2 se alza con `emerge` en lugar de `approach`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const K = require('../renderer/scenes.js');

const DESKTOP = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;
const HOTKEY = 'Control+Alt+K';

// L1 — el arranque son tres escenas, en este orden: dormido, despierta enfadado, la ayuda
test('L1 bootScenes: tres escenas y su papel', () => {
  const items = K.bootScenes(HOTKEY);
  assert.equal(items.length, 3);
  for (const it of items) {
    assert.ok(K.EMOTIONS.includes(it.kind), `kind ${it.kind}`);
    assert.equal(it.caption, it.scene.caption);
  }
  const [dormido, despierta, ayuda] = items.map((it) => it.scene);
  assert.equal(dormido.hero.action, 'sleep');
  assert.equal(despierta.hero.action, 'emerge');
  assert.equal(despierta.hero.then, 'angry');
  assert.equal(despierta.tone, 'trouble');
  assert.match(despierta.caption, /KLOTHULHU DESPIERTA/);
  assert.equal(ayuda.caption, K.LINES.boot(HOTKEY));
  assert.equal(ayuda.backdrop, despierta.backdrop, 'la ayuda no cambia de fondo');
  assert.deepEqual(ayuda.palette, despierta.palette);
});

// L2 — el motor pinta las tres sin corregir nada, en pixel y en un estilo 3D
test('L2 bootScenes pinta sin correcciones', () => {
  for (const { scene } of K.bootScenes(HOTKEY)) {
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look, bubble: { lines: K.BUBBLE_LINES }, secondsPerChar: 0.03 });
      assert.equal(r.ok, true, `${scene.caption}/${look}: ${r.error}`);
      assert.deepEqual([...r.warnings], [], `${scene.caption}/${look}`);
      assert.equal(r.scene.caption, scene.caption);
      assert.equal(r.scene.backdrop, scene.backdrop);
      assert.deepEqual({ ...r.scene.hero }, { ...scene.hero });
      assert.deepEqual({ ...r.scene.palette }, { ...(scene.palette || {}) });
      assert.equal(r.scene.tone, scene.tone);
      if (scene.particles) assert.deepEqual({ ...r.scene.particles }, { ...scene.particles });
    }
  }
});

// L3 — la ayuda sigue diciendo quién es y cómo hablarle (P8), sin repetir el grito
test('L3 LINES.boot', () => {
  const s = K.LINES.boot(HOTKEY);
  assert.match(s, /klothulhu/);
  assert.match(s, /Ctrl\+Alt\+K/);
  assert.doesNotMatch(s, /despierta/i);
  assert.ok(s.length <= K.CAPTION_MAX);
});

// L4 — cada llamada da objetos nuevos: retocar una escena no toca la siguiente
test('L4 bootScenes no comparte estado', () => {
  const a = K.bootScenes(HOTKEY);
  a[1].scene.hero.action = 'walk';
  a[1].scene.palette.sky = '#000000';
  const b = K.bootScenes(HOTKEY);
  assert.equal(b[1].scene.hero.action, 'emerge');
  assert.notEqual(b[1].scene.palette.sky, '#000000');
});

// L5 — el renderer arranca con bootScenes
test('L5 index.html encola bootScenes al arrancar', () => {
  const html = fs.readFileSync(path.join(DESKTOP, 'renderer', 'index.html'), 'utf8');
  assert.match(html, /enqueue\(\s*bootScenes\(\s*cfg\.hotkey\s*\)\s*\)/);
  assert.doesNotMatch(html, /kind:\s*'happy',\s*caption:\s*LINES\.boot/);
});
