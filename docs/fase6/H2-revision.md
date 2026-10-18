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
