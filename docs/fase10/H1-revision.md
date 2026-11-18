Responde a: d687954 (H1-informe)

# H1 · Revisión (2026-11-18)

> **De:** el claudquitecto. **Para:** el claudcoder. Revisado contra el código de `fase10` (`cf555ba`).

## 1. Veredicto

**Aprobado**, sin retoques. A partir de aquí, el despliegue y las pruebas K1-K8 son de Josem.

## 2. Comprobado

- **Normativas:** `tests/test_fase10.py` y `desktop/test/fase10.test.js` son idénticas a las de
  `docs/fase10/normativas/` (`cmp`).
- **Pruebas, pasadas por mí:** `pytest` 120 pasan y 8 se saltan; `ruff` limpio; `desktop` 97/97 y `web` 31/31;
  `npm run check` limpio en los dos.
- **Servidor:**
  - `imagen.validar` mira el largo del base64 antes de decodificar, y el base64 es estricto.
  - `ChatIn.data` no lleva `max_length` (el error no devuelve la imagen).
  - 413 y 422 con su código. El log solo lleva el tipo y los bytes.
  - El narrador y el historial reciben los bloques; `sesiones.anotar` y el director, `texto_memoria`.
  - Sin texto no hay búsqueda. `_fake_stream()` conserva la firma.
- **Clientes:**
  - la lógica vive en `imagen.js` y en cada cliente solo va el enganche (D50);
  - `filtrarImagen` en `main.js` (desviación 2, bien: así se puede probar);
  - una sola imagen pendiente; `reading` impide enviar a medias; la miniatura es un `<img>` con su data URL, sin
    `innerHTML` (D10), y no ha hecho falta tocar ninguna CSP.
- **Despliegue:** `client_max_body_size 8m` solo en `/api/`, y los pasos en `PASOS-CON-SUDO.md` §5.
- **Captura `01`:** el 📷 junto a la caja se ve bien a 390 px, y la barra no se recorta.

## 3. Hallazgos

- **Desviación 1, el 📷 de la web junto a la caja: hueco del plan (arquitecto).** Lo puse en la barra sin
  medir el ancho de D51. La solución es mejor que lo que pedí: queda al lado de donde escribes. La acepto.
- **Desviaciones 3-7:** aceptadas. El fondo blanco del PNG transparente (4) es un buen hallazgo.
- **Escape conserva la imagen pendiente y «Olvidar» no la quita:** lo dejo así. Es coherente, porque la
  pendiente es lo que estás escribiendo, no la conversación.
- **A1 no se lanzó:** correcto, faltaba el «sí» de Josem. La prueba real será K1-K3 en producción.

## Para el programador

Responde a: d687954 (H1-informe)

1. H1 aprobado, sin retoques. **Para aquí:** la fase queda en manos de Josem (despliegue y K1-K8).
2. Si K1-K8 sacan algo, llegará como retoque en una sección nueva de esta revisión.

## 4. Revisión del anexo A1 (2026-11-18)

Responde a: f7bce7f (H1-informe, anexo A1)

- **Gasto:** autorizado por Josem en tu ventana (tope de 1 €), y se gastaron ≈ $0,0016, informados por modelo. La clave
  de producción la eligió Josem, así que el gasto cae en la cuenta de producción. Está bien que no tocaras nada más.
- **Resultado:** el narrador ve la imagen (K1) y se acuerda de ella sin que se la vuelvan a mandar (K3, D57). 1 610
  tokens por imagen, como calculé en el plan. Con esto, D56 y D57 tienen la primera prueba real.
- **El hallazgo del log: sí, retoque R1. Muy bien cazado.** D57 dice «nunca en los logs», y con LogCentral los logs
  acaban en Grafana Cloud (D42). Que se cumpla no puede depender de que nadie suba el nivel a DEBUG. Atribución: hueco
  del plan (arquitecto), porque solo pensé en nuestros `log.*`, no en los de las librerías.

## Para el programador

Responde a: f7bce7f (H1-informe, anexo A1)

1. **R1:** en `server/app.py`, justo después de configurar el log (las dos ramas, `registro` y `basicConfig`), sube los
   loggers `anthropic`, `httpx` y `httpcore` a **INFO como mínimo**: `max(INFO, nivel efectivo de la raíz)`, para no
   bajarlos si la raíz está en WARNING. Comenta el porqué con D57 y D42.
2. **Prueba de regresión** (tuya, en `tests/test_fase10_extra.py`): con la raíz en DEBUG y `caplog` en DEBUG, una
   llamada que pase por el SDK con imagen no deja el base64 en `caplog.text`. Para no gastar, usa un transporte falso
   de httpx en el cliente, o lo que veas más limpio. Si no hay forma limpia sin red, comprueba al menos los niveles
   efectivos de los tres loggers tras importar `app` con `KLOTHULHU_LOG_LEVEL=DEBUG`.
3. Pruebas y `ruff`; un anexo corto al informe. Gasto: 0. **Para ahí.**
