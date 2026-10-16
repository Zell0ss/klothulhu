# tomorrow.md — klothulhu

**Parada:** fase 4, H1 y H2 aprobados por el arquitecto (H2-revision, ac957fd). Código en `fase4` (worktree
`/data/klothulhu-fase4`, pushed), sin merge a `main`. Gasto de la fase: $0,0138 de $0,10.

**Siguiente paso:** nada del programador hasta el juicio de Josem sobre `docs/fase4/capturas/galeria.html`.
Si no convence, llega como `H3-encargo.md`. Si convence: Josem hace merge `--ff-only` de `fase4` en `main` desde
`/data/klothulhu` y reinicia `klothulhu-api` (cambia `server/`); Konnos no necesita nada. La fase 5 (bocadillo con
scroll) espera a claude-fables.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree.
- `api_smoke.py`: pasa siempre `--out` explícito (por defecto `docs/fase4/capturas/`, nunca `docs/fase2/`); guarda `director_raw`.
- `continuations`/`fixed_*` se miden sobre la salida cruda del director, antes de `continue_scene`.
- `tests/test_fase4.py` y `cut_cases.json` son normativos: no se editan.
- Pasos [API]: la clave la pone Josem en su shell; yo no la tengo.

**Bloqueos:** ninguno.
