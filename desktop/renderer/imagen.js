(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlImagen = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Imágenes en la conversación (fase 10, D56): lo que comparten los dos clientes. Lo puro (medidas, deDataUrl,
  // paraHistorial) se prueba desde Node; `reducir` usa el DOM y no tiene prueba en Node.
  // La imagen nunca se guarda: solo viaja en la petición y vive en la memoria del servidor mientras su vuelta
  // esté entre las últimas (D57). El historial local del cliente guarda solo el texto con 📷.

  const MAX_LADO = 1280;   // lado largo de lo que se manda; una foto de móvil de 12 MP baja a ~300 KB
  const CALIDAD = 0.85;    // JPEG
  const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];   // los de server/imagen.py
  const MAX_DATA_CHARS = 6_000_000;   // base64: algo más que MAX_BYTES (4 000 000) de server/imagen.py → ~5,33 M

  // Tamaño al que hay que reducir: el lado largo como mucho `max`, con la proporción conservada.
  // Nunca amplía y nunca da 0.
  function medidas(w, h, max = MAX_LADO) {
    const escala = Math.min(1, max / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * escala)), h: Math.max(1, Math.round(h * escala)) };
  }

  // De lo que da el canvas (`data:image/jpeg;base64,…`) a lo que va en la petición. Otra cosa: null.
  function deDataUrl(url) {
    if (typeof url !== 'string') return null;
    const m = /^data:(image\/[\w.+-]+);base64,/.exec(url);
    if (!m) return null;
    const data = url.slice(m[0].length);   // sin regex sobre el resto: puede pesar megas
    return data ? { media_type: m[1], data } : null;
  }

  // Lo que `main.js` deja pasar del renderer al servidor (D56): solo un objeto con uno de los cuatro tipos y
  // `data` de texto de como mucho MAX_DATA_CHARS. Devuelve una copia limpia, o null (y entonces se descarta).
  function filtrarImagen(image) {
    if (!image || typeof image !== 'object') return null;
    const { media_type: mediaType, data } = image;
    if (!MEDIA_TYPES.includes(mediaType)) return null;
    if (typeof data !== 'string' || !data || data.length > MAX_DATA_CHARS) return null;
    return { media_type: mediaType, data };
  }

  // Lo que sale en el panel de historial por tu mensaje (el historial local no guarda la imagen).
  function paraHistorial(text, conImagen) {
    if (!conImagen) return text;
    const t = String(text ?? '').trim();
    return t ? `📷 ${t}` : '📷';
  }

  // Reduce una imagen (File o Blob) a JPEG de como mucho MAX_LADO de lado largo.
  // Devuelve { media_type, data, vista }; `vista` es el data URL para la miniatura. Rechaza si el navegador
  // no puede leerla. `from-image` respeta la orientación EXIF: la foto del móvil no sale girada.
  async function reducir(fileOrBlob) {
    const bmp = await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' });
    try {
      const { w, h } = medidas(bmp.width, bmp.height);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext('2d');
      g.fillStyle = '#fff';   // un PNG con transparencia saldría negro en JPEG
      g.fillRect(0, 0, w, h);
      g.drawImage(bmp, 0, 0, w, h);
      const vista = canvas.toDataURL('image/jpeg', CALIDAD);
      const partes = deDataUrl(vista);
      if (!partes) throw new Error('el canvas no dio un JPEG');
      return { ...partes, vista };
    } finally {
      if (typeof bmp.close === 'function') bmp.close();
    }
  }

  return { MAX_LADO, CALIDAD, MEDIA_TYPES, MAX_DATA_CHARS, medidas, deDataUrl, filtrarImagen, paraHistorial, reducir };
});
