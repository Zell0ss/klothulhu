'use strict';
// Pruebas normativas de la fase 9, H1 (docs/fase9/PLAN.md, D50). No editar: añadir en otro fichero.
// Se copia tal cual a web/test/fase9-h1.test.js y se ejecuta con `cd web && npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WEB = path.join(__dirname, '..');
const REPO = path.join(WEB, '..');
const DESKTOP = path.join(REPO, 'desktop');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const K = require(path.join(DESKTOP, 'renderer', 'scenes.js'));
const A = require(path.join(DESKTOP, 'renderer', 'avatar.js'));
const core = require(path.join(WEB, 'webcore.js'));

const ctx = {};
vm.createContext(ctx);
vm.runInContext(read(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), ctx);
const M = ctx.FablesMotor;

const TOKEN = 'abcd1234efgh5678-secreto';

// Un `storage` de mentira con la forma de localStorage.
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
}

// Un cuerpo SSE como lo da fetch: trozos de texto, y se cierra solo si `end` (si no, espera al abort).
function sseResponse(chunks, { signal, end = true } = {}) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      if (end) c.close();
      else if (signal) signal.addEventListener('abort', () => c.error(new Error('aborted')));
    },
  });
  return { ok: true, status: 200, body };
}

// Instala un fetch falso mientras dura `fn`, y lo devuelve a su sitio.
async function withFetch(impl, fn) {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return impl(url, init, calls); };
  try { await fn(calls); } finally { globalThis.fetch = real; }
}

function newHost(storage, extra = {}) {
  const { createHost } = require(path.join(WEB, 'host.js'));
  return createHost({ storage, sse: require(path.join(DESKTOP, 'sse-client.js')), ...extra });
}

// W1 — geometría de la franja en una pantalla vertical (D50): siempre a todo el ancho
test('W1 webGeometry', () => {
  assert.deepEqual(core.webGeometry(390), { stageW: 320, zoom: 1.21875, width: 390, height: 156 });
  assert.deepEqual(core.webGeometry(430), { stageW: 320, zoom: 1.34375, width: 430, height: 172 });
  assert.deepEqual(core.webGeometry(320), { stageW: 320, zoom: 1, width: 320, height: 128 });
  assert.deepEqual(core.webGeometry(640), { stageW: 640, zoom: 1, width: 640, height: 128 });
  assert.deepEqual(core.webGeometry(844), { stageW: 640, zoom: 844 / 640, width: 844, height: 169 });
  assert.deepEqual(core.webGeometry(390.7), core.webGeometry(390));   // los píxeles CSS fraccionarios se truncan
  for (const bad of [NaN, undefined, 0, -5, Infinity, 'ancho']) {
    assert.deepEqual(core.webGeometry(bad), core.webGeometry(320), String(bad));   // nunca lanza
  }
});

// W2 — el motor pinta a esos anchos, con los dos avatares, sin correcciones ni avisos (D50)
test('W2 el motor cabe en la franja del móvil', () => {
  const scenes = [...K.EMOTIONS, 'thinking', 'idle'].map((kind) => K.sceneFor(kind, 'Hola, mortal. ¿Qué quieres de mí?'));
  for (const vw of [320, 360, 390, 430, 640, 844]) {
    const g = core.webGeometry(vw);
    assert.ok(g.stageW >= 320 && g.stageW <= 1600, 'el motor admite anchos de 320 a 1600');
    for (const avatar of A.AVATARS) {
      for (const scene of scenes) {
        const r = M.renderScene(scene, {
          look: 'pixel', width: g.stageW, height: 128, bubble: { lines: K.BUBBLE_LINES },
          secondsPerChar: M.VOCAB.defaults.secondsPerChar, ...A.avatarOptions(avatar, M.VOCAB.avatars),
        });
        assert.equal(r.ok, true, `${avatar} ${vw}px: ${r.error}`);
        assert.deepEqual([...(r.warnings || [])], [], `${avatar} ${vw}px`);   // el spread: es un array de otro contexto de vm
      }
    }
  }
});

