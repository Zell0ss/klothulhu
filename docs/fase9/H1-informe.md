# H1 — Informe (fase 9, cliente web para el móvil, D50)

Responde a: 92acd81 (PLAN.md de la fase 9)

## Hecho

T1–T6 en la rama `fase9` (worktree `/data/klothulhu-fase9`), un commit por tarea, citando D50:

| Tarea | Commit | Qué |
|---|---|---|
| T1 | 16f5b7c | `desktop/sse-client.js` como UMD: solo el envoltorio final (Node: módulo; `<script>` clásico: `KlSse`) |
| T2 | dceaac8 | `web/package.json`, `web/webcore.js` (W1–W4) y normativas copiadas sin editar a `web/test/fase9-h1.test.js` |
| T3 | adc5a65 | `web/host.js`: `hasToken`, `setToken`, `ask`, `forget`, `onEvent`, `onForgotten`, `onNeedToken`; un solo `inflight` |
| T4 | 8af1e90, 78e7533 | `web/index.html`, `style.css`, `app.js` (copia del reproductor del escritorio) + retoques de la pasada a mano |
| T5 | 04ddae8 | `deploy/nginx-klothulhu-web.conf` y `deploy/PASOS-CON-SUDO.md` |
| T6 | 4ab8717, e2bd394 | `web/dev-server.js` (web, `/shared/`, `/api/` sin búfer) |

**Pruebas:** `cd web && npm test` → 12/12 (W1–W12) · `npm run check` limpio · `cd desktop && npm test` → 69/69 (por T1) ·
`npm run check` del escritorio limpio. `pytest` no se ha lanzado: el servidor no cambia (`git diff` de `server/` vacío).
**Restricción dura cumplida:** `desktop/renderer/index.html`, `main.js`, `preload.js` y `state.js` sin tocar (diff vacío).

**Pasada a mano** (servidor de pruebas + `dev-server.js` + Chrome headless dirigido por CDP, a 390×844 y 844×390).
Capturas en `docs/fase9/capturas/`: `00-sin-token`, `01-pensando`, **`02-claude-390x844`**, **`03-klothulhu-390x844`**,
`04-recarga-sigue-klothulhu`, `05-horizontal-844x390`, `06-token-malo`. Comprobado:

| Prueba del plan §7 | Resultado |
|---|---|
| K1 token una vez | Sin token sale el formulario; uno corto se rechaza; uno pegado con espacios y salto se guarda recortado; tras recargar no vuelve a pedirlo |
| K2 pantalla | Franja de 390×156 arriba, barra, historial y entrada abajo (capturas 02 y 03). **El teclado abierto no se ha podido probar** (headless): solo se ha previsto con `100dvh` e `interactive-widget=resizes-content` |
| K3 | «pensando», escenas del servidor (con director), historial con los dos turnos; un segundo envío mientras espera se ignora (botón deshabilitado) |
| K5 | El avatar cambia, se guarda en `klothulhu.avatar` y sigue tras recargar |
| K7 | Con un token malo: la línea del 401 sale en la franja **y** en el formulario, y el token se borra |
| K8 | A 844 px: franja de 844×169; de vuelta a 390 px: 390×156, siempre con klothulhu parado |
| K4, K6, K9 | **No probables aquí** (ver más abajo): son de Josem en el móvil |

## Gasto

0. Servidor de pruebas con `KLOTHULHU_FAKE=1`, sin memoria (no toca BD ni Qdrant), token de prueba, `127.0.0.1:8766`,
arrancado desde mi worktree, no desde `/data/klothulhu`. El servicio de producción no se ha tocado ni reiniciado.

## Desviaciones

1. **T1, un bloque `{ … }` en el envoltorio.** Como `<script>` clásico, un `const api` suelto sería global y chocaría con
   otro script. Sigue siendo solo el final del fichero. Además, `streamChat`, `forget`, `parseBlock` y
   `FIRST_EVENT_TIMEOUT_MS` quedan como globales al cargarse así; por eso `app.js` va dentro de una función anónima
   (desviación 2), para que ningún `const` suyo choque.
2. **T4, `app.js` envuelto en una función anónima** (misma razón). Los nombres y cuerpos de `paint`, `play`, `pump`,
   `enqueue`, `think` y el tratamiento de eventos son los del escritorio.
