---
proyecto: klothulhu
fase: 1
titulo: v2 en el cliente — el motor de claude-fables con escenas fijas
plan: arquitecto
fecha: 2026-10-15
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D7-D12)"
---

# Fase 1 — v2 en el cliente: el motor de claude-fables con escenas fijas

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-15.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).
> Decisiones: `30-projects/klothulhu/ficha.md` § Decisiones. Cítalas en el código como `D<n>`.

## 0. Qué y por qué

klothulhu v2 deja de pintarse con sprites y pasa a pintarse con el **motor de escenas de
claude-fables**: una escena JSON se convierte en un SVG animado (D7). En la fase 2 el servidor
montará las escenas con un narrador y un director (D8). **Esta fase no toca el servidor:** el
cliente trocea la respuesta en frases, y cada frase se convierte en una escena fija según la
emoción (D9). Así despejamos las incógnitas del cliente sin gastar API ni cambiar el contrato SSE.

Lectura obligatoria antes de empezar:

- `30-projects/claude-fables/PARA-KLOTHULHU.md` (vault): la API del motor y lo que choca con el cliente.
- `/data/claude-fables/types/index.d.ts`: el esquema `FablesScene`.
- `/data/claude-fables/motor/dist/playground.html`: se abre sin servidor y sirve para ver escenas.

**Fuera de alcance:** el servidor (`server/`, `tests/`), el evento `scene` (fase 2), el troceo
mientras llega el texto (aquí se trocea al recibir `done`), accesorios (`props`), empaquetado.

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** Se borran los sprites y su código, con commit
  (quedan en la historia de git). Las pruebas solo leen ficheros del repo; no escriben nada.
- **¿Algo llama a una API externa?** No. El programador no llama al servidor ni a Anthropic. La
  prueba de Josem en Konnos usa el servidor de producción como siempre (uso normal, no un paso [API]).
- **¿Algo toca producción?** No. `klothulhu-api.service` arranca desde `/data/klothulhu`, que se
  queda en `main` sin tocar. Todo se trabaja en el worktree `/data/klothulhu-fase1`, rama `fase1`.
  El merge a `main` lo hace Josem al cerrar la fase; el servidor no cambia y no hace falta reiniciarlo.

## 2. Dónde se trabaja

- Worktree `/data/klothulhu-fase1`, rama `fase1`. El buzón es `docs/fase1/` de esa rama.
- **Antes de T1:** si `main` tiene commits que `fase1` no tiene (Josem va a hacer commit de un README
  corregido), `git merge main` en `fase1`. No debería haber conflictos.
- Puedes hacer `git push -u origin fase1`: Josem prueba en Konnos tirando de esa rama. Nunca
  merges ni pushes a `main`.
- Node 22 en seb01. En `desktop/` no hay `node_modules` en el worktree: `npm ci` después de T2.

## 3. Tareas

### T1 · Vendorizar el motor (D10)

- Copia `/data/claude-fables/motor/dist/fables-motor.iife.js` a `desktop/renderer/vendor/`.
  sha256 esperado: `56788549409ac24e9180d149bbca08a1213c09323c0c7b15adfeb62a80e0b03b`
  (claude-fables, rama `fase1-motor`, commit `dafe0df`, `SCHEMA_VERSION = 1`).
- **No** incluyas el ESM (`fables-motor.js`).
- Crea `desktop/renderer/vendor/VENDOR.md` con: origen (repo, rama, commit), sha256 completo,
  `SCHEMA_VERSION`, cómo actualizarlo (`cd /data/claude-fables/motor && npm ci && npm run build`)
  y que la cabecera de licencias (MIT de upstream y SIL OFL de Monocraft) no se toca (fables D10).

### T2 · Fijar Electron (D11)

- `desktop/package.json`: `"electron": "44.4.5"` exacto, sin `^`, sin `~`.
- Genera y añade `desktop/package-lock.json` (`npm install` en `desktop/`).
- Script `"test": "node --test test/"`. Mantén `check` y añade `scenes.js` a él.

### T3 · Módulo puro `desktop/renderer/scenes.js`

