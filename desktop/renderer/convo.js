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

    function push(role, t, sources, consultadas) {
      const entry = { role, text: t };
      if (sources) {   // D60: solo si las hay
        entry.sources = sources;
        if (consultadas) entry.consultadas = true;   // D61: leídas, no citadas
      }
      list.push(entry);
      if (list.length > max) list = list.slice(list.length - max);
    }
    function flush() {
      if (pending === null) return false;
      push('klothulhu', pending.text, pending.sources, pending.consultadas);
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
      // `sources`: los enlaces que citó al buscar en la web (D60); ya normalizados por KlFuentes.
      // `consultadas` (D61): verdadero si no las citó y son lo que leyó.
      hold(text, sources, consultadas) {
        if (typeof text !== 'string') return;
        const t = text.trim();
        if (!t) return;
        flush();   // un pendiente anterior no se pierde
        const hay = Array.isArray(sources) && sources.length;
        pending = { text: t, sources: hay ? sources.map((s) => ({ ...s })) : null, consultadas: Boolean(hay && consultadas) };
      },
      release() { return flush(); },
      clear() { list = []; pending = null; },
      entries() {
        return list.map((e) => (e.sources ? { ...e, sources: e.sources.map((s) => ({ ...s })) } : { ...e }));
      },
    };
  }

  // Copiar la conversación (D66): el Markdown de lo que enseña el panel, o sea las entradas de `entries()`
  // (la respuesta que aún se lee no está: D54). El texto va tal cual, sin escapar. Sin entradas, ''.
  function toMarkdown(entries, { fecha } = {}) {
    if (!entries.length) return '';
    const out = [fecha ? `# Klothulhu · ${fecha}` : '# Klothulhu', ''];
    for (const e of entries) {
      out.push(`**${e.role === 'user' ? 'Tú' : 'Klothulhu'}:** ${e.text}`);
      if (e.sources) {   // D60, D61
        const enlaces = e.sources.map((s) => `[${s.host || s.url}](${s.url})`).join(', ');
        out.push(`${e.consultadas ? 'consultado' : 'fuentes'}: ${enlaces}`);
      }
      out.push('');
    }
    return out.join('\n');
  }

  return { createConvo, toMarkdown };
});