// W3 — la escena de arranque de la web no habla de atajos de teclado que el móvil no tiene (D50)
test('W3 webBoot', () => {
  const items = core.webBoot(K);
  assert.equal(items.length, 2);
  assert.deepEqual(items, K.bootScenes('Control+Alt+K').slice(0, 2));
  for (const it of items) assert.doesNotMatch(it.caption, /Pulsa|Ctrl|Control|Alt/);
});

// W4 — el token se guarda una vez en el móvil; un storage roto no tumba la página (D50)
test('W4 createTokenStore', () => {
  assert.equal(core.TOKEN_KEY, 'klothulhu.token');
  const st = fakeStorage();
  const ts = core.createTokenStore(st);
  assert.equal(ts.get(), '');
  assert.equal(ts.set('corto'), false);                         // el servidor exige 16 como mínimo
  assert.equal(ts.set('tiene espacios dentro 1234567'), false);
  assert.equal(ts.get(), '');
  assert.equal(ts.set(`  ${TOKEN}\n`), true);                   // pegar desde el portapapeles trae espacios y saltos
  assert.equal(ts.get(), TOKEN);
  assert.equal(st.getItem('klothulhu.token'), TOKEN);
  ts.clear();
  assert.equal(ts.get(), '');
  const roto = { getItem() { throw new Error('denegado'); }, setItem() { throw new Error('lleno'); }, removeItem() { throw new Error('x'); } };
  const tr = core.createTokenStore(roto);
  assert.equal(tr.get(), '');
  assert.equal(tr.set(TOKEN), false);
  assert.doesNotThrow(() => tr.clear());
});

// W5 — sse-client.js se carga también como script clásico del navegador, y en Node sigue igual (D50)
test('W5 sse-client en navegador', () => {
  const real = require(path.join(DESKTOP, 'sse-client.js'));
  for (const f of ['streamChat', 'forget', 'parseBlock']) assert.equal(typeof real[f], 'function', f);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(read(DESKTOP, 'sse-client.js'), sandbox);   // sin `module`, como un <script> clásico
  for (const f of ['streamChat', 'forget', 'parseBlock']) assert.equal(typeof sandbox.KlSse?.[f], 'function', `KlSse.${f}`);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.KlSse.parseBlock('event: delta\ndata: {"text":"a"}'))), { event: 'delta', data: { text: 'a' } });   // JSON: es un objeto de otro contexto de vm
});

// W6 — host: ask() por /api/chat con el token en la cabecera, y los eventos en orden (D50)
test('W6 host.ask', async () => {
  const host = newHost(fakeStorage({ 'klothulhu.token': TOKEN }));
  const got = [];
  host.onEvent((e) => got.push(e));
  await withFetch(() => sseResponse([
    'event: emotion\ndata: {"emotion":"happy"}\n\nevent: del',     // un bloque partido entre dos trozos
    'ta\ndata: {"text":"Hola"}\n\nevent: done\ndata: {"reply":"Hola"}\n\n',
  ]), async (calls) => {
    await host.ask('qué tal');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/chat');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
    assert.deepEqual(JSON.parse(calls[0].init.body), { text: 'qué tal' });
    assert.ok(!calls[0].url.includes(TOKEN), 'el token nunca va en la URL');
  });
  assert.deepEqual(got.map((e) => e.type), ['emotion', 'delta', 'done']);
  assert.deepEqual(got[1].data, { text: 'Hola' });
});

// W7 — host: sin token no se llama a la red; con un 401, el token se olvida y se vuelve a pedir (D50)
test('W7 host y el token', async () => {
  // sin token
  const st1 = fakeStorage();
  const h1 = newHost(st1);
  let need1 = 0;
  const ev1 = [];
  h1.onNeedToken(() => { need1++; });
  h1.onEvent((e) => ev1.push(e));
  assert.equal(h1.hasToken(), false);
  await withFetch(() => { throw new Error('no debía llamar'); }, async (calls) => {
    await h1.ask('hola');
    assert.equal(calls.length, 0);
  });
  assert.equal(need1, 1);
  assert.deepEqual(ev1, []);
  // token malo
  const st2 = fakeStorage({ 'klothulhu.token': TOKEN });
  const h2 = newHost(st2);
  let need2 = 0;
  const ev2 = [];
  h2.onNeedToken(() => { need2++; });
  h2.onEvent((e) => ev2.push(e));
  await withFetch(() => ({ ok: false, status: 401 }), async () => { await h2.ask('hola'); });
  assert.deepEqual(ev2, [{ type: 'error', data: { code: 'http_401' } }]);   // el cliente ya sabe pintar este error
  assert.equal(st2.getItem('klothulhu.token'), null);
  assert.equal(h2.hasToken(), false);
  assert.equal(need2, 1);
  // setToken guarda y hasToken lo ve
  assert.equal(h2.setToken('corto'), false);
  assert.equal(h2.setToken(TOKEN), true);
  assert.equal(h2.hasToken(), true);
});