Script clásico que se carga en el renderer **y** se puede hacer `require` desde Node. Patrón:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlScenes = api;
})(typeof self !== 'undefined' ? self : this, function () { 'use strict'; /* … */ return { … }; });
```

No toca el DOM ni el motor: solo datos y funciones puras. Exporta:

| Nombre | Qué |
|---|---|
| `EMOTIONS` | `['neutral','happy','annoyed','confused','smug','sleepy']`, en el mismo orden que `server/emotion_parser.py` (P7) |
| `CAPTION_MAX` | `70` (el `CAPTION_BUDGET` de upstream; el motor recorta a partir de 80) |
| `STAGING` | Puesta en escena por tipo: las 6 emociones + `thinking` + `idle` (tabla de abajo) |
| `LINES` | Textos fijos: `boot(hotkey)`, `thinking`, `idle` y `errors` (`{código: [emoción, texto]}`, los de `ERRORS` de hoy). Todos ≤ 70 (P8) |
| `beats(text, marks)` | Trocea la respuesta en golpes `[{caption, emotion}]` (reglas abajo) |
| `sceneFor(kind, caption, opts)` | Devuelve un `FablesScene` (objeto plano). `kind` desconocido → `neutral`. `opts.tone` sustituye el tono |
| `readMs(caption, speaksAfterSec, fadeIn)` | Cuánto se queda una escena en pantalla, en ms (fórmula abajo) |

**`STAGING`**: recomendación del arquitecto, comprobada contra el motor (pinta sin corregir nada con
`pixel` y con `ukiyoe`). Josem la puede retocar; P4 vigila que siga siendo válida.

| tipo | backdrop | hero | particles | tone |
|---|---|---|---|---|
| neutral | night | walk 15→40, then inspect | — | work |
| happy | forest | jump 20→50, then celebrate | stars 0.4 | milestone |
| annoyed | volcano | walk 20→45, then shrug | sparks 0.4 | trouble |
| confused | space | think 45→45, then shrug | stars 0.2 | work |
| smug | city | sneak 10→40, then point | — | work |
| sleepy | night | sleep 50→50 | stars 0.3 | work |
| thinking | lab | think 45→45 | bubbles 0.3 | work |
| idle | night | sleep 50→50 | stars 0.2 | work |

Todas con `palette: {}` y `props: []`. Sin `title` ni `enter` (el fundido se pide con la opción
`fadeIn` del motor, no en la escena).

**Reglas de `beats(text, marks)`:**

- `marks` = `[{at, emotion}]`, ordenadas por `at` (posición en `text`, que ya llega sin etiquetas).
  El texto anterior a la primera marca es `neutral`. El renderer mete la primera emoción como
  `{at: 0, …}`.
- Primero se parte `text` en tramos por las marcas. **Nunca** se juntan frases de tramos distintos.
- Dentro de cada tramo: espacios normalizados (`\s+` → un espacio, sin espacios al principio ni al final)
  y partido en frases. Una frase acaba en `.`, `!`, `?` o `…` (uno o varios seguidos, y quizá
  cerrando `»"')`), seguido de espacio o fin.
- Frases consecutivas del mismo tramo se **juntan** con un espacio mientras quepan en `CAPTION_MAX`.
- Una frase de más de `CAPTION_MAX` se parte por el último espacio que quepa; una palabra de más de
  `CAPTION_MAX` se corta a `CAPTION_MAX` exactos.
- Ningún caption vacío. Texto vacío → `[]`. Las palabras se conservan: unir los captions de un tramo
  con un espacio devuelve el tramo normalizado.

**`readMs`** reproduce `readMs` de upstream (`/data/claude-fables/hooks/narrator.ts`) más la espera de la
burbuja: `speaksAfterSec*1000 + (fadeIn ? 600 : 0) + 200 + len*30 + 2000 + len*45`, con
`len = caption.length`, redondeado a entero.

### T4 · Renderer (`desktop/renderer/index.html`)

- **Fuera:** canvas, sprites, la tabla de poses, el parpadeo, la máquina de escribir, la burbuja HTML
  y la prueba por píxel.
- **CSP (D10):** `default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'self' 'unsafe-inline'`.
  Nada más.
- Carga `vendor/fables-motor.iife.js` y `scenes.js` con `<script src>` clásicos, antes del script en
  línea.
- **Escenario:** un `<img>` con la escena a `640×128` (lo que devuelve el motor) mostrado a
  `640*scale × 128*scale` px. SVG → `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent(svg)`.
  **Nunca `innerHTML`** (D10). Escena nueva = `<img>` nueva o `src` nuevo; **la misma escena no se
  vuelve a asignar** (reinicia la animación).
- `look` de la config (T5). Si `renderScene` devuelve `ok: false` con ese look, se reintenta con
  `VOCAB.defaults.look` y se avisa una vez por consola. Si vuelve a fallar, se queda la escena que
  hubiera y se avisa por consola. Nunca se lanza una excepción.
