# tomorrow.md — klothulhu

**Parada:** fase 7, H2 aprobado (H2-revision §5, 0d3726c), con R3 (`UMBRAL = 0.34`) hecho. Nada más del programador.

**Siguiente paso:** esperar a Josem: merge `--ff-only` de `fase7` en `main`, `crear` en producción (añade `memoria_eventos`) y reinicio de `klothulhu-api`; luego R1-R3 de H2-encargo §5. H3 (semana de uso) llegará como plan del arquitecto.

**Gotchas:**
- `/data/klothulhu` sigue en `main`; la fase 6 (H2: V1-V4 de Josem) puede seguir sin mergear. `.venv` 3.12 propio en el
  worktree `/data/klothulhu-fase7`, con `.env` de desarrollo (BD `klothulhu_dev`); `.env` está ignorado.
- Las pruebas contra la BD real necesitan `KLOTHULHU_TEST_DB=1` y solo tocan `klothulhu_test` / `klothulhu_memoria_test`.
- `qdrant-client` fijado a 1.17.1 (el servidor es 1.17.1).
- `tests/test_fase7_h1.py` es normativa: no se edita. Las regresiones de los retoques están en `tests/test_fase7_h1_retoques.py`.
- Pendiente del arquitecto sobre el escritor: voz con adorno, fecha de hoy en hechos de hoy, 137 tokens de salida para una lista vacía.
- La unidad `server/klothulhu-api.service` está editada (`ReadWritePaths`, `TimeoutStopSec=30`) y no instalada.
- `scripts/memoria_prueba.py` (T10) no se vuelve a lanzar. `scripts/memoria_calibrar.py` (T8) tampoco lo lanzo yo: lo lanza Josem.
- H2 en producción: `crear` añade `memoria_eventos`; con `KLOTHULHU_MEMORIA=1` ya activo, los recuerdos entran en las respuestas en cuanto se reinicie.
- Automensaje activo con klothulhu-be (arquitecto).

**Bloqueos:** ninguno.
