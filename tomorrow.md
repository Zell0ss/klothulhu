# tomorrow.md — klothulhu

**Parada:** fase 9 cerrada. H1, H2 y H3 aprobados; el último mensaje del buzón es `b1565c8` (revisión del anexo R3 de H3, D53: `img-src 'self' data:`), y dice que no hay nada más que hacer.
`fase9` y `main` están en el mismo commit (`b1565c8`). Worktree `/data/klothulhu-fase9` (rama `fase9`, `.venv` propio).

**Siguiente paso:** ninguno por mi lado. Falta lo de Josem: ver en el Samsung el acceso directo nuevo con icono (hay que volver a añadirlo), y `nginx -t` si no lo ha hecho ya.
No empezar fase ni hito nuevos sin un «adelante». Antes de tocar nada, mirar el buzón (`docs/<fase>/`). Si la fase 9 ya no hace falta como worktree, quitarlo (`git worktree remove`) lo decide Josem.

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso. Config sin versionar: copiar, no symlink.
- Servidor de pruebas de la fase 9 (no producción): desde `fase9/server`,
  `KLOTHULHU_FAKE=1 KLOTHULHU_TOKENS=konnos:token-de-prueba-0123456789 ../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8766`
  y `node web/dev-server.js --api 127.0.0.1:8766` (web en `127.0.0.1:5858`). Gasto 0, sin BD.
- Fase 9: `web/test/fase9-h1.test.js` es normativa (no se edita). `desktop/renderer/index.html`, `main.js`, `preload.js` y
  `state.js` NO se tocan: `web/app.js` es una copia deliberada del reproductor (D50), hay que trasladar a mano los cambios.
- `sse-client.js` es UMD y como `<script>` clásico deja globales (`streamChat`, `forget`, `parseBlock`): por eso `app.js` va en una función.
- Ningún fichero de `web/` puede llevar una URL absoluta (W11), ni siquiera en comentarios.
- La CSP del cliente web es `img-src 'self' data:` (D53): los iconos del manifest y el favicon dependen de `'self'`.
- **Fallo conocido, sin arreglo (2026-11-09):** el Samsung Internet 30.0.5 con el modo oscuro de sitios filtra la imagen de la escena
  (`<img id="scene">`): los trazos negros salen gris claro y los colores lavados. El resto de la página, ya oscura, se ve bien.
  Apaño: botón «Sitios claros» del menú del navegador. En Chrome 149 con oscurecimiento forzado, R2 (meta y `color-scheme: dark`) sí funciona.
  Probadas en el móvil y sin efecto: `light dark` con `prefers-color-scheme`, escena como fondo CSS, `<iframe>` y `<object>`.
  Descartado: `<canvas>`, porque congela la animación del SVG. Sin ideas baratas; no reabrir sin un dato nuevo.
- K6 (el verde fluido en el móvil) y K8 (girar en un móvil real) solo se prueban en el móvil.
- Pruebas contra la BD real: `KLOTHULHU_TEST_DB=1`, solo `klothulhu_test` / `klothulhu_memoria_test`.
- T10 (`memoria_prueba.py`) y T8 (`memoria_calibrar.py`) no se vuelven a lanzar sin autorización de Josem.
- Automensaje: la última sesión tenía como pareja a `klothulhu-24`; otra anotación decía que no había pareja confirmada. Preguntar a Josem quién es el arquitecto antes de usarlo.

**Bloqueos:** ninguno.
