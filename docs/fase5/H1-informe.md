# Fase 5 · H1 — informe

Responde a: 282b2cd (PLAN)

## Hecho

- **T1** motor v2 vendorizado: origen `/data/claude-fables`, `main`, `a247d95`; sha256 de `dist/fables-motor.iife.js` =
  `029c99ec…9166d` (el del plan). `VENDOR.md`, `server/fables_vocab.json` (F1) y P9 (`SCHEMA_VERSION` 2) al día.
- **T2** `tramos()` y `TRAMO_MAX` en `server/beats.py`; `tramos()`, `TRAMO_MAX`, `BUBBLE_LINES` en `scenes.js`. Los 12
  casos de `tramos_cases.json` pasan en los dos lados.
- **T3** `app.py` trocea con `tramos()`; `build_scene` descarta `then == "approach"` (D26); docstrings: «golpe» → «tramo».
- **T4** `prompt.md` (narrador: prosa normal, párrafo nuevo solo si cambia el tema; quitada la regla de 70) y
  `director_prompt.md` (`approach`, `angry`, `dazed` en las listas de acciones).
- **T5** cliente: `holdMs`, `secondsPerChar` (+ `BUBBLE_COLS = 32`) en `scenes.js`; `index.html` pinta con
  `bubble: { lines: BUBBLE_LINES }` y `secondsPerChar`, y mide con `holdMs(typedAfter, spc)`; `feed.js` recorta a
  `TRAMO_MAX` y usa `tramos()` sin escenas del servidor. README del cliente al día.
- **T6** G7-G9 borradas de `tests/test_fase4.py`, con el comentario pedido. Nada más de ese fichero.
- **T7 (preparación, sin API):** `api_smoke.py` con ruta por defecto `docs/fase5/capturas/`, y en el resumen
  `tramos_per_reply`, `tramo_len_mean`, `tramo_len_max`, `new_actions` y los contadores de D23 de siempre;
  `gallery.js` pinta con `bubble` + `secondsPerChar: 0.03` y pone `typedAfter` bajo cada escena.
  Ensayo `--fake` + galería en el scratchpad: corren.
- Normativas copiadas byte a byte (sha256 comprobados contra el plan).
- Verde: `pytest` **42**, `npm test` **42**, `ruff`, `npm run check`.
- Commits (uno por tarea): T1 · T2 · T3 · T4 · T6 · T5 · T7-preparación, en `fase5`.

## Gasto

0. No se ha tocado la API (T7 espera la autorización de Josem).

## Desviaciones

- **C6 de `fase3.test.js`** (mía, no normativa) ajustada además de C3: comparaba con `K.beats` y el feed ya usa
  `tramos()`. C3 ahora usa un caption de 600 para poder ver el recorte a `TRAMO_MAX`.
- **`ruff.toml`:** exención E501/B905 para `tests/test_fase5.py` (normativo) y `extend-exclude` de
  `docs/fase5/normativas/` (copias byte a byte).
- El plan dice «el cliente no necesita reinicio del servidor» en fases anteriores; aquí es al revés: **servidor y
  cliente van juntos** (PLAN §0).
- `TRAVEL` (D23) no incluye `approach`: G11 lo fija en 7 acciones. Si el arquitecto quiere que `approach` cuente como
  desplazamiento para la continuidad, es un cambio de contrato.
- `approach` se ha puesto en la lista de movimiento del prompt del director, como pedía el plan.

## Orden de arranque para H3 (servidor de la rama, sin tocar producción)

Desde seb01, con el `.venv` de la rama y las variables de producción, **en el puerto 8766**:

```bash
cd /data/klothulhu-fase5/server
set -a; . /etc/klothulhu/klothulhu.env; set +a
KLOTHULHU_PORT=8766 ../.venv/bin/uvicorn app:app --host "$KLOTHULHU_HOST" --port 8766
```

Comprobado sin API (`KLOTHULHU_FAKE=1`, `127.0.0.1:8766`): arranca y `/health` responde con `director`. El historial
vive en memoria, así que no comparte nada con producción. En Konnos: `"apiUrl": "http://seb01:8766"` en `config.json`
(o la IP de Tailscale que ya use) y `git pull` de `fase5`. Al terminar la prueba, parar ese `uvicorn` (Ctrl-C).

## Decisiones que necesito

- **Autorización de gasto de T7 [API]** (solo Josem, en mi ventana): el plan propone hasta $0,10 y espera ~$0,01.
  Orden: `cd /data/klothulhu-fase5 && .venv/bin/python scripts/api_smoke.py --director-thinking 0 --out docs/fase5/capturas/api_smoke.json`
  y `node desktop/scripts/gallery.js docs/fase5/capturas/api_smoke.json docs/fase5/capturas/galeria.html`.
