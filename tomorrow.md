# tomorrow.md — klothulhu

**Parada:** fase 9, H2 (estilo elegible en el móvil, D51): hecha (6fe6415, 014d21b, e922243) e informe en `docs/fase9/H2-informe.md`.
Espero revisión. H1 está cerrado y aprobado (R1 incluida). Automensaje activo: la pareja es `klothulhu-24`.
Worktree `/data/klothulhu-fase9` (rama `fase9`, `.venv` propio). La fase 8 ya está en `main`.

**Siguiente paso:** esperar. El merge `--ff-only` de `fase9` en `/data/klothulhu` y recargar la web en el móvil son de Josem (nginx sirve `main`,
el servidor no se reinicia). Antes de tocar nada, mirar el buzón (`docs/fase9/`).

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso. Config sin versionar: copiar, no symlink.
- Servidor de pruebas de la fase 9 (no producción): desde `fase9/server`,
  `KLOTHULHU_FAKE=1 KLOTHULHU_TOKENS=konnos:token-de-prueba-0123456789 ../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8766`
  y `node web/dev-server.js --api 127.0.0.1:8766` (web en `127.0.0.1:5858`). Gasto 0, sin BD.
- Fase 9: `web/test/fase9-h1.test.js` es normativa (no se edita). `desktop/renderer/index.html`, `main.js`, `preload.js` y
  `state.js` NO se tocan: `web/app.js` es una copia deliberada del reproductor (D50), hay que trasladar a mano los cambios.
- `sse-client.js` es UMD y como `<script>` clásico deja globales (`streamChat`, `forget`, `parseBlock`): por eso `app.js` va en una función.
- Ningún fichero de `web/` puede llevar una URL absoluta (W11), ni siquiera en comentarios.
- `nginx -t` sin ejecutar: lo hace Josem. El nginx sirve `main`, así que el merge va antes.
- K6 (el verde fluido en el móvil) y K8 (girar en un móvil real) solo se prueban en el móvil.
- Pruebas contra la BD real: `KLOTHULHU_TEST_DB=1`, solo `klothulhu_test` / `klothulhu_memoria_test`.
- T10 (`memoria_prueba.py`) y T8 (`memoria_calibrar.py`) no se vuelven a lanzar sin autorización de Josem.
- Automensaje: sin pareja confirmada (la sesión klothulhu-be ya no existe); preguntar a Josem quién es el arquitecto.

**Bloqueos:** ninguno.
