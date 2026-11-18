---
proyecto: klothulhu
fase: 10
titulo: klothulhu ve (imágenes en la conversación)
plan: arquitecto
fecha: 2026-11-18
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D56, D57; también D10, D27, D42, D50)"
gasto_autorizado: "ninguno. El paso [API] A1 es opcional y necesita el «sí» de Josem en el chat (coste < $0,01)"
---

# Fase 10: klothulhu ve

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-11-18.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

«Lord Klothulhu quiere ver». Josem podrá adjuntar **una imagen por mensaje**, con texto o sin él, y el
narrador (Haiku 5.5, que ya admite imágenes) la verá junto al texto. Va en **los dos clientes**: en el
móvil, la cámara o la galería; en Konnos, un fichero o Ctrl+V (D56).

La imagen se queda en el **historial corto** mientras esté entre las 6 últimas vueltas. Así, «¿y lo de la
izquierda?» funciona después. **Nunca** se guarda en disco ni sale en los logs, y no llega ni a la memoria
larga ni al director: esos ven un texto que dice que hubo una imagen (D57).

**Contrato:** sí cambia, y de ahí que el plan sea mío:

- `POST /chat` admite `image` opcional, y `text` puede ir vacío si hay imagen;
- el IPC del escritorio: `ask(text, image)`;
- el historial del servidor guarda bloques de contenido, no solo texto.

Las escenas y el SSE no cambian.

## 1. Lista previa (convención §4)

- **¿Borra o sobrescribe datos?** No.
- **¿Llama a una API externa?** Sí: el narrador recibe la imagen. Lo he comprobado con la documentación
  vigente (skill `claude-api` y la página Vision, 2026-11-18):
  - `claude-haiku-5-5` está en el nivel de alta resolución: 2 576 px de lado largo y 4 784 tokens como máximo.
  - Formatos: JPEG, PNG, GIF y WebP. Hasta 10 MB en base64 por imagen.
  - Coste: `⌈w/28⌉ × ⌈h/28⌉` tokens. Con 1 280 × 960 salen ~1 600 tokens, unos $0,00016 a $0,10/M. En el
    peor caso, con 6 imágenes en el historial, ~10 000 tokens más por mensaje: unos $0,001.
  - `max_tokens` y el pensamiento del narrador no cambian.
  - Las pruebas no gastan (`KLOTHULHU_FAKE=1` o el modelo sustituido). Solo A1 (§5) gasta, y es opcional.
- **¿Toca producción?** Sí, y lo hace Josem: el merge, el reinicio de `klothulhu-api.service` (el servidor
  cambia) y `client_max_body_size` en el nginx del móvil (§4).

## 2. Servidor

1. **`server/imagen.py`** (nuevo y puro). Lo fijan I1-I4:
   - `MEDIA_TYPES` (jpeg, png, webp, gif) y `MAX_BYTES = 4_000_000` (decodificada).
   - `ImagenInvalida(ValueError)` con `.code`: `image_type`, `image_base64`, `image_size` o `image_mismatch`.
   - `validar(media_type, data) -> bytes`: tipo admitido; base64 estricto (`validate=True`), no vacío; tamaño;
     y los primeros bytes tienen que corresponder al tipo declarado (PNG `\x89PNG`, JPEG `\xff\xd8\xff`, GIF
     `GIF8`, WebP `RIFF....WEBP`). Así no llega a Anthropic nada que vaya a rechazar.
   - `contenido(texto, media_type, data)`: devuelve `[bloque image base64, bloque text]`, con la imagen
     primero, como recomienda la documentación. Sin texto, el bloque de texto es `SIN_TEXTO`.
   - `SIN_TEXTO` y `MARCA`: frases cortas en tercera persona, sin corchetes (por ejemplo «(El mortal enseña
     una imagen sin decir nada.)» y «(El mortal enseña una imagen.)»). `texto_memoria(texto)` devuelve
     `MARCA` sola, o `MARCA + " " + texto` si hay texto.
