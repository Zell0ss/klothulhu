Responde a: 9f6b829 (H0-revision, plan aprobado con M1-M3)

# Fase 3 · H1 — informe

## Hecho

- M1-M3 aplicados en `PLAN.md` (commit `Fase 3: plan con M1-M3 aplicados`).
- **T1/T2** `cc43bea`: `renderer/feed.js` (puro), `debug-log.js`, `test/fase3.test.js` (C1-C9 + C6b), `"debug": false`
  en `config.example.json`, `.gitignore`.
- **T3** `dedf99c` y `6935d5b`: `index.html` (cola con `scene` al llegar, `play(item)` con caída a la escena fija,
  medidas `first-scene` y `done`, avisos del motor), `preload.js` (`kl.debug`), `main.js` (`debug` en `init`, IPC
  `debug` → `klothulhu-debug.log` solo con `cfg.debug`), `package.json` (`check`).
- **T4** humo en Node: el script de `index.html` ejecutado con el motor real y `window`/`kl` simulados. Comprobado:
  la primera `scene` sustituye a «pensando»; índice repetido y `scene` tras `done` no pintan; `scene: null` y escena
  inválida (`backdrop` inexistente) caen a la fija con `painted=fixed`; `done` sin escenas pinta `beats()`;
  respuesta vacía llega a `lingering` y luego `idle`; el único aviso restante es el de la escena inválida, esperado.
  El humo encontró un fallo mío (`think()` e `idle` llamaban a `play` con la firma antigua), corregido en `6935d5b`.
  El script está en el scratchpad de la sesión, no en el repo.
- **T5** servidor local (puerto 8766, `KLOTHULHU_FAKE=1`, token de prueba): `sse-client.js` → feed recibe
  `scene 0/2 (annoyed, escena no nula)`, `scene 1/2 (neutral)` y `done` sin fallback (0 items). Servidor parado después.
- **T6** `desktop/README.md` (estaba en blanco) y `tomorrow.md`. **T7** push de `fase3`.
- Pruebas: `npm test` 27/27 (las 10 nuevas incluidas), `npm run check` ok, `pytest -q tests` 26 passed,
  `ruff check .` limpio.

## Gasto

0. Solo servidor local con `KLOTHULHU_FAKE=1`; no se llamó a la API.

## Desviaciones

- `fromServer: true/false` en los items (no estaba en el plan) para distinguir el primer item de servidor al medir.
- La medida `first-scene` se registra con `console.info` y, con `debug`, en el log, como pedía el plan; `done` y
  `warning` van por el mismo camino.
- Aviso de índice fuera de orden: `console.warn` desde `feed.js` (el plan lo anotaba).
- No he podido ejecutar Electron en seb01: lo que toca `main.js`/`preload.js` (IPC `debug`, escritura del log) solo
  está comprobado con `node --check` y por lectura; `appendLog` sí tiene prueba (C9). Se verá en L4.

## Decisiones que necesito

Ninguna.

## Para Josem (Konnos)

`git fetch ; git checkout fase3 ; npm ci ; npm test ; npm start` con `"debug": true` en `config.json`; mirar L1-L7 de
`docs/fase3/PLAN.md` §5.
