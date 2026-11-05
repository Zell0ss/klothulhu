'use strict';
// estado.json (D31): tamaño y posición de la ventana, aparte de config.json (que nunca se escribe). Solo `fs`, sin Electron.
const fs = require('fs');
const { SIZE_ORDER } = require('./layout');

const DEFAULT = Object.freeze({ size: 'normal', x: null, y: null });

// Nunca lanza: lo que no vale se queda en su valor por defecto. La posición va entera o no va.
function parseState(text) {
  let o;
  try { o = JSON.parse(text); } catch { return { ...DEFAULT }; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ...DEFAULT };
  const size = SIZE_ORDER.includes(o.size) ? o.size : DEFAULT.size;
  const ok = Number.isInteger(o.x) && Number.isInteger(o.y);
  return { size, x: ok ? o.x : null, y: ok ? o.y : null };
}

// El avatar (D49) se lee aparte para que parseState y readState sigan devolviendo lo de la fase 6.
// Nunca lanza: lo que no está en `avatars` es 'claude'.
function parseAvatar(text, avatars) {
  try {
    const o = JSON.parse(text);
    if (o && typeof o === 'object' && !Array.isArray(o) && typeof o.avatar === 'string' && avatars.includes(o.avatar)) {
      return o.avatar;
    }
  } catch { /* texto que no es JSON: el de por defecto */ }
  return 'claude';
}

function readAvatar(file, avatars) {
  try { return parseAvatar(fs.readFileSync(file, 'utf8'), avatars); } catch { return 'claude'; }
}

function readState(file) {
  try { return parseState(fs.readFileSync(file, 'utf8')); } catch { return { ...DEFAULT }; }
}

// Escribe en un .tmp y lo renombra encima, para que un corte no deje el fichero a medias. Puede lanzar.
function writeState(file, { size, x, y, avatar }) {
  const tmp = file + '.tmp';
  const o = { version: 1, size, x, y };
  if (avatar !== undefined) o.avatar = avatar;   // solo si viene (D49)
  fs.writeFileSync(tmp, JSON.stringify(o, null, 2));
  fs.renameSync(tmp, file);
}

module.exports = { parseState, parseAvatar, readState, readAvatar, writeState };
