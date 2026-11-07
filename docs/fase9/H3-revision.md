Responde a: 5bb58f0 (H3-informe)

# H3 · Revisión (2026-11-07)

**Veredicto: aprobado con un retoque (R3), que sale de la decisión pedida.**

## 1. Comprobado contra el código

- **Restricción dura:** el diff no toca `desktop/renderer/`, `main.js`, `preload.js`, `state.js`,
  `server/` ni ninguna normativa.
- **Los iconos:** `icon-512.png` y la captura a 48 px están bien. klothulhu verde y nítido, centrado y
  dentro de la zona segura, y en círculo se reconoce. Que el personaje quede algo pequeño (24 de 48 px) es
  el precio de la escala entera y de la zona segura. Se acepta.
- **Desviaciones:** se aceptan las siete. La 1 (escena `space` + `inspect`, con el bocadillo quitado y el
  fondo cambiado) es justo el «recorta la escena más limpia» que preveía el §1.1. La 3 (parar las
  animaciones en t=0, con una prueba de centrado) es un buen hallazgo.
- **Parar por la CSP fue lo correcto.**

## 2. La decisión: la CSP bloquea los iconos · *hueco del encargo (arquitecto)*

El §1.3 del encargo decía que los iconos no pasan por la CSP de la página. Es falso en Chrome: lo has
medido y tienes razón. **Josem ha elegido la opción A**, registrada como **D53**: `img-src 'self' data:`.

He revisado la normativa en `docs/fase9/normativas/fase9-h1.test.js` (W10, línea 239). Ahora exige
`img-src` igual a `'self'` y `data:`, en cualquier orden, con un comentario que apunta a D53. Lo he
comprobado sobre una copia aparte, con la CSP cambiada: W10 pasa. Con la CSP de ahora, W10 falla, que es
lo que debe pasar.

## Para el programador

Responde a: 5bb58f0 (H3-informe)

**R3** (D53):
1. Copia otra vez `docs/fase9/normativas/fase9-h1.test.js` a `web/test/fase9-h1.test.js`, **sin editarlo**
   (`cmp` tiene que salir vacío).
2. En `web/index.html`, `img-src data:` pasa a `img-src 'self' data:` en la CSP. No toques nada más de la
   CSP. Si el comentario de encima habla de `img-src`, actualízalo.
3. En `web/test/icons.test.js`, el aviso «`img-src` sigue siendo `data:`» pasa a comprobar `'self'` y
   `data:`.
4. `cd web && npm test` y `npm run check`. Repite tu medida con `Page.getAppManifest`: favicon e icono del
   manifest cargados y la consola sin errores de CSP.
5. Un commit citando D53, y un anexo corto al final de `H3-informe.md`. Para ahí.

## 3. Revisión del anexo R3 (2026-11-07)

Responde a: 090007b (H3-informe, anexo R3; código en ff55973)

- `web/test/fase9-h1.test.js` es idéntica a la normativa revisada (`cmp` vacío).
- La CSP es `img-src 'self' data:`, sin ningún otro cambio. El comentario que estaba mal, que decía que
  los iconos no pasan por `img-src`, ahora está corregido.
- `cd web && npm test` → 31/31, y `npm run check` sale limpio. `cd desktop && npm test` → 69/69. Lo he
  lanzado yo.

**R3 aprobado, y con él H3.** Queda que Josem lo vea en Samsung: el acceso directo nuevo, con icono.

## Para el programador

Responde a: 090007b (H3-informe, anexo R3)

R3 y H3 aprobados. No hay nada más que hacer.
