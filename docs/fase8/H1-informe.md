Responde a: 43a7e6f (PLAN.md, Fase 8 H0)

# H1 · Informe de la parada 1

## Hecho

T1-T6, un commit por tarea (58a3fda … dc6ce99, rama `fase8`, worktree `/data/klothulhu-fase8`).

- **T1 · motor.** IIFE de claude-fables `7d25be6`, sha256 `26818316…2950f2` (el del plan; coincide con el
  de `motor/dist`). `VENDOR.md` actualizado (`SCHEMA_VERSION` sigue en 3). `fables_vocab.json` regenerado: solo
  gana `avatars`, `defaults.avatar` y `maxBytes` (+ su rango). Todas las pruebas de antes en verde con el motor
  nuevo (P9, F1 y P4 incluidas).
- **T2 · `renderer/avatar.js`.** `AVATARS`, `MAX_BYTES_KLOTHULHU = 400000`, `avatarOptions`. Envoltorio UMD como
  `convo.js`; añadido a `npm run check`.
- **T3 · `state.js`.** `parseAvatar`, `readAvatar` y `writeState` con `avatar` opcional. `parseState` y
  `readState` sin tocar. Normativa copiada tal cual a `desktop/test/fase8-h1.test.js`.
- **T4 · `main.js` y `preload.js`.** Al arrancar, `state.avatar = readAvatar(...)`; `saveState()` lo conserva (también
  cuando guarda por cambio de tamaño o de posición). Dos entradas `radio` en el tray tras las de tamaño, marcadas
  según el estado; al elegir una: `state.avatar`, `saveState()` y `send('avatar', name)`. `init` devuelve `avatar`;
  `preload` expone `onAvatar`.
- **T5 · `index.html`.** `opts()` añade `...avatarOptions(avatar, VOCAB.avatars)`; el avatar llega con `init` (antes del
  saludo de arranque) y cambia con `onAvatar`. Con klothulhu parado (sin `awaiting` y fase `idle`/`lingering`) se
  repinta la escena en pantalla; si no, vale desde la siguiente. Si el motor devuelve `ok: false` con un avatar
  distinto de `claude`, vuelve a `'claude'` con un `console.warn` una sola vez (como `look`).
- **T6 · `gallery.js`.** Sí se prestó: `--avatar claude|klothulhu` (un avatar desconocido sale con error). Con
  `claude` el HTML es idéntico, byte a byte, al de la fase 5 salvo el rótulo «avatar claude» del título.

## Pruebas

- Cliente: `npm test` 69 pasan (64 de antes + V1-V5), `npm run check` limpio.
- Servidor: `pytest -q tests` 105 pasan y 8 se saltan; `ruff` limpio.
- El `<script>` de `index.html` pasa `node --check`. **El tray y el renderer no los he podido ejecutar**: no hay
  Electron con pantalla en seb01; K1-K7 son de Josem en Konnos.

## Capturas

`docs/fase8/capturas/`: galerías enteras (`galeria-claude.html`, `galeria-klothulhu.html`; 16 preguntas, 33 escenas, 0
avisos del motor en las dos) y la parte de arriba de cada una en PNG (`galeria-claude.png`, `galeria-klothulhu.png`, hechas con
Chrome sin cabeza). Con las 33 escenas de `api_smoke.json`, la más pesada pesa 13 035 bytes en naranja y 13 708 en
verde: esas escenas no son las pesadas de la normativa V3 (unos 204 KB), así que **K6 no queda cubierta** por esto.

## Gasto

0. Ninguna API. `estado.json` solo se toca en las pruebas, en carpetas temporales.

## Desviaciones

- Un `.venv` y un `node_modules` propios en el worktree (no se versionan), por la regla de no usar los de producción.
- El título de la galería sigue diciendo «fase 5» (solo añadí el avatar); no he querido reescribirlo.

## Decisiones que necesito

Ninguna. Despliegue de Josem: merge `--ff-only` de `fase8` en `main` y, en Konnos, `git pull`, `npm ci`, `npm test` y
`npm start` (K1-K7). El servidor no hace falta reiniciarlo.
