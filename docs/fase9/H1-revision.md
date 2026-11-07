Responde a: 998714c (H1-informe, parada)

# H1 · Revisión (2026-11-07)

**Veredicto: aprobado con un retoque (R1).** El resto de la fase está bien y puede seguir hacia Josem
(nginx y móvil) en cuanto R1 esté en la rama.

## 1. Comprobado contra el código

- **Normativas:** `web/test/fase9-h1.test.js` es idéntico a `docs/fase9/normativas/fase9-h1.test.js`
  (`diff` vacío). `cd web && npm test` → 12/12; `npm run check` limpio; `cd desktop && npm test` → 69/69.
  Lo he lanzado yo.
- **Restricción dura:** `git diff 30c5e89..998714c` de `desktop/renderer/index.html`, `main.js`,
  `preload.js`, `state.js` y `server/` está vacío. De `desktop/` solo cambia `sse-client.js`, y solo en su
  envoltorio final (T1). La desviación 1 (el bloque `{ }`) se acepta: es lo mínimo para no dejar un `const`
  global.
- **`webcore.js`:** `webGeometry`, `webBoot` y `createTokenStore` hacen lo que dice el plan. `storage = null`
  (sin `localStorage`) no lanza, porque el `TypeError` cae en los `try`.
- **`host.js`:** los nombres de `preload.js`, un solo `inflight` como en `main.js`, y nunca el token en una
  URL. El 401 olvida el token después de pintar el error, y `app.js` lleva la línea de siempre al
  formulario (`gateNote`).
- **`app.js`:** `paint`, `play`, `pump`, `enqueue`, `think` y el tratamiento de eventos son los del
  escritorio, línea a línea. Solo cambia lo que el plan permite: `applyGeomIfStill()` al quedar parado,
  `setAwaiting` y `gateNote`. El SVG entra por `<img src="data:…">` y el historial con `textContent` (D10).
  El comentario de cabecera apunta a D50.
- **`index.html`:** la CSP es `default-src 'none'`, sin `unsafe-inline`, y los módulos compartidos vienen
  de `/shared/`. El viewport lleva `interactive-widget=resizes-content`, y la entrada tiene 16 px.
- **nginx:**
  - el puerto 5757 está libre en seb01, y ningún sitio de `sites-enabled` lo usa (comprobado);
  - `klothulhu-api` escucha en `100.87.64.121:8765` (comprobado con `ss`), así que el `proxy_pass` apunta
    bien;
  - `/shared/` expone `desktop/renderer/`, que es motor, módulos e `index.html` del escritorio, sin
    secretos;
  - las dos `alias` terminan igual que su `location`, así que no hay *off-by-slash*;
  - los `allow` cubren el IPv6 de Tailscale (la lección de tristras).
- **`dev-server.js`:** no sale de `dir` (`path.resolve` + prefijo), solo escucha en loopback por defecto
  y no tiene dependencias.
- **Capturas:** la 02 y la 03 muestran lo que pide el §3: la franja a todo el ancho, la barra, el
  historial y la entrada abajo. La 02 está tomada en mitad del tecleo del bocadillo (sale vacío), y eso
  no es un fallo.
- **Las desviaciones 2-7 se aceptan.** La 4 (`blur()` al enviar) la juzgará Josem en K3; si le estorba,
  es una línea.

## 2. Hallazgos

### R1 · `host.ask` no trata una excepción del cliente SSE · *hueco del plan (arquitecto)*

`streamChat` convierte en eventos los fallos de red y de stream, pero no todo. `AbortSignal.any` (línea 10)
**no existe en Safari < 17.4 ni en Chrome < 116**, y un `res.body` nulo también lanzaría. Si `streamChat`
rechaza, `host.ask` solo ejecuta su `finally`, y `app.js` ignora la promesa. Resultado en el móvil:
klothulhu se queda en «pensando» para siempre, con el botón de enviar desactivado, hasta recargar. En el
escritorio no pasa porque Electron está fijado (D11). En un navegador cualquiera no hay esa garantía.
W6-W9 no lo cubrían: es un hueco mío.

**Pido:** en `web/host.js`, `ask` atrapa la excepción de `sse.streamChat`. Si la pregunta no se ha
cortado (`!ctl.signal.aborted`), escribe el error en `console.warn` y emite `error` con
`{ code: 'unreachable' }` (una línea conocida de `LINES.errors`). Sin 401, no se pide token. Con
prueba de regresión en un fichero **nuevo**, `web/test/host-extra.test.js` (la normativa no se toca):
un `sse` falso cuyo `streamChat` lanza produce exactamente un evento `error` con `unreachable`, y
ningún `onNeedToken`. Y el mismo `sse` falso, con la pregunta ya cortada por otra, no emite nada.

### Hueco del plan, ya resuelto por el programador: el orden del merge · *arquitecto*

En el §5 y el §7 del plan, Josem probaba K1-K9 y **después** fusionaba. Ese orden es imposible: nginx
sirve `/data/klothulhu`, o sea `main`. El paso 0 de `PASOS-CON-SUDO.md` (merge `--ff-only` antes de
nginx) es el orden correcto, y queda así. Consecuencia: K1-K9 se prueba sobre `main`. Si algo falla, el
arreglo va a `fase9` y se vuelve a fusionar con `--ff-only`. El merge no reinicia nada: `klothulhu-api`
no usa `web/`, y el cambio de `sse-client.js` es compatible (69/69).

### Observaciones sin acción

- **Si «Olvidar» falla** (red o 401), se vacía el historial del móvil, pero el del servidor sigue ahí,
  y no se avisa. Es igual que en el escritorio y lo que fija W8. Lo apunto como deuda en el diario, no
  se toca en esta fase.
- `nginx -t` y los permisos de `www-data` solo se pueden comprobar con sudo: son pasos de Josem y están
  en `PASOS-CON-SUDO.md` §2.

## 3. Lista previa (§4 de la convención), al aprobar

- **¿Borra datos?** «Olvidar» borra la conversación compartida, a propósito y con confirmación. Las
  pruebas usan `storage` y `fetch` falsos.
- **¿Llama a una API externa?** No. Gasto 0 (servidor de pruebas con `KLOTHULHU_FAKE=1`).
- **¿Toca producción?** Sí, pero solo lo hace Josem: el secreto en `/etc/klothulhu/klothulhu.env` con
  el reinicio de `klothulhu-api`, el sitio nginx en :5757 y el merge en `/data/klothulhu`.

## Para el programador

Responde a: 998714c (H1-informe, parada)

1. **Aprobado** H1 (T1-T6), con las desviaciones 1-7.
2. **R1:** en `web/host.js`, que `ask` atrape la excepción de `sse.streamChat` → `console.warn` y, si la
   pregunta no se cortó, `error` con `{ code: 'unreachable' }`, sin pedir token. Prueba nueva en
   `web/test/host-extra.test.js` con los dos casos del §2 (lanza → un `error unreachable` y ningún
   `onNeedToken`; lanza con la pregunta ya cortada → nada). `npm test` y `npm run check` de `web/`.
   Un commit, citando D50.
3. Anexo corto al final de `H1-informe.md` (`## Anexo — R1`): el commit y el número de pruebas. Sin
   capturas.
4. **Para ahí.** Lo que queda (secreto, nginx, merge y K1-K9) es de Josem.
