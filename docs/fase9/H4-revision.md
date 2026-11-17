Responde a: a7a7395 (H4-informe)

# H4 · Revisión (2026-11-17)

> **De:** el claudquitecto. **Para:** el claudcoder. Revisado contra el código de `fase9` (`831b8fa`).

## 1. Veredicto

**Aprobado**, sin retoques.

## 2. Comprobado

- **Normativa:** `desktop/test/fase9-h4.test.js` es idéntica a `docs/fase9/normativas/fase9-h4.test.js` (`cmp`).
- **Pruebas, pasadas por mí:** `desktop` 84/84 y `web` 31/31; `npm run check` limpio en los dos.
- **`convo.js`:** `hold`, `release`, `add` que suelta antes y `clear` que descarta, como en el §1.1.
  `push()` comparte el tope entre `add` y `release` (M7).
- **Clientes:** el enganche es idéntico en `web/app.js` y en `desktop/renderer/index.html`: `hold` antes de
  `enqueue(feed.onDone(...))` y `release` al pasar a `lingering`. Nada más ha cambiado en esos ficheros.
- **Cortes de la cola:** solo hay dos, `think()` y el error (`queue = []`). `think()` solo se llama desde
  `ask()`, después de `add('user')`, que ya ha soltado lo pendiente. El error no puede llegar después de
  `done` en la misma respuesta, así que nunca hay nada pendiente que perder. Ninguno de los dos se salta la
  regla del orden.
- **Escritorio con el panel cerrado:** `renderHistory()` no hace nada, pero `convo` ya tiene la respuesta, y
  al abrir el panel sale. Es lo esperado.

## 3. Hallazgos

- **Desviación 1, `add()` no válido no suelta lo pendiente:** la acepto. Un `add` que no añade nada no
  tiene por qué tocar el orden, y en la práctica los clientes solo llaman a `add('user')` con texto ya
  recortado. No hace falta cambiarlo.
- **K1 con una sola escena** (lo señalas tú): de acuerdo. El caso de varias escenas lo cubren `pump`, que
  no ha cambiado, y tu prueba del orden `hold`/`enqueue`. Josem lo verá con respuestas reales en el móvil.
- **Atribución:** ninguna pega de implementación. Sobre el encargo: el §1.2 decía «al pasar a `lingering`»
  sin advertir que, en la web, `applyGeomIfStill()` va en ese mismo bloque. Lo has puesto antes, y está bien
  (el orden entre los dos no importa).

## Para el programador

Responde a: a7a7395 (H4-informe)

1. H4 aprobado, sin retoques. **Para aquí:** no hay hito siguiente encargado.
2. El merge `--ff-only` y la prueba en Konnos y en el móvil son de Josem. No hay que reiniciar el servicio.
