Responde a: 1aa5dda (PLAN.md, Fase 7 H0)

# H1 · Informe de la parada 1

## Hecho

T1-T9b, un commit por tarea (1c06ea2 … ca3522a; `tomorrow.md` 2cf37f6).

- **Pruebas:** normativas M1-M10 copiadas a `tests/test_fase7_h1.py` sin tocar, en verde. Sin `KLOTHULHU_TEST_DB`:
  70 pasan y 4 se saltan (las de la BD real). Con `KLOTHULHU_TEST_DB=1`, `tests/test_memoria_bd.py` pasa entero
  (8) contra `klothulhu_test` / `klothulhu_memoria_test`. `ruff` limpio.
- **Pasada a mano** (`KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1 KLOTHULHU_HISTORY_TTL_MIN=1`, puerto 8791, contra
  `klothulhu_dev`; `scripts/memoria.py crear` antes). `/health` dijo `memoria: {enabled: true, frenada: false}`.
  1. Dos mensajes, esperar al barrido, `listar`:
     ```
     BD klothulhu_dev · colección klothulhu_memoria_dev
     1 recuerdos (fuerza calculada en el día de uso 1)
     d82b47ea   0.50    2 smug      -              0  sí 2026-10-19 23:02  Un mortal habló conmigo en modo de pruebas.
     ```
     `gasto`: total $0,000035 (escritor falso: 100 in / 50 out; embedding falso: 10 in). Log:
     `sesión e7662d16-… cerrada: 2 vueltas, 1 recuerdos, coste 0.000035` (sin texto).
  2. Dos mensajes, `DELETE /history` («Forget») antes del barrido y espera de más de 2 minutos: `listar` sigue
     con el mismo recuerdo y el log tiene una sola línea «cerrada». Forget tiró la sesión sin escribir.

## Gasto

0. Todo con falsos; los $0,000035 de `memoria_gasto` son del escritor y el embedder falsos, en `klothulhu_dev`.
T10 no se ha lanzado.

## Desviaciones

- `registro.py`: el puente reenvía nivel y mensaje a loguru; el JSON de LogCentral no lleva el módulo de origen.
- `cierre.cerrar()` admite un `motivo` opcional (`ttl` por defecto; `app` pasa `apagado` al parar). El contrato no
  lo nombraba, pero `anotar_sesion` lo exige.
- `AlmacenMariaQdrant` tiene además `vaciar()` (solo `_test`), `gasto_desglose()`, `sin_indexar()` e `indexar()`,
  para el script y las pruebas.
- `.gitignore`: sustituí `logs/` por `logs/*.log` y añadí `.env` (no estaba ignorado), para que `logs/.gitkeep` se versione.
- `escritor_prompt.md` está escrito con las reglas del plan; falta tu revisión.

## No probado

- El cierre al apagar (`todas()` con el límite de 20 s): no lo he ejercitado con un `SIGTERM` real.
- La unidad systemd está editada (`ReadWritePaths`, `TimeoutStopSec=30`) y no instalada.
- El escritor y el embedder reales (T10).

## Decisiones que necesito

Ninguna. Aviso: `qdrant-client` 1.19.1 avisa de incompatibilidad con el servidor Qdrant 1.17.1 (diferencia de
versión menor 2; el límite es 1). Funciona en todas las pruebas; la pregunta es si se fija el cliente más cerca
del servidor o se pasa `check_compatibility=False`.
