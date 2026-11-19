'use strict';
// Pruebas normativas de la fase 11, H1 (docs/fase11/PLAN.md, D58, D59, D60). No editar: añadir en otro fichero.
// Se copia tal cual a desktop/test/fase11.test.js y se ejecuta con `cd desktop && npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const F = require('../renderer/fuentes.js');
const K = require('../renderer/scenes.js');
const { createConvo } = require('../renderer/convo.js');
const VOCAB = JSON.parse(read(REPO, 'server', 'fables_vocab.json'));

// B1 — fuentes.js: lo que llega en `sources` se filtra antes de pintarlo (D60)
test('B1 normalizar', () => {
  assert.equal(F.MAX, 5);
  assert.equal(F.host('https://www.aemet.es/x?y=1'), 'aemet.es');
  assert.equal(F.host('no es una url'), '');
  for (const ok of ['https://a.es/', 'http://b.org/x']) assert.equal(F.esSegura(ok), true, ok);
  for (const malo of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x', '', null, 42, 'https//x']) {
    assert.equal(F.esSegura(malo), false, String(malo));
  }
  const items = [
    { title: 'AEMET', url: 'https://www.aemet.es/x' },
    { title: 'AEMET otra vez', url: 'https://www.aemet.es/x' },   // repetida: fuera
    { title: 'mal', url: 'javascript:alert(1)' },                  // no es http(s): fuera
    { title: '', url: 'http://eltiempo.es/m' },                    // sin título: el dominio
    { url: 'https://c.com/' },
    'basura', null,
  ];
  assert.deepEqual(F.normalizar(items), [
    { title: 'AEMET', url: 'https://www.aemet.es/x', host: 'aemet.es' },
    { title: 'eltiempo.es', url: 'http://eltiempo.es/m', host: 'eltiempo.es' },
    { title: 'c.com', url: 'https://c.com/', host: 'c.com' },
  ]);
  const muchas = Array.from({ length: 8 }, (_, i) => ({ title: 'x', url: `https://s${i}.org/` }));
  assert.equal(F.normalizar(muchas).length, 5);
  assert.deepEqual(F.normalizar(undefined), []);
  assert.deepEqual(F.normalizar({ items: 1 }), []);
});

// B2 — el historial guarda las fuentes con la respuesta, y solo si las hay (D54, D60)
test('B2 convo con fuentes', () => {
  const c = createConvo();
  c.add('user', '¿Llueve?');
  const src = [{ title: 'AEMET', url: 'https://aemet.es/x', host: 'aemet.es' }];
  c.hold('Llueve, mortal.', src);
  assert.equal(c.entries().length, 1);         // D54: espera a que acabe la escena
  assert.equal(c.release(), true);
  assert.deepEqual(c.entries()[1], { role: 'klothulhu', text: 'Llueve, mortal.', sources: src });
  c.hold('Sin buscar.');
  c.release();
  assert.deepEqual(c.entries()[2], { role: 'klothulhu', text: 'Sin buscar.' });   // sin clave `sources`
  c.hold('Tampoco.', []);
  c.release();
  assert.deepEqual(c.entries()[3], { role: 'klothulhu', text: 'Tampoco.' });
  // entries() devuelve copias: tocar lo devuelto no cambia el historial
  c.entries()[1].sources.push({ title: 'x', url: 'https://x.org/', host: 'x.org' });
  assert.equal(c.entries()[1].sources.length, 1);
});

// B3 — la escena de «buscando» existe, se distingue de «pensando» y el motor la conoce (D60)
test('B3 escena searching', () => {
  assert.equal(typeof K.LINES.searching, 'string');
  assert.ok(K.LINES.searching.length > 0 && K.LINES.searching.length <= K.CAPTION_MAX);
  assert.notEqual(K.LINES.searching, K.LINES.thinking);
  const s = K.STAGING.searching;
  assert.ok(s, 'falta STAGING.searching');
  assert.ok(VOCAB.backdrops.includes(s.backdrop), s.backdrop);
  assert.ok(VOCAB.actions.includes(s.hero.action), s.hero.action);
  if (s.particles) assert.ok(VOCAB.particles.includes(s.particles.kind), s.particles.kind);
  const scene = K.sceneFor('searching', K.LINES.searching);
  assert.equal(scene.caption, K.LINES.searching);
  assert.equal(scene.backdrop, s.backdrop);
});

// B4 — los dos clientes atienden los eventos nuevos, cargan fuentes.js y abren los enlaces con cuidado
test('B4 clientes', () => {
  const desk = read(DESKTOP, 'renderer', 'index.html');
  const web = read(REPO, 'web', 'app.js');
  for (const [nombre, src] of [['escritorio', desk], ['web', web]]) {
    assert.match(src, /['"]searching['"]/, `${nombre}: no atiende searching`);
    assert.match(src, /['"]sources['"]/, `${nombre}: no atiende sources`);
    assert.match(src, /KlFuentes\.normalizar\(/, `${nombre}: no filtra las fuentes`);
    assert.doesNotMatch(src, /innerHTML/, `${nombre}: innerHTML (D10)`);
  }
  assert.match(desk, /<script src="fuentes\.js"><\/script>/);
  assert.match(read(REPO, 'web', 'index.html'), /<script src="\/shared\/fuentes\.js"><\/script>/);
  assert.match(read(DESKTOP, 'package.json'), /node --check renderer\/fuentes\.js/);
  // web: enlace normal, en pestaña nueva y sin dar acceso a la página
  assert.match(web, /noopener noreferrer/);
  // escritorio: el renderer pide abrir; main valida y abre en el navegador, y la ventana nunca navega
  assert.match(read(DESKTOP, 'preload.js'), /openExternal: \(url\) =>/);
  const main = read(DESKTOP, 'main.js');
  assert.match(main, /shell\.openExternal\(/);
  assert.match(main, /esSegura\(/);
  assert.match(main, /setWindowOpenHandler\(/);
  assert.match(main, /will-navigate/);
});
