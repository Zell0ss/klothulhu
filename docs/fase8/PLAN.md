---
proyecto: klothulhu
fase: 8
titulo: segundo avatar, klothulhu verde
plan: arquitecto
fecha: 2026-11-06
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D49; también D10, D15, D31, D32)"
gasto_autorizado: "ninguno: la fase no llama a ninguna API de pago"
---

# Fase 8: segundo avatar, klothulhu verde

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-11-06.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

claude-fables ha entregado el pedido 4 (vault: `claude-fables/PARA-KLOTHULHU.md` §8, su fase 4): un
segundo avatar, **klothulhu verde**, que se elige con una opción de pintado. Esta fase lo integra en
el cliente (D49):

- el mortal elige el avatar en el tray: «Avatar: Claude» o «Avatar: Klothulhu»;
- el avatar se recuerda en `estado.json`, como el tamaño;
- el renderer pasa al motor las opciones de ese avatar.

**Contrato:** cambia uno, la opción de pintado entre el motor y el cliente (motor nuevo vendorizado),
y `estado.json` gana el campo `avatar`. El esquema de escena (`SCHEMA_VERSION` 3) **no** cambia. El
servidor solo regenera `fables_vocab.json` (prueba F1) y no cambia de comportamiento.

**Fuera de alcance:**
- una transformación animada de naranja a verde;
- que el servidor o el director sepan qué avatar se ve;
- un botón en la ventana (solo el tray);
- avisar en la interfaz de `avatar-not-drawn` (basta con el log de depuración, como los demás avisos).

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** Sí: `estado.json`, en `userData`. Las pruebas usan
  carpetas temporales (`fs.mkdtempSync`), como las de la fase 6. `config.json` no se escribe nunca,
  como hasta ahora.
- **¿Algo llama a una API externa?** No. Gasto: 0.
- **¿Algo toca producción?**
  - El servidor no cambia de comportamiento. `server/fables_vocab.json` gana `avatars`, que el
    servidor no usa, así que **no hace falta reiniciar** `klothulhu-api`.
  - Al cerrar: merge `--ff-only` de `fase8` en `main` (Josem), y en Konnos `git pull` y `npm ci`
    (no hay dependencias nuevas, pero no cuesta).

## 2. Tareas

Rama `fase8`, worktree `/data/klothulhu-fase8` (ya creado). Una tarea, un commit. Cita D49 en las
costuras.

- **T1 · Vendorizar el motor de la fase 4 de claude-fables** (`VENDOR.md`, D10, D15):
  - el IIFE de `/data/claude-fables`, rama `main`, que ya lleva la fase 4: commit de código
    `7d25be6`, sha256 `26818316f8bb8a71b920a5dc76ee5ad970eb870b9c6536a560e7a6557f2950f2`;
  - actualiza `VENDOR.md` (commit, sha256; `SCHEMA_VERSION` sigue en 3) y regenera
    `server/fables_vocab.json` con `node desktop/scripts/export-vocab.js`;
  - **todas** las pruebas de antes en verde, del cliente y del servidor: P9, F1 y P4 sobre todo. Si
    alguna falla, para y pregunta.
- **T2 · `renderer/avatar.js`**, puro y con el envoltorio UMD de `convo.js` (`window.KlAvatar` en el
  renderer):
  - `AVATARS = ['claude', 'klothulhu']`;
  - `MAX_BYTES_KLOTHULHU = 400000`, la cifra que pide claude-fables (su D28);
  - `avatarOptions(avatar, avatars)`: `{ avatar: 'klothulhu', maxBytes: 400000 }` si es `klothulhu`
    y está en `avatars`; en cualquier otro caso, `{}`. El naranja va sin opciones, para que su SVG
    sea idéntico al de hoy.

  Añádelo a `npm run check`.
