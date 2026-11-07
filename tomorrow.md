# tomorrow.md — klothulhu

**Parada:** fase 9, H3 (icono para la pantalla de inicio, D52): piezas hechas (80ec69a, bf2d546, cd553d9) e informe en `docs/fase9/H3-informe.md`,
**con una decisión abierta: la CSP (`img-src data:`) bloquea el favicon y los iconos del manifest** (medido en Chrome). Arreglarlo toca `img-src`, fijado por W10: lo decide el arquitecto.
H1 y H2 cerrados y aprobados. Automensaje activo: la pareja es `klothulhu-24`. Worktree `/data/klothulhu-fase9` (rama `fase9`, `.venv` propio). La fase 8 ya está en `main`.

**Siguiente paso:** esperar la decisión (A: `img-src 'self' data:` y el arquitecto cambia W10; B: iconos como `data:` URI). Si es A, cambiar en `icons.test.js` el aviso de `img-src`.
El merge de `fase9` a `main` (último en `main`: `e62ee99`, sin R2 ni H3) y volver a añadir el acceso directo en el móvil son de Josem. Antes de tocar nada, mirar el buzón (`docs/fase9/`).

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
