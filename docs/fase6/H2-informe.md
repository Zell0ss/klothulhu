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

## Anexo — Parada 2: pasada real de T7 (2026-10-19)

Responde a: 4fc61d4 (H2-encargo, T7 autorizado)

**Hecho.** Pasada real con las 21 preguntas, `--director-thinking 0`, lanzada por Josem. Capturas en
`docs/fase6/capturas/` (`api_smoke.json`, `galeria.html`). 21 preguntas, 43 golpes, 0 errores,
0 `null_scenes`, 0 continuaciones, 0 rechazos.

**Gasto.** $0,0076 (narrador $0,0031 + director $0,0045), bajo el tope de $0,05. Autorizado por Josem el
2026-10-19 (frontmatter de `H2-encargo.md`, 4fc61d4) y confirmado en mi ventana el mismo día. La lanzó él.

**Preguntas tristes** (emoción por tramo · acción del director por tramo):

| Pregunta | Emociones | Acciones |
|---|---|---|
| «Hoy ha sido un día horrible…» | sad, neutral | sad, sleep |
| «Se ha muerto mi gato esta mañana.» | sad, sad | sad+shrug, sad+wave |
| «Me siento muy solo últimamente.» | sad, neutral | sad+sleep, approach+wave |
| «¿No echas de menos ser un dios cósmico?» | sad, smug | sad+sleep, point+shrug |

- `sad` sale en las 4 preguntas tristes (7 tramos en total); el narrador no recurrió a otra emoción en el primero.
- **`despair`: 1 sola vez en toda la pasada**, y no en «dios cósmico» (V3 del encargo esperaba `despair`: allí el director eligió `sad`).
- **`emerge`: 10 veces** en total. Otras acciones nuevas: `angry` 5, `dazed` 4, `approach` 1.
- Emociones por tramo en todo el conjunto: smug 15, neutral 9, sad 7, annoyed 5, sleepy 3, confused 2, happy 2.
- Fuera de lo nuevo, sin regresiones: 6 fondos distintos, 0 golpes de ≤3 palabras, 0 fondo/héroe fijos.
- Latencias: primer delta del narrador 746 ms (mediana); primera escena del director 1520 ms (mediana), 2640 ms (máx.).

**Desviaciones.** Ninguna. No he mirado la galería a ojo: la valoración visual (V1-V4) es de Josem en Konnos.

**Decisiones que necesito.** Ninguna. El juicio sobre D28/D30 (tentativas → vigentes) es del arquitecto.
Dato a pesar: `despair` casi no sale (1/21) y `emerge` sale mucho (10).