- **Cola** (como el `Director` de upstream, simplificado):
  - Al recibir `done`: `beats(...)` → una escena por golpe, a la cola.
  - Cada escena se queda `readMs(caption, r.speaksAfter, fadeIn)` antes de dar paso a la siguiente.
    `fadeIn` = el `backdrop` cambia respecto a la escena anterior.
  - Mientras se espera la respuesta: escena `thinking` con `LINES.thinking`. Se sustituye en cuanto
    hay golpes, sin esperar a que se lea.
  - Una pregunta nueva vacía la cola y pone `thinking` al momento.
  - `error`: vacía la cola y encola la escena de `LINES.errors[código]` (emoción de la tabla, `tone:
    'trouble'`), que espera a que se lea la que está en pantalla. Código desconocido → `confused`
    con `Error desconocido: <código>` (recortado a `CAPTION_MAX`).
  - Cola vacía y última escena leída: espera 30 s (el `LINGER_MS` de upstream) y pone `idle` con
    `LINES.idle`.
  - Al arrancar: `happy` con `LINES.boot(hotkey)`, con «klothulhu» (hoy dice «Claudthulhu»: es un bug).
- **Botones**: copiar (📋, copia **la respuesta entera**, no solo el caption visible; se ve si hay
  respuesta) y cerrar (✕, sale de la app), en la esquina superior derecha de la franja, como hoy.
- **Ratón (D12):** toda la franja es interactiva; fuera de ella y de la caja de texto los clics
  atraviesan la ventana. Clic sobre la franja (fuera de los botones) abre o cierra la caja; arrastrar
  la mueve. Igual que hoy, pero con un rectángulo en vez de píxeles.
- El texto que se pregunta y la caja de texto no cambian (`Enter`, `Esc`, atajo).

### T5 · `main.js`, `preload.js` y la config

- Ventana: `width = round(640*scale)`, `height = round(128*scale) + INPUT_H`. El resto de opciones
  de la ventana no cambia.
- Sin `readSprites`: `init` devuelve `{scale, hotkey, look}`.
- `config.json` acepta `look` opcional (por defecto `"pixel"`); añádelo a `config.example.json`. La
  validación del look la hace el renderer (T4), que es el que tiene el motor.
- Icono del tray: `klothulhu.ico` (los sprites desaparecen).
- Borra `desktop/renderer/sprites/`.

### T6 · Documentación

- `README.md`: sección del cliente (v2: motor de claude-fables, franja, `look`, `npm ci`, `npm test`)
  y, en vez de «Sprites», «Escenas» (dónde está `STAGING`, cómo se actualiza el motor:
  `vendor/VENDOR.md`). La nota de mantener sincronizadas las emociones pasa a apuntar a `scenes.js`.
- Crea el `CLAUDE.md` del repo, que no existe: arquitectura breve, comandos (tests y lint del
  servidor, `npm test` del cliente), la regla del worktree (el servicio arranca de `/data/klothulhu`)
  y dónde están las decisiones. Corto.

### T7 · Pruebas normativas

Copia el bloque de abajo **tal cual** a `desktop/test/fase1.test.js` y hazlo pasar. No lo cambies
para que pase (convención §3); si una prueba te parece mal, para y pregunta. Puedes **añadir**
pruebas en otros ficheros.

