# tomorrow.md — klothulhu

**Parada:** fase 7, H2 (recordar) cerrado en código y aprobado: parada 1, calibración (UMBRAL 0,34), R1-R6 y D47 (H2-revision §7, 127bbff). Último commit de código: 2e302dd. 110 pruebas pasan con `KLOTHULHU_TEST_DB=1`
(92+ sin ella, el resto se salta); `ruff` limpio. Nada más del programador.

**Siguiente paso:** esperar. El despliegue de H2 (merge `--ff-only` de `fase7` en `main` desde `/data/klothulhu` y reinicio de
`klothulhu-api`; `crear` si no se hizo ya, para `memoria_eventos`) es de Josem. Después empieza H3 (semana de uso): llegará
como encargo del arquitecto cuando haya datos. Antes de tocar nada, mirar el buzón y leer ese encargo.

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree `/data/klothulhu-fase7` (`.venv` 3.12 propio, `.env` de desarrollo
  contra `klothulhu_dev`, ignorado).
- Pruebas contra la BD real: `KLOTHULHU_TEST_DB=1`, solo `klothulhu_test` / `klothulhu_memoria_test`.
- `tests/test_fase7_h1.py` y `tests/test_fase7_h2.py` son normativas: no se editan (N2 y N8 las cambió el arquitecto).
  Mis regresiones están en `tests/test_fase7_h1_retoques.py`, `tests/test_memoria_bd.py` y `tests/test_calibrar.py`.
- Con `KLOTHULHU_MEMORIA=1` en producción, los recuerdos entran en las respuestas desde el reinicio, con `UMBRAL = 0.34`
  (`KLOTHULHU_MEMORIA_UMBRAL` lo sobrescribe).
- `scripts/memoria.py eventos [--detalle]` resume `memoria_eventos` para H3; `listar` y `gasto` siguen igual.
- T10 (`memoria_prueba.py`) y T8 (`memoria_calibrar.py`) no se vuelven a lanzar sin autorización de Josem.
- Automensaje activo con klothulhu-be (arquitecto).

**Bloqueos:** ninguno.
