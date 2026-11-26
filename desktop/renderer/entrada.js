(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlEntrada = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // La caja de escribir de los dos clientes (fase 12): qué hace Enter (D64) y cuánto mide (D63).
  // Pura: sin DOM. Se carga en el renderer, en la web (/shared/) y desde las pruebas de Node.

  const MAX_LINEAS = 6;

  // `modo`: 'escritorio' (Enter envía, Mayús+Enter salta) o 'movil' (Enter salta, Ctrl/⌘+Enter envía).
  // Devuelve 'enviar', 'linea' o null. Solo con 'enviar' se hace preventDefault: el resto es cosa del textarea.
  function teclaEnter(ev, modo) {
    if (ev.isComposing || ev.key !== 'Enter') return null;   // con una composición en marcha (IME), nada
    if (modo === 'escritorio') return ev.shiftKey ? 'linea' : 'enviar';
    if (modo === 'movil') return ev.ctrlKey || ev.metaKey ? 'enviar' : 'linea';
    return null;
  }

  // Alto en píxeles para el texto que hay: de 1 a MAX_LINEAS líneas; a partir de ahí, scroll.
  // `scrollHeight` incluye el relleno pero no el borde (con box-sizing: border-box, lo suma quien llama).
  function altoCaja({ scrollHeight, linea, relleno }) {
    return Math.max(linea + relleno, Math.min(scrollHeight, linea * MAX_LINEAS + relleno));
  }

  return { MAX_LINEAS, teclaEnter, altoCaja };
});
