Responde a: 62ed363 (H2-encargo, estilo elegible en el móvil, D51)

# H2 — Informe (fase 9, estilo elegible en el móvil, D51)

## Hecho

Rama `fase9` (worktree `/data/klothulhu-fase9`), un commit por pieza, citando D51:

| Pieza | Commit | Qué |
|---|---|---|
| `webcore` | 6fe6415 | `LOOK_KEY = 'klothulhu.look'` y `pickLook(stored, looks, fallback)`: pura, devuelve `stored` solo si es una cadena presente en un array `looks`; con cualquier otra cosa, `fallback`; nunca lanza |
| `app` + `html` + `css` | 014d21b | `<select id="lookSel" aria-label="Estilo">` vacío en `#bar`; `app.js` crea las opciones desde `VOCAB.looks` (`createElement('option')` + `textContent`); arranque con `pickLook` dentro de `try`; `setLook` / `markLook` con la misma forma que `setAvatar` / `markAvatar`; `paint` llama a `markLook()` cuando cae al estilo por defecto; comentario de cabecera actualizado |
| pruebas | e922243 | `web/test/look.test.js` (fichero nuevo) |

**Pruebas:** `cd web && npm test` → 22/22 (14 de antes + 8 nuevas); `npm run check` limpio. `cd desktop && npm test` → 69/69;
`npm run check` limpio. `git diff --stat -- desktop server` está vacío: no he tocado `desktop/`, `server/` ni `web/test/fase9-h1.test.js`.

`look.test.js` cubre:
- `pickLook`: un estilo válido tal cual; `null`, `undefined`, `''`, `'inexistente'`, `42`, objeto, array y `true` caen al fallback; `looks` igual a
  `undefined`, `null`, cadena, número u objeto también, sin lanzar. Tampoco se cuelan `'toString'` ni una subcadena (`'uki'`).
- `pickLook` con el `VOCAB.looks` real: `'ukiyoe'` → `'ukiyoe'`, y cada estilo del motor se devuelve a sí mismo.
- W2 ampliada: 11 estilos × 320 y 640 × 2 avatares × 9 escenas (7 emociones + `thinking` + `idle`), todas `ok: true`, cargando el motor como la normativa.
- `index.html`: `#lookSel` vacío, dentro de `#bar`, con `aria-label="Estilo"`.
- `app.js`: usa `VOCAB.looks` y `createElement('option')`, cita D51, no tiene `innerHTML` ni escribe ningún nombre de estilo a mano.
- `style.css`: `#lookSel` con `min-height: 40px`.

W11 sigue en verde. Ojo: W11 prohíbe la palabra «innerHTML» **también en comentarios**; mi primer comentario la llevaba y la reformulé.

**Pasada a mano** (servidor de pruebas `KLOTHULHU_FAKE=1` en :8766 + `web/dev-server.js` en :5858 + Chrome headless por CDP; ya parados):
- El select arranca en `pixel` sin nada guardado y tiene las 11 opciones, en el orden del motor.
- Elegir `ukiyoe` lo guarda en `localStorage` (`klothulhu.look = ukiyoe`). Tras recargar, el select sigue en `ukiyoe` (captura 09).
- Un valor guardado que el motor no tiene (`ya-no-existe`) arranca en `pixel`, sin error.
- Cambiar de estilo **mientras klothulhu lee** guarda el valor pero no repinta; con klothulhu **parado** (`lingering`), repinta sin fundido.
- Capturas en `docs/fase9/capturas/`: `07-ukiyoe-390x844.png` (escena del servidor), `08-barra-360x780.png` (barra entera, una fila) y
  `09-recarga-sigue-ukiyoe-390x844.png`. Además, a 360 px el nombre más largo del motor, `engraving`, cabe en el select (lo comprobé con un recorte
  que no se sube).

**Medición de la barra** (ancho de la barra = ancho de la pantalla en todos; sin scroll horizontal; botones y select de 40 px de alto):

| Ancho | Filas | Texto recortado |
|---|---|---|
| 320 | 2 (el select baja, ver desviación 2) | no |
| 360 | 1 | no |
| 390 | 1 | no |
| 430 | 1 | no |

**Para K6 — tiempo de pintado por estilo** (320 de ancho, escena `happy`, Chrome headless **sin GPU**: sirve para comparar, no como cifra del móvil):

| Estilo | Render claude / klothulhu (ms) | Decodificar imagen claude / klothulhu (ms) | SVG claude / klothulhu (KB) |
|---|---|---|---|
| pixel, original | 0-1 / 0-1 | 0-2 / 0-2 | 6 / 6 |
| mosaic | 7 / 6 | 11 / 1 | 89 / 89 |
| aero | 7 / 18 | 14 / 15 | 93 / 175 |
| kamon | 7 / 17 | 13 / 19 | 90 / 151 |
| tapestry | 7 / 25 | 9 / 23 | 95 / 209 |
| engraving | 8 / 17 | 12 / 18 | 108 / 192 |
| ukiyoe | 8 / 17 | 11 / 37 | 97 / 176 |
| golden | 9 / 16 | 16 / 32 | 98 / 199 |
| blueprint | 12 / 32 | 15 / 16 | 94 / 172 |
| cave | 13 / 25 | 21 / 21 | 93 / 235 |

