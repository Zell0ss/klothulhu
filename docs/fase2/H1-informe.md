# Fase 2 · H1 — informe

Responde a: fd869fb (PLAN.md, fase 2)

## Hecho

T0–T7 completas, commit `5bd1ed6` (rama `fase2`, subida a origin).

- **T0** `.venv` 3.12.14 en el worktree. `requirements.txt` fijado (fastapi 0.143.2, uvicorn 0.54.0,
  anthropic 1.15.0) y `requirements-dev.txt` (pytest 9.1.1, ruff 0.17.1). Los 3 avisos de `ruff`
  arreglados; `ruff check .` limpio.
- **T1** `desktop/scripts/export-vocab.js` y `server/fables_vocab.json`; nota en `VENDOR.md`.
- **T2** `server/beats.py`: puerto de `beats()`; pasa `beats_cases.json`.
- **T3** `server/director.py` y `server/director_prompt.md`: `load_vocab`, `MAX_PROPS`, `output_schema`,
  `system_prompt`, `build_scene`, `direct`, `fake_direct`.
- **T4** `server/app.py`: ajustes nuevos (también en `klothulhu.env.example`), `_director`, evento `scene`,
  `/health` con `director`, `output_config={"effort": EFFORT}` en el narrador, aviso si `refusal`,
  docstring del contrato.
- **T5** `server/prompt.md`: regla de 70 caracteres por frase. Los dos ejemplos ya la cumplían (39, 58, 30 y 46).
- **T6** `README.md` («API contract», ajustes, Python 3.12) y `CLAUDE.md` del repo.
- **T7** Pruebas normativas copiadas tal cual a `tests/test_fase2.py` y `desktop/test/fase2.test.js`.

Resultado: `pytest -q tests` 21 pasan; `ruff check .` limpio; `npm test` 17 pasan; `npm run check` ok.

## Gasto

0. En H1 no se llama a la API. El tope de $1 para la fase (Josem, 2026-10-15, en la ventana del
arquitecto) queda intacto para H2.

## Desviaciones

1. **`ruff.toml`**: `src = ["server", "tests"]`, para que `ruff` trate `emotion_parser`, `history`,
   `director`, etc. como módulos propios. Sin eso, el arreglo automático de imports reordenaba `app.py` de
   forma absurda. También `target-version = "py312"` (D17).
2. **`ruff.toml`**: `per-file-ignores` de `E501` y `B905` solo para `tests/test_fase2.py`. El fichero es
   normativo y no se edita, y esos dos avisos eran de estilo.
3. **Orden en `_reply`**: el historial se guarda **antes** de mandar los eventos `scene`, no después
   como dice el plan. Si el cliente se desconecta mientras espera al director, el turno ya está guardado.
   Cualquier cliente que lea hasta `done` ve lo mismo, y N7 pasa igual.
4. `fake_direct` usa tres puestas en escena fijas, rotando por golpe.

## Decisiones que necesito

Ninguna. Dos observaciones para el arquitecto, sin bloquear nada:

- El prompt del director ocupa ~2.000 caracteres (unos 500–600 tokens), no «≥1K tokens» como decía §1. Puede
  quedar en el borde del mínimo de caché (512). `cache_control` está puesto igualmente; en H2 se verá en
  `cache_read_input_tokens` si cacheó.
- `direct` descarta con `zip(..., strict=False)` las escenas de más y rellena con `None` las que faltan,
  como pide N6/N12.

Parada de H1. Espero la revisión.
