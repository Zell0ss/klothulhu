(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlAvatar = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // El avatar que se pinta (D49): qué opciones pasa el cliente al motor para cada uno.
  // Pura: sin DOM ni motor. Se carga en el renderer y desde las pruebas de Node.

  const AVATARS = ['claude', 'klothulhu'];
  // El verde pesa más que el naranja; es la cifra que pide claude-fables (su D28).
  const MAX_BYTES_KLOTHULHU = 400000;

  // `avatars` es lo que el motor dice conocer (VOCAB.avatars). El naranja va sin opciones, para que su
  // SVG sea idéntico al de antes de la fase 8; un avatar que el motor no tiene vuelve a ese naranja.
  function avatarOptions(avatar, avatars) {
    if (avatar === 'klothulhu' && Array.isArray(avatars) && avatars.includes('klothulhu')) {
      return { avatar: 'klothulhu', maxBytes: MAX_BYTES_KLOTHULHU };
    }
    return {};
  }

  return { AVATARS, MAX_BYTES_KLOTHULHU, avatarOptions };
});
