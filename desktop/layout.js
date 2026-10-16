'use strict';
// Geometría de la ventana al abrir y cerrar el panel de historial (D27). Pura: sin Electron, para poder probarla.

const PANEL_W = 176;   // unidades del motor (como STAGE_W); el bocadillo mide ~168

// Ensancha por la derecha; si no cabe en `area`, se desplaza a la izquierda lo justo. `shift` es cuánto.
function openBounds(bounds, area, add) {
  const width = bounds.width + add;
  const x = Math.max(area.x, Math.min(bounds.x, area.x + area.width - width));
  return { bounds: { x, y: bounds.y, width, height: bounds.height }, shift: bounds.x - x };
}

// Deshace openBounds sobre la posición actual (la ventana puede haberse arrastrado entre medias).
function closeBounds(bounds, add, shift) {
  return { x: bounds.x + shift, y: bounds.y, width: bounds.width - add, height: bounds.height };
}

module.exports = { PANEL_W, openBounds, closeBounds };
