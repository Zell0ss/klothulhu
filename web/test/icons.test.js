'use strict';
// Pruebas de H3 (D52): el icono para la pantalla de inicio. Fichero nuevo; las normativas no se tocan.
// Los PNG los genera `desktop/scripts/make-icons.js` (no se ejecuta aquí); estas pruebas solo miran lo que hay en el repo.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const WEB = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(WEB, 'manifest.json'), 'utf8'));

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const FILES = { 'icons/icon-192.png': 192, 'icons/icon-512.png': 512, 'icons/apple-touch-icon.png': 180 };

test('manifest.json: los campos de D52', () => {
  assert.equal(manifest.name, 'Klothulhu');
  assert.equal(manifest.short_name, 'Klothulhu');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#140f0d');
  assert.equal(manifest.theme_color, '#140f0d');
  assert.deepEqual(manifest.icons.map((i) => i.sizes).sort(), ['192x192', '512x512']);
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    assert.equal(icon.purpose, 'any maskable');
    assert.ok(fs.existsSync(path.join(WEB, icon.src)), `el icono ${icon.src} no existe`);
  }
});

test('el fondo y el color del tema del manifest son los de la web', () => {
  const css = fs.readFileSync(path.join(WEB, 'style.css'), 'utf8');
  assert.match(css, new RegExp(`--bg:\\s*${manifest.background_color}`));
  assert.match(html, new RegExp(`<meta name="theme-color" content="${manifest.theme_color}">`));
});

test('cada PNG tiene firma PNG y las dimensiones de su nombre (IHDR)', () => {
  for (const [file, size] of Object.entries(FILES)) {
    const png = fs.readFileSync(path.join(WEB, file));
    assert.ok(png.subarray(0, 8).equals(SIGNATURE), `${file}: firma`);
    assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR', `${file}: IHDR`);
    assert.equal(png.readUInt32BE(16), size, `${file}: ancho`);
    assert.equal(png.readUInt32BE(20), size, `${file}: alto`);
  }
});

test('index.html lleva las tres <link>, con rutas relativas', () => {
  const links = [
    ['manifest', 'manifest.json'],
    ['icon', 'icons/icon-192.png'],
    ['apple-touch-icon', 'icons/apple-touch-icon.png'],
  ];
  for (const [rel, href] of links) {
    const m = html.match(new RegExp(`<link rel="${rel}" href="([^"]+)">`));
    assert.ok(m, `falta <link rel="${rel}">`);
    assert.equal(m[1], href);
    assert.doesNotMatch(m[1], /^(https?:|\/)/, `${rel}: la ruta tiene que ser relativa`);
    assert.ok(fs.existsSync(path.join(WEB, m[1])), `${m[1]} no existe`);
  }
});

test('la CSP tiene manifest-src \'self\' y img-src sigue siendo solo data: (aviso; lo fija W10)', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => d.split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(dir['manifest-src'], ["'self'"]);
  assert.deepEqual(dir['img-src'], ['data:']);
});

// --- el personaje, centrado y dentro del 60 % seguro de los iconos maskable (los recorta Android) ---

// Decodificador mínimo de PNG: 8 bits, sin entrelazado, RGB o RGBA (lo que escribe Chrome). Devuelve {w, h, px(x, y) → [r,g,b]}.
function decodePng(buf) {
  let off = 8; let ihdr = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.subarray(off + 4, off + 8).toString('latin1');
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9], inter: data[12] };
    if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  assert.equal(ihdr.depth, 8); assert.equal(ihdr.inter, 0);
  const bpp = { 2: 3, 6: 4 }[ihdr.color];
  assert.ok(bpp, `tipo de color ${ihdr.color} no soportado en la prueba`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = ihdr.w * bpp;
  const out = Buffer.alloc(ihdr.h * stride);
  for (let y = 0; y < ihdr.h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v;
      if (f === 0) v = cur;
      else if (f === 1) v = cur + a;
      else if (f === 2) v = cur + b;
      else if (f === 3) v = cur + ((a + b) >> 1);
      else {
        const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v = cur + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { w: ihdr.w, h: ihdr.h, px: (x, y) => [out[y * stride + x * bpp], out[y * stride + x * bpp + 1], out[y * stride + x * bpp + 2]] };
}

test('en cada icono el personaje está centrado y dentro del 60 % central, sobre #140f0d', () => {
  for (const [file, size] of Object.entries(FILES)) {
    const img = decodePng(fs.readFileSync(path.join(WEB, file)));
    assert.deepEqual(img.px(0, 0), [0x14, 0x0f, 0x0d], `${file}: la esquina no es el fondo de la web`);
    let x0 = size, y0 = size, x1 = -1, y1 = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const [r, g, b] = img.px(x, y);
        if (r !== 0x14 || g !== 0x0f || b !== 0x0d) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      }
    }
    assert.ok(x1 >= 0, `${file}: no hay personaje`);
    const w = x1 - x0 + 1; const h = y1 - y0 + 1;
    assert.ok(w <= size * 0.6 && h <= size * 0.6, `${file}: el personaje ocupa ${w}x${h} de ${size} (máx. 60 %)`);
    assert.ok(Math.abs((x0 + x1 + 1) / 2 - size / 2) <= 2, `${file}: descentrado en horizontal (${x0}..${x1})`);
    assert.ok(Math.abs((y0 + y1 + 1) / 2 - size / 2) <= 2, `${file}: descentrado en vertical (${y0}..${y1})`);
  }
});
