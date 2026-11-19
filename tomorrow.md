# tomorrow.md — klothulhu

**Parada:** fase 11, H1 único (klothulhu busca: búsqueda web del narrador, D58, D59, D60) **hecho e informado** (`eb0503c`,
`docs/fase11/H1-informe.md`); el turno es del arquitecto. Commits: `6cd0c89` servidor, `c72b988` clientes, `2d863a8`
pasos de despliegue + capturas, `6c389fc` prueba con el SDK real. Pruebas: pytest 139 passed (8 skipped), `ruff` limpio,
desktop 103/103, web 31/31. Normativas S1-S10 y B1-B4 copiadas tal cual (`cmp` vacío). Gasto 0.
Las fases 9 y 10 están cerradas y aprobadas. Rama `fase11`, worktree `/data/klothulhu-fase11` con `.venv` propio (sin
`node_modules`: no hace falta). Los worktrees de las fases 9 y 10 ya no existen.

**Siguiente paso:** antes de tocar nada, mirar el buzón (`docs/fase11/`): si llega `H1-revision.md`, el turno es mío.
**Pendiente de Josem (informe, «Decisiones que necesito»):** el «sí» para **A1 [API]** (3 mensajes con `KLOTHULHU_FAKE=0`
contra el servidor de pruebas, < $0,05; la clave, solo la línea `ANTHROPIC_API_KEY` de `/etc/klothulhu/klothulhu.env`, sin
imprimirla; el permiso de 1 € de la fase 10 NO se extiende). Sin ese «sí», A1 no se hace. Si en A1 busca en la charla, se ajusta
el párrafo «The grimoires» de `server/prompt.md` y se repite solo ese mensaje.
Lo de Josem para desplegar (`deploy/PASOS-CON-SUDO.md` §6): merge `--ff-only` de `fase11` → reiniciar `klothulhu-api.service` →
recargar el móvil; en Konnos, `git pull` y reiniciar la app. nginx no cambia. Después K1-K6 de `docs/fase11/PLAN.md` §6.
No empezar fase ni hito nuevos sin un «adelante». Quitar el worktree lo decide Josem.

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso. Config sin versionar: copiar, no symlink.
- Servidor de pruebas (no producción): desde `<worktree>/server`,
  `KLOTHULHU_FAKE=1 KLOTHULHU_TOKENS=konnos:token-de-prueba-0123456789 ../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8766`
  y `node web/dev-server.js --api 127.0.0.1:8766` (web en `127.0.0.1:5858`; `--port` lo cambia). Gasto 0, sin BD. Con imagen, la respuesta
  enlatada dice cuántos KB llegaron; un texto que empieza por «busca» da la búsqueda enlatada (escena de buscar, 4 s, fuentes de `example.org`).
- Normativas que no se editan: `web/test/fase9-h1.test.js`, `desktop/test/fase9-h4.test.js`, `tests/test_fase10.py`, `desktop/test/fase10.test.js`
  (y sus copias en `docs/<fase>/normativas/`). `web/app.js` es una copia deliberada del reproductor (D50): hay que trasladar a mano los cambios
  entre los dos clientes (la fase 10 usó el mismo `errorItem`/`attach` en los dos).
- Imágenes (D56, D57): nunca a disco ni a los logs; la memoria larga y el director ven `imagen.texto_memoria`, no la imagen. Sin `max_length` en
  `ImagenIn.data` (el 422 de Pydantic devolvería la imagen). El cliente reduce a 1280 px / JPEG 0,85 (`imagen.reducir`); el servidor topa en 4 MB.
- El 📷 de la web va en la fila de entrada, no en `#bar`: en la barra, «Klothulhu» queda recortado a 360 y 390 px (D51).
- Los clientes no pasan `figure` a `renderScene`: con `look: 'pixel'` pintan el sprite; la figura 3D solo sale con estilos cuyo `figure` ya es 3D
  (p. ej. `aero`, `ukiyoe`). Confirmado por el arquitecto (`docs/fase9/H6-revision.md` §3).
- El motor vendorizado sale de `main` de claude-fables (`VENDOR.md`). Si un encargo dice que un commit tiene que estar en `main` y no está,
  parar: ese merge es de Josem. Construir con `cd /data/claude-fables/motor && npm ci && npm run build` (deja el repo limpio).
- Pruebas a mano: `playwright-core` en el scratchpad de la sesión (no en el repo) con `/usr/bin/google-chrome`. **Electron de Linux real** (para probar
  el IPC): `npm install --no-save electron@44.4.5` en una copia de `desktop/` en el scratchpad (hace falta además `node install.js` dentro de
  `node_modules/electron`) y `xvfb-run -a node guion.js` con `_electron.launch`. El `node_modules/electron` de `/data/klothulhu/desktop` es el de
  Windows (`electron.exe`) y no arranca aquí. `desktop/config.json` no está en `.gitignore`: no lo crees dentro del repo.
- Nunca `pkill -f`/`pgrep -f` con la línea del servidor escrita en el propio comando: coincide con tu shell y lo mata. Mata por PID (`lsof -ti tcp:<puerto>`).
- `sse-client.js` es UMD y como `<script>` clásico deja globales (`streamChat`, `forget`, `parseBlock`): por eso `app.js` va en una función.
- Ningún fichero de `web/` puede llevar una URL absoluta (W11), ni siquiera en comentarios.
- La CSP del cliente web es `img-src 'self' data:` (D53): los iconos del manifest y el favicon dependen de `'self'`; las miniaturas son data URLs.
- **Fallo conocido, sin arreglo (2026-11-09):** el Samsung Internet 30.0.5 con el modo oscuro de sitios filtra la imagen de la escena
  (`<img id="scene">`): los trazos negros salen gris claro y los colores lavados. El resto de la página, ya oscura, se ve bien.
  Apaño: botón «Sitios claros» del menú del navegador. En Chrome 149 con oscurecimiento forzado, R2 (meta y `color-scheme: dark`) sí funciona.
  Probadas en el móvil y sin efecto: `light dark` con `prefers-color-scheme`, escena como fondo CSS, `<iframe>` y `<object>`.
  Descartado: `<canvas>`, porque congela la animación del SVG. Sin ideas baratas; no reabrir sin un dato nuevo.
- K6 (el verde fluido en el móvil) y K8 (girar en un móvil real) de la fase 9 solo se prueban en el móvil.
- Pruebas contra la BD real: `KLOTHULHU_TEST_DB=1`, solo `klothulhu_test` / `klothulhu_memoria_test`.
- T10 (`memoria_prueba.py`) y T8 (`memoria_calibrar.py`) no se vuelven a lanzar sin autorización de Josem.
- Automensaje: activo con `klothulhu-fc` (tmux `klothulhu-arq`) como arquitecto, deducido del nombre del tmux y sin confirmar por Josem. Los nombres
  cambian entre sesiones: buscar con `ListAgents` y preguntar si no hay una candidata clara.

**Bloqueos:** ninguno.
- Búsqueda web (D58-D60): `buscaweb.py` es puro; la cuota (`_cuota` en `app.py`) vive en memoria del proceso. El log solo lleva números: nunca
  consulta, URLs ni títulos. Las fuentes que se enseñan son solo las **citadas** (`citations` de los bloques `text`). El puente del escritorio
  se llama `kl` (no `window.klothulhu`). `desktop/renderer/fuentes.js` lo usan los dos clientes y `main.js`. Para ver los eventos SDK reales sin
  gastar: `tests/test_fase11_sdk.py` (transporte `httpx2.MockTransport`).
