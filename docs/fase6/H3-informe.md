# Fase 6 · H3 — informe

Responde a: a604fc0 (H3-encargo)

## Hecho

- **T1** `desktop/renderer/scenes.js`: `bootScenes(hotkey)` (exportada, con comentario `D29`) devuelve las tres escenas
  de la tabla; paleta en la constante `BOOT_PALETTE`, copiada en cada escena; objetos nuevos en cada llamada.
  `LINES.boot` ahora es «klothulhu escucha, mortal. Pulsa … o haz clic para hablar.» (mismo `replace` y `slice`).
- **T2** `renderer/index.html`: `bootScenes` en la desestructuración; el arranque hace `enqueue(bootScenes(cfg.hotkey))`.
- **T3** `desktop/test/fase6-h3.test.js` copiada byte a byte (sha256 `cfdef9c3…74a1` comprobado). El README del cliente no
  describe el saludo: sin cambios.
- Verde: `npm test` **54**, `npm run check`, `pytest` **42**, `ruff`.

## Gasto

0.

## Desviaciones

Ninguna.

## Decisiones que necesito

Ninguna. Falta la prueba S1-S4 de Josem en Konnos.
