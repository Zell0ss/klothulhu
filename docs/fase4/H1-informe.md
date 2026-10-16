# Fase 4 · H1 — informe

Responde a: 6b878d7 (PLAN)

## Hecho

- T1 `is_cut` en `server/beats.py`; casos compartidos en `tests/fixtures/cut_cases.json` (copiado del plan) y `desktop/test/fase4.test.js` (cliente).
- T2 `TRAVEL` y `continue_scene` en `server/director.py` (pura, copia profunda; `then` se conserva).
- T3 `server/app.py`: cada escena pasa por `continue_scene(última_emitida_corregida, caption_anterior, escena)`. Las `null` de relleno no pasan. Un `log.info` por respuesta (`D23 for <cid>: {continuations, fixed_backdrop, fixed_hero}`).
- T4 `director_prompt.md`: la frase blanda sustituida por la regla de D23 (`(continues)`); `_user_message` añade ` (continues)` tras la emoción.
- T5 (preparación, sin API): `scripts/api_smoke.py` añade `continuations`, `fixed_backdrop`, `fixed_hero` (y `long_beat_replies`) al resumen y por pregunta (`continuity`). Se miden sobre lo que dijo el director **antes** de la corrección del servidor (si no, saldrían siempre 0). Tope `BUDGET = 0.10`. Ruta por defecto `docs/fase4/capturas/` (ya no `docs/fase2/`). Añadidas 3 preguntas de frase larga; no he quitado ninguna.
- Pruebas: `pytest` 37 (26 + 11), `npm test` 35 (34 + 1), `ruff` limpio, `npm run check` ok.
- Ensayo `--fake` a una ruta del scratchpad: corre, 16 preguntas, 0 continuaciones.
- Commits: 00ac02b (T1) · 9d02746 (T2+T4) · 56232eb (T3) · d02fc2b (T5).

## Gasto

0. No he tocado la API.

## Desviaciones

- T2 y T4 van en un solo commit: ambas tocan `director.py` y el prompt, y no se separan sin `add -p`.
- `ruff.toml`: exención de E501 y B905 para `tests/test_fase4.py` (normativo, no se edita), como con `test_fase2.py`.
- El ensayo `--fake` no ejercita la continuidad: las respuestas del modo fake son cortas y dan 0 continuaciones. La continuidad de punta a punta la cubren G7-G9 con el director simulado; el dato real vendrá de T5 con API.
- Un golpe cuyo anterior emitido fue `null` sale tal cual (G9); el contador no lo cuenta como continuación.

## Decisiones que necesito

Ninguna. Para T5 hace falta tu «sí» y la clave en tu shell (autorización ya en el plan: hasta $0.10):
`.venv/bin/python scripts/api_smoke.py --director-thinking 0 --out docs/fase4/capturas/api_smoke.json` y luego `node desktop/scripts/gallery.js docs/fase4/capturas/api_smoke.json docs/fase4/capturas/galeria.html`.
