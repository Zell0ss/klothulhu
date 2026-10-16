# Fase 3 · H2 — informe

Responde a: 2c2db02 (H2-encargo)

## Hecho

- R3 `.gitattributes` (`desktop/renderer/vendor/** -text`); `git ls-files --eol` muestra `attr/-text` en los dos ficheros de vendor.
- R1 `readMs(…, opts)` con `{cut, speed}` e `isCut()` en `scenes.js`; `play()` pasa `{ cut: isCut(item.caption), speed: readSpeed }`.
- R2 `desktop/config.js` con `normalizeConfig(raw) → { cfg, warnings }`; `main.js` lo usa, escribe cada aviso con `console.warn` (y al log si `debug`) y manda `readSpeed` en el `init`. `config.example.json` y README al día.
- Pruebas: `npm test` 34/34 (27 + N1-N7), `npm run check` limpio (con `config.js` añadido al script), `pytest` 26 passed.
- Commits (uno por retoque): R3 · R1 · R2, en `fase3`.

## Gasto

0.

## Desviaciones

- `package.json`: añadí `node --check config.js` al script `check` (lo pedía el encargo: «con `config.js` dentro»).
- Entre el commit R1 y el R2, `index.html` lee `cfg.readSpeed` que aún no llegaba por el `init`; R2 lo cierra. Los tres commits van juntos.
- No he podido ver el efecto real en pantalla: eso es la prueba de Josem en Konnos.

## Decisiones que necesito

Ninguna.