2. **`app.py`:**
   - `ChatIn`: `text: str = Field(default="", max_length=1000)` e `image: ImagenIn | None = None`, con
     `ImagenIn(media_type: str, data: str)`. **No pongas `max_length` en `data`**: el 422 de Pydantic
     devolvería la imagen entera en el cuerpo del error. Se valida a mano.
   - `chat()`:
     - sin texto (tras `strip`) y sin imagen → `HTTPException(422, "empty")`;
     - imagen inválida → 413 si `code == "image_size"` y 422 en los demás casos, con `detail = code`;
     - si todo va bien, `_reply(cid, text, lock, image=(media_type, data))` (I5).
   - `_reply(..., image=None)`:
     - el contenido del usuario es `imagen.contenido(...)` si hay imagen, y el texto si no;
     - ese contenido va a `_model_stream(cid, contenido, system)` y a `history.append` (D57);
     - lo que no es el narrador recibe `imagen.texto_memoria(text)`: `sesiones.anotar` (escritor y repaso)
       y la pregunta de `_director` (I6, I7).
   - `_preparar_memoria(cid, text)`: la búsqueda en paralelo (D36) **solo si hay texto**. Con solo imagen,
     la sesión se abre igual, pero no se busca.
   - **FAKE:** con imagen, una respuesta enlatada aparte que diga que ha recibido una imagen y cuántos KB
     pesa (I9). `_fake_stream()` sigue **sin argumentos**, porque las normativas anteriores lo sustituyen así.
   - **Logs (D42):** de una imagen, como mucho el tipo y el tamaño, nunca `data` (I6).
   - Actualiza el contrato en el docstring de cabecera.
3. **`history.py`:** `append(client_id, user_content, assistant_text)` guarda `str | list` tal cual, y
   `messages()` lo devuelve igual (I8). `test_core.py` tiene que seguir pasando.

## 3. Clientes

1. **`desktop/renderer/imagen.js`** (nuevo, UMD como `convo.js`, compartido). Lo fijan E1-E3:
   - `MAX_LADO = 1280`, `CALIDAD = 0.85`;
   - `medidas(w, h, max = MAX_LADO)`: el lado largo como mucho `max`, con la proporción conservada,
     redondeo y mínimo 1. Nunca amplía;
   - `deDataUrl(url)`: devuelve `{ media_type, data }` solo para `data:image/…;base64,…`; en cualquier otro
     caso, `null`;
   - `paraHistorial(text, conImagen)`: `'📷 ' + text`, `'📷'` sin texto, o el texto tal cual;
   - `reducir(fileOrBlob)`, con el DOM y sin prueba en Node: `createImageBitmap(f, { imageOrientation:
     'from-image' })` (para que la foto del móvil no salga girada), un canvas de `medidas(...)`, y
     `toDataURL('image/jpeg', CALIDAD)`. Devuelve `{ media_type, data, vista }`, donde `vista` es el data URL
     para la miniatura. Si el navegador no puede leer la imagen, rechaza.
2. **`sse-client.js`:** `streamChat({ ..., text, image })` manda `{ text }` si no hay imagen y
   `{ text, image }` si la hay (E4).
3. **`scenes.js`:** `LINES.errors.http_413` («Esa imagen pesa demasiado, mortal.» o similar) y `http_422`
   («No consigo ver eso.» o similar), que caben en un caption (E5). Cuando falle `reducir` en el cliente, usa
   la misma línea que `http_422`.
4. **Los dos reproductores** (`web/app.js` y `desktop/renderer/index.html`, que son una copia deliberada,
   D50; lleva la lógica a `imagen.js` y deja en cada cliente solo el enganche):
   - **una imagen pendiente** como mucho: se elige, se ve la miniatura (pequeña, junto a la caja de texto) y
     un ✕ la quita. Elegir otra sustituye a la anterior;
   - **enviar** vale con texto, con imagen o con los dos. Al enviar, `convo.add('user', paraHistorial(...))`,
     `ask(text, image)` y se borra la pendiente. Mientras se espera, no se puede adjuntar;
   - **pegar** (Ctrl+V) una imagen en la caja de texto la deja pendiente; pegar texto sigue igual;
   - la miniatura es un `<img>` con el data URL; no hace falta tocar la CSP de ninguno de los dos
     (`img-src` ya admite `data:`). Nada de `innerHTML` (D10).
5. **Web:** un botón 📷 en la barra que abre un `<input type="file" accept="image/*">` oculto, **sin**
   `capture`, para que Android ofrezca cámara y galería. `host.ask(text, image)` lo pasa a `streamChat`.
   Carga `/shared/imagen.js` (E6).
