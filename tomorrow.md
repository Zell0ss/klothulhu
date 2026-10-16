# tomorrow.md — klothulhu

**Parada:** fase 3, plan aprobado (H0-revision, 9f6b829) y T1-T7 hechas en `fase3` (worktree `/data/klothulhu-fase3`,
pushed). Informe: `docs/fase3/H1-informe.md`. Falta la prueba L1-L7 de Josem en Konnos (PLAN §5) y la revisión.

**Siguiente paso:** nada del programador hasta la revisión o un encargo nuevo. Merge `--ff-only` de `fase3` en `main`
desde `/data/klothulhu`: lo hace Josem, y el cliente no necesita reinicio del servidor.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree.
- `play(item)` en `index.html` recibe un item `{kind, caption, scene?, tone?}`; no la firma antigua de la fase 1.
- Humo sin Electron: `scratchpad/smoke.js` (se pierde con la sesión; el informe cuenta qué comprobaba).
- Pasos [API]: `scripts/api_smoke.py` con la clave en el shell de Josem; yo no la tengo.

**Bloqueos:** ninguno.
