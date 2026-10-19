# tomorrow.md — klothulhu

**Parada:** fase 7, H1 (`fase7`, worktree `/data/klothulhu-fase7`). T1-T9b hechas y commiteadas (último: ca3522a).
Normativas M1-M10 en verde (copiadas a `tests/test_fase7_h1.py`), `ruff` limpio, 70 pasan y 4 se saltan
(las de la BD real). **Falta para la parada 1:** T6 contra `klothulhu_test` y la pasada a mano con
`KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1` contra `klothulhu_dev`.

**Siguiente paso:** cuando Josem ponga la contraseña de `klothulhu_dev` en `/data/klothulhu-fase7/.env` (hoy está
vacío; copiar de `.env.example`) y haya hecho P1 (BD y usuarios):
1. `KLOTHULHU_TEST_DB=1 .venv/bin/python -m pytest -q tests/test_memoria_bd.py`
2. `scripts/memoria.py crear` y la pasada a mano (dos mensajes, esperar el barrido con
   `KLOTHULHU_HISTORY_TTL_MIN=1`, `listar`; otra con «Forget» antes del barrido).
3. Informe `docs/fase7/H1-informe.md` con la salida de `listar` en las dos pasadas, y timbre a klothulhu-be.

**Gotchas:**
- `/data/klothulhu` sigue en `main` (fase 6 sin mergear aún); `.venv` 3.12 propio en este worktree.
- `klothulhu_dev` hoy da «Access denied»: falta P1 o la contraseña. P2 (clave OpenAI) solo hace falta en T10.
- T10 [API] no se lanza sin revisión de la parada 1 y un «sí» de Josem (tope $0,05).
- `escritor_prompt.md` lo revisa el arquitecto.
- Automensaje activo con klothulhu-be (arquitecto).

**Bloqueos:** contraseña de `klothulhu_dev` en `.env` (P1/P3).
