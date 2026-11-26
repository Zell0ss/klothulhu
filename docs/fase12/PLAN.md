---
proyecto: klothulhu
fase: 12
titulo: la caja grande y copiar la conversación (y su resumen)
plan: arquitecto
fecha: 2026-11-26
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D63-D67; también D10, D27, D50, D54, D60, D61)"
gasto_autorizado: "ninguno en H1 (gasto 0). H2 llevará un paso [API] con su coste en su encargo"
---

# Fase 12: la caja grande y copiar la conversación

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-11-26.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

Josem habla más con klothulhu y la caja de una línea se le queda corta. Se traen dos cosas de la agora:
la caja que crece (agora D30) y el «Exportar» (agora D12). El resumen va después, en H2.

- **H1** (este plan): la caja de varias líneas, Enter según el cliente, el tope de 1000 a 4000 caracteres y
  el botón de copiar la conversación. En los dos clientes. Gasto 0.
- **H2** (encargo aparte, `H2-encargo.md`, cuando H1 esté aprobado): el resumen en voz neutra (D67). Abre
  un endpoint nuevo; sus normativas van en el encargo.

**Contrato:** sí cambia, y por eso el plan es mío.

- `POST /chat`: `text` admite hasta **4000** caracteres (D65). Nada más cambia de forma.
- `convo.js` gana `toMarkdown(entries, { fecha })` (D66).
- Módulo compartido nuevo, `desktop/renderer/entrada.js` (global `KlEntrada`), que se carga en los dos
  clientes (en la web, por `/shared/`, que ya apunta a `desktop/renderer/`).
- La IPC del escritorio **no** cambia: se reutiliza `copy`. `main.js`, `layout.js` y el tamaño de la
  ventana tampoco cambian (D63).

## 1. Lista previa (convención §4)

- **¿Borra o sobrescribe datos?** No.
- **¿Llama a una API externa?** En H1, no. Con 4000 caracteres el narrador recibe hasta unos 1000 tokens
  más por mensaje: céntimos de céntimo con Haiku 5.5 (D65). Las pruebas van con `KLOTHULHU_FAKE=1`.
- **¿Toca producción?** Sí, y lo hace Josem: merge `--ff-only` en `/data/klothulhu`, reinicio de
  `klothulhu-api.service` (por el tope del servidor) y recarga del móvil. nginx sirve `/shared/` y la web
  desde `/data/klothulhu`, así que la web se actualiza con el merge, sin tocar nginx. En Konnos, `git pull`
  y reiniciar la app. El orden importa poco: un cliente nuevo con el servidor viejo solo falla con más de
  1000 caracteres (422).

## 2. `entrada.js` (nuevo, puro, UMD como `convo.js`)

1. `MAX_LINEAS = 6`.
2. `teclaEnter(ev, modo)` con `ev = { key, shiftKey, ctrlKey, metaKey, isComposing }` y `modo`
   `'escritorio' | 'movil'`. Devuelve `'enviar'`, `'linea'` o `null` (D64):
   - con `isComposing`, o si `key !== 'Enter'`, o con otro modo → `null`;
   - escritorio: Mayús+Enter → `'linea'`; lo demás → `'enviar'`;
   - móvil: Ctrl o ⌘ → `'enviar'`; lo demás → `'linea'`.

   Quien la llama hace `preventDefault()` y envía solo con `'enviar'`. Con `'linea'` y `null` deja que el
   `textarea` haga lo suyo.
3. `altoCaja({ scrollHeight, linea, relleno })` → `max(linea + relleno, min(scrollHeight, linea *
   MAX_LINEAS + relleno))`, en píxeles. Cada cliente la usa en `input` (poniendo `height: auto` antes de
   leer `scrollHeight`) y al vaciar la caja.
4. Añádelo a `npm run check` del escritorio y cárgalo en los dos `index.html` antes del script principal.

## 3. Los dos clientes

Es una copia deliberada de la lógica, como el resto del reproductor (D50). Lo compartido es lo de §2 y §4.

