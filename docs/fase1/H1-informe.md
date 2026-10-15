Responde a: 9d9b683 (PLAN.md, fase 1)

# Fase 1 · H1 — informe del programador

Rama `fase1`, subida a `origin/fase1` (último commit `2b1c32f`). **No se ha hecho merge a `main`.**

## Hecho

| Tarea | Commit | Estado |
|---|---|---|
| T1 vendorizar el IIFE + `VENDOR.md` (sha256 coincide con el del plan) | d6d8c6b | hecho |
| T2 Electron `44.4.5` exacto + `package-lock.json`, scripts `test` y `check` (con `scenes.js`) | 6936b23 | hecho |
| T3 `renderer/scenes.js` | 5427c8b | hecho |
| T7 `test/fase1.test.js` copiado tal cual + `test/scenes.extra.test.js` | 5427c8b | **P4 falla** (ver Desviaciones 1) |
| T4 `renderer/index.html` (franja, cola, CSP, ratón) y T5 `main.js`/`config.example.json`, sprites borrados | 92e06a4 | hecho |
| T6 `README.md` y `CLAUDE.md` del repo | 0f21466 | hecho |

Pruebas:

- `npm test` (cliente): 15 pruebas, **14 pasan, 1 falla (P4)**. P1-P3, P5-P11 en verde. Las 4 de
  `scenes.extra.test.js` en verde, incluida P4b: la misma comprobación que P4 comparando entre reinos.
- Servidor: `pytest -q tests` → 9 pasan (con `KLOTHULHU_FAKE=1`, venv de `/data/klothulhu`).
- `npm run check` pasa.
- `ruff check .` → **3 errores que ya existen en `main`** (`server/app.py` I001, `tests/test_core.py`
  I001 y F401). No he tocado el servidor, así que no los arreglo; el plan decía «siguen en verde» y no lo estaban.
- No he podido arrancar Electron en seb01 (el binario no se descarga aquí: `dist/electron` es un
  stub). K1-K7 son solo de Josem en Konnos. Lo que sí he hecho: ejecutar el script del renderer en Node
  con un DOM simulado y temporizadores falsos: arranque con `look: "inventado"` (avisa una vez y cae a
  `pixel`), ~37 s tras el arranque pasa a `idle`, pregunta → `thinking`, `done` con dos emociones →
  cola de 2 escenas que esperan su lectura, error de código desconocido → escena de error tras leer la
  actual. Es un humo, no sustituye K2.

Medidas (en Node, `pixel`, 8 tipos × 50 repeticiones): SVG medio **≈ 5,7 KB**; `renderScene` **≈ 2,3 ms**
por escena. Orden de magnitud: irrelevante para la interfaz.

## Gasto

0. No he llamado al servidor ni a Anthropic. (`npm install` descargó paquetes de npm, sin coste.)

## Desviaciones

1. **P4 falla y no he tocado la prueba.** El fallo no está en `STAGING`: la línea
   `assert.deepEqual(r.warnings, [], …)` (y la de `r.scene.props`) compara un array creado dentro del
   contexto de `vm` donde se carga el motor con un `[]` de Node. `deepStrictEqual` compara prototipos y
   los de dos reinos distintos nunca coinciden: `r.warnings` es `[]`, `Array.isArray` da `true`, y
   `deepEqual([...r.warnings], [])` pasa. El mismo defecto afecta a `deepEqual(r.scene.props, [])`.
   Por la convención §3 paro aquí en esa prueba: **necesito que el arquitecto corrija P4** (por
   ejemplo copiando con `[...r.warnings]` / `[...r.scene.props]`, o comparando con `JSON`). Mientras
   tanto `scenes.extra.test.js` (P4b) comprueba lo mismo sin el defecto y pasa en las 16 combinaciones
   (8 tipos × `pixel` y `ukiyoe`), así que `STAGING` queda validada contra el motor.
2. **`"test": "node --test test/"` no funciona con Node 22** (el de seb01, v22.18): trata `test/` como un
   módulo y da `MODULE_NOT_FOUND`. Lo cambié a `"node --test"`, que descubre `test/*.test.js` y
   no entra en `node_modules`. En Node 20 sirven las dos formas.
3. `main` no tiene commits que `fase1` no tenga, así que no hubo `git merge main`. Pero **en
   `/data/klothulhu` hay cambios sin commit de Josem en `README.md`** (README corregido) y el directorio
   `desktop/renderer/vendor/` sin seguimiento (el que dejó claude-fables). Mi `README.md` toca
   las secciones «Desktop client» y «Sprites» y la nota de emociones, cerca de los cambios de Josem:
   al hacer el merge puede haber un conflicto pequeño en ese README. El `vendor/` sin seguimiento de
   `main` coincidirá con el que trae `fase1` (mismo sha256) y habrá que borrarlo o moverlo antes de
   hacer el merge, o git se negará.
4. `LINES.boot(hotkey)` recorta a `CAPTION_MAX` por si alguien configura un atajo muy largo.
   Textos nuevos: `thinking` = «Consultando a los astros…» e `idle` = «Los astros duermen. Zzz…» (el plan
   no los fijaba).

## Decisiones que necesito

1. Corregir (o aprobar mi corrección de) **P4** (Desviaciones 1).
2. El merge de `fase1` a `main` y la prueba K1-K7 en Konnos son de Josem; no he hecho ni lo uno ni lo otro.

## Anexo 1 — retoques

Responde a: 77ff525 (H1-revision, aprobado con retoques)

- **Hecho · R1:** P4 de `desktop/test/fase1.test.js` sustituida por el bloque de la revisión, tal cual
  (commit de R1). Quité P4b de `scenes.extra.test.js`, que quedaba redundante. `npm test`: **14/14**.
- **R2 espera.** Josem aún no ha hecho commit del README en `/data/klothulhu` (`main` sigue en `1d536ab`,
  con `README.md` modificado y `desktop/renderer/vendor/` sin seguimiento). Cuando lo haga: `git merge main`
  en `fase1`, quedarme con lo de `main` y con lo de v2, y quitar la viñeta «Long replies scroll…»
  (la sustituiré por una línea sobre 📋 y ✕).
- **Gasto:** 0. **Desviaciones:** ninguna. **Decisiones que necesito:** ninguna; solo el commit del README por Josem.

## Anexo 2 — R2 (README)

Responde a: a63208a (H1-revision §4)

- **Hecho · R2:** `git merge main` en `fase1` (`main` en `53c4f1d`, README de Josem). Un solo conflicto, en la
  lista de la sección del cliente. Resuelto: se queda lo de `main` (clonar el repo, «Plain JavaScript…», la
  viñeta del acceso directo de Windows) y lo de v2; la viñeta «Long replies scroll inside the bubble…» fuera,
  sustituida por «El botón 📋 copia la respuesta entera; ✕ cierra la app». `npm test`: 14/14.
- **Antes del merge a `main`:** en `/data/klothulhu` sigue sin seguimiento `desktop/renderer/vendor/` (el IIFE,
  idéntico al de `fase1`, y el ESM `fables-motor.js`, que la fase no usa). Lo borra Josem; yo no toco ese directorio.
- **Gasto:** 0. **Desviaciones:** ninguna. **Decisiones que necesito:** ninguna.
- **Parada:** push de `fase1` hecho. Lo siguiente es K1-K7 en Konnos (Josem).
