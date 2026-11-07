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