3. **T4, el formulario del token es un `<form>`** (no estaba en el plan): Chrome avisa de un campo de contraseña suelto
   y el teclado del móvil ofrece «Ir». Nunca se envía (`preventDefault`); el token sigue sin ir en ninguna URL.
4. **T4, el teclado se cierra al enviar** (`input.blur()`), como el escritorio cierra la entrada: la respuesta se lee en
   la franja. Es una decisión de comodidad mía; si resulta incómodo (hay que tocar la caja cada vez), es un cambio de
   una línea.
5. **T4, CSS `max-width: 100%` en la franja y `overflow: hidden` en `#app`** (retoque 78e7533). **Hallazgo real de la
   pasada a mano:** sin esto, tras girar a horizontal y volver a vertical, `innerWidth` se quedaba en 844 y la franja
   no se reajustaba, porque la franja de 844 px desbordaba y el viewport de móvil se ensanchaba para contenerla. Con
   el retoque gira en los dos sentidos. Habría que mirarlo en un móvil real (K8).
6. **T6, `--api` acepta `host:puerto`** (o con esquema, que se recorta): W11 prohíbe cualquier URL absoluta en los
   ficheros de `web/`, así que no hay valor por defecto escrito como URL.
7. **`.venv` propio en `/data/klothulhu-fase9`** (3.12, `requirements-dev.txt`, desde PyPI) para arrancar el servidor de
   pruebas desde mi worktree. Está en `.gitignore`.

## Lo que no he podido comprobar

- **`nginx -t` no se ha ejecutado** (no tengo sudo): `nginx-klothulhu-web.conf` solo está validado por W12, que lee
  texto. Un error de sintaxis saldría en el paso `sudo nginx -t` de `PASOS-CON-SUDO.md`, antes del `reload`.
- **El nginx sirve `/data/klothulhu/web`, o sea `main`:** hasta el merge de `fase9` daría 404. Por eso el paso 0 de
  `PASOS-CON-SUDO.md` es el merge `--ff-only`. Tampoco he comprobado que `www-data` pueda leer esas rutas (hay un
  paso para eso).
- **K6 (el verde y el 3D sin tirones ni calor)** es la incógnita de la fase y aquí no se puede medir: Chrome headless
  sin GPU en un servidor. `app.js` apunta a la consola `first-scene ms=…` y `done ms=…` por si ayuda.
- **K4 (misma conversación que Konnos)** depende del segundo secreto con el mismo `cid` y de reiniciar
  `klothulhu-api` (§5.1, tuyo).
- **Observación, sin acción:** `forget()` con un token malo devuelve `false` pero no pide token otra vez, porque
  `sse.forget` solo devuelve `res.ok` y no distingue el 401. Lo cubre W8 como está; el siguiente envío sí lo pide.

## Decisiones que necesito

Ninguna. Esperan a un «sí» de Josem, y no los hago yo: el segundo secreto y el reinicio de `klothulhu-api`, el
nginx con sudo, el merge `--ff-only` de `fase9` y K1–K9 en el móvil (todo en `deploy/PASOS-CON-SUDO.md`).

## Anexo — R1

Responde a: 3f6ea60 (H1-revision, «Para el programador»)

- **Hecho:** R1 en `fc236aa`. `web/host.js`: `ask` atrapa la excepción de `sse.streamChat`; si la pregunta no se ha
  cortado (`!ctl.signal.aborted`), `console.warn` y un evento `error` con `{ code: 'unreachable' }`, sin 401 y sin pedir
  token. Prueba de regresión nueva en `web/test/host-extra.test.js` (la normativa `fase9-h1.test.js` no se toca) con
  los dos casos de la revisión: lanza → un solo `error unreachable`, ningún `onNeedToken` y el token intacto; lanza con
  la pregunta ya cortada por otra → nada, ni evento ni aviso. Las dos fallaban antes del arreglo.
- **Pruebas:** `npm test` de `web/`: 14/14 (12 anteriores + 2 nuevas). `npm run check`: limpio.
- **Gasto:** 0.
- **Desviaciones:** ninguna.
- **Decisiones que necesito:** ninguna. Paro aquí; secreto, nginx, merge `--ff-only` y K1–K9 siguen siendo de Josem.
