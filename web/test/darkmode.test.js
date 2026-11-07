'use strict';
// Pruebas de regresión de R2 (H2-revision.md §3, D50): la web ya es oscura y tiene que decirlo, o el modo oscuro
// automático del navegador del móvil la oscurece otra vez (marco y bocadillo de ukiyoe en marrón, colores en negativo).
// Fichero nuevo: `fase9-h1.test.js` es normativa y no se toca.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WEB = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(WEB, 'style.css'), 'utf8');

test('R2: index.html declara <meta name="color-scheme" content="dark"> dentro del <head>', () => {
  const head = html.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(head, 'falta el <head>');
  assert.match(head[1], /<meta\s+name="color-scheme"\s+content="dark"\s*>/);
  // Junto al theme-color, como pide la revisión.
  assert.ok(head[1].indexOf('name="color-scheme"') > head[1].indexOf('name="theme-color"'), 'va después de theme-color');
});

test('R2: style.css declara color-scheme: dark en :root', () => {
  const root = css.match(/:root\s*\{[^}]*\}/);
  assert.ok(root, 'falta la regla :root');
  assert.match(root[0], /color-scheme:\s*dark\s*;/);
});

test('R2: sin prefers-color-scheme: la página ya es oscura, no hay variante clara', () => {
  assert.doesNotMatch(css, /prefers-color-scheme/);
});
