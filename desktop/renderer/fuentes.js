(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlFuentes = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Las fuentes que cita klothulhu al buscar en la web (fase 11, D60). Pura: sin DOM ni red. Se carga en el
  // renderer, en la web (/shared/), en main.js y desde las pruebas de Node. Lo que llega en `sources.items` se
  // filtra aquí antes de pintarlo: el cliente no se fía de lo que viene del servidor ni de las páginas.

  const MAX = 5;

  function parse(url) {
    if (typeof url !== 'string') return null;
    try { return new URL(url); } catch { return null; }
  }

  // Solo http y https: nada de javascript:, file:, data:...
  function esSegura(url) {
    const u = parse(url);
    return Boolean(u) && (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname !== '';
  }

  // El dominio sin «www.», o '' si no es una URL.
  function host(url) {
    const u = parse(url);
    return u ? u.hostname.replace(/^www\./, '') : '';
  }

  // De lo que llega: objetos con URL segura, sin repetir, como mucho MAX, con { title, url, host }.
  function normalizar(items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    const vistas = new Set();
    for (const it of items) {
      if (!it || typeof it !== 'object' || !esSegura(it.url) || vistas.has(it.url)) continue;
      vistas.add(it.url);
      const h = host(it.url);
      const title = typeof it.title === 'string' && it.title.trim() ? it.title.trim() : h;
      out.push({ title, url: it.url, host: h });
      if (out.length === MAX) break;
    }
    return out;
  }

  return { MAX, esSegura, host, normalizar };
});
