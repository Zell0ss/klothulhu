# tomorrow.md — klothulhu

**Parada:** fase 8, H1 (segundo avatar, D49): T1-T6 hechas (58a3fda … dc6ce99) e informe entregado en `docs/fase8/H1-informe.md`.
Espero revisión. Worktree `/data/klothulhu-fase8` (rama `fase8`, `.venv` y `node_modules` propios). La fase 7 ya está en `main`.

**Siguiente paso:** esperar. El merge `--ff-only` de `fase8` y la prueba K1-K7 en Konnos son de Josem (el servidor no se reinicia).
Antes de tocar nada, mirar el buzón (`docs/fase8/`).

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso (hoy `/data/klothulhu-fase8`, `.venv` 3.12 propio).
  El de la fase 7 (`/data/klothulhu-fase7`, con su `.env` de desarrollo contra `klothulhu_dev`) sigue ahí para cualquier retoque.
- Pruebas contra la BD real: `KLOTHULHU_TEST_DB=1`, solo `klothulhu_test` / `klothulhu_memoria_test`.
- `tests/test_fase7_h1.py` y `tests/test_fase7_h2.py` son normativas: no se editan (N2 y N8 las cambió el arquitecto).
  Mis regresiones están en `tests/test_fase7_h1_retoques.py`, `tests/test_memoria_bd.py` y `tests/test_calibrar.py`.
- Con `KLOTHULHU_MEMORIA=1` en producción, los recuerdos entran en las respuestas desde el reinicio, con `UMBRAL = 0.34`
  (`KLOTHULHU_MEMORIA_UMBRAL` lo sobrescribe).
- `scripts/memoria.py eventos [--detalle]` resume `memoria_eventos` para H3; `listar` y `gasto` siguen igual.
- T10 (`memoria_prueba.py`) y T8 (`memoria_calibrar.py`) no se vuelven a lanzar sin autorización de Josem.
- Automensaje: sin pareja confirmada (la sesión klothulhu-be ya no existe); preguntar a Josem quién es el arquitecto.
- Fase 8: `desktop/test/fase8-h1.test.js` es normativa (no se edita). `parseState`/`readState` no cambian (M4, M5 de la fase 6): el avatar va por `parseAvatar`/`readAvatar`.
- K6 (que el verde no vaya a tirones con escenas pesadas) solo se prueba en Konnos; el tray y el renderer no se pueden ejecutar en seb01.

**Bloqueos:** ninguno.