```js
'use strict';
// Pruebas normativas de la fase 1 (docs/fase1/PLAN.md, D10-D12). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const K = require('../renderer/scenes.js');
const VENDOR = path.join(DESKTOP, 'renderer', 'vendor');
const IIFE = path.join(VENDOR, 'fables-motor.iife.js');

function loadMotor() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(IIFE, 'utf8'), ctx);
  return ctx.FablesMotor;
}
const M = loadMotor();
const KINDS = [...K.EMOTIONS, 'thinking', 'idle'];
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// P1 — frases cortas del mismo tramo se juntan
test('P1 beats junta frases cortas del mismo tramo', () => {
  assert.deepEqual(K.beats('Hola.   Qué tal.', [{ at: 0, emotion: 'happy' }]),
    [{ caption: 'Hola. Qué tal.', emotion: 'happy' }]);
  assert.deepEqual(K.beats('', [{ at: 0, emotion: 'happy' }]), []);
  assert.deepEqual(K.beats('Sin marcas.', []), [{ caption: 'Sin marcas.', emotion: 'neutral' }]);
});

// P2 — ningún caption pasa de CAPTION_MAX y no se pierden palabras
test('P2 beats respeta CAPTION_MAX y conserva las palabras', () => {
  assert.equal(K.CAPTION_MAX, 70);
  const text = 'No tengo reloj, mortal, solo eternidad. Pero Tokio va siete horas por delante de Madrid en verano, ' +
    'y eso lo sabe hasta el más torpe de mis sectarios aunque lo niegue. ¿Algo más?';
  const out = K.beats(text, [{ at: 0, emotion: 'smug' }]);
  assert.ok(out.length >= 3);
  for (const b of out) {
    assert.ok(b.caption.length > 0 && b.caption.length <= K.CAPTION_MAX, b.caption);
    assert.equal(b.emotion, 'smug');
    assert.equal(b.caption, b.caption.trim());
  }
  assert.equal(out.map((b) => b.caption).join(' '), norm(text));
  assert.deepEqual(K.beats('x'.repeat(100), []).map((b) => b.caption), ['x'.repeat(70), 'x'.repeat(30)]);
});

// P3 — las marcas de emoción parten tramos y nunca se juntan entre sí
test('P3 beats no junta frases de emociones distintas', () => {
  const text = 'Los astros duermen. Pero yo no.';
  const at = text.indexOf('Pero');
  assert.deepEqual(K.beats(text, [{ at: 0, emotion: 'confused' }, { at, emotion: 'smug' }]), [
    { caption: 'Los astros duermen.', emotion: 'confused' },
    { caption: 'Pero yo no.', emotion: 'smug' },
  ]);
  assert.deepEqual(K.beats('Antes. Después.', [{ at: 7, emotion: 'happy' }]), [
    { caption: 'Antes.', emotion: 'neutral' },
    { caption: 'Después.', emotion: 'happy' },
  ]);
});

// P4 — toda la puesta en escena es válida: el motor la pinta sin corregir nada
test('P4 STAGING pinta sin correcciones en pixel y en un estilo 3D', () => {
  for (const kind of KINDS) assert.ok(K.STAGING[kind], `falta STAGING.${kind}`);
  for (const kind of KINDS) {
    const scene = K.sceneFor(kind, 'Los astros aplauden, sectario.');
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look });
      assert.equal(r.ok, true, `${kind}/${look}: ${r.error}`);
      assert.deepEqual(r.warnings, [], `${kind}/${look}`);
      assert.equal(r.scene.caption, scene.caption);
      assert.equal(r.scene.backdrop, scene.backdrop);
      assert.deepEqual({ ...r.scene.hero }, { ...scene.hero });
      assert.equal(r.scene.tone, scene.tone);
      assert.deepEqual(r.scene.props, []);
      if (scene.particles) assert.deepEqual({ ...r.scene.particles }, { ...scene.particles });
    }
  }
});

// P5 — sceneFor: tipo desconocido cae a neutral; opts.tone manda
test('P5 sceneFor', () => {
  assert.deepEqual(K.sceneFor('nope', 'Hola.'), K.sceneFor('neutral', 'Hola.'));
  assert.equal(K.sceneFor('happy', 'Hola.', { tone: 'trouble' }).tone, 'trouble');
  assert.equal(K.sceneFor('happy', 'Hola.').caption, 'Hola.');
});

// P6 — readMs reproduce la fórmula de upstream más la espera de la burbuja
test('P6 readMs', () => {
  const c40 = 'x'.repeat(40);
  assert.equal(K.readMs(c40, 0.5, true), 500 + 600 + 200 + 1200 + 2000 + 1800);
  assert.equal(K.readMs(c40, 0, false), 200 + 1200 + 2000 + 1800);
});

// P7 — las emociones del cliente son las del servidor, en el mismo orden
test('P7 EMOTIONS sincronizadas con server/emotion_parser.py', () => {
  const py = fs.readFileSync(path.join(REPO, 'server', 'emotion_parser.py'), 'utf8');
  const m = py.match(/^EMOTIONS = \(([^)]*)\)/m);
  assert.ok(m, 'no encuentro EMOTIONS en emotion_parser.py');
  assert.deepEqual([...K.EMOTIONS], [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]));
});

// P8 — los textos fijos caben en un caption y los errores usan emociones conocidas
test('P8 LINES', () => {
  const fixed = [K.LINES.boot('Control+Alt+K'), K.LINES.thinking, K.LINES.idle];
  assert.match(K.LINES.boot('Control+Alt+K'), /klothulhu/);
  assert.doesNotMatch(K.LINES.boot('Control+Alt+K'), /Claudthulhu/);
  for (const code of ['unreachable', 'timeout', 'http_401', 'http_409', 'upstream_error', 'stream_broken']) {
    const [emotion, text] = K.LINES.errors[code];
    assert.ok(K.EMOTIONS.includes(emotion), code);
    fixed.push(text);
  }
  for (const t of fixed) assert.ok(t.length > 0 && t.length <= K.CAPTION_MAX, t);
});

// P9 — motor vendorizado: el fichero registrado, con sus licencias, y solo el IIFE (D10)
test('P9 vendor', () => {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(IIFE)).digest('hex');
  assert.ok(fs.readFileSync(path.join(VENDOR, 'VENDOR.md'), 'utf8').includes(sha), 'VENDOR.md no lleva el sha256 del IIFE');
  const head = fs.readFileSync(IIFE, 'utf8').slice(0, 4000);
  assert.match(head, /MIT License/);
  assert.match(head, /SIL Open Font License/);
  assert.equal(fs.existsSync(path.join(VENDOR, 'fables-motor.js')), false);
  assert.equal(M.SCHEMA_VERSION, 1);
});

// P10 — CSP y pintado (D10)
test('P10 CSP y sin innerHTML', () => {
  const html = fs.readFileSync(path.join(DESKTOP, 'renderer', 'index.html'), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(dir['default-src'], ["'none'"]);
  assert.deepEqual(dir['img-src'], ['data:']);
  assert.deepEqual(dir['script-src'].sort(), ["'self'", "'unsafe-inline'"]);
  assert.doesNotMatch(csp, /unsafe-eval|https?:/);
  assert.doesNotMatch(html, /innerHTML/);
  assert.match(html, /<script src="vendor\/fables-motor\.iife\.js"><\/script>/);
  assert.match(html, /<script src="scenes\.js"><\/script>/);
});

// P11 — Electron fijado (D11)
test('P11 electron fijado con lockfile', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies.electron, '44.4.5');
  const lock = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/electron'].version, '44.4.5');
});
```

