'use strict';
// Normalización pura de config.json (sin Electron, para poder probarla). D22 para readSpeed.

function normalizeConfig(c) {
  const raw = c || {};
  const warnings = [];

  let readSpeed = 1;
  if ('readSpeed' in raw) {
    const v = raw.readSpeed;
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0.25 && v <= 4) readSpeed = v;
    else warnings.push(`config.json: readSpeed debe ser un número entre 0.25 y 4 (recibido ${JSON.stringify(v)}); uso 1`);
  }

  if ('debug' in raw && typeof raw.debug !== 'boolean') {
    warnings.push(`config.json: debug debe ser true o false, sin comillas (recibido ${JSON.stringify(raw.debug)}); uso false`);
  }

  const cfg = {
    apiUrl: String(raw.apiUrl || '').replace(/\/+$/, ''),
    token: String(raw.token || ''),
    scale: Number(raw.scale) > 0 ? Number(raw.scale) : 1.5,
    hotkey: raw.hotkey || 'Control+Alt+K',
    // Validated by the renderer, which owns the engine; unknown values fall back to its default.
    look: String(raw.look || 'pixel'),
    // D20: con true, el renderer manda sus medidas y se escriben en LOG_FILE.
    debug: raw.debug === true,
    readSpeed,
  };
  return { cfg, warnings };
}

module.exports = { normalizeConfig };
