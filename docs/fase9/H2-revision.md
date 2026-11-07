Responde a: a0ae9bb (H2-informe)

# H2 · Revisión (2026-11-07)

**Veredicto: aprobado.**

## 1. Comprobado contra el código

- `git diff 62ed363..efe085e` no toca `desktop/`, `server/` ni `web/test/fase9-h1.test.js`.
  `cd web && npm test` → 22/22, y `npm run check` sale limpio. Lo he lanzado yo.
- **`pickLook`:** es pura y no lanza. `includes` sobre el array no deja colarse `'toString'` ni una
  subcadena. Se exporta junto con `LOOK_KEY`.
- **`app.js`:**
  - las opciones salen de `VOCAB.looks`, con `createElement` y `textContent` (D10);
  - `setLook` y `markLook` tienen la misma forma que `setAvatar` y `markAvatar`;
  - con klothulhu parado se repinta sin fundido; si está hablando, vale desde la escena siguiente;
  - cuando `paint` cae al estilo por defecto, el selector lo refleja;
  - en el arranque, `pickLook` va dentro de `try` y después de crear las opciones, así que
    `lookSel.value` sí encuentra su opción.
- **CSS:** las desviaciones 1-3 se aceptan. La 3 (especificidad de `#forgetBtn`/`#tokenBtn`) era un fallo
  pequeño de H1 que nadie había visto, y el arreglo es correcto.
- **Capturas:** en la 07 y la 08 se ve `ukiyoe` con la barra en una fila a 390 y a 360 px. A 360 px,
  «Klothulhu» llena su botón, pero cabe.
- **Tiempos para K6:** se agradecen. `pixel` y `original` casi no cuestan nada. Los otros nueve pesan
  de 90 a 235 KB, y el avatar verde cuesta más. Es un dato, no un fallo.

## 2. Observaciones sin acción

- **iOS** amplía la página al tocar un `select` con letra de menos de 16 px. Josem usa Android
  (`realme-gt-7t`), y Chrome en Android no lo hace. Si algún día se usa desde el iPad, se arregla con una
  línea (`font-size: 16px` en `#lookSel`).
- La desviación 4 (pruebas de texto sobre `app.js` y el CSS) se acepta. Ojo: es el mismo tipo de prueba
  «que lee el texto» que nos ató en D50. Si estorba al extraer el reproductor, se sustituye.

## Para el programador

Responde a: a0ae9bb (H2-informe)

H2 aprobado. No hay nada más que hacer: el merge `--ff-only` y recargar en el móvil son de Josem.

## 3. Retoque tras la prueba en el móvil (2026-11-07)

Responde a: a0ae9bb (H2-informe); sin informe nuevo, viene de una captura de Josem.

### R2 · El navegador del móvil oscurece la página por su cuenta · *hueco del plan (arquitecto)*

Con el modo oscuro del navegador activo (el «modo oscuro automático para sitios web» de Chrome y sus
derivados), la página sale alterada: el marco y el bocadillo de `ukiyoe`, que son crema con letra
oscura, se ven marrón oscuro con letra clara; los colores del dibujo, como en negativo; y el rojo óxido
de la barra se vuelve más oscuro. El navegador aplica su oscurecido porque la página no declara que ya
es oscura. El plan no lo previó.

**Pido:**
1. En `web/index.html`, `<meta name="color-scheme" content="dark">`, junto al `theme-color`.
2. En `web/style.css`, `color-scheme: dark;` en `:root`.
3. Una prueba en un fichero nuevo, `web/test/darkmode.test.js` (la normativa no se toca), que compruebe
   las dos cosas leyendo el texto.

Nada más: ni colores nuevos ni `prefers-color-scheme`. La página ya es oscura; solo hay que decirlo.
`npm test` y `npm run check` de `web/`. Un commit, citando D50. Anexo corto al final de `H2-informe.md`.
No hacen falta capturas: el oscurecido forzado no se reproduce en headless, lo verá Josem.

## Para el programador

Responde a: a0ae9bb (H2-informe)

R2 del §3: `color-scheme: dark` en el meta y en `:root`, con su prueba en `web/test/darkmode.test.js`.
Un commit y un anexo en `H2-informe.md`. Para ahí.

## 4. Revisión del anexo R2 (2026-11-07)

Responde a: e52313a (H2-informe, anexo R2; código en b5ae706)

- `git diff e55c969..e52313a` toca solo `index.html` (el meta, después de `theme-color`), `style.css`
  (`color-scheme: dark` en `:root`), la prueba nueva y el informe. No toca `desktop/`, `server/` ni la
  normativa.
- `cd web && npm test` → 25/25, y `npm run check` sale limpio. Lo he lanzado yo.
- El efecto lateral, que los controles nativos también salgan oscuros, es el que queremos.

**R2 aprobado.** Queda que Josem lo compruebe en el móvil con el navegador en oscuro.

## Para el programador

Responde a: e52313a (H2-informe, anexo R2)

R2 aprobado. No hay nada más que hacer.
