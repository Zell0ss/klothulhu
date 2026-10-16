(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./scenes.js') : root.KlScenes);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlFeed = api;
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';
  // Lógica pura (sin DOM ni motor): qué va a la cola de escenas y cuándo (D21).
  // Un feed por respuesta. Las escenas del servidor entran al llegar; solo si `done` llega sin
  // ninguna (servidor anterior a la fase 2) se trocea con beats(), y nunca se hacen las dos cosas.

  function createFeed() {
    const seen = new Set();
    let closed = false;
    let warnedOrder = false;
    let last = -1;

    // data = payload del evento `scene` -> item { kind, caption, scene, fromServer } o null si se ignora.
    function onScene(data) {
      if (closed) return null;
      if (!data || typeof data !== 'object') return null;
      if (!Number.isInteger(data.index) || data.index < 0) return null;
      if (typeof data.caption !== 'string' || !data.caption.trim()) return null;
      if (seen.has(data.index)) return null;
      seen.add(data.index);
      if (data.index < last && !warnedOrder) {
        warnedOrder = true;
        if (typeof console !== 'undefined') console.warn(`scene fuera de orden: index ${data.index} tras ${last}`);
      }
      last = Math.max(last, data.index);
      const kind = S.EMOTIONS.includes(data.emotion) ? data.emotion : 'neutral';
      const scene = data.scene && typeof data.scene === 'object' ? data.scene : null;
      return { kind, caption: data.caption.slice(0, S.CAPTION_MAX), scene, fromServer: true };
    }

    function onDone(reply, marks) {
      const fallback = !closed && seen.size === 0;
      closed = true;
      if (!fallback) return [];
      return S.beats(reply, marks).map((b) => ({ kind: b.emotion, caption: b.caption, scene: null, fromServer: false }));
    }

    function onError() { closed = true; }

    return { onScene, onDone, onError, get count() { return seen.size; } };
  }

  return { createFeed };
});
