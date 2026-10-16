---
proyecto: klothulhu
fase: 5
titulo: bocadillo con scroll y una escena por tramo
plan: arquitecto
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D24-D26; también D10, D15, D18, D22, D23)"
gasto_autorizado: "pendiente: el paso [API] (T7) necesita el sí de Josem, tope propuesto $0.10"
---

# Fase 5: bocadillo con scroll y una escena por tramo

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-16.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).
> Motor nuevo: vault `30-projects/claude-fables/PARA-KLOTHULHU.md` §6. Léelo entero antes de T1.

## 0. Qué y por qué

claude-fables ha entregado el bocadillo que pedimos: altura fija de N líneas, scroll y captions de hasta
500 caracteres. Con él, klothulhu deja de partir el texto en golpes de 70:

- **D24 · una escena por tramo.** Un tramo es el texto entre cambios de emoción o saltos de línea. Los
  tramos de más de 500 se parten entre frases. El narrador ya no escribe para captions de 70.
- **D25 · el cliente pinta con el bocadillo de scroll.** Usa `bubble: { lines: 2 }` y
  `secondsPerChar` según `readSpeed`. Cada escena se queda en pantalla `typedAfter` (lo da el motor)
  más el margen de la última línea.
- **D26 · las acciones nuevas** (`approach`, `angry`, `dazed`) las elige el director. El servidor
  quita `approach` de `then`.
- **D23 sigue valiendo** entre tramos: con una emoción nueva a media frase, o con un tramo de más de
  500, la escena siguiente hereda fondo, partículas y posición.

**Contrato:** cambia. Los eventos SSE tienen los mismos campos, pero cada `scene` es un tramo de hasta
500 caracteres, no un golpe de 70, y el esquema de escena sube a la versión 2. Por eso este plan lo
escribe el arquitecto.

**Despliegue:** el servidor y el cliente van **juntos**. Un cliente de la fase 3 o 4 recorta en el feed
el caption a 70, y con un tramo largo perdería texto. Josem actualiza Konnos el mismo día que reinicia
el servicio.

**Fuera de alcance:**
- cambiar `STAGING` (escenas fijas) para usar las acciones nuevas;
- la continuidad de tamaño tras un `approach`;
- borrar `beats()` y sus pruebas, que se quedan aunque ya no pinten nada (deuda para otra fase);
- LogCentral.

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?**
  - T1 sobrescribe `desktop/renderer/vendor/fables-motor.iife.js`, `VENDOR.md` y
    `server/fables_vocab.json`. Es lo esperado, y solo en el worktree.
  - El paso [API] escribe **solo** en `docs/fase5/capturas/`, con `--out` explícito, y nunca en
    `docs/fase2/` ni en `docs/fase4/`.
  - Las pruebas no escriben ficheros.
  - `.venv` propio en el worktree.
  - El build del motor se hace en `/data/claude-fables/motor`, en `dist/`, que es su salida de
    siempre. No se toca nada más de ese repo.
- **¿API externa?** Sí, solo en T7 [API].
  - Mismos modelos e ids que en producción (Claude Haiku 5.5 para narrador y director, director sin
    pensamiento: D16, D20). No cambia ningún modelo.
  - El director recibe menos golpes y más largos, y su salida sigue siendo JSON sin captions, así que
    `max_tokens` (4096) sigue sobrando.
  - Coste esperado: ~$0,01 (la fase 4 gastó $0,0078 en 16 preguntas).
  - **El paso no se ejecuta hasta que Josem autorice el gasto en el chat** y se anote aquí.
- **¿Producción?** Solo al final:
  - merge `--ff-only` de `fase5` en `main` desde `/data/klothulhu`;
  - reinicio de `klothulhu-api.service`: cambian el prompt del narrador, el del director, el troceo y
    el vocabulario;
  - y el mismo día, `git pull` del cliente en Konnos.
  Todo lo hace Josem.

## 2. Tareas

Rama `fase5`, worktree `/data/klothulhu-fase5`, ya creado. Una tarea, un commit.

### T1 · Vendorizar el motor v2 (D25)

Sigue `desktop/renderer/vendor/VENDOR.md`:
1. En `/data/claude-fables/motor` (rama `main`, que contiene `a247d95`): `npm ci && npm run build`.
2. Comprueba que el sha256 de `dist/fables-motor.iife.js` es
   `029c99ec9e95a2b5756b29977855e5bb20597e9b17b5465c0ec42c36c1a9166d`. **Si no lo es, para y avisa.**
