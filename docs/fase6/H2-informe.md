# Fase 6 · H2 — informe (parada 1, antes de T7 [API])

Responde a: 793381b (H2-encargo)

## Hecho

- **T1** (27c6531) motor v3 construido fuera de `/data/claude-fables` (`git archive 768ac2a`); sha256 `90368402…6459` coincide;
  copiado a `vendor/`, `VENDOR.md` al día, `fables_vocab.json` regenerado (cambian solo `schemaVersion` y las tres acciones);
  las tres líneas de P9, I2 y H2 cambiadas.
- **T2+T5** (f336fba) `sad` en `emotion_parser.py` y `scenes.js` (+ `STAGING.sad`); escena 2 del saludo con `emerge`.
- **T3** (e0d558e) etiqueta `[sad]` y su línea en `prompt.md`.
- **T4** (2ddca9e) prompt del director y `OPENING_ONLY = {approach, emerge}` en `director.py`; `TRAVEL` y `continue_scene` intactos.
- **T6** (3b58bc7) `test_fase6.py`, `fase6-h2.test.js` y `fase6-h3.test.js` (v2) byte a byte; sha256 comprobados
  (`6cc719ad…`, `ec6c8ef9…`, `1f58d4ec…`); README.
- **T7 preparado** (74e5a3d), **sin lanzar**: `api_smoke.py` con 21 preguntas, `BUDGET` $0,05, salida por defecto en
  `docs/fase6/capturas/`, y en el resumen `new_actions` (+`sad`, `despair`, `emerge`), `emotions` y `sad_questions`.
  Ensayo `--fake` correcto (escrito en el scratchpad, no en el repo).
- Verde: `pytest` **47**, `npm test` **64**, `npm run check`, `ruff`.

## Gasto

0. La pasada real espera la autorización de Josem.

## Desviaciones

- T2 y T5 en un solo commit (tocan los mismos ficheros).
- En `sad_questions` tomo como tristes las cuatro preguntas: las tres nuevas del encargo («gato», «solo», «dios cósmico») más «Hoy ha sido un día horrible…».

## Decisiones que necesito

Ninguna. Falta la autorización de gasto de Josem (hasta $0,05) para T7.
