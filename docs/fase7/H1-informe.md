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

## Anexo — Parada 1, retoques R1-R5 (2026-10-19)

Responde a: 4987715 (H1-revision, «Para el programador»)

**Hecho** (commits 1afbdaa R1, 4ebbb0c R2, 18e7894 R3/R4, 30f4b35 punto 5):
- **R1:** `Freno.frenado` (último estado, sin consulta); `/health` lo usa. Regresión: con un almacén cuyo `gasto_total()` lanza, `health()` responde.
- **R2:** `dia_actual()` en los dos almacenes y en el contrato de `test_memoria_bd.py`; `listar` lo usa.
- **R3:** `_barrido(parar)` espera `BARRIDO_S` o el evento y cierra todas las que saca; `_apagar()` pone el evento, espera la tarea y cierra `todas()` dentro de `APAGADO_S`. Si se agota, el `warning` da solo el número de sesiones sin cerrar. Regresión (`tests/test_fase7_h1_retoques.py`): escritor lento, parada a mitad del cierre → quedan anotadas la caducada (`ttl`) y la abierta (`apagado`).
- **R4:** `director.py` solo `type(exc).__name__`; `app.py` sin `exc_info`, con el tipo en el mensaje. `app.py:243` intacto. Ninguna prueba normativa anterior chocó.
- **Punto 5:** `qdrant-client==1.17.1` en `requirements.txt`; ya no sale el aviso de compatibilidad.

**Pruebas:** 79 pasan con `KLOTHULHU_TEST_DB=1` (incluida T6 contra `klothulhu_test`); sin esa variable, 4 se saltan. `ruff` limpio.

**R5 (apagado real)**, `KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1`, TTL 30, `klothulhu_dev`, puerto 8791: dos mensajes y `kill -TERM` al uvicorn.
```
2 recuerdos (fuerza en el día de uso 1)
d82b47ea   0.50    2 smug  -  0  sí 2026-10-19 23:02  Un mortal habló conmigo en modo de pruebas.   (pasada anterior)
da4750c5   0.50    2 smug  -  0  sí 2026-10-19 23:08  Un mortal habló conmigo en modo de pruebas.   (nuevo)

sesiones: 000d0232  pasada  apagado  2 vueltas  1 recuerdo  0.0000352
          e7662d16  pasada  ttl      2 vueltas  1 recuerdo  0.0000352   (pasada anterior)
```
Log: `sesión 000d0232-… cerrada: 2 vueltas, 1 recuerdos, coste 0.000035`.

**Gasto:** 0 real (falsos). **Desviaciones:** el commit 1afbdaa lleva también las regresiones de R2 y R3 (un solo fichero de pruebas). **Decisiones que necesito:** ninguna. Paro aquí; T10 no se ha lanzado.