- **T3 · `state.js`.** `parseState` y `readState` **no cambian**: M4 y M5 de la fase 6 son normativas.
  Además:
  - `parseAvatar(text, avatars)`: el `avatar` del JSON si es un texto que está en `avatars`; si no,
    `'claude'`. Nunca lanza;
  - `readAvatar(file, avatars)`: como `readState`, y `'claude'` sin fichero;
  - `writeState(file, { size, x, y, avatar })` escribe `avatar` solo si viene. `version` sigue en 1.
- **T4 · `main.js` y `preload.js`:**
  - al arrancar, `state.avatar = readAvatar(stateFile, AVATARS)`, y `saveState()` lo conserva;
  - el tray lleva dos entradas de tipo `radio`, «Avatar: Claude» y «Avatar: Klothulhu», marcadas
    según el estado, después de las de tamaño;
  - al elegir una: `state.avatar`, `saveState()` y `win.webContents.send('avatar', name)`;
  - `init` devuelve también `avatar`;
  - `preload` expone `onAvatar(cb)`.
- **T5 · El renderer** (`index.html`):
  - `opts()` añade `...KlAvatar.avatarOptions(avatar, VOCAB.avatars)`;
  - el avatar llega con `init` y cambia con `onAvatar`;
  - el cambio vale desde la escena siguiente. Si klothulhu está parado (sin respuesta en curso),
    se repinta la escena que haya en pantalla;
  - el saludo de arranque (D29) usa el avatar guardado desde la primera escena;
  - si el motor no conoce el avatar (`ok: false`), se vuelve a `'claude'` con un aviso en consola,
    una sola vez, como se hace hoy con `look`.
- **T6 · `scripts/gallery.js`:** si genera la galería de escenas, que acepte `--avatar klothulhu`.
  Es opcional: si el script no se presta, dilo en el informe y no lo fuerces.

**⏸ Parada:** las normativas nuevas (`test/fase8-h1.test.js`) y todas las de antes en verde,
`npm run check`, y las pruebas del servidor (`pytest`, por F1). Informe en
`docs/fase8/H1-informe.md`, con dos capturas de la galería si T6 salió: una con el avatar naranja y
otra con el verde.

## 3. Pruebas normativas

`docs/fase8/normativas/fase8-h1.test.js` se copia tal cual a `desktop/test/fase8-h1.test.js`. No se
edita. Están comprobadas por el arquitecto contra el IIFE de claude-fables: con el motor nuevo, V3
y V4 se cumplen, y la escena más pesada de klothulhu ocupa unos 204 KB.

| # | Qué fija |
|---|---|
| V1 | Motor con `avatars`, de acuerdo con `AVATARS`; esquema 3; `maxBytes` dentro de los límites; un avatar desconocido no vale |
| V2 | `avatarOptions`: el verde con `maxBytes`, y el naranja (y todo lo demás) sin opciones |
| V3 | Klothulhu pinta toda la puesta en escena sin correcciones ni avisos, en pixel y en `ukiyoe`, y cabe en `maxBytes` |
| V4 | El naranja es idéntico byte a byte al de hoy |
| V5 | `estado.json` con `avatar`: `parseAvatar` y `readAvatar`; `parseState` y `readState` siguen igual |

## 4. Prueba en Konnos (Josem)

Tras el merge: `git pull`, `cd desktop`, `npm ci`, `npm test` y `npm start`.

| # | Qué mirar |
|---|---|
| K1 | El tray tiene «Avatar: Claude» y «Avatar: Klothulhu», con el actual marcado |
| K2 | Al elegir Klothulhu, la escena parada se repinta en verde, y las respuestas siguientes salen en verde |
| K3 | Al enfadarse (por ejemplo, el saludo de arranque), los cuatro ojos se ponen rojos |
| K4 | Los tentáculos se agitan mientras se escribe el bocadillo |
| K5 | Al cerrar y abrir la app, sigue en verde, en el mismo tamaño y en el mismo sitio |
| K6 | **Que no vaya a tirones** con escenas pesadas: claude-fables pide confirmarlo (su D28) |
| K7 | Al volver a Claude, todo se ve como antes |
