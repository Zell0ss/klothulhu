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

function readState(file) {
  try { return parseState(fs.readFileSync(file, 'utf8')); } catch { return { ...DEFAULT }; }
}

// Escribe en un .tmp y lo renombra encima, para que un corte no deje el fichero a medias. Puede lanzar.
function writeState(file, { size, x, y }) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, size, x, y }, null, 2));
  fs.renameSync(tmp, file);
}

module.exports = { parseState, readState, writeState };