Además: `.venv/bin/python -m pytest -q tests` y `.venv/bin/ruff check .` siguen en verde (el
servidor no se toca), y `npm run check` pasa.

## 4. Punto de parada (H1, único hito de la fase)

1. T1-T7 con commits pequeños, pruebas en verde, `git push -u origin fase1`.
2. Informe `docs/fase1/H1-informe.md` con el formato de la convención §3.2, con commit. Incluye:
   - Salida de `npm test` (resumen) y de las pruebas del servidor.
   - Tamaño medio del SVG por escena y cuánto tarda `renderScene` (orden de magnitud, medido en Node).
   - Cualquier cosa de `STAGING` que hayas cambiado y por qué (no deberías necesitarlo).
3. **Para.** La prueba en Konnos la hace Josem (lista de abajo) y yo reviso el código.

## 5. Prueba en Konnos (Josem, después del informe)

```powershell
cd <repo>\desktop ; git fetch ; git checkout fase1 ; npm ci ; npm test ; npm start
```

| # | Qué mirar | Si falla |
|---|---|---|
| K1 | Arranca y sale la escena de bienvenida, animada, con el texto | CSP o carga del motor |
| K2 | Una pregunta: escena de «pensando» y después varias escenas, una por frase, cada una hasta leerla | cola |
| K3 | El botón 📋 copia la respuesta entera; ✕ cierra | botones |
| K4 | Clic en la franja abre la caja; arrastrar la mueve; fuera de la franja los clics atraviesan | ratón (D12) |
| K5 | **Incógnita de claude-fables:** con una escena a medias, arrastra la ventana y después ocúltala y vuelve a mostrarla desde el tray. ¿La animación sigue o vuelve al segundo 0? | Si vuelve a 0: **indicador de falsación** de fables §4. Se avisa a claude-fables (`resumeAt`) |
| K6 | El tamaño de la franja (con tu `scale`) te parece bien en pantalla | D12 sigue `tentativa`: se ajusta |
| K7 | Cambia `look` en `config.json` a `ukiyoe` y luego a uno inventado: el primero cambia el estilo; el inventado vuelve a `pixel` sin romperse | validación del look |

## 6. Indicadores de falsación de la fase

- **D10 (IIFE + `<img>`):** K1 no pinta nada o la fuente sale como fuente del sistema. Es decir, la CSP
  bloquea algo que creíamos permitido.
- **D12 (franja 5:1):** en K6 a Josem no le cabe o no le gusta en ningún `scale`. Se replantea el formato
  (franja aparte, o altura distinta).
- **Escenas fijas (D9):** si en K2 el ritmo de escenas resulta insoportable (demasiadas, demasiado
  rápidas), el troceo de `beats` se revisa antes de la fase 2, porque el narrador escribirá con las
  mismas reglas.
