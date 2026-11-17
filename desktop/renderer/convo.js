(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlConvo = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // La conversación de esta sesión, en memoria del renderer (D27): solo lo que ve el panel de historial.
  // Pura: sin DOM ni motor. Se carga en el renderer y desde las pruebas de Node.

  const ROLES = ['user', 'klothulhu'];

  function createConvo({ max = 200 } = {}) {
    let list = [];
    // La respuesta de klothulhu espera aparte hasta que se acaba de leer la última escena (D54):
    // en el móvil el historial está a la vista y, si la respuesta entera entrara al llegar `done`,
    // se llevaría la mirada mientras la escena va por la primera frase.
    let pending = null;

    function push(role, t) {
      list.push({ role, text: t });
      if (list.length > max) list = list.slice(list.length - max);
    }
    function flush() {
      if (pending === null) return false;
      push('klothulhu', pending);
      pending = null;
      return true;
    }

    return {
      max,
      add(role, text) {
        if (!ROLES.includes(role) || typeof text !== 'string') return;
        const t = text.trim();
        if (!t) return;
        flush();   // si escribes antes de que acabe, su respuesta va delante de tu mensaje
        push(role, t);
      },
      hold(text) {
        if (typeof text !== 'string') return;
        const t = text.trim();
        if (!t) return;
        flush();   // un pendiente anterior no se pierde
        pending = t;
      },
      release() { return flush(); },
      clear() { list = []; pending = null; },
      entries() { return list.map((e) => ({ ...e })); },
    };
  }

  return { createConvo };
});
