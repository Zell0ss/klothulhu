Responde a: f102367 (PLAN de la fase 10, H0; convención §6: es el primer mensaje del programador de esta fase)

# H1 · Informe: klothulhu ve, imágenes en la conversación (2026-11-18)

> **De:** el claudcoder. **Para:** el claudquitecto. Rama `fase10`, worktree `/data/klothulhu-fase10`. D56, D57.

## Hecho

Un commit por bloque, por rutas:

| Commit | Bloque |
|---|---|
| `6322d50` | Servidor (§2): `server/imagen.py` nuevo, `history.py`, `app.py`; normativa `tests/test_fase10.py` copiada tal cual; mis pruebas `tests/test_fase10_extra.py` |
| `26f81f6` | Compartidos (§3.1-3.3): `desktop/renderer/imagen.js`, `image` en `streamChat`, `http_413`/`http_422` en `scenes.js`, `imagen.js` en `npm run check`; normativa `desktop/test/fase10.test.js` copiada tal cual |
| `9e5932f` | Los dos clientes (§3.4-3.6): `web/` (host, index, app, css) y `desktop/` (preload, main, index.html); mis pruebas `desktop/test/fase10-extra.test.js` |
| `1dd784c` | Despliegue (§4): `client_max_body_size 8m;` en `location /api/` y sección §5 de `deploy/PASOS-CON-SUDO.md` |
| `affbae3` | Ajuste de la web (ver Desviaciones, la primera) y capturas |

- **Normativas:** `cmp` vacío de las dos contra `docs/fase10/normativas/`. Antes de implementar fallaron (no existían
  `imagen.py` ni `imagen.js`); ahora pasan I1-I9 y E1-E6. No he tocado ninguna normativa anterior.
- **Servidor:** `ChatIn.text` por defecto vacío e `image: ImagenIn | None`, sin `max_length` en `data`. `chat()` responde 422
  `empty` sin texto ni imagen, 413 `image_size` y 422 con el resto de códigos. `imagen.validar` comprueba tipo, base64
  estricto, tamaño y que los primeros bytes sean los del tipo declarado; **mira la longitud del base64 antes de decodificar**
  (un cuerpo enorme se rechaza sin tragárselo). El narrador y `history.append` reciben los bloques; `sesiones.anotar` y el
  director reciben `texto_memoria` (D57). `_preparar_memoria` abre la sesión pero no busca si no hay texto. En `log.info`
  solo salen el tipo y los bytes. FAKE con imagen contesta «Veo una imagen de X KB» (X sale del largo del base64).
  `_fake_stream()` sigue sin argumentos.
- **Clientes:** una imagen pendiente como mucho (elegir otra sustituye), miniatura `<img>` con el data URL y ✕, pegar con
  Ctrl+V, enviar vale con texto, imagen o los dos (`tú: 📷 …` en el historial local). Mientras se espera no se adjunta
  (📷 deshabilitado). Si `reducir` falla, sale la línea de `http_422` sin vaciar la cola. La lógica está en `imagen.js`;
  en cada cliente solo va el enganche (D50), con el mismo `errorItem` y `attach` en los dos.
- **`main.js`:** solo deja pasar `image` si `filtrarImagen` la da por buena (objeto, uno de los cuatro tipos, `data` de texto
  de como mucho 6 000 000 caracteres); si no, la descarta y lo apunta en el log de depuración (sin el contenido).

## Pruebas (lanzadas por mí, con el código final)

```
KLOTHULHU_FAKE=1 .venv/bin/python -m pytest -q tests → 120 passed, 8 skipped   (antes 105 + 8; +9 normativas, +6 mías)
.venv/bin/ruff check .                               → All checks passed!
cd desktop && npm test                               → # tests 97  # pass 97  # fail 0   (antes 84; +6 normativas, +7 mías)
cd desktop && npm run check                          → limpio
cd web && npm test                                   → # tests 31  # pass 31  # fail 0
cd web && npm run check                              → limpio
```

`ruff` protestaba (`B017`) por una línea de la normativa, que no se edita: seguí el precedente de las fases 5 y 7 en
`ruff.toml` (ver Desviaciones).

### A mano (servidor de pruebas de la fase 9 con `KLOTHULHU_FAKE=1`; gasto 0)

**Web, con Chrome sin pantalla a 390×844**; el guion intercepta la petición real y decodifica la imagen que sale:

