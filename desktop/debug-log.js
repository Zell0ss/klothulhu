'use strict';
// Log de depuración del cliente (D20). Lo escribe el proceso principal; el renderer solo manda la línea.
const fs = require('fs');

const MAX_BYTES = 256 * 1024;
const MAX_LINE = 500;

function formatLine(line, now = new Date()) {
  return `${now.toISOString()} ${String(line).replace(/\s+/g, ' ').trim().slice(0, MAX_LINE)}\n`;
}

// Tope sin rotación: si el fichero ya pasa de MAX_BYTES se vacía antes de escribir.
function appendLog(file, line, now) {
  try {
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_BYTES) fs.truncateSync(file, 0);
    fs.appendFileSync(file, formatLine(line, now));
    return true;
  } catch {
    return false;
  }
}

module.exports = { appendLog, formatLine, MAX_BYTES, MAX_LINE };