3. Copia el IIFE a `desktop/renderer/vendor/` y actualiza `VENDOR.md`: commit de origen `a247d95`, el
   sha256 y `SCHEMA_VERSION` 2.
4. Regenera `server/fables_vocab.json` con `node desktop/scripts/export-vocab.js` (F1).
5. **Prueba normativa superada (D25):** en `desktop/test/fase1.test.js`, P9, cambia **solo**
   `assert.equal(M.SCHEMA_VERSION, 1);` por `assert.equal(M.SCHEMA_VERSION, 2);  // D25: motor v2`.
   Es el único cambio que se permite en ese fichero.

### T2 · `tramos()` en los dos lados (D24)

- **`server/beats.py`:** `TRAMO_MAX = 500` y
  `tramos(text, marks) -> list[tuple[str, str]]`:
  - se corta por las marcas de emoción, con las mismas reglas que `beats()`: una marca en 0 sustituye
    a la primera y las que caen fuera de rango se ignoran;
  - dentro de cada tramo de emoción, se corta en cada salto de línea (`\s*\n\s*`);
  - en cada párrafo, los espacios se normalizan y los vacíos se descartan;
  - si un párrafo cabe en `TRAMO_MAX`, va entero;
  - si no, se trocea en frases con el `_SENTENCE` de siempre, y una frase de más de `TRAMO_MAX` se parte
    por el último espacio que quepa, o con corte duro si no hay espacio;
  - después se empaquetan con un espacio mientras quepan en `TRAMO_MAX`;
  - nunca se juntan párrafos ni tramos de emociones distintas.
- **`desktop/renderer/scenes.js`:** `TRAMO_MAX`, `BUBBLE_LINES = 2` y `tramos(text, marks)` con la misma
  firma que `beats()` (`marks: [{at, emotion}]` → `[{caption, emotion}]`). Se exportan los tres.
- `tests/fixtures/tramos_cases.json` es normativo (§3). Nota: las longitudes se cuentan en caracteres en
  Python y en unidades UTF-16 en JS. Son iguales sin emojis, que el narrador no usa. Déjalo dicho en un
  comentario.

### T3 · El servidor trocea por tramos (D24, D23)

- `server/app.py`: `bs = tramos(shown, marks)` en lugar de `beats(...)`. Lo demás no cambia: el
  director, `continue_scene` y el `log.info` de D23.
- `server/director.py`, `build_scene`: un `then == "approach"` se descarta (D26).
- `server/director.py`, docstrings: donde dice «golpe», que quede claro que ahora es un tramo (D24).

### T4 · Prompts (D24, D26)

- **`server/prompt.md`** (narrador):
  - quita la regla «Every sentence at most 70 characters … each one is shown on its own caption …» y
    pon en su lugar: prosa normal, y párrafo nuevo (una línea en blanco) solo si el tema cambia de
    verdad;
  - el total (250 caracteres), las etiquetas y el resto no cambian;
  - si algún ejemplo del prompt parte una frase solo para cumplir los 70, junta las dos partes.
- **`server/director_prompt.md`:**
  - `approach` (se acerca al espectador y crece, de frente; solo como acción principal, nunca en
    `then`; rara vez, para una confidencia o un momento importante);
  - `angry` (pisotones en el sitio, para el enfado);
  - `dazed` (balanceo mareado, para el desconcierto).
  Pon las tres en las listas de acciones que ya existen («Moving…», «In place…»). `approach` cuenta como
  movimiento hacia la pantalla. El resto del prompt no cambia.

### T5 · El cliente pinta con el bocadillo (D25)

- **`scenes.js`:**
  - `holdMs(typedAfter, spc) = round(typedAfter*1000 + max(1200, 2*spc*32*1000))`, con 32 = columnas
    del bocadillo (`BUBBLE_COLS`, comentado con fables D16);
  - `secondsPerChar(readSpeed, base) = clamp(readSpeed*base, 0.01, 0.2)`, con `readSpeed` ausente igual
    a 1, redondeado para que las comparaciones exactas de I4 pasen;
  - se exportan las dos.
- **`index.html`:**
  - `paint()` llama a `renderScene(scene, { look, fadeIn, bubble: { lines: BUBBLE_LINES }, secondsPerChar: … })`,
    con `secondsPerChar(readSpeed, VOCAB.defaults.secondsPerChar)`, y devuelve también `typedAfter`;
  - `play()` usa `holdMs(shown.typedAfter, spc)` en vez de `readMs`;
  - nada más cambia: la cola, la reserva fija (D21) y la CSP (D10).