1. **Caja (D63):** `<input id="ask">` pasa a `<textarea id="ask" rows="1" maxlength="4000">`, con los
   mismos `placeholder`, `autocomplete` y `spellcheck`. Lleva `resize: none` (sin tirador),
   `white-space: pre-wrap` y `overflow-y: auto`. Crece sola con `altoCaja`.
   - **Konnos:** la caja crece **hacia arriba, sobre la escena**, y la ventana no cambia. La fila `#entry`
     se ancla abajo (p. ej. `position: absolute; bottom: …` dentro de `#col`) para que, al crecer, no
     empuje nada fuera de la ventana. Con una línea tiene que verse **igual que hoy** (32 px, mismo sitio).
     Comprueba que el click-through sigue bien: sobre la caja crecida, los clics van a la caja (hoy
     `overInput` mira `e.target === input`; con el `textarea` debería seguir valiendo).
   - **Móvil:** la caja crece dentro de `#entry` y el historial (`flex: 1`) encoge. Revisa que la fila
     (📷, miniatura, caja, ⤢, ➤) cabe a **360 y 390 px**, que es el aviso de D51 y D56.
2. **⤢ (D63):** `<button id="growBtn" type="button" title="Ampliar" aria-label="Ampliar la caja"
   aria-pressed="false">⤢</button>` en `#entry`, a un lado de la caja. Alterna `aria-pressed` y el
   `title`/`aria-label` («Reducir la caja»). Ampliada: en Konnos, el alto de la escena (`STAGE_H × zoom`,
   el que ya tiene `#stage`); en el móvil, `55dvh`. Ampliada no crece sola: hace scroll. Al enviar, vuelve
   a una línea y sin ampliar. No se guarda en ningún sitio.
3. **Enter (D64):** en `keydown`, `teclaEnter(e, 'escritorio')` en Konnos y `teclaEnter(e, 'movil')` en la
   web. En la web, `enterkeyhint="send"` pasa a `enterkeyhint="enter"`. Las condiciones de envío no
   cambian (no se envía mientras `awaiting` o `reading`, y sí con texto o imagen). En la web se mantiene
   `input.blur()` al enviar.
4. **Copiar la conversación (D66):** `<button id="copyAllBtn" type="button" title="Copiar la conversación"
   aria-label="Copiar la conversación">📋</button>` en la cabecera del panel de historial. **Fuera** del
   contenedor que vacía `renderHistory()` (`replaceChildren`): si no, desaparece en cada repintado. Está
   desactivado si `convo.entries()` está vacío. Al pulsarlo, copia `toMarkdown(convo.entries(), { fecha })`,
   con `fecha` la local en `AAAA-MM-DD`, y da la misma señal que el 📋 de Konnos (✅ ~1,2 s).
   - **Konnos:** `kl.copy(md)`. El panel solo se ve con 📜. El 📋 de la escena (la última respuesta) no
     cambia.
   - **Móvil:** si `window.isSecureContext && navigator.clipboard`, `navigator.clipboard.writeText(md)`. Si
     no (es lo normal: `:5757` va por **http**), un `textarea` oculto, `select()` y
     `document.execCommand('copy')`, como en la agora. Si fallan los dos, la señal es ✕ y no ✅.
   - Deja en la cabecera sitio para un segundo botón (el resumen de H2).

## 4. `convo.js` y servidor

1. **`convo.js`:** `toMarkdown(entries, { fecha } = {})`, exportada junto a `createConvo` (D66). Formato,
   el de la prueba C1:
   - `# Klothulhu · <fecha>` (o `# Klothulhu` sin fecha), una línea en blanco y una entrada detrás de otra,
     cada una seguida de una línea en blanco;
   - `**Tú:** <texto>` / `**Klothulhu:** <texto>`, con el texto tal cual (los saltos de línea se quedan);
   - si la entrada trae `sources`, en la línea siguiente `fuentes:` (o `consultado:` si `consultadas`,
     D61) y los enlaces `[host](url)` separados por `, `;
   - sin entradas → `''`.
