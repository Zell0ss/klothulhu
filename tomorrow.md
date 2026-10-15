# tomorrow.md — klothulhu

**Parada:** fase 2 aprobada por el arquitecto (H3-revision §6, 2026-10-15). Código en `fase2`, sin merge a `main`.
Gasto de la fase: $0.0187 de $1.

**Siguiente paso:** nada del programador. Josem despliega (PLAN §6 de `docs/fase2/PLAN.md`): merge `--ff-only` de
`fase2` en `main` desde `/data/klothulhu`, `.venv` de producción con Python 3.12, reinicio de `klothulhu-api`
y `/health` con `director`. Después, lo que vea Josem llega como encargo nuevo; la fase 3 es el cliente.

**Gotchas:**
- Desarrollo en el worktree `/data/klothulhu-fase2` (`.venv` 3.12 propio); `/data/klothulhu` se queda en `main`.
- `KLOTHULHU_DIRECTOR_THINKING` no hace falta en el env: por defecto `0` (D20).
- Las pruebas `tests/test_fase2.py` y `tests/test_fase2_plazo.py` son normativas: no se editan.
- El corte de frases largas (D18) tiene que ser idéntico en `server/beats.py` y `desktop/renderer/scenes.js`.
- Pasos [API]: `scripts/api_smoke.py` con la clave en el shell de Josem; yo no la tengo.

**Bloqueos:** ninguno.
