(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlWebCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Lo puro del cliente web (D50): geometría de la franja, escenas de arranque, almacén del token y elección del estilo (D51).
  // Sin DOM ni red, para probarlo desde Node. Se carga también como <script> clásico (`KlWebCore`).

  const TOKEN_KEY = 'klothulhu.token';
  const LOOK_KEY = 'klothulhu.look';   // el estilo del motor que se elige en la barra (D51)
  const TOKEN_MIN = 16;          // el servidor exige 16 como mínimo
  const STAGE_H = 128;           // el motor dibuja una franja de alto 128 (D12)
  const WIDE_FROM = 640;         // desde aquí el motor usa su escenario de 640; por debajo, el de 320 (D32)

  // La franja ocupa todo el ancho de la pantalla; el motor dibuja a 320 o 640 y se escala (zoom).
  // Los píxeles CSS fraccionarios se truncan; un ancho que no es un número válido cae al mínimo.
  function webGeometry(viewportW) {
    const w = Number.isFinite(viewportW) && viewportW >= 1 ? Math.floor(viewportW) : 320;
    const stageW = w >= WIDE_FROM ? 640 : 320;
    const zoom = w / stageW;
    return { stageW, zoom, width: w, height: Math.round(STAGE_H * zoom) };
  }

  // Las dos primeras escenas del despertar; la tercera habla de un atajo de teclado que el móvil no tiene.
  function webBoot(K) {
    return K.bootScenes('Control+Alt+K').slice(0, 2);
  }

  // El token se teclea una vez y se guarda en el móvil. Un `storage` que falla (modo privado, cuota)
  // no tumba la página: simplemente no se recuerda.
  function createTokenStore(storage) {
    return {
      get() {
        try { return storage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
      },
      set(value) {
        const t = String(value ?? '').trim();   // pegar desde el portapapeles trae espacios y saltos
        if (t.length < TOKEN_MIN || /\s/.test(t)) return false;
        try { storage.setItem(TOKEN_KEY, t); } catch { return false; }
        return true;
      },
      clear() {
        try { storage.removeItem(TOKEN_KEY); } catch { /* nada que hacer */ }
      },
    };
  }

  // El estilo guardado, si el motor aún lo tiene; si no (nunca guardado, borrado del motor, basura en
  // localStorage), el de por defecto. Pura y sin lanzar: lo que llega de localStorage no es de fiar (D51).
  function pickLook(stored, looks, fallback) {
    if (typeof stored !== 'string' || !Array.isArray(looks)) return fallback;
    return looks.includes(stored) ? stored : fallback;
  }

  return { TOKEN_KEY, LOOK_KEY, webGeometry, webBoot, createTokenStore, pickLook };
});
