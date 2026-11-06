---
proyecto: klothulhu
fase: 9
titulo: klothulhu en el móvil (cliente web)
plan: arquitecto
fecha: 2026-11-06
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D50; también D10, D12, D27, D32, D49)"
gasto_autorizado: "ninguno: la fase no llama a ninguna API de pago (el uso real del móvil sí gasta, bajo el freno D40, pero eso es de Josem)"
---

# Fase 9: klothulhu en el móvil

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-11-06.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

Josem quiere hablar con klothulhu desde el móvil, con el teléfono en vertical. Un cliente web, servido
desde seb01 y alcanzado por Tailscale (D50):

- **arriba**, la franja del motor a todo el ancho; **abajo**, el historial y la caja de texto;
- **la misma conversación que Konnos**: el mismo `cid` en el servidor, así que historial y recuerdos se
  comparten sin que el servidor cambie;
- el token se **teclea una vez** y se guarda en el móvil.

**Contrato:** cambia uno, el cliente tiene ahora **dos anfitriones**: Electron (`window.kl`) y la web
(`web/host.js`). Lo demás es nuevo y pequeño: la URL `/api/…` de nginx hacia el servidor, el token en
`localStorage`, y `sse-client.js` que se carga también como script clásico. El esquema de escena no
cambia y **el servidor no se toca**.

**Lo que NO se toca (restricción dura):** `desktop/renderer/index.html`, `main.js`, `preload.js` y
`state.js`. Las normativas de las fases 1, 5 y 6 leen el texto de `index.html` (`bubble: { lines: … }`,
`enqueue(bootScenes(cfg.hotkey))`, `onButton = (t) => …sizeBtn`…) y **no se editan**. Por eso el
reproductor de la web (`web/app.js`) es una **copia deliberada** de la lógica en línea del escritorio, no
un módulo compartido. Lo que sí se comparte, por cargarse desde el mismo sitio, es: el motor, `scenes.js`,
`feed.js`, `convo.js`, `avatar.js` y `sse-client.js`. Ninguno de ellos se copia a `web/`.

**Fuera de alcance:**
- **voz** (Josem la quiere más adelante; no se deja nada hecho, solo la fila de entrada sin apretar);
- que el historial sobreviva a recargar la pestaña o a volver de otra app: sigue en memoria (D27). Si
  molesta de verdad, es un `GET /history` en el servidor (cambio de contrato, otra fase);
- PWA, service worker, HTTPS: no hay TLS en este sitio (como tristras, D34);
- una escena vertical, que sería un pedido 5 a claude-fables;
- botón de copiar, tamaños, arrastrar, click-through: cosas de ventana de escritorio;
- cambiar `index.html` del escritorio, o extraer el reproductor (deuda, ver D50).

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** «Forget» en el móvil borra el historial del servidor,
  que es el mismo que el de Konnos (a propósito). En el móvil solo se escribe `localStorage` (token y
  avatar). Las pruebas usan un `storage` de mentira y un `fetch` de mentira: no tocan nada real.
- **¿Algo llama a una API externa?** No desde el código nuevo. Pruebas: gasto 0. Para probar a mano, el
  servidor de **desarrollo** con `KLOTHULHU_FAKE=1`, nunca el de producción.
- **¿Algo toca producción?**
  - El servicio `klothulhu-api` **no cambia y no se reinicia** por el código. Sí hay un cambio de
    configuración, de Josem: un segundo secreto para el móvil (§5).
  - nginx de seb01: un sitio nuevo en el puerto 5757, que instala **Josem** con sudo. Tú escribes el
    fichero y los pasos, no los ejecutas.
  - Al cerrar: merge `--ff-only` de `fase9` en `main` (Josem).

## 2. Cómo se sirve

```
móvil ──Tailscale──▶ nginx seb01 :5757 ─┬─ /            web/ (estático)
                                        ├─ /shared/     desktop/renderer/  (motor, scenes, feed, convo, avatar)
                                        │  /shared/sse-client.js  desktop/sse-client.js
                                        └─ /api/…       proxy a http://100.87.64.121:8765/…  (SSE sin búfer)
```

Mismo origen: el servidor no necesita CORS. El puerto **5757** está libre (el 5656 no: lo usa otro
servicio de seb01). Se sirve **solo** lo de arriba: nunca el repo, ni `desktop/` entero, ni `server/`.

## 3. Pantalla

El motor solo dibuja una **franja** (320×128 como mínimo, D12 y D32); no hay escena vertical. A 390 px de
ancho sale de 156 px de alto. Es lo que hay, y deja casi toda la pantalla para el historial.