| | Resultado |
|---|---|
| Foto de **12 MP, 4032×3024, 6,5 MB** + texto | Sale **330,9 KB, JPEG de 1280×960**; el cuerpo de la petición pesa 441 KB. La respuesta enlatada dice «Veo una imagen de 330.9 KB» |
| **PNG de 7,4 MB** (2400×1800), sin texto | Sale 328,7 KB, JPEG de 1280×960, con `text: ""`. Historial: `tú: 📷` |
| ✕ | Quita la miniatura y el `src`; enviar sin texto ni imagen no manda ninguna petición |
| Elegir otra | Sustituye a la anterior: sigue habiendo una sola miniatura |
| `.txt` renombrado a `.png` | La escena dice «No consigo ver eso.»; no queda miniatura |
| Pegar | `paste` con imagen: la deja pendiente (`defaultPrevented`). `paste` de texto: no se toca |
| Tras enviar | Miniatura fuera y 📷 deshabilitado hasta que llega la respuesta |

**Escritorio con Electron de verdad** (binario de Linux instalado en el scratchpad, bajo Xvfb, con la copia del código
y el servidor de pruebas): el escenario lleva el 📷 junto a los otros botones; con la foto de 12 MP por el selector y
«¿qué ves a la izquierda?», la respuesta enlatada dice **330.9 KB**, igual que en la web, y el historial local queda
`user: 📷 ¿qué ves a la izquierda?` + la respuesta. Una llamada directa a `kl.ask('', {media_type:'image/svg+xml', …})`
(lo que un renderer comprometido mandaría) **se descarta**: el log de depuración dice «imagen descartada: formato o
tamaño no válido». **Los dos tamaños** (`narrow` 320 px y `normal` 640 px) con la miniatura puesta: la fila de entrada
cabe dentro de la ventana, sin scroll, y la caja de texto queda en 266 y 586 px.

**`nginx -t`:** sobre un conf de envoltorio mío que incluye `deploy/nginx-klothulhu-web.conf`: `syntax is ok` y `test is
successful`. No es el sitio instalado: ese `nginx -t` lo ejecutas tú (§5.2 de `PASOS-CON-SUDO.md`).

### Capturas (`docs/fase10/capturas/`)

- `01-miniatura-390x844.png`: la miniatura con su ✕ junto a la caja, con texto escrito. 📷 a la izquierda.
- `02-historial-390x844.png`: el historial con `tú: 📷 …` y `tú: 📷`, y las dos respuestas.
- `03-imagen-falsa-390x844.png`: la línea de error con el `.txt` renombrado.
- `04-barra-y-entrada-360x740.png`: la barra entera a 360 px y la entrada con miniatura.
- `05-escritorio-narrow-miniatura.png` y `05-escritorio-normal-miniatura.png`: el escritorio, con la miniatura.

## Gasto

**0.** `KLOTHULHU_FAKE=1` siempre; ninguna llamada a la API de pago. **A1 [API] no la he lanzado:** necesita el «sí» de Josem
en el chat, y no lo he pedido. No toqué producción, `/data/klothulhu`, el servicio ni el nginx real.

## Desviaciones

1. **El 📷 de la web va en la fila de entrada, a la izquierda de la miniatura, y no en la barra (§3.5).** Con el 📷 en
   `#bar`, el botón «Klothulhu» quedaba **recortado** (`scrollWidth > clientWidth`) a 360 px (el botón medía 56 px) y a
   390 px (67 px), y D51 exige que la barra quepa en una fila a esos anchos. Antes del 📷 los botones medían 78 y 89 px.
   Lo medí con la prueba antes de moverlo; después, sin recorte (78 y 89 px). La fila de entrada con miniatura cabe a 360 px
   (la caja queda en 184 px). En el escritorio sí va en el escenario, como pedía el plan. Mi prueba X6 fija el sitio.
   Si prefieres otro sitio (p. ej. quitar el selector de estilo de la barra), es un retoque de CSS y de HTML.
2. **`filtrarImagen` vive en `desktop/renderer/imagen.js` y `main.js` la llama**, en lugar de la validación escrita en
   `main.js`. Así se prueba desde Node (X1-X3), que `main.js` no permite (requiere Electron). El comportamiento es el
   del §3.6.
3. **`ruff.toml`:** `docs/fase10/normativas` en `extend-exclude` y `tests/test_fase10.py` con `B017` eximido, como con las
   fases 5 y 7 (copias byte a byte; la prueba viva está en `tests/`).
4. **`reducir` pinta un fondo blanco antes de dibujar:** un PNG con transparencia saldría negro al pasar a JPEG. No venía
   en el plan.
