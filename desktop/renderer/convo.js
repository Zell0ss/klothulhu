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
    return {
      max,
      add(role, text) {
        if (!ROLES.includes(role) || typeof text !== 'string') return;
        const t = text.trim();
        if (!t) return;
        list.push({ role, text: t });
        if (list.length > max) list = list.slice(list.length - max);
      },
      clear() { list = []; },
      entries() { return list.map((e) => ({ ...e })); },
    };
  }

  return { createConvo };
});