```
┌──────────────────────┐
│ ▓▓▓ franja motor ▓▓▓ │  ← webGeometry(innerWidth): ancho completo, alto 128·zoom
│   (bocadillo)        │
├──────────────────────┤
│ [Claude|Klothulhu] 🗑 🔑│  ← barra pequeña: avatar, Forget (con confirmación), cambiar token
│ tú: …                │
│ klothulhu: …         │  ← historial, flex:1, scroll, se pega al final
│                      │
├──────────────────────┤
│ [ Habla, mortal…  ][➤]│  ← entrada fija abajo; fuente ≥16 px; safe-area
└──────────────────────┘
```

- Alto `100dvh`; el viewport lleva `interactive-widget=resizes-content` para que el teclado empuje la
  entrada y no la tape.
- **Sin token** (primera vez, o tras un 401): un formulario encima de todo para pegarlo
  (`type=password`, `autocomplete=off`). Con un 401 se muestra además la línea de siempre del escritorio
  (`LINES.errors.http_401`).
- El avatar se elige en la barra y se guarda en `localStorage` (`klothulhu.avatar`, por defecto
  `claude`), con el mismo comportamiento que D49: vale desde la escena siguiente, y parado se repinta la
  que hay.
- Arranque: `webBoot(KlScenes)`, es decir, las dos primeras escenas del despertar. La tercera dice «Pulsa
  Ctrl+Alt+K…», que en el móvil no tiene sentido.
- `look`: `pixel` (el de por defecto del motor), sin configuración. `readSpeed`: 1.
- Mientras se espera la respuesta, se ignora un segundo envío (como el escritorio).

## 4. Tareas

Rama `fase9`, worktree `/data/klothulhu-fase9` (ya creado). Una tarea, un commit. Cita D50 en las costuras.

- **T1 · `desktop/sse-client.js` como UMD.** Solo el envoltorio final: en Node sigue
  `module.exports = { streamChat, forget, parseBlock }`, y como `<script>` clásico deja `KlSse`. Ni una
  línea más (`main.js` lo usa tal cual). Añade `node --check` si hace falta. **Todas** las pruebas de
  antes del escritorio en verde (`cd desktop && npm test`).
- **T2 · `web/package.json` y `web/webcore.js`** (UMD, `window.KlWebCore`, puro, sin DOM):
  `TOKEN_KEY = 'klothulhu.token'`; `webGeometry(viewportW)`; `webBoot(K)`; `createTokenStore(storage)`.
  Reglas exactas en W1-W4. `package.json`: `private`, **sin dependencias**, `scripts.test = "node --test"`
  y `scripts.check` con `node --check` de cada fichero JS de `web/`. Copia las normativas
  (`docs/fase9/normativas/fase9-h1.test.js` → `web/test/fase9-h1.test.js`, sin editar).
- **T3 · `web/host.js`** (UMD, `window.KlHost`): `createHost({ storage, sse, apiUrl = '/api' })` →
  `{ hasToken, setToken, ask, forget, onEvent, onForgotten, onNeedToken }`. Mismo reparto de papeles que
  `main.js` + `preload.js`: el token vive en el host, el pintado no lo ve. Reglas en W6-W9. Las que no
  dicen las pruebas:
  - los nombres son los de `preload.js` (`ask`, `forget`, `onEvent`, `onForgotten`) para que el
    reproductor se lea igual que el del escritorio;
  - un solo `inflight`, como en `main.js`.
- **T4 · `web/index.html`, `web/style.css`, `web/app.js`.** El reproductor: `paint`, `play`, `pump`,
  `enqueue`, `think`, el tratamiento de `kl-event`, el historial con `textContent`. **Cópialo de
  `desktop/renderer/index.html`** con sus mismos nombres, y pon al principio de `app.js` un comentario
  que lo diga y apunte a D50. Cambia solo lo que la web exige:
  - la geometría sale de `webGeometry(window.innerWidth)` y se recalcula en `resize` y en
    `orientationchange` (con klothulhu parado; si no, en cuanto pare);
  - `kl.init`, `kl.onSizeRequest`, `kl.onSummon`, `kl.panel`, `kl.clickThrough`, `kl.drag*`, `kl.quit`,
    `kl.copy` y `debug` desaparecen; lo que cada uno hacía en la ventana no existe aquí;
  - la entrada y el historial están siempre visibles;
  - CSP de W10 (sin `unsafe-inline`: todo el JS y el CSS en ficheros).
  El SVG sigue entrando como `<img src="data:image/svg+xml…">`, nunca con `innerHTML` (D10).
- **T5 · `deploy/nginx-klothulhu-web.conf` y `deploy/PASOS-CON-SUDO.md`**, a imagen de los de tristras
  (`/data/tristras/deploy/`): lo que se cumple está en W12. Los pasos: copiar a
  `sites-available`, enlazar en `sites-enabled`, `sudo nginx -t`, `sudo systemctl reload nginx`, y
  comprobarlo con `curl` desde seb01 y desde el móvil. Lleva también el paso del §5 y el de volver atrás.
