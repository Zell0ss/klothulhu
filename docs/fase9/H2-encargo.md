Responde a: 1358efc (H1-informe, anexo R1)

# H2 · Encargo: estilo elegible en el móvil (2026-11-07)

> **Para:** el claudcoder. **Desde:** el claudquitecto.
> **Decisión:** D51 (vault, `30-projects/klothulhu/ficha.md` § Decisiones). Supera la línea del plan
> «`look`: `pixel`, sin configuración» (§3).

## 0. Qué y por qué

Josem ya usa la web en el móvil (nginx instalado, `main` en `82f10b4`) y quiere poder elegir el estilo
del motor, para empezar `ukiyoe`. Ha elegido un **selector en la barra**, que funciona como el del
avatar. También sirve para medir K6 (tirones y calor) estilo a estilo.

**No es un contrato nuevo entre piezas.** Es una preferencia del móvil más en `localStorage`. El
servidor, el escritorio y el motor no cambian. Por eso no hay normativa: hay reglas exactas y pruebas
de regresión que escribes tú.

**Restricción dura:** la de siempre. No se tocan `desktop/` (nada), `server/` ni
`web/test/fase9-h1.test.js`.

## 1. Reglas

1. **`web/webcore.js`** gana `LOOK_KEY = 'klothulhu.look'` y una función pura
   `pickLook(stored, looks, fallback)`:
   - devuelve `stored` si es una cadena que está en `looks`;
   - en cualquier otro caso (`null`, `''`, un estilo que el motor ya no tiene, algo que no es cadena,
     `looks` que no es un array), devuelve `fallback`;
   - nunca lanza.
   La exportas junto a lo demás (`KlWebCore`).
2. **`web/index.html`:** un `<select id="lookSel" aria-label="Estilo">` en `#bar`, vacío en el HTML.
3. **`web/app.js`:**
   - Las opciones se crean en el arranque **desde `VOCAB.looks`**, con `document.createElement('option')`
     y `textContent` (D10: nada de `innerHTML`). Nunca una lista escrita a mano: si el motor gana un
     estilo, aparece solo.
   - Arranque: `look = pickLook(storage.getItem(LOOK_KEY), VOCAB.looks, VOCAB.defaults.look)`, dentro de
     `try` como el avatar. El `select` refleja el valor.
   - Al cambiar: se guarda en `localStorage` (en `try`), se pone `lookWarned = false` y, **con klothulhu
     parado** (`!awaiting` y fase `idle` o `lingering`), se repinta `lastScene` sin fundido. Si no está
     parado, vale desde la escena siguiente. Es exactamente lo que hace `setAvatar`; hazlo con la misma
     forma (`setLook`, `markLook`).
   - Si `paint` cae al estilo por defecto porque el motor rechaza el elegido (la rama que ya existe),
     el `select` lo refleja (`markLook()`, como `markAvatar()` en la rama del avatar).
   - Actualiza el comentario de cabecera: lo que cambia respecto al escritorio ahora incluye «el estilo
     se elige en la barra (D51)».
4. **`web/style.css`:** la barra tiene que caber **en una fila a 360 px y a 390 px**, sin desbordar
   ni hacer scroll horizontal, con zonas táctiles de 40 px de alto como mínimo. Orientación:
   `[Claude|Klothulhu] [estilo ▾] 🗑 🔑`, con los botones del avatar en `flex: 1; min-width: 0` y el
   `select` de ancho fijo (unos `7.5em`) con el mismo borde que los botones. Si a 360 px no cabe de
   ninguna manera, el `select` baja a una segunda fila, debajo de los avatares, a todo el ancho. Dilo
   en el informe.

## 2. Pruebas (fichero nuevo, `web/test/look.test.js`)

- `pickLook`: un estilo válido se devuelve tal cual; `null`, `''`, `'inexistente'`, `42`, y `looks`
  igual a `undefined`, devuelven el `fallback`, sin lanzar.
- `pickLook` con el `VOCAB.looks` **real** del motor: `'ukiyoe'` → `'ukiyoe'`.
- **W2 ampliada, sin tocar la normativa:** el motor pinta a 320 y a 640 de ancho con **cada** estilo de
  `VOCAB.looks`, los dos avatares y la escena de cada emoción, `ok: true`. Los avisos sí se permiten
  (`props-not-drawn` en los 3D es lo esperado). Carga el motor como lo hace la normativa.
- W11 sigue en verde. Ojo: `app.js` no puede usar `innerHTML` ni para limpiar el `select`.

## 3. Parada

`cd web && npm test` y `npm run check`. Y, aunque no hayas tocado `desktop/`, `cd desktop && npm test`.

Pasada a mano con el servidor de pruebas y `dev-server.js`. Tres capturas en `docs/fase9/capturas/`:
- `07-ukiyoe-390x844.png`, con una escena del servidor;
- `08-barra-360x780.png`, con la barra entera visible;
- `09-recarga-sigue-ukiyoe-390x844.png`.

Apunta en el informe si algún estilo tarda visiblemente más en pintar (con los `ms` de la consola, si
ayudan). Es un dato para K6, no hay que arreglar nada.

Informe nuevo, **`docs/fase9/H2-informe.md`**, con el formato de siempre. **Para ahí.** El merge `--ff-only` y la recarga en el móvil son de Josem (nginx no se toca:
sirve `main` y los ficheros son estáticos).

## Para el programador

Responde a: 1358efc (H1-informe, anexo R1)

1. Implementa H2 según §1, en la rama `fase9` (worktree `/data/klothulhu-fase9`). Un commit por pieza
   (`webcore`, `app` + `html` + `css`, pruebas), citando D51.
2. Pruebas en `web/test/look.test.js` (§2). La normativa no se toca.
3. Parada del §3: pruebas, tres capturas e informe en `docs/fase9/H2-informe.md`.
4. Gasto: 0. Usa el servidor de pruebas con `KLOTHULHU_FAKE=1`, nunca producción.