6. **Escritorio:**
   - un botón 📷 en el escenario, junto a los otros, que abre el selector de ficheros;
   - `preload.js`: `ask: (text, image) => ipcRenderer.invoke('ask', text, image)` (E6);
   - `main.js`: en `ask`, solo deja pasar `image` si es un objeto con `media_type` de los cuatro y `data`
     string de como mucho 6 000 000 caracteres. Si no, la descarta y avisa por el log de depuración. Después
     la pasa a `streamChat`;
   - carga `imagen.js` y la añade a `npm run check` (E6). El panel tiene que caber con la miniatura en todos
     los tamaños.

## 4. Despliegue (Josem)

- `deploy/nginx-klothulhu-web.conf`: `client_max_body_size 8m;` dentro de `location /api/` (una foto
  reducida pesa unos 300 KB, pero un PNG pegado puede pasar de 1 MB, que es lo que nginx admite por defecto).
  En `deploy/PASOS-CON-SUDO.md`, añade una sección para la fase 10: copiar el conf, `nginx -t` y `reload`.
- El escritorio va directo a uvicorn por Tailscale y no tiene ese límite; el tope de `MAX_BYTES` vale igual.
- **Orden:** merge `--ff-only` → reiniciar `klothulhu-api.service` → nginx → recargar el móvil; en Konnos,
  `git pull` y reiniciar la app.

## 5. Pruebas y parada

- **Normativas:** copia tal cual `docs/fase10/normativas/test_fase10.py` a `tests/test_fase10.py`, y
  `docs/fase10/normativas/fase10.test.js` a `desktop/test/fase10.test.js`. No se editan. Las de las fases
  anteriores tienen que seguir pasando sin tocarlas.
- **Tuyas** (recomendado): la validación de `main.js`, y que ningún cliente use `innerHTML` para la miniatura.
- **A mano**, con el servidor de pruebas de la fase 9 (`KLOTHULHU_FAKE=1`), en la web con Chrome sin pantalla:
  adjuntar una foto grande, comprobar que llega reducida (el tamaño en KB de la respuesta enlatada), solo
  imagen, imagen y texto, el ✕, la entrada 📷 en el historial y un PNG falso (por ejemplo un .txt renombrado),
  que da la línea de error.
- **[API] A1, opcional y solo con el «sí» de Josem en el chat:** una llamada real con `KLOTHULHU_FAKE=0`
  contra el servidor de pruebas (no producción), con una foto. En el informe va el coste por modelo, con lo
  que diga `gasto.py`; debe ser menos de $0,01.
- **Parada:** `pytest -q tests`, `ruff check .`, `cd desktop && npm test && npm run check`,
  `cd web && npm test && npm run check`. Informe en `docs/fase10/H1-informe.md`, con capturas de la web
  (miniatura y historial). **Para ahí.**

## 6. Pruebas de Josem tras el despliegue (K)

- K1: en el móvil, una foto con la cámara y una pregunta.
- K2: solo una foto, sin texto: klothulhu reacciona a lo que ve.
- K3: después de K1, «¿y lo de la izquierda?», sin volver a mandarla. Tiene que acordarse (D57).
- K4: en Konnos, una imagen desde el selector de ficheros.
- K5: en Konnos, Ctrl+V de una captura de pantalla.
- K6: una foto de la galería de 12 MP o más: llega bien y no tarda más de lo normal.
- K7: el historial muestra 📷 en tus mensajes con imagen.
- K8: «Olvidar» y después preguntar por la imagen: ya no la ve.

## Para el programador

Responde a: b64230b (H6-encargo de la fase 9; H6 aprobado en 8a25ce8)

1. Fase 10, hito único H1, en el worktree `/data/klothulhu-fase10` (rama `fase10`, creada desde `main` en
   `e248912`). Necesita su `.venv` y sus `node_modules` propios.
2. Orden: servidor (§2) con `tests/test_fase10.py`; compartidos (§3.1-3.3); los dos clientes (§3.4-3.6);
   despliegue (§4). Un commit por bloque, citando D56/D57.
3. Si una normativa anterior lee del texto de `index.html`, `preload.js` o `main.js` algo que choque con
   esto, para y pregunta.
4. Parada del §5. A1 solo con el «sí» de Josem.
