# tomorrow.md — klothulhu

**Parada:** fase 4, H1 hecho en `fase4` (worktree `/data/klothulhu-fase4`, pushed): T1-T4 y preparación de T5.
Informe: `docs/fase4/H1-informe.md`. Falta la revisión del arquitecto.

**Siguiente paso:** tras la revisión, Josem lanza T5 [API] (hasta $0.10, ya autorizado en el PLAN) y yo escribo
`docs/fase4/H2-informe.md` con coste por modelo, `continuations`, `fixed_backdrop`, `fixed_hero` y ruta de la galería.
Merge `--ff-only` de `fase4` en `main` y reinicio de `klothulhu-api`: de Josem.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree.
- `api_smoke.py` escribe por defecto en `docs/fase4/capturas/`; pasa siempre `--out` explícito. Nunca a `docs/fase2/`.
- `continuations`/`fixed_*` se miden sobre la salida cruda del director, antes de `continue_scene`.
- `--fake` no genera continuaciones (respuestas cortas); la continuidad se prueba con G7-G9.
- `tests/test_fase4.py` y `cut_cases.json` son normativos: no se editan.

**Bloqueos:** ninguno.
