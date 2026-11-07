'use strict';
// Iconos de la web para la pantalla de inicio del móvil (fase 9, H3, D52): klothulhu verde, estilo `pixel`, sobre el
// fondo de la web. Genera web/icons/icon-192.png, icon-512.png y apple-touch-icon.png (180x180) con el motor vendorizado
// y el Chrome headless del servidor. No se ejecuta en las pruebas: los PNG se suben al repo y este script queda para
// regenerarlos si cambia el motor.
// Uso: node desktop/scripts/make-icons.js [carpeta-de-salida]     (CHROME=/ruta/al/chrome si no es /usr/bin/google-chrome)
//
// Cómo se dibuja: el motor no sabe pintar al personaje sin escenario ni sin bocadillo (exige `caption` y siempre dibuja un
// fondo), así que se usa su escena más limpia (`space`, sin partículas ni props, acción `inspect`) y se limpia el SVG que
// devuelve: se quita el bocadillo (`data-part="speech"`), se pone el fondo de la web (#140f0d) en lugar del suyo y se
// recorta un cuadrado centrado en el personaje. Nada se dibuja a mano.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');

const DESKTOP = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(DESKTOP, '..', 'web', 'icons'));
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const BG = '#140f0d';               // el fondo de la web (style.css, --bg)
const HERO_W = 52, HERO_H = 36;     // el sprite de klothulhu: 13x9 celdas de 4 unidades

// Cada tamaño usa una escala entera (px por unidad del motor) para que los píxeles del pixel art salgan iguales y
// nítidos: el lado del recorte es size/scale, y el personaje ocupa HERO_W/(size/scale) del ancho. Maskable: el
// personaje tiene que quedar dentro del 60 % central (Android recorta los iconos en círculo o «squircle»).
const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 2 },          // 54 %
  { file: 'icon-512.png', size: 512, scale: 5 },          // 51 %
  { file: 'apple-touch-icon.png', size: 180, scale: 2 },  // 58 %
];
const SAFE = 0.6;

const A = require('../renderer/avatar.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;

function must(cond, msg) { if (!cond) { console.error(`make-icons: ${msg}`); process.exit(1); } }

// El SVG del personaje, ya limpio, con el héroe y su centro. Se recorta después, por tamaño.
function baseSvg() {
  const scene = {
    backdrop: 'space', palette: {}, hero: { action: 'inspect', from: 50, to: 50, then: 'celebrate' },
    props: [], caption: '.', tone: 'work', particles: { kind: 'stars', density: 0 },
  };
  const r = M.renderScene(scene, {
    look: 'pixel', width: 320, height: 128, secondsPerChar: 0.03, ...A.avatarOptions('klothulhu', M.VOCAB.avatars),
  });
  must(r.ok, `el motor no pudo pintar la escena: ${r.error}`);
  must(M.VOCAB.avatars.includes('klothulhu'), 'el motor no conoce el avatar klothulhu');
  let svg = r.svg.replace(/<g data-part="speech">[\s\S]*?<\/g>/, '');
  must(!svg.includes('data-part="speech"'), 'no se pudo quitar el bocadillo del SVG');
  const own = /style="display:block;background:(#[0-9a-f]{6})"/.exec(svg);
  must(own, 'no encuentro el fondo del motor');
  svg = svg.split(own[1]).join(BG);
  const hero = /<g transform="translate\(([\d.]+) ([\d.]+)\)">/.exec(svg);
  must(hero, 'no encuentro al héroe en el SVG');
  return { svg, cx: Number(hero[1]) + HERO_W / 2, cy: Number(hero[2]) + HERO_H / 2 };
}

function cropped(base, size, scale) {
  const side = size / scale;
  must(HERO_W / side <= SAFE, `${size}px: el personaje ocupa ${(100 * HERO_W / side).toFixed(0)} %, más del 60 % seguro`);
  const x0 = base.cx - side / 2, y0 = base.cy - side / 2;
  const open = /<svg [^>]*>/.exec(base.svg);
  must(open && /viewBox="0 0 320 128" width="320" height="128"/.test(open[0]), 'el <svg> del motor ha cambiado de forma');
  const tag = open[0].replace('viewBox="0 0 320 128" width="320" height="128"', `viewBox="${x0} ${y0} ${side} ${side}" width="${size}" height="${size}"`);
  return base.svg.replace(open[0], tag);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const base = baseSvg();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'make-icons-'));
  const port = 9340 + (process.pid % 100);
  // Sin TMPDIR para Chrome: crea un socket en esa carpeta y falla si la ruta es larga («Socket path too long», > 107).
  const env = { ...process.env };
  delete env.TMPDIR;
  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, 'about:blank'], { env, stdio: ['ignore', 'ignore', process.env.DEBUG_ICONS ? 'inherit' : 'ignore'] });
  chrome.on('error', (e) => { console.error(`make-icons: ${CHROME}: ${e.message}`); });
  try {
    let page = null;
    for (let i = 0; i < 60 && !page; i++) {
      try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { /* aún no */ }
      if (!page) await sleep(250);
    }
    must(page, `no arranca ${CHROME}`);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    await send('Page.enable');

    for (const { file, size, scale } of ICONS) {
      const svg = cropped(base, size, scale);
      // El SVG va en línea (no como <img>) para poder parar sus animaciones: `inspect` oscila ±8 unidades con el tiempo, y
      // el fotograma que saliera dependería de cuándo se hiciera la captura. En t=0 el héroe está centrado.
      const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${BG}}svg{display:block}</style>${svg}`;
      await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html, 'utf8').toString('base64') });
      await sleep(600);
      const paused = await send('Runtime.evaluate', { expression: 'const s = document.querySelector("svg"); s.pauseAnimations(); s.setCurrentTime(0); s.getCurrentTime()', returnByValue: true });
      must(paused.result?.result?.value === 0, `${file}: no se pudieron parar las animaciones del SVG`);
      await sleep(200);
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
      const png = Buffer.from(shot.result.data, 'base64');
      must(png.readUInt32BE(16) === size && png.readUInt32BE(20) === size, `${file}: salió de ${png.readUInt32BE(16)}x${png.readUInt32BE(20)}, no de ${size}x${size}`);
      fs.writeFileSync(path.join(OUT, file), png);
      console.log(`escrito ${path.relative(process.cwd(), path.join(OUT, file))} (${size}x${size}, ${png.length} B)`);
    }
    ws.close();
  } finally {
    // Esperar a que Chrome muera antes de borrar su perfil: si no, sigue escribiendo y el borrado falla (ENOTEMPTY).
    const gone = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await Promise.race([gone, sleep(3000)]);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* es solo una carpeta temporal */ }
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