2. **Servidor:** `ChatIn.text`: `max_length=4000` (D65). Repasa que nada más recorte o rechace por
   encima de 1000. Yo solo he visto que `memoria_bd.py` recorta los eventos a 1000 al guardarlos, y eso se
   queda así.
3. **La normativa de la fase 10 cambia por D65, por orden mía:** en `tests/test_fase10.py` (I5) y en su
   original `docs/fase10/normativas/test_fase10.py`, la línea `app.ChatIn(text="x" * 1001)` pasa a
   `app.ChatIn(text="x" * 4001)  # D65 (fase 12) sube el tope de 1000 a 4000`. Es el **único** cambio
   permitido en normativas anteriores. Si otra normativa vieja se rompe, para y me lo dices.

## 5. Pruebas y parada

- **Normativas:** copia tal cual `docs/fase12/normativas/fase12.test.js` a `desktop/test/fase12.test.js` y
  `docs/fase12/normativas/test_fase12.py` a `tests/test_fase12.py`. No se editan. Las de las fases
  anteriores tienen que seguir pasando (con la excepción de §4.3).
- **Tuyas** (recomendado): `toMarkdown` con un texto que traiga `**` o corchetes (sale tal cual, sin
  escapar) y una entrada `sources` sin `host` (cae a la URL).
- **A mano**, con el servidor de pruebas de la fase 9 (`KLOTHULHU_FAKE=1`) y Chrome sin pantalla, en la web
  a 360 y a 390 px. Capturas en `docs/fase12/capturas/`:
  1. la caja vacía (una línea, como antes);
  2. con 3 líneas (ha crecido y el historial ha encogido);
  3. con 20 líneas (tope de 6 líneas y scroll);
  4. ampliada con ⤢;
  5. Enter hace salto de línea y ➤ envía; tras enviar, la caja vuelve a una línea;
  6. 📋 del historial: pega lo copiado en el informe (en la página por http tiene que funcionar el plan B).

  Konnos no se puede probar aquí. Lo prueba Josem (K1-K3).
- **Parada:** `pytest -q tests`, `ruff check .`, `cd desktop && npm test && npm run check`,
  `cd web && npm test && npm run check`. Informe en `docs/fase12/H1-informe.md`, con las capturas.
  **Para ahí.**

## 6. Pruebas de Josem tras desplegar H1 (K)

- K1: en Konnos, escribe tres líneas con Mayús+Enter: la caja crece hacia arriba sobre la escena y Enter
  envía. Con una línea, se ve como antes.
- K2: en Konnos, ⤢ con un texto largo: tapa la escena y hace scroll; al enviar vuelve a una línea. Mientras
  klothulhu habla, ¿te molesta que la caja tape la escena? (Es el indicador de D63.)
- K3: en Konnos, 📜 y 📋 del panel: pégalo en Obsidian; sale la charla con las fuentes como enlaces.
- K4: en el móvil, Enter hace salto de línea y ➤ envía; ⤢ la sube a media pantalla.
- K5: en el móvil, 📋 del historial: pégalo en una nota. Funciona aunque la página vaya por http.
- K6: un mensaje de unas 300 palabras (más de 1000 caracteres) llega y klothulhu contesta.

## 7. H2: el resumen (avance; el encargo manda)

Para que H1 no cierre puertas. **No** se implementa en H1.

- El botón (`#summaryBtn`, «Resumir la conversación») va junto a `#copyAllBtn`.
- El cliente manda `entries` (rol y texto, como mucho las 200 de `convo.js`) a un endpoint nuevo
  (`POST /summary`). El servidor devuelve un resumen en voz neutra (D67) que el cliente enseña y deja
  copiar. En Konnos, por una IPC nueva (el token no llega al renderer).
- En el encargo de H2, tras comprobarlos con la documentación vigente: el modelo y su coste, el prompt, el
  tope de salida y qué pasa si se corta (D62 y agora D36), los errores (413, 422, 502), qué va a los logs
  (nada del texto, D42) y el paso [API] con su coste.
