#!/usr/bin/env node
'use strict';
// Servidor SOLO PARA PROBAR el cliente web (fase 9, D50). Hace lo mismo que deploy/nginx-klothulhu-web.conf:
//   /            -> web/
//   /shared/     -> desktop/renderer/            /shared/sse-client.js -> desktop/sse-client.js
//   /api/…       -> un servidor de DESARROLLO de klothulhu (--api host:puerto), sin búfer para el SSE
// Sin dependencias. Escucha en 127.0.0.1:5858; `--host 0.0.0.0` lo abre (no lo hagas fuera de pruebas).
//   node web/dev-server.js --api 127.0.0.1:8766 [--host 127.0.0.1] [--port 5858]
// No es producción y no hay que desplegarlo: la web real la sirve nginx.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const WEB = __dirname;
const DESKTOP = path.join(WEB, '..', 'desktop');

function parseArgs(argv) {
  const o = { host: '127.0.0.1', port: 5858, api: '127.0.0.1:8766' };
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!['--host', '--port', '--api'].includes(k) || v === undefined) throw new Error(`argumento no válido: ${k}`);
    o[k.slice(2)] = k === '--port' ? Number(v) : v;
  }
  // Acepta también «esquema://host:puerto»: solo importa host y puerto.
  const [apiHost, apiPort] = o.api.replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '').split(':');
  return { host: o.host, port: o.port, apiHost, apiPort: Number(apiPort) || 80 };
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// Solo ficheros dentro de `dir`; nada de subir con «..» ni de listar carpetas (como nginx sin autoindex).
function sendFile(res, dir, rel) {
  const full = path.resolve(dir, rel);
  if (full !== dir && !full.startsWith(dir + path.sep)) return notFound(res);
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(full).pipe(res);
  });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404');
}

function createServer({ apiHost, apiPort }) {
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(req.url.split('?')[0]); } catch { return notFound(res); }

    if (pathname.startsWith('/api/')) {
      // /api/chat -> /chat; las cabeceras (Authorization) y el cuerpo pasan tal cual.
      const up = http.request({
        host: apiHost, port: apiPort, method: req.method, path: pathname.slice(4) + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''),
        headers: { ...req.headers, host: `${apiHost}:${apiPort}`, connection: 'close' },
      }, (upRes) => {
        res.writeHead(upRes.statusCode, upRes.headers);
        res.flushHeaders();
        upRes.on('data', (chunk) => res.write(chunk));   // trozo a trozo: el SSE no espera a llenar un búfer
        upRes.on('end', () => res.end());
        upRes.on('error', () => res.destroy());
      });
      up.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      res.on('close', () => up.destroy());   // el navegador cortó (otra pregunta): se corta también aquí
      req.pipe(up);
      return;
    }
    if (pathname === '/shared/sse-client.js') return sendFile(res, DESKTOP, 'sse-client.js');
    if (pathname.startsWith('/shared/')) return sendFile(res, path.join(DESKTOP, 'renderer'), pathname.slice('/shared/'.length));
    return sendFile(res, WEB, pathname === '/' ? 'index.html' : pathname.slice(1));
  });
}

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  createServer(opts).listen(opts.port, opts.host, () => {
    console.log(`klothulhu web (pruebas): ${opts.host}:${opts.port}  ->  api ${opts.apiHost}:${opts.apiPort}`);
  });
}

module.exports = { createServer, parseArgs };
