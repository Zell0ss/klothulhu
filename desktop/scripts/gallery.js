'use strict';
// Galería para Josem (fase 2, T9; fase 5: bocadillo de scroll, D25): lee docs/fase5/capturas/api_smoke.json y escribe galeria.html,
// autocontenido. Cada pregunta con su respuesta y sus escenas pintadas con el motor vendorizado.
// Uso: node desktop/scripts/gallery.js [entrada.json] [salida.html]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESKTOP = path.join(__dirname, '..');
const CAPT = path.join(DESKTOP, '..', 'docs', 'fase5', 'capturas');
const IN = process.argv[2] || path.join(CAPT, 'api_smoke.json');
const OUT = process.argv[3] || path.join(CAPT, 'galeria.html');

const K = require('../renderer/scenes.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function img(scene, alt) {
  const r = M.renderScene(scene, { look: 'pixel', bubble: { lines: K.BUBBLE_LINES }, secondsPerChar: 0.03 });
  if (!r.ok) return `<p class="aviso">El motor no pudo pintarla: ${esc(r.error)}</p>`;
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(r.svg, 'utf8').toString('base64');
  return `<img src="${uri}" alt="${esc(alt)}"><p class="meta">typedAfter ${r.typedAfter.toFixed(1)} s</p>`;
}

const { summary, rows } = JSON.parse(fs.readFileSync(IN, 'utf8'));
const cards = rows.map((row, i) => {
  const beats = row.beats.map(([caption, emotion], j) => {
    const scene = row.scenes[j];
    const fallback = scene ? null : K.sceneFor(emotion, caption);
    return `<figure>${img(scene || fallback, caption)}${
      scene ? '' : '<p class="aviso">Sin escena del director (null): se vería la escena fija de la emoción «' +
        esc(emotion) + '».</p>'}<figcaption><b>${esc(emotion)}</b> · ${esc(caption)}</figcaption></figure>`;
  }).join('');
  const usd = row.cost_usd.narrator + row.cost_usd.director;
  return `<section><h2>${i + 1}. ${esc(row.question)}</h2>
<p class="resp">${esc(row.text)}</p>
<p class="meta">narrador: primer texto ${row.narrator_ms.first_delta} ms · director: ${row.director_ms ?? '—'} ms · $${usd.toFixed(5)}${
    row.error ? ' · <b>ERROR ' + esc(JSON.stringify(row.error)) + '</b>' : ''}</p>
<div class="strip">${beats}</div></section>`;
}).join('\n');

const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>klothulhu · galería de la fase 5</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1c1b22;--mute:#6b6a75;--card:#f3f2f7;--warn:#a15c00}
@media (prefers-color-scheme:dark){:root{--bg:#15141a;--fg:#ececf1;--mute:#9b9aa6;--card:#201f28;--warn:#e0a458}}
body{background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;max-width:980px;margin:0 auto;padding:16px}
section{background:var(--card);border-radius:10px;padding:14px 16px;margin:18px 0}
h1{font-size:1.4rem}h2{font-size:1.05rem;margin:0 0 6px}
.resp{font-size:1.05rem;margin:4px 0}.meta,figcaption{color:var(--mute);font-size:.85rem}
.strip{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}figure{margin:0;flex:1 1 280px;max-width:100%}
img{width:100%;height:auto;border-radius:6px;display:block}.aviso{color:var(--warn);font-size:.85rem;margin:4px 0}
</style>
<h1>klothulhu · galería de la fase 5</h1>
<p class="meta">${summary.questions_run} preguntas · ${summary.beats_total} tramos · ${summary.null_scenes} sin escena ·
gasto $${summary.cost_usd.total.toFixed(4)}${summary.fake ? ' · <b>ENSAYO (fake): no es salida del modelo</b>' : ''}.
Para juzgar la voz (D16) y las escenas (D14).</p>
${cards}
</html>
`;
fs.writeFileSync(OUT, html);
console.log(`escrito ${path.relative(process.cwd(), OUT)} (${(html.length / 1024).toFixed(0)} KB)`);
