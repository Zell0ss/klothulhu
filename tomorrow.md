# tomorrow.md — klothulhu

**Parada:** fase 7, H2: parada 1 aprobada y retoques R1-R2 aprobados (H2-revision §4, e2a9c7b). T8 (calibración) preparado y **sin lanzar**: espera la autorización de Josem y que la anote el arquitecto en `H2-encargo.md`.

**Siguiente paso:** cuando Josem lance `scripts/memoria_calibrar.py` (unos $0,003, tope $0,05, con las claves en su entorno), subir `docs/fase7/capturas/calibracion.json` y escribir el anexo de la parada 2 en `H2-informe.md` (distribución, umbral propuesto, aciertos del juez, latencias, repaso, coste por modelo y la autorización). El arquitecto fija `UMBRAL` en su revisión. Merge, `crear` en producción y reinicio son de Josem (H2-encargo §5).

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