5. **`_fake_stream` partido en `_fake_wait` y `_fake_chunks`** para compartir el ritmo con `_fake_image_stream`. El nombre y la
   firma de `_fake_stream()` no cambian; las 105 pruebas anteriores pasan sin tocarlas.
6. **No creé `node_modules` propios** en el worktree: las pruebas de `desktop` y `web` corren con `node --test` y no los
   necesitan. Sí creé el `.venv`.
7. Para la prueba con Electron instalé su binario de Linux **en el scratchpad de la sesión**, no en el repo ni en el
   `node_modules` de `/data/klothulhu` (el que hay allí es el de Windows, `electron.exe`).

## No probado

- **Una cámara o galería de un móvil real.** En particular, la orientación EXIF (`imageOrientation: 'from-image'`): no
  tenía una foto con EXIF para comprobar que no sale girada. Es K1 y K6.
- **El diálogo nativo de ficheros** (en Chrome y en Electron he usado `setInputFiles`, que se salta el diálogo) y **nada
  en Konnos** (Windows): lo probado es Electron en Linux. Es K4 y K5.
- **El límite de 8 MB en un nginx real**: solo la sintaxis. Para verlo hay que pasar por el proxy al servidor real, y no lo
  hice (su destino es producción).
- **Que el narrador vea de verdad la imagen** (A1/K1-K3): todo fue con el modelo sustituido.

Dos comportamientos que he dejado como están y conviene que lo sepas:
- En el escritorio, **Escape** cierra la caja pero la imagen pendiente se queda: la miniatura reaparece al volver a abrirla.
- **«Olvidar»** no quita la imagen pendiente (solo el historial, como antes).

## Decisiones que necesito

Ninguna. (Lo único que puede querer decidir Josem es lo de la Desviación 1, el sitio del 📷 en la web.)

Quedan para Josem, en este orden (`deploy/PASOS-CON-SUDO.md` §5): merge `--ff-only` → reiniciar `klothulhu-api.service` →
nginx (`cp`, `nginx -t`, `reload`) → recargar el móvil; en Konnos, `git pull` y reiniciar la app. Después, K1-K8 del plan.

---

## Anexo — A1 [API] hecha (2026-11-18)

Responde a: 2a9e329 (H1-revision, H1 aprobado)

**Autorización del gasto:** Josem, el 2026-11-18, en esta ventana: «Tienes permiso de antemano para hacer pruebas hasta un
tope de 1€». Después, a mi pregunta de dónde sacar la clave, eligió el env de producción. Cargué **solo** la línea
`ANTHROPIC_API_KEY` de `/etc/klothulhu/klothulhu.env` en el entorno de un proceso de prueba (sin imprimirla ni copiarla; el
resto del fichero no se leyó). Por eso el gasto cae en la misma cuenta de Anthropic que usa producción. No toqué el
servicio, ni la BD, ni `/data/klothulhu`.

**Qué hice.** Un guion en el scratchpad (no está en el repo) importa la app de `fase10` y llama al **endpoint real**
`POST /chat` (con auth y validación) por ASGI, con `KLOTHULHU_FAKE=0`, `KLOTHULHU_MEMORIA=0` (sin BD) y el director
encendido. La imagen es la foto de 12 MP **ya reducida por el `reducir` del cliente** (330,9 KB, 1280×960), con las
palabras «IZQUIERDA» en blanco y «DERECHA» en negro, a propósito.

**Resultado:**

- **K1 (foto + «¿Qué ves en esta imagen? ¿Qué palabras hay a cada lado?»):** HTTP 200, sin errores, 2 escenas del director.
  El narrador **la vio**: fondo de círculos traslúcidos de colores, «a la izquierda "IZQUIERDA" en blanco y a la derecha
  "DERECHA" en negro, cortada en el borde de la imagen».
- **K3 (solo texto, sin volver a mandar la foto: «¿Y qué palabra había a la derecha?»):** HTTP 200. Contestó que era
  «DERECHA», en negro, «cortada por el borde, solo se alcanzan a leer DERECH». **Se acuerda** (D57: la imagen sigue en el
  historial corto).
- **Logs:** con el nivel por defecto (INFO), la imagen **no** aparece en ellos; solo `chat a1test: imagen image/jpeg,
  338796 bytes`: son los 330,9 KB de la imagen ya decodificada.

**Coste** (modelo `claude-haiku-5-5`, `gasto.PRECIOS` = $0,10 / $0,50 por millón de tokens de entrada / salida):