// W8 — host: forget() borra por /api/history y avisa siempre, también si falla (como el tray del escritorio) (D50)
test('W8 host.forget', async () => {
  const host = newHost(fakeStorage({ 'klothulhu.token': TOKEN }));
  let forgotten = 0;
  host.onForgotten(() => { forgotten++; });
  await withFetch(() => ({ ok: true, status: 200, json: async () => ({ cleared: 'konnos' }) }), async (calls) => {
    assert.equal(await host.forget(), true);
    assert.equal(calls[0].url, '/api/history');
    assert.equal(calls[0].init.method, 'DELETE');
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
  });
  assert.equal(forgotten, 1);
  await withFetch(() => { throw new Error('sin red'); }, async () => {
    assert.equal(await host.forget(), false);
  });
  assert.equal(forgotten, 2);
});

// W9 — host: una pregunta nueva corta la anterior y no se cuelan sus eventos (D50, como `ask` de main.js)
test('W9 host.ask corta la anterior', async () => {
  const host = newHost(fakeStorage({ 'klothulhu.token': TOKEN }));
  const got = [];
  host.onEvent((e) => got.push(e));
  let n = 0;
  await withFetch((_url, init) => {
    n++;
    return n === 1
      ? sseResponse(['event: delta\ndata: {"text":"vieja"}\n\n'], { signal: init.signal, end: false })
      : sseResponse(['event: delta\ndata: {"text":"nueva"}\n\nevent: done\ndata: {}\n\n']);
  }, async (calls) => {
    const first = host.ask('uno');
    await new Promise((r) => setTimeout(r, 20));
    await host.ask('dos');
    await first;
    assert.equal(calls[0].init.signal.aborted, true);
  });
  const texts = got.filter((e) => e.type === 'delta').map((e) => e.data.text);
  assert.ok(texts.includes('nueva'));
  assert.ok(!got.some((e) => e.type === 'error'), 'cortar la anterior no es un error');
});

// W10 — la página: CSP estricta sin `unsafe-inline`, móvil, y los módulos compartidos se cargan, no se copian (D50)
test('W10 index.html', () => {
  const html = read(WEB, 'index.html');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => d.split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(dir['default-src'], ["'none'"]);
  assert.deepEqual(dir['script-src'], ["'self'"]);
  assert.deepEqual(dir['style-src'], ["'self'"]);
  assert.deepEqual(dir['img-src'], ['data:']);
  assert.deepEqual(dir['connect-src'], ["'self'"]);
  assert.doesNotMatch(csp, /unsafe-|https?:|\*/);
  assert.match(html, /<meta name="viewport" content="[^"]*width=device-width/);
  assert.match(html, /viewport-fit=cover/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);   // ningún script en línea
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  const compartidos = [
    '/shared/vendor/fables-motor.iife.js', '/shared/scenes.js', '/shared/feed.js', '/shared/convo.js',
    '/shared/avatar.js', '/shared/sse-client.js',
  ];
  for (const s of compartidos) assert.ok(srcs.includes(s), `falta ${s}`);
  const propios = srcs.filter((s) => !s.startsWith('/shared/'));
  assert.ok(propios.length >= 1);
  for (const s of propios) assert.ok(!/^[a-z]+:|^\/\//.test(s), `script externo: ${s}`);
  // los propios, después de los compartidos (necesitan sus globales)
  const lastShared = Math.max(...compartidos.map((s) => srcs.indexOf(s)));
  for (const s of propios) assert.ok(srcs.indexOf(s) > lastShared, `${s} va antes de un módulo compartido`);
  assert.match(html, /<link rel="stylesheet" href="[^":]+">/);
});