- **`feed.js`:**
  - recorta el caption a `TRAMO_MAX` (antes `CAPTION_MAX`);
  - la reserva sin escenas del servidor usa `tramos()` (antes `beats()`).
  - Ajusta tu C3 de `fase3.test.js` (no es normativa) para que pruebe `TRAMO_MAX`.
- `README` del cliente: una línea sobre `readSpeed`, que ahora mueve la escritura y el scroll.

### T6 · Pruebas de la fase 4 superadas (D24)

En `tests/test_fase4.py`, **borra solo** las funciones G7, G8 y G9 y deja en su sitio un comentario:
`# G7-G9: superadas por tests/test_fase5.py H4-H6 (D24: ya no hay golpes de 70 caracteres)`.
Hacen falta frases de más de 70 que ahora van en un solo tramo, así que ya no prueban D23. H4-H6 lo
prueban con emociones a media frase. **No se toca nada más de ese fichero.**

### T7 · [API] Pasada real y galería

- `desktop/scripts/gallery.js` pinta con `bubble: { lines: 2 }` y `secondsPerChar: 0.03`, y debajo de
  cada escena pone `typedAfter`.
- `scripts/api_smoke.py`:
  - ruta por defecto `docs/fase5/capturas/`;
  - en el resumen añade `tramos_per_reply`, la longitud media y la máxima de los tramos, cuántas veces
    sale cada acción nueva (`approach`, `angry`, `dazed`) y los contadores de D23 que ya existen;
  - las preguntas son las mismas de la fase 4.
- Haz primero un ensayo `--fake` en el scratchpad.
- **Solo con la autorización de Josem anotada en el frontmatter**, la pasada real la lanza él:
  ```bash
  cd /data/klothulhu-fase5
  .venv/bin/python scripts/api_smoke.py --director-thinking 0 --out docs/fase5/capturas/api_smoke.json
  node desktop/scripts/gallery.js docs/fase5/capturas/api_smoke.json docs/fase5/capturas/galeria.html
  ```

## 3. Pruebas normativas

Están en `docs/fase5/normativas/`. Cópialas **byte a byte** a su sitio y hazlas pasar; no se editan.
Comprueba los sha256:

| Fichero en `normativas/` | Va a | sha256 |
|---|---|---|
| `tramos_cases.json` | `tests/fixtures/tramos_cases.json` | `f3d86fb6503b47e0697376eb7f6e082f5d2f85d4b11e9091d4622c0a83159575` |
| `test_fase5.py` | `tests/test_fase5.py` | `15b44699a6c367e808fe21276941014c2879e6d560259a77ea43d1abf6372ef2` |
| `fase5.test.js` | `desktop/test/fase5.test.js` | `c2318d80d288f359bc39955f08b8334624112525835c04c19f02d77482d2cb6a` |

Las únicas normativas antiguas que se tocan son P9 (T1.5) y G7-G9 (T6), con su decisión.

**Comprobado:** el arquitecto montó en su scratchpad un prototipo de T1-T6 y las pruebas pasan: 42 del
servidor (37 − 3 + 8) y 42 del cliente (35 + 7). El prototipo no se pasa: impleméntalo tú.

## 4. Hitos y paradas

- **H1:** T1-T6 en verde:
  - `pytest` 42;
  - `npm test` 42;
  - `ruff`;
  - `npm run check`.
  Prepara T7 y haz el ensayo `--fake`. **Para** y deja `docs/fase5/H1-informe.md`.
- **H2:** después de mi revisión y con el gasto autorizado, Josem lanza T7. Tú escribes
  `docs/fase5/H2-informe.md` con:
  - el coste por modelo;
  - las métricas de T7;
  - 2-3 respuestas de ejemplo con sus tramos;
  - la ruta de la galería.
  **Para.**
- **H3:** Josem prueba en Konnos el cliente de la rama **contra un servidor de la rama**, sin tocar
  producción:
  - un `uvicorn` aparte desde `/data/klothulhu-fase5`, en el puerto **8766**, con las variables de
    `/etc/klothulhu/klothulhu.env`;
  - y `"apiUrl": "http://seb01:8766"` en el `config.json` de Konnos.
  En el informe de H1, deja la orden exacta de arranque. Lo que salga de la prueba irá en
  `H3-encargo.md` si hace falta.
