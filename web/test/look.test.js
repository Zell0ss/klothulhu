'use strict';
// Pruebas de regresión de H2 (D51): el estilo del motor se elige en la barra del móvil.
// Fichero nuevo: `fase9-h1.test.js` es normativa y no se toca.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WEB = path.join(__dirname, '..');
const DESKTOP = path.join(WEB, '..', 'desktop');

const core = require(path.join(WEB, 'webcore.js'));
const K = require(path.join(DESKTOP, 'renderer', 'scenes.js'));
const A = require(path.join(DESKTOP, 'renderer', 'avatar.js'));

// El motor, cargado como lo hace la normativa (un contexto de vm; por eso los arrays son «de otro contexto»).
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;

const LOOKS = ['pixel', 'ukiyoe', 'kamon'];

test('LOOK_KEY es la clave de localStorage del estilo', () => {
  assert.equal(core.LOOK_KEY, 'klothulhu.look');
});

test('pickLook devuelve el estilo guardado si el motor lo tiene', () => {
  assert.equal(core.pickLook('ukiyoe', LOOKS, 'pixel'), 'ukiyoe');
  assert.equal(core.pickLook('pixel', LOOKS, 'kamon'), 'pixel');
});

test('pickLook cae al fallback con cualquier otra cosa, sin lanzar', () => {
  for (const stored of [null, undefined, '', 'inexistente', 42, {}, ['ukiyoe'], true]) {
    assert.equal(core.pickLook(stored, LOOKS, 'pixel'), 'pixel', `stored=${String(stored)}`);
  }
  for (const looks of [undefined, null, 'ukiyoe', 42, {}, { 0: 'ukiyoe', length: 1 }]) {
    assert.equal(core.pickLook('ukiyoe', looks, 'pixel'), 'pixel', `looks=${JSON.stringify(looks)}`);
  }
  // Un estilo que el motor ya no tiene no se cuela por prototipo ni por subcadena.
  assert.equal(core.pickLook('toString', LOOKS, 'pixel'), 'pixel');
  assert.equal(core.pickLook('uki', LOOKS, 'pixel'), 'pixel');
});

test('pickLook con el VOCAB.looks real del motor', () => {
  assert.equal(core.pickLook('ukiyoe', M.VOCAB.looks, M.VOCAB.defaults.look), 'ukiyoe');
  for (const look of M.VOCAB.looks) assert.equal(core.pickLook(look, M.VOCAB.looks, 'x'), look);
  assert.equal(core.pickLook('nada', M.VOCAB.looks, M.VOCAB.defaults.look), M.VOCAB.defaults.look);
});

// W2 ampliada: la normativa la prueba solo con `pixel`; aquí, con cada estilo del motor (D51).
test('W2+: el motor pinta a 320 y a 640 con cada estilo, los dos avatares y cada emoción', () => {
  assert.ok(M.VOCAB.looks.length >= 11, 'el motor tiene al menos los 11 estilos de hoy');
  const scenes = [...K.EMOTIONS, 'thinking', 'idle'].map((kind) => K.sceneFor(kind, 'Hola, mortal. ¿Qué quieres de mí?'));
  for (const look of M.VOCAB.looks) {
    for (const width of [320, 640]) {
      for (const avatar of A.AVATARS) {
        for (const scene of scenes) {
          const r = M.renderScene(scene, {
            look, width, height: 128, bubble: { lines: K.BUBBLE_LINES },
            secondsPerChar: M.VOCAB.defaults.secondsPerChar, ...A.avatarOptions(avatar, M.VOCAB.avatars),
          });
          // Los avisos sí se permiten (props-not-drawn en los 3D es lo esperado); un fallo, no.
          assert.equal(r.ok, true, `${look} ${width}px ${avatar} ${scene.emotion || scene.kind || ''}: ${r.error}`);
        }
      }
    }
  }
});

// El HTML trae el selector vacío; las opciones las crea app.js desde VOCAB.looks (nunca una lista a mano).
test('index.html tiene #lookSel vacío dentro de #bar, con etiqueta accesible', () => {
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  const m = html.match(/<select id="lookSel"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(m, 'falta <select id="lookSel">');
  assert.match(m[0], /aria-label="Estilo"/);
  assert.equal(m[1].trim(), '', 'las opciones no se escriben a mano');
  assert.ok(html.indexOf('id="lookSel"') > html.indexOf('id="bar"'), '#lookSel va en #bar');
});

test('app.js crea las opciones desde VOCAB.looks sin innerHTML y cita D51', () => {
  const src = fs.readFileSync(path.join(WEB, 'app.js'), 'utf8');
  assert.match(src, /VOCAB\.looks/);
  assert.match(src, /createElement\('option'\)/);
  assert.match(src, /D51/);
  assert.doesNotMatch(src, /innerHTML/);
  for (const look of M.VOCAB.looks.filter((l) => l !== 'pixel')) {
    assert.doesNotMatch(src, new RegExp(`['"]${look}['"]`), `app.js no escribe «${look}» a mano`);
  }
});

test('style.css: el selector de estilo tiene zona táctil de 40 px', () => {
  const css = fs.readFileSync(path.join(WEB, 'style.css'), 'utf8');
  const rule = css.match(/#lookSel\s*\{[^}]*\}/);
  assert.ok(rule, 'falta la regla de #lookSel');
  assert.match(rule[0], /min-height:\s*40px/);
});
