---
proyecto: klothulhu
fase: 6
hito: H2
fecha: 2026-10-19
veredicto: parada 1 aprobada; T7 [API] pendiente de la autorización de Josem
---

# Fase 6 · H2 — revisión (parada 1)

Revisado contra el código de `27c6531..a89e616` y el encargo (`793381b`), no contra el informe.

## 1. Comprobado

- **T1:**
  - el IIFE vendorizado tiene el sha256 `90368402…6459`, el que entrega claude-fables;
  - `fables_vocab.json` solo cambia `schemaVersion` y las tres acciones;
  - P9, I2 y H2 cambian solo la línea indicada.
- **T2-T5:**
  - `sad` va la última en `EMOTIONS`, en el parser y en `scenes.js`;
  - `STAGING.sad` es la de la tabla;
  - el narrador y el director llevan el texto del encargo;
  - `OPENING_ONLY` está en `build_scene`;
  - `TRAVEL` y `continue_scene` no cambian;
  - la escena 2 del saludo va con `emerge` 50→50 y luego `angry`.
- **T6:** las tres normativas son idénticas a las del buzón (`cmp`).
- **T7 preparado:**
  - 21 preguntas;
  - `BUDGET` de $0,05;
  - la salida va a `docs/fase6/capturas/`;
  - los contadores `new_actions`, `emotions` y `sad_questions`.

  No hay capturas en el repo: el ensayo `--fake` se quedó en el scratchpad.
- **Verde:** `pytest` 47, `npm test` 64, `npm run check` y `ruff`.
- **Desviaciones:** T2 y T5 van en un commit; `SAD_QUESTIONS` son las cuatro. Las dos, aceptadas.

## 2. Hallazgos

- **Menor, sin retoque:** en `director_prompt.md`, la frase de `emerge` y «Played once: …» quedan en una sola
  línea muy larga. Al modelo le da igual y Q5 pasa. Atribución: implementación, aceptable.

## 3. Veredicto

**Parada 1 aprobada.** T7 se lanza cuando Josem autorice el gasto en el chat (hasta $0,05; se esperan
~$0,008). Lo anotaré en el frontmatter del encargo.

## Para el programador

Responde a: a89e616 (H2-informe, parada 1)

Parada 1 aprobada. **No lances T7:** espera a que anote la autorización de Josem en el frontmatter de
`H2-encargo.md`. La pasada la lanza Josem con la orden del §2 T7. Después, el anexo de la parada 2.

## 4. Revisión del anexo de la parada 2 (2026-10-19)

Responde a: 2bc2bb4 (H2-informe, anexo de la parada 2)

### Comprobado contra `capturas/api_smoke.json`, no contra el informe

- **Gasto:** $0,007604 (narrador $0,003132 + director $0,004472), con tope de $0,05; autorización anotada en 4fc61d4. Coincide.
- **Sin regresiones:** 21 preguntas, 43 golpes, `null_scenes` 0, continuaciones 0, `error` vacío, 6 fondos distintos, 0 golpes de ≤3 palabras.
- **D28, parte del narrador:** `sad` sale como emoción en las 4 preguntas tristes (7 tramos). El indicador «el narrador no elige `sad`» **no se dispara**.
- **D30:** `emerge` sale en 10 de 43 tramos y en 9 de 21 respuestas. Nunca en `then` (el servidor lo quita, y se ve en los datos). Siempre con `smug`: 10 de los 15 tramos `smug`. Ni «nunca» ni «casi todas»: el indicador **no se dispara**.
- Los números del informe son los del JSON.

### Hallazgos

1. **`despair` casi no sale (1/21) y en «dios cósmico» el director eligió `sad`+`then: sleep`, no `despair`.** V3 del encargo esperaba `despair`; no lo verás. Atribución: hueco del plan (el prompt describe `despair` pero el encargo no fijaba cuándo). No es un fallo de D28/D33: ninguna decisión pide una frecuencia de `despair`. Sin retoque.
2. **`sad` con `then: sleep` en 2 de las 4 preguntas tristes** («Me siento muy solo», «dios cósmico»). La acción principal es `sad`, pero el final de la escena es `sleep`, justo lo que D28 quería distinguir. Lo decide el ojo de Josem en V2, no los números. Atribución: comportamiento del director, no de la implementación.
3. **`emerge` en «Hola, ¿cómo estás?» y en «diferencia entre lista y tupla»**: no son amenaza ni grandeza. Dos de cada tres tramos `smug` acaban en `emerge`; puede volverse el gesto por defecto de `smug`. Vigilar, sin retoque.

### Veredicto

**Parada 2 aprobada; H2 queda a falta de la prueba de Josem en Konnos (V1-V4).**

- **D30 pasa a `vigente`** (su indicador se mide en la galería y no se dispara). Anotado en la ficha.
- **D28 sigue `tentativa`:** su segunda mitad («la escena no se distingue de `sleepy`») es visual y se cierra con V2.
- Para V3, Josem mira «dios cósmico» (`sad` + `then: sleep`) y dice si se lee como la pena propia de klothulhu o como cansancio.

## Para el programador

Responde a: 2bc2bb4 (H2-informe, anexo de la parada 2)

Parada 2 aprobada. **No hay retoques ni código nuevo.** Para aquí: H2 espera la prueba de Josem en Konnos (V1-V4); el merge de `fase6`, el reinicio de `klothulhu-api` y el `git pull` en Konnos son suyos. Si V1-V4 trae algo, te llegará una sección nueva al final de esta revisión.
