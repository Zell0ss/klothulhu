(function (root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./webcore.js') : root.KlWebCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlHost = api;
})(typeof self !== 'undefined' ? self : this, function (core) {
  'use strict';
  // El anfitrión web (D50): hace lo que `main.js` + `preload.js` hacen en el escritorio, con los mismos nombres
  // (`ask`, `forget`, `onEvent`, `onForgotten`) para que el reproductor se lea igual. El token vive aquí:
  // el pintado nunca lo ve. `sse` es el cliente compartido (`KlSse`); `storage`, localStorage.

  function createHost({ storage, sse, apiUrl = '/api' }) {
    const tokens = core.createTokenStore(storage);
    const onEvents = [];
    const onForgottens = [];
    const onNeedTokens = [];
    let inflight = null;   // AbortController de la petición /chat en curso (uno solo, como main.js)

    const emit = (list, ...args) => { for (const cb of list) cb(...args); };

    async function ask(text) {
      const token = tokens.get();
      if (!token) { emit(onNeedTokens); return; }   // sin token no hay red
      if (inflight) inflight.abort();
      const ctl = new AbortController();
      inflight = ctl;
      let unauthorized = false;
      // Un evento de una pregunta ya cortada no se cuela en la nueva.
      const send = (type, data) => {
        if (ctl.signal.aborted) return;
        if (type === 'error' && data && data.code === 'http_401') unauthorized = true;
        emit(onEvents, { type, data });
      };
      try {
        await sse.streamChat({ apiUrl, token, text, signal: ctl.signal, onEvent: send });
      } catch (err) {
        // streamChat convierte en eventos los fallos de red, pero no todo: en un navegador viejo
        // `AbortSignal.any` no existe y un `res.body` nulo también lanza. Sin esto el móvil se queda en
        // «pensando» para siempre (R1, D50). Una pregunta ya cortada por otra no avisa de nada.
        if (!ctl.signal.aborted) {
          console.warn('klothulhu: streamChat falló', err);
          send('error', { code: 'unreachable' });
        }
      } finally {
        if (inflight === ctl) inflight = null;
      }
      // El servidor no lo acepta: se olvida y se pide otro (el error ya se ha pintado).
      if (unauthorized) { tokens.clear(); emit(onNeedTokens); }
    }

    // Avisa siempre, también si falla (como el tray del escritorio): el historial local se vacía igual.
    async function forget() {
      let ok = false;
      const token = tokens.get();
      if (token) {
        try { ok = Boolean(await sse.forget({ apiUrl, token })); } catch { ok = false; }
      } else {
        emit(onNeedTokens);
      }
      emit(onForgottens);
      return ok;
    }

    return {
      hasToken: () => tokens.get() !== '',
      setToken: (value) => tokens.set(value),
      ask,
      forget,
      onEvent: (cb) => { onEvents.push(cb); },
      onForgotten: (cb) => { onForgottens.push(cb); },
      onNeedToken: (cb) => { onNeedTokens.push(cb); },
    };
  }

  return { createHost };
});
