# tomorrow.md — klothulhu

**Parada:** fase 5, H1 hecho en `fase5` (worktree `/data/klothulhu-fase5`): T1-T6 y preparación de T7, todo en verde
(pytest 42, npm test 42). Informe: `docs/fase5/H1-informe.md`. Falta la revisión del arquitecto.

**Siguiente paso:** tras la revisión, Josem autoriza el gasto de T7 [API] (tope $0,10; anotarlo en el informe H2) y lo
lanza; yo escribo `docs/fase5/H2-informe.md` (coste por modelo, métricas, 2-3 respuestas con sus tramos, ruta de la
galería). Después H3: Josem prueba en Konnos contra el servidor de la rama en el puerto 8766 (orden en H1-informe).
Merge `--ff-only` de `fase5` en `main`, reinicio de `klothulhu-api` y `git pull` en Konnos: de Josem, **el mismo día**.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree (`npm ci` hecho en `desktop/`).
- Normativas de la fase: `tests/test_fase5.py`, `tests/fixtures/tramos_cases.json`, `desktop/test/fase5.test.js`
  (copias de `docs/fase5/normativas/`, no se editan). P9 (fase1) y G7-G9 (fase4) son las únicas antiguas tocadas.
- `api_smoke.py`: pasa siempre `--out` explícito; nunca a `docs/fase2/` ni `docs/fase4/`.
- `beats()` y sus pruebas se quedan aunque ya no pinten (deuda para otra fase).
- Pasos [API]: la clave la pone Josem en su shell; yo no la tengo.

**Bloqueos:** autorización de gasto de T7 (Josem).