Lectura: `pixel` y `original` son casi gratis (6 KB). Los otros nueve pesan 89-235 KB y tardan 6-32 ms en generar el SVG y hasta 37 ms en decodificarlo, y **el avatar
klothulhu pesa y tarda más que el de claude** en casi todos (hasta 235 KB con `cave`; la excepción es `mosaic`, igual en los dos y con un aviso del motor en el de klothulhu). El más lento de decodificar es `ukiyoe` con klothulhu (37 ms), seguido de `golden` (32 ms).
Esto es solo una pintada suelta: el tirón de K6 vendrá de la animación, que aquí no se puede medir. No hay nada que arreglar.

## Gasto

0. Servidor de pruebas con `KLOTHULHU_FAKE=1`, sin BD ni Qdrant; el servicio de producción (:8765) no se tocó. No hizo falta autorización.

## Desviaciones

1. **La barra del plan no cabía tal cual.** Con la letra de 15 px, `gap: 8px`, los dos botones de 44 px y el select de `7.5em`, a 360 y a 390 px el texto de
   «Klothulhu» quedaba recortado en su botón (medido: sin desbordar, pero con `scrollWidth > clientWidth`). Para que quepa en una fila:
   - la letra de la barra escala con el ancho: `--bar-fs: clamp(11px, 3.4vw, 14px)` (≈12,2 px a 360 y ≈13,3 px a 390);
   - `gap: 8px → 4px`, `padding` horizontal de los botones de avatar y del select de 2 px, y 🗑 / 🔑 de 44 a 40 px de ancho (siguen siendo 40 px de alto);
   - el select va en `7.5em` como pedía el encargo, que con esa letra son ≈92 px a 360 y ≈100 px a 390.
   A 360 px «Klothulhu» ocupa casi todo su botón (captura 08): cabe, pero con poco margen. Con una fuente monoespaciada del móvil algo más ancha que la de este Chrome podría rozar.
2. **Debajo de 340 px el select baja a una segunda fila** a todo el ancho (`@media (max-width: 339px)`). No lo pedía el encargo (que fija 360 y 390), pero evita
   recortes a 320. Lo mido a 320 px y funciona; no es un caso de uso real hoy.
3. **Arreglo de un fallo que ya estaba:** `#forgetBtn, #tokenBtn { padding: 0 }` perdía contra `#bar button { padding: 0 12px }` por especificidad, así que nunca se
   aplicaba (los botones salían ~3 px más anchos). Ahora la regla es `#bar #forgetBtn, #bar #tokenBtn`.
4. **Pruebas de más sobre las pedidas:** las del HTML, `app.js` y el CSS de `look.test.js` (las tres últimas de la lista de arriba) son un añadido mío, para que el selector
   no pueda volver a escribirse a mano ni perder el tamaño táctil sin que falle algo.

## Decisiones que necesito

Ninguna. Esperan a un «sí» de Josem, y no los hago yo: el merge `--ff-only` de `fase9` en `/data/klothulhu` y recargar la web en el móvil (nginx sirve `main`, los
ficheros son estáticos y no hay que tocar nada más; el servidor no se reinicia). Solo en el móvil real se puede ver si 12-13 px se lee bien en la barra y cómo se comporta
el selector nativo de Android o iOS; no lo he podido probar aquí.

## Anexo — R2

Responde a: e55c969 (H2-revision §3, retoque R2)

- **Hecho:** R2 en `b5ae706`. `web/index.html`: `<meta name="color-scheme" content="dark">` justo después del `theme-color`.
  `web/style.css`: `color-scheme: dark;` en `:root`. Nada más: ni colores nuevos ni `prefers-color-scheme`. Prueba nueva en
  `web/test/darkmode.test.js` (tres casos: el meta en el `<head>` y tras `theme-color`, la propiedad en `:root`, y que el CSS no
  tiene `prefers-color-scheme`); las dos primeras fallaban antes del arreglo.
- **Pruebas:** `cd web && npm test`: 25/25 (22 + 3 nuevas); `npm run check` limpio. Sin tocar `desktop/`, `server/` ni la normativa.
- **Sin captura**, como pedía la revisión: el oscurecido forzado del navegador no se reproduce en headless. Lo comprobará Josem en el móvil.
- **Efecto lateral esperado:** con `color-scheme: dark`, los controles nativos (el desplegable del select, el campo del token) también salen en oscuro.
- **Gasto:** 0. **Desviaciones:** ninguna. **Decisiones que necesito:** ninguna.
- **Merge pendiente:** `main` está en `e62ee99`, sin R2; el merge `--ff-only` de `fase9` y recargar en el móvil son de Josem.
