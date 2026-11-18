# tomorrow.md — klothulhu

**Parada:** fase 10, H1 único (klothulhu ve: imágenes en la conversación, D56, D57) **aprobado sin retoques** (`2a9e329`,
`H1-revision.md`). Después hice A1 [API] (autorizada por Josem, tope 1 €; gasto ≈ $0,0016) y la dejé en un anexo del informe
(`adb9331`): el narrador ve la foto y se acuerda de ella sin volver a mandarla. El arquitecto pidió el **retoque R1** (`0d8231f`) y lo hice
(`057d708`, anexo 2 del informe `b8b79c6`): los loggers `anthropic`, `httpx`, `httpx2`, `httpcore` y `httpcore2` se quedan en INFO como mínimo
(`_acotar_loggers_de_librerias` en `app.py`), porque con el log en DEBUG el SDK imprimía la imagen en base64. **R1 aprobado y H1 cerrado** (`8271512`, `H1-revision.md` §5): no hay nada más por mi lado.
Pruebas: pytest 122 passed (8 skipped), `ruff` limpio, desktop 97/97, web 31/31.
La fase 9 (H1-H6) está cerrada y aprobada.
Rama `fase10`, worktree `/data/klothulhu-fase10` con `.venv` propio (sin `node_modules`: no hace falta). Pruebas: pytest 120 passed
(8 skipped), `ruff` limpio, desktop 97/97, web 31/31. El worktree `/data/klothulhu-fase9` sigue ahí (rama `fase9`).

**Siguiente paso:** ninguno por mi lado; antes de tocar nada, mirar el buzón (`docs/fase10/`); si K1-K8 de Josem sacan algo, llegará como
una sección nueva de `H1-revision.md`. Falta lo de Josem (la punta de `fase10` incluye R1), en este orden (`deploy/PASOS-CON-SUDO.md` §5): merge `--ff-only` de `fase10` → reiniciar `klothulhu-api.service`
(el servidor cambia) → nginx (`cp`, `nginx -t`, `reload`) → recargar el móvil; en Konnos, `git pull` y reiniciar la app. Después K1-K8 del plan.
Gasto: más pruebas de pago solo dentro del tope que dio Josem (1 € en total, el 2026-11-18); lo gastado hasta ahora son ≈ 0,0015 €.
Para la clave de pruebas Josem eligió leer solo la línea `ANTHROPIC_API_KEY` de `/etc/klothulhu/klothulhu.env` (sin imprimirla); no leer el resto del fichero.
No empezar fase ni hito nuevos sin un «adelante». Quitar los worktrees (`git worktree remove`) lo decide Josem.

**Gotchas:**
- `/data/klothulhu` está en `main`; trabajo en el worktree de la fase en curso. Config sin versionar: copiar, no symlink.
- Servidor de pruebas (no producción): desde `<worktree>/server`,
  `KLOTHULHU_FAKE=1 KLOTHULHU_TOKENS=konnos:token-de-prueba-0123456789 ../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8766`
  y `node web/dev-server.js --api 127.0.0.1:8766` (web en `127.0.0.1:5858`). Gasto 0, sin BD. Con imagen, la respuesta enlatada dice cuántos KB llegaron.
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
