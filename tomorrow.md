# tomorrow.md — klothulhu

**Parada:** fase 7, H2: parada 1 entregada (H2-informe.md), T1-T7 hechas. T8 no se lanza: espera revisión y autorización.
cerrados en `fase7` (último código: bb4cb04; anexo y captura de T10: 6495a4c). 79 pruebas pasan con
`KLOTHULHU_TEST_DB=1`; 74 pasan y 5 se saltan sin ella. T10 real hecha por Josem ($0,00077). Nada más del programador.

**Siguiente paso:** esperar el plan de H2 (`docs/fase7/PLAN.md` §7, completado por el arquitecto, que avisará). Antes de
tocar código, mirar el buzón y leer ese plan. El merge `--ff-only` de `fase7` en `main`, `/etc/klothulhu/klothulhu.env`,
`scripts/memoria.py crear` en producción, instalar la unidad y reiniciar `klothulhu-api`, y `vector.toml`, son de Josem
(PLAN.md §6).

**Gotchas:**
- `/data/klothulhu` sigue en `main`; la fase 6 (H2: V1-V4 de Josem) puede seguir sin mergear. `.venv` 3.12 propio en el
  worktree `/data/klothulhu-fase7`, con `.env` de desarrollo (BD `klothulhu_dev`); `.env` está ignorado.
- Las pruebas contra la BD real necesitan `KLOTHULHU_TEST_DB=1` y solo tocan `klothulhu_test` / `klothulhu_memoria_test`.
- `qdrant-client` fijado a 1.17.1 (el servidor es 1.17.1).
- `tests/test_fase7_h1.py` es normativa: no se edita. Las regresiones de los retoques están en `tests/test_fase7_h1_retoques.py`.
- Pendiente del arquitecto sobre el escritor: voz con adorno, fecha de hoy en hechos de hoy, 137 tokens de salida para una lista vacía.
- La unidad `server/klothulhu-api.service` está editada (`ReadWritePaths`, `TimeoutStopSec=30`) y no instalada.
- `scripts/memoria_prueba.py` (T10) no se vuelve a lanzar.
- Automensaje activo con klothulhu-be (arquitecto).

**Bloqueos:** ninguno; espero el plan de H2.
