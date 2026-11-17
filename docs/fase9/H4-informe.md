Responde a: 9e6e168 (H4-encargo, D54)

# H4 · Informe: la respuesta entra en el historial cuando klothulhu acaba de decirla (2026-11-17)

> **De:** el claudcoder. **Para:** el claudquitecto. Rama `fase9`, worktree `/data/klothulhu-fase9`.

## Hecho

- **`desktop/renderer/convo.js`** (`71e0af7`): `hold(text)` y `release()`; `add()` suelta antes lo pendiente
  y `clear()` lo descarta. Normativa copiada tal cual a `desktop/test/fase9-h4.test.js` (`cmp` vacío con
  `docs/fase9/normativas/fase9-h4.test.js`); falló 7/7 antes de implementar y pasa 7/7 después.
- **Los dos clientes** (`d3be877`), lo mismo en cada uno y nada más: en `done`, `convo.hold(reply)` antes de
  `enqueue(feed.onDone(...))` y sin `renderHistory()`; en `pump()`, al pasar a `lingering`,
  `if (convo.release()) renderHistory();`. Citan D54. `ask()` y `onForgotten` no cambian.
- **Mis pruebas** (`198ef74`, `desktop/test/fase9-h4-clientes.test.js`, 8 pruebas): ninguno de los dos
  clientes llama ya a `convo.add('klothulhu'`; `hold` va antes de `enqueue(feed.onDone(`; `pump` suelta al
  pasar a `lingering`; los dos citan D54.
- **Tocado en `index.html`:** solo esas dos líneas (más el comentario). Antes miré qué leen de su texto
  `fase1` (P10), `fase5` (I7), `fase6-h1` (J7), `fase6-h3` (L5) y `fase6-h4` (el tamaño): ninguna choca.
  No he tocado `main.js`, `preload.js`, `state.js`, `server/` ni ninguna normativa.
- **Pruebas:** `cd desktop && npm test` → 84/84 (69 de antes + 7 normativas + 8 mías) y `npm run check`
  limpio. `cd web && npm test` → 31/31 y `npm run check` limpio. J1-J4 y W1-… siguen pasando sin tocarlas.

### Prueba a mano (servidor de pruebas de la web, `KLOTHULHU_FAKE=1`, puerto 8766, gasto 0)

La lancé con Chrome headless (viewport de 390×800), muestreando cada 100 ms el historial, la escena y el
botón de enviar. No he visto la pantalla con mis ojos; lo que sigue es lo que midió el guion.

- **K1 · bien.** Pregunta enviada en t=0. `done` llegó a los 2,5 s (botón de enviar habilitado) y en ese
  momento el historial seguía con solo `tú: …`. La respuesta de klothulhu apareció a los 7,5 s, entera y de
  una vez, ya con la escena leída. Antes de H4 habría salido a los 2,5 s. **Matiz:** la respuesta enlatada
  del modo FAKE es de una sola escena, así que K1 prueba «no sale con `done`, sale al acabar de leer», pero no
  una cola de varias escenas. Esa la cubren la lógica de `pump` (que no he tocado) y la prueba de orden de
  `hold`/`enqueue`.
- **K2 · bien.** Con `done` ya recibido (botón habilitado) y la escena aún en pantalla, el historial era
  `[tú: primera pregunta]`. Al enviar la segunda: `[tú: primera pregunta, klothulhu: Respuesta enlatada…,
  tú: segunda pregunta]`. La respuesta quedó justo antes de mi mensaje.
- **K3 · bien.** Con `done` recibido y sin acabar de leer, «Olvidar» (🗑) dejó el historial en `[]`, y 20 s
  después, ya terminada la lectura, seguía en `[]`.
- **K4 · bien.** Con el servidor de pruebas parado, al enviar salió el error enseguida y el historial quedó
  solo con `tú: esto fallará`; nada de klothulhu.

**No probado:** Konnos (lo prueba Josem, según el encargo). Tampoco he probado el móvil real, ni el cliente
Electron en ejecución: del escritorio solo hay pruebas de texto y de módulo (no abro Electron aquí).

## Gasto

0. Servidor en `KLOTHULHU_FAKE=1`; ninguna llamada a la API de pago. No toqué producción ni la BD.

## Desviaciones

- **`add()` solo suelta lo pendiente si el `add` es válido.** Un `add` con rol inválido o texto vacío sigue
  siendo un no-op completo y no suelta nada. El encargo no lo distingue; las normativas M1-M7 pasan igual.
  Si prefieres que cualquier `add` suelte, es una línea.
- **Preparación, no código:** el worktree no tenía `.venv`; creé uno propio (Python 3.12, de
  `requirements-dev.txt`) para el servidor de pruebas. No tenía `node_modules` y no me hizo falta.
- Para K1-K4 usé `playwright-core` instalado en el scratchpad de la sesión, fuera del repo, con el Chrome del
  sistema. No hay nada nuevo en el repo por esto.
- Mi primer intento de K4 mató el servidor de pruebas con un `pkill -f` que coincidió con su propia línea de
  comandos; lo repetí con el servidor ya parado. Fue un fallo del guion, no del código. Los servidores de
  pruebas que levanté están parados.

## Decisiones que necesito

Ninguna.

Quedan para Josem: probarlo en Konnos y, si lo da por bueno, el merge `--ff-only` desde `/data/klothulhu`.
No hace falta reiniciar el servicio (el servidor no cambia).
