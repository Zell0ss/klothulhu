'use strict';
// Geometría de la ventana: panel de historial (D27), tamaños y posición de arranque (D31). Pura: sin Electron, para poder probarla.

// El motor dibuja una franja de 640x128 (D12); la caja de texto va debajo y no se escala.
const STAGE_W = 640;
const STAGE_H = 128;
const INPUT_H = 44;
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

// D31: tres tamaños; `half` reduce el zoom a la mitad, `narrow` pide al motor un escenario de 320 (su minWidth).
const SIZE_ORDER = Object.freeze(['normal', 'half', 'narrow']);

function sizeGeometry(name, scale) {
  const size = SIZE_ORDER.includes(name) ? name : 'normal';
  const zoom = size === 'half' ? scale * 0.5 : scale;
  const stageW = size === 'narrow' ? 320 : STAGE_W;
  return { size, zoom, stageW, width: Math.round(stageW * zoom), height: Math.round(STAGE_H * zoom) + INPUT_H };
}

function nextSize(name) {
  const i = SIZE_ORDER.indexOf(name);
  return i < 0 ? 'normal' : SIZE_ORDER[(i + 1) % SIZE_ORDER.length];
}

const clampTo = (area, x, y, width, height) => ({
  x: Math.max(area.x, Math.min(x, area.x + area.width - width)),
  y: Math.max(area.y, Math.min(y, area.y + area.height - height)),
  width, height,
});

// Cambia de tamaño dejando fija la esquina de abajo a la derecha, y lo mete dentro de `area`.
function resizeBounds(bounds, area, width, height) {
  return clampTo(area, bounds.x + bounds.width - width, bounds.y + bounds.height - height, width, height);
}

// Dónde arranca: donde se dejó si sigue en una pantalla; si no, abajo a la derecha de la principal.
function startBounds(saved, { width, height }, areas, primaryArea) {
  const def = {
    x: primaryArea.x + primaryArea.width - width - 24,
    y: primaryArea.y + primaryArea.height - height - 8,
    width, height,
  };
  if (!Number.isInteger(saved.x) || !Number.isInteger(saved.y)) return def;
  const overlap = (a) => Math.max(0, Math.min(saved.x + width, a.x + a.width) - Math.max(saved.x, a.x))
    * Math.max(0, Math.min(saved.y + height, a.y + a.height) - Math.max(saved.y, a.y));
  let best = null;
  let bestOverlap = 0;
  for (const a of areas) {
    const o = overlap(a);
    if (o > bestOverlap) { best = a; bestOverlap = o; }
  }
  return best ? clampTo(best, saved.x, saved.y, width, height) : def;
}

module.exports = {
  STAGE_W, STAGE_H, INPUT_H, PANEL_W, SIZE_ORDER,
  openBounds, closeBounds, sizeGeometry, nextSize, resizeBounds, startBounds,
};