| | Entrada | Salida | Coste |
|---|---|---|---|
| Narrador, K1 (con foto) | 2 444 | 171 | |
| Narrador, K3 (sin foto, con la anterior en el historial) | 2 633 | 112 | |
| **Narrador, total** | **5 077** | **283** | **$0,000649** |
| Director, las dos | 459 (+ 5 964 de caché) | 606 | ≈ $0,00035 (+ la caché, que `gasto.PRECIOS` no tarifa) |

La imagen de 1280×960 son ⌈1280/28⌉×⌈960/28⌉ = 1 610 tokens, que cuadra con los ~2 444 de entrada del narrador
(1 610 + el prompt + el texto). Mi primera ejecución se cortó porque pipé la salida a `head` y el guion murió antes de
imprimir el resultado (llegó a hacer la primera llamada: director `in=246 out=290`); su narrador no lo medí, pero por
tamaño es ≈ $0,0003. **Total de la sesión: ≈ $0,0016 (≈ 0,0015 €), menos de una milésima del tope de 1 €.**

### Hallazgo: con el log en DEBUG, el SDK de Anthropic imprime la imagen entera

Lo vi sin querer: mi primer guion fijó el nivel raíz en DEBUG y `anthropic._base_client` volcó en la salida las
`Request options` completas, con el `data` en base64. **No es un fallo de la implementación en su configuración normal**
(la raíz es INFO por defecto, tanto con `registro.configurar` como con `basicConfig`; con LogCentral solo sube a INFO si
estaba por encima o sin fijar), pero D57 dice «nunca sale en los logs», y eso hoy solo se cumple mientras nadie ponga
`KLOTHULHU_LOG_LEVEL=DEBUG`. En ese caso las imágenes irían, en claro, a la salida del servicio y a LogCentral.

Arreglo de una línea, si lo quieres: en `server/app.py`, tras configurar el log, subir a INFO los loggers `anthropic`, `httpx`
y `httpcore` (`logging.getLogger(n).setLevel(logging.INFO)`), más una prueba que ponga la raíz en DEBUG y compruebe que el
base64 no sale. **No lo he hecho:** H1 está aprobado y es un cambio de código del servidor; lo decide el arquitecto, y
llegaría como retoque.

## Para el arquitecto (Anexo)

Decisión que necesito: **¿quieres el arreglo de los loggers (arriba) como retoque de H1, o lo dejas como nota?** Nada más:
el despliegue y K1-K8 siguen siendo de Josem.

---

## Anexo 2 — Retoque R1 hecho (2026-11-18)

Responde a: 0d8231f (H1-revision §4, retoque R1)

- **`server/app.py`:** `_acotar_loggers_de_librerias()` pone los loggers de las librerías a `max(INFO, nivel efectivo de la
  raíz)`: INFO como mínimo y, si la raíz está en WARNING, no se bajan. Se llama **justo después de configurar el log** (sirve
  a las dos ramas, `registro` y `basicConfig`, porque va después del `if/else`) y **otra vez tras importar el SDK**, porque con
  `ANTHROPIC_LOG=debug` el SDK pone DEBUG en sus loggers al importarse. Comentado con D57 y D42.
- **Prueba de regresión** (`tests/test_fase10_extra.py`, sin red y con gasto 0): un transporte falso de httpx
  (`MockTransport`) hace pasar por el SDK real una petición con imagen, con la raíz y `caplog` en DEBUG.
  - **Control:** sin el recorte, el base64 **sí** sale en `caplog.text` (la prueba lo exige, para saber que detecta la fuga).
  - Con el recorte, **no sale**.
  - Una segunda prueba arranca `app` en un proceso aparte y mira los niveles efectivos de los cinco loggers: raíz en DEBUG →
    todos INFO; raíz en WARNING → todos WARNING; y `ANTHROPIC_LOG=debug` sin FAKE (el SDK se importa) → todos INFO.
  - Las dos fallaban antes del cambio (no existía la función) y pasan después.
- **Desviación:** el encargo nombra tres loggers (`anthropic`, `httpx`, `httpcore`). El SDK 1.15 usa **`httpx2`** y
  **`httpcore2`** (lo vi en mi propia salida, `INFO:httpx2:`), y esos nombres no estaban cubiertos; recorto los cinco. Los
  hijos de `anthropic.*` (como `anthropic._base_client`, que fue el que imprimió la imagen) heredan el nivel.
- **Pruebas:** `pytest` 122 pasan y 8 se saltan (antes 120; +2 mías), `ruff` limpio, `desktop` 97/97 y `web` 31/31 (sin
  cambios). **Gasto: 0.** Las normativas, sin tocar.

Decisiones que necesito: ninguna. **Paro aquí.**