- **T6 · `web/dev-server.js`** (Node, sin dependencias, solo para probar): sirve `web/`, `/shared/`
  como nginx y pasa `/api/` a un servidor de **desarrollo** (`--api http://127.0.0.1:8766`), reenviando
  el SSE sin búfer. Escucha en `127.0.0.1:5858` por defecto y `--host` lo cambia. Sin esto no hay
  forma de ver nada antes de que Josem instale nginx. Arranca el servidor de pruebas desde tu worktree
  con `KLOTHULHU_FAKE=1`, un token de prueba, puerto 8766 y la BD de desarrollo (no `/data/klothulhu`).

**⏸ Parada:** `cd web && npm test` y `npm run check`; `cd desktop && npm test` (por T1); `pytest` no hace
falta, el servidor no cambia. Haz una pasada a mano con el servidor de pruebas y el `dev-server.js`, con
las herramientas del navegador a 390×844 y a 844×390, y pon dos capturas en el informe (vertical con
Claude y con Klothulhu). Informe en `docs/fase9/H1-informe.md`.

## 5. Lo que hace Josem (no el programador)

1. **Un segundo secreto para el móvil**, el mismo `cid`. En `/etc/klothulhu/klothulhu.env`:
   `KLOTHULHU_TOKENS=konnos:<el de Konnos>,konnos:<uno nuevo de ≥16 caracteres>`. El servidor admite dos
   secretos con el mismo `cid` (`_parse_tokens` guarda por secreto), así que el móvil comparte
   conversación y recuerdos con Konnos y **se puede revocar sin tocar el de Konnos**. Exige reiniciar
   `klothulhu-api` (decisión suya, como siempre). Alternativa sin reinicio: teclear en el móvil el mismo
   token que Konnos; sirve, pero perder el móvil obligaría a cambiar los dos.
2. Instalar nginx (`deploy/PASOS-CON-SUDO.md`).
3. Merge `--ff-only` de `fase9` en `main`.

## 6. Pruebas normativas

`docs/fase9/normativas/fase9-h1.test.js` se copia tal cual a `web/test/fase9-h1.test.js`. No se edita.
Las ha comprobado el arquitecto contra una implementación de referencia desechable: pasan las 12.

| # | Qué fija |
|---|---|
| W1 | `webGeometry`: franja de 320 hasta 639 px y de 640 en adelante; ancho completo; no lanza con basura |
| W2 | El motor pinta a esos anchos, con los dos avatares y todas las emociones, sin avisos |
| W3 | `webBoot`: las dos primeras escenas del despertar; ninguna habla de teclas |
| W4 | `createTokenStore`: mínimo 16 sin espacios, recorta lo pegado, `storage` roto no lanza |
| W5 | `sse-client.js` se carga como script clásico (`KlSse`) y en Node sigue igual |
| W6 | `host.ask`: `POST /api/chat`, token en la cabecera y nunca en la URL, eventos en orden |
| W7 | `host`: sin token no hay red; con 401 el token se olvida y se pide otro |
| W8 | `host.forget`: `DELETE /api/history`, y avisa siempre, también si falla |
| W9 | `host.ask`: una pregunta nueva corta la anterior y no se cuelan sus eventos |
| W10 | `index.html`: CSP sin `unsafe-inline`, móvil, y los módulos compartidos se cargan de `/shared/` |
| W11 | `web/`: no reimplementa lo compartido, ni `innerHTML`, ni URLs externas, ni token en URL; sin dependencias |
| W12 | nginx: solo Tailscale, SSE sin búfer, proxy al servidor sin tocarlo, y solo se sirve lo debido |

El reproductor (`app.js`) y la pantalla no tienen normativa: son DOM y se revisan contra el código y con
las capturas.

## 7. Prueba en el móvil (Josem)

Tras el nginx y, si hiciste el §5.1, el reinicio de `klothulhu-api`:

| # | Qué mirar |
|---|---|
| K1 | `http://seb01:5757` abre, pide el token una vez y no lo vuelve a pedir tras recargar |
| K2 | En vertical, la franja arriba a todo el ancho y el historial y la entrada abajo; con el teclado abierto, la entrada se ve |
| K3 | Escribes, sale «pensando», luego las escenas del servidor, y el historial lleva los dos turnos |
| K4 | **Misma conversación:** hablas en Konnos y sigues en el móvil; klothulhu recuerda lo que dijisteis |
| K5 | Avatar: cambias y se ve; recargas y sigue |
| K6 | **Que el verde y el 3D no vayan a tirones ni calienten el móvil**: es la incógnita de la fase |
| K7 | Con un token malo, aparece el aviso y vuelve el formulario |
| K8 | Giras el móvil: la franja se reajusta |
| K9 | Sales a otra app y vuelves: anota si el historial se ha perdido y si te estorba (decide si hace falta `GET /history`) |