// W11 — ningún fichero de la web copia lo compartido, mete HTML a mano, trae URLs externas o lleva el token (D10, D50)
test('W11 higiene de web/', () => {
  const files = fs.readdirSync(WEB).filter((f) => /\.(js|html|css)$/.test(f));
  assert.ok(files.includes('app.js') && files.includes('host.js') && files.includes('webcore.js'));
  for (const f of files) {
    const src = read(WEB, f);
    assert.doesNotMatch(src, /innerHTML|insertAdjacentHTML|outerHTML|document\.write|eval\(|new Function/, f);
    assert.doesNotMatch(src, /https?:\/\//, `${f}: nada de URLs absolutas`);
    for (const name of ['tramos', 'sceneFor', 'bootScenes', 'createFeed', 'createConvo', 'avatarOptions', 'parseBlock', 'streamChat']) {
      assert.doesNotMatch(src, new RegExp(`(function\\s+${name}\\b|(const|let|var)\\s+${name}\\s*=\\s*(async\\s*)?(\\(|function))`), `${f} reimplementa ${name}`);
    }
    assert.doesNotMatch(src, /[?&]token=/, f);
  }
  const pkg = JSON.parse(read(WEB, 'package.json'));
  assert.equal(pkg.private, true);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.scripts.test, 'node --test');
  for (const f of ['webcore.js', 'host.js', 'app.js']) assert.match(pkg.scripts.check, new RegExp(`node --check ${f.replace('.', '\\.')}`), f);
});

// W12 — el sitio de nginx: solo Tailscale, el servidor sin tocar, SSE sin búfer, y solo se sirve lo que debe (D50)
test('W12 nginx', () => {
  const conf = read(REPO, 'deploy', 'nginx-klothulhu-web.conf');
  const code = conf.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(code, /listen 5757;/);
  assert.doesNotMatch(code, /listen\s+(80|0\.0\.0\.0)/);
  const deny = code.indexOf('deny all;');
  assert.ok(deny > 0);
  for (const a of ['allow 100.64.0.0/10;', 'allow fd7a:115c:a1e0::/48;', 'allow 127.0.0.1;', 'allow ::1;']) {
    const i = code.indexOf(a);
    assert.ok(i >= 0 && i < deny, `${a} antes de deny all`);
  }
  assert.match(code, /root \/data\/klothulhu\/web;/);
  const block = (head) => {
    const i = code.indexOf(head);
    assert.ok(i >= 0, `falta ${head}`);
    return code.slice(i, code.indexOf('}', i));
  };
  const api = block('location /api/ {');
  assert.match(api, /proxy_pass http:\/\/100\.87\.64\.121:8765\/;/);   // la barra final quita /api del camino
  assert.match(api, /proxy_buffering off;/);
  assert.match(api, /proxy_http_version 1\.1;/);
  const to = api.match(/proxy_read_timeout (\d+)s;/);
  assert.ok(to && Number(to[1]) >= 60, 'proxy_read_timeout de al menos 60s');
  assert.match(block('location /shared/ {'), /alias \/data\/klothulhu\/desktop\/renderer\/;/);
  assert.match(block('location = /shared/sse-client.js {'), /alias \/data\/klothulhu\/desktop\/sse-client\.js;/);
  // lo que no se debe servir nunca: el repo entero, desktop/ entero, server/, y listados de carpeta
  assert.doesNotMatch(code, /root \/data\/klothulhu\/?;/);
  assert.doesNotMatch(code, /alias \/data\/klothulhu\/?;/);
  assert.doesNotMatch(code, /alias \/data\/klothulhu\/desktop\/?;/);
  assert.doesNotMatch(code, /server\/|config\.json|\.env/);
  assert.doesNotMatch(code, /autoindex on/);
  assert.match(code, /Cache-Control "no-cache"/);
});
