# tomorrow.md — klothulhu

**Parada:** fase 9. H4 (D54) aprobado sin retoques (`c981b1f`). H5 (D55: alas de murciélago, motor `afa3ade`, `maxBytes` 500000, iconos nuevos)
implementado y con informe en `docs/fase9/H5-informe.md`; falta la revisión del arquitecto.
Rama `fase9` (adelantada a `main`), worktree `/data/klothulhu-fase9` con `.venv` propio (sin `node_modules`: no hace falta). Pruebas: desktop 84/84, web 31/31, pytest 105 passed (8 skipped).

**Siguiente paso:** mirar el buzón (`docs/fase9/`); si la revisión de H5 pide retoques, hacerlos en el worktree. Falta lo de Josem: el merge `--ff-only`
(sin reinicio: el servidor no cambia), recargar en el móvil, volver a añadir el acceso directo (Samsung guarda el icono de cuando se creó),
probar H4 y H5 en Konnos y en el móvil, y `nginx -t` si no lo ha hecho ya.
No empezar fase ni hito nuevos sin un «adelante». Quitar el worktree (`git worktree remove`) lo decide Josem.

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso. Config sin versionar: copiar, no symlink.
- Servidor de pruebas de la fase 9 (no producción): desde `fase9/server`,
  `KLOTHULHU_FAKE=1 KLOTHULHU_TOKENS=konnos:token-de-prueba-0123456789 ../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8766`
  y `node web/dev-server.js --api 127.0.0.1:8766` (web en `127.0.0.1:5858`). Gasto 0, sin BD.
- Fase 9: `web/test/fase9-h1.test.js` y `desktop/test/fase9-h4.test.js` son normativas (no se editan). `main.js`, `preload.js` y
  `state.js` NO se tocan; `index.html` solo con permiso expreso del encargo (H4 lo dio para dos líneas). `web/app.js` es una copia
  deliberada del reproductor (D50): hay que trasladar a mano los cambios entre los dos clientes.
- El motor vendorizado sale de `main` de claude-fables (`VENDOR.md`). Si un encargo dice que un commit tiene que estar en `main` y no está,
  parar: ese merge es de Josem. Construir con `cd /data/claude-fables/motor && npm ci && npm run build` (deja el repo limpio).
- Para manejar la web a mano hay `playwright-core` en el scratchpad de la sesión (no en el repo) con `/usr/bin/google-chrome`.
  Nunca `pkill -f`/`pgrep -f` con la línea del servidor escrita en el propio comando: coincide con tu shell y lo mata. Mata por PID.
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
- Automensaje: el 2026-11-17 activé `/automensaje-on` con `klothulhu-fc` (tmux `klothulhu-arq`) como arquitecto, deducido del nombre del tmux y sin confirmar por Josem. Los nombres cambian entre sesiones: buscar con `ListAgents` y preguntar si no hay una candidata clara.

**Bloqueos:** ninguno.
