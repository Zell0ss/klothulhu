# Fase 12 · H1: revisión

Responde a: 1b9c4f0 (H1-informe)

**Veredicto: aprobado con un retoque (R1).** Revisado contra el código (`184b3d5..eac0237`), no contra el informe.

## 1. Comprobado

- **Normativas:** las dos copias son idénticas a `docs/fase12/normativas/` (`cmp`). En la fase 10 solo cambia la línea de I5
  que autorizó el plan (§4.3), en `tests/` y en su original. Ejecutado aquí: pytest 151/8 omitidas, escritorio 114/114, web
  31/31.
- **`entrada.js`:** `teclaEnter` y `altoCaja` son exactamente lo de §2. El comentario de `scrollHeight` y el borde es correcto,
  y los dos clientes suman el borde (`offsetHeight - clientHeight`).
- **`convo.js`:** `toMarkdown` cumple C1. Cae a la URL si falta `host` y no escapa el texto. Las dos cosas tienen prueba
  propia en `fase12-extra.test.js`.
- **Konnos:**
  - `keydown`: Esc primero, y luego solo `'enviar'` hace `preventDefault`. Enter con `awaiting`/`reading` no envía ni mete
    un salto de línea, que es lo razonable.
  - Al enviar: `ampliar(false)` y después `toggleInput(false)`.
  - `ajustarCaja` se llama en `applyGeom`, en `setPending` y al abrir la caja.
  - El 📋 de la escena sigue copiando `reply`.
  - `main.js`, la IPC y `layout.js` no se tocan (D63).
- **Web:**
  - `copiar()` usa primero `navigator.clipboard` con contexto seguro y, si no, el plan B. Si los dos fallan, ✕.
    `readOnly` y `setSelectionRange` en el plan B están bien pensados.
  - `enterkeyhint="enter"`; `submit()` mantiene sus condiciones y el `blur()`.
  - El ⤢ no roba el foco (`mousedown` con `preventDefault`).
- **Capturas:** `02-tres-lineas-360` (la fila cabe y el historial encoge) y `d4-ampliada` (la caja tapa la escena y los botones
  de arriba quedan libres) son lo que pide D63.

## 2. Desviaciones

| # | Juicio | Atribución |
|---|---|---|
| 1 | `55dvh` como máximo y la fila que encoge con el teclado abierto: **bien**. Con el teclado abierto, el plan tal cual dejaba ➤ fuera de la pantalla | hueco del plan (arquitecto): no tuve en cuenta el teclado |
| 2 | `pointer-events: none` en `#entry` y `auto` en sus piezas con la caja abierta: **bien**, y con su prueba de regresión. Al anclar la fila sobre la escena, el contenedor transparente se quedaba con el ratón | hueco del plan (arquitecto): §3.1 decía «comprueba el click-through» pero no previó el contenedor |
| 3 | Cabecera + `#turns` en Konnos y `#historyHead` hermano en la web: **bien**. Es lo que pedía §3.4 | — |
| 4 | Menores: **bien** | — |
| 5 | Esc conserva el borrador y la caja ampliada: **bien**. Coherente con §3.2 (solo enviar reinicia) | — |

## 3. Decisión que pedías

**¿El historial del móvil sigue pegado al final cuando crece la caja?** Josem dice que **sí**, tal como lo propones: si estaba
al final, sigue al final; si habías subido a leer, no se mueve. Queda registrado como **D68**.

## 4. Despliegue

Lo hace Josem tras R1: merge `--ff-only`, reinicio de `klothulhu-api.service`, recarga del móvil y, en Konnos, `git pull` y
reiniciar la app. Tomo nota de lo de `origin/main` (23 commits por detrás): se lo digo a Josem, y no es cosa tuya.

## Para el programador

Responde a: 1b9c4f0 (H1-informe)

Aprobado H1, con un retoque:

1. **R1 (D68):** en `web/app.js`, cuando cambia el alto de la caja (al escribir, con ⤢, al enviar y al cambiar el tamaño de la
   ventana), si `#history` estaba al final antes del cambio (con 2-4 px de margen), vuelve a ponerlo al final después. Si no
   estaba al final, no lo toques. Konnos no lo necesita, porque allí la caja no encoge el panel.
   - **Prueba:** si puedes, pon la condición «¿estaba al final?» en una función pura y pruébala. Si no, basta con dos capturas
     a 360×640: una con historial largo y estando al final, con 4 líneas y luego ampliada (sigue viéndose lo último), y otra
     tras subir a leer y escribir (no se mueve).

Después, un anexo corto en `H1-informe.md` con el commit y las capturas. **Para ahí**: el encargo de H2 lo escribo cuando Josem
haya probado H1 desplegado.

## 5. Revisión del anexo 1, R1 (2026-11-26)

Responde a: c612859 (H1-informe, anexo 1)

**Veredicto: aprobado.** H1 queda cerrado.

- **`estabaAlFinal`** (`webcore.js`) es pura y tiene prueba. El margen de 3 px está dentro de lo que pedí.
- **Anotar `alFinal` en cada `scroll`, y no justo antes del cambio: bien visto.** Con el teclado, el historial ya ha encogido
  cuando llega `resize`, y medir en ese momento daría «no estaba al final». La instrucción de la revisión («si estaba al final
  antes del cambio») se quedaba corta ahí. El hueco es mío.
- **`alFinal = true` en `renderHistory()`** cubre la charla que aún cabe entera (no hay `scroll` que lo anote). Es correcto,
  porque `renderHistory()` ya bajaba al final.
- **`ajustarCaja()`** guarda `scrollTop` antes de medir y lo repone si no estaba al final, para que el `height: auto`
  momentáneo no lo arrastre. Cuando el `scroll` lo provoca el propio ajuste, vuelve a anotar el mismo valor: no hay bucle ni
  estado incoherente.
- Ejecutado aquí: web 35/35.

## Para el programador

Responde a: c612859 (H1-informe, anexo 1)

R1 aprobado y H1 cerrado. Ahora le toca a Josem: merge, reinicio y las pruebas K1-K6. **No sigas con H2**: el encargo lo
escribo después de sus pruebas. Si en K1-K6 sale algo, irá como retoque en una sección nueva de esta revisión.
