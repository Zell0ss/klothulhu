---
proyecto: klothulhu
fase: 3
titulo: retoques tras la prueba de Josem en Konnos
plan: arquitecto (este encargo; es corto y fija una fórmula)
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D22; también D10, D18, D21)"
---

# Fase 3 · H2 — encargo: retoques tras la prueba en Konnos

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-16.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## Para el programador

Responde a: 73fc589 (H1-revision; no hay informe nuevo: esto sale de la prueba de Josem en Konnos)

Josem ha probado en Konnos: L1-L7 sin quejas, salvo lo de abajo. El código de H1 sigue aprobado.
Este encargo trae tres retoques. **Rama `fase3`**, en el worktree `/data/klothulhu-fase3`. Todo es del
cliente: `server/` no se toca.

### R1 · Tiempo de lectura (D22)

**Qué pasa:** en las frases cortadas (D18), la escena se queda quieta mucho rato antes de seguir.
Con las 51 escenas de `docs/fase2/capturas/api_smoke-think0.json`, `speaksAfter` sale siempre a 0. La
espera viene de la parte de lectura de `readMs` (`2000 + len*45`), que se suma *después* de escribir:
el texto ya escrito se queda ~4,4 s de media.
**Atribución:** del arquitecto. Es la fórmula de upstream que fijé en la fase 1 sin contar con D18.

**Qué hacer** (`desktop/renderer/scenes.js`):

1. `readMs(caption, speaksAfterSec, fadeIn, opts)`, con un cuarto parámetro opcional
   `opts = { cut = false, speed = 1 }`:
   ```
   read = cut ? len*45/2 : 2000 + len*45
   ms   = round(speaksAfterSec*1000 + (fadeIn ? 600 : 0) + 200 + len*30 + speed*read)
   ```
   Si no se pasa `opts`, el resultado es **idéntico** al de hoy (P6 sigue pasando sin tocarla).
2. `isCut(caption)`: `true` si el caption, quitando los espacios del final y los cierres
   `» " ” ' ) ]`, **no** termina en `.`, `!`, `?` o `…`. Se exporta junto a lo demás.
3. En `index.html`, `play()` pasa `{ cut: isCut(item.caption), speed: readSpeed }`, con `readSpeed`
   llegado por el `init` del IPC.

### R2 · `readSpeed` y avisos de `config.json`

**Qué pasa:** Josem puso `"debug": "true"` (string) y el log no se escribía, sin ningún aviso.
**Atribución:** del arquitecto. El plan no pedía validar la config.

1. Saca la normalización de `loadConfig()` de `main.js` a `desktop/config.js`, puro (sin Electron):
   `normalizeConfig(raw) → { cfg, warnings }`. Los campos y valores por defecto existentes no cambian.
2. **`readSpeed`:** se acepta un `number` finito en `[0.25, 4]`. Si falta, vale `1`. Cualquier otro
   valor (string incluido) → `1`, más un aviso que nombre `readSpeed`.
3. **`debug`:** solo `true` lo enciende. Si está presente y no es booleano → `false`, más un aviso que
   nombre `debug`.
4. `main.js` escribe cada aviso con `console.warn` al arrancar (Josem arranca con `npm start` y lo ve en
   la consola). Si el log está encendido, también va al log.
5. `config.example.json` y el README del cliente: añadir `"readSpeed": 1` y una línea explicando qué hace.

### R3 · P9 en Windows (`.gitattributes`)

**Qué pasa:** en un clon de Windows (`core.autocrlf=true`), git pasa `fables-motor.iife.js` a CRLF, el
sha256 no coincide con `VENDOR.md` y P9 falla. Josem lo confirmó en Konnos.
**Atribución:** del arquitecto. Ningún plan contaba con un clon en Windows.

- `.gitattributes` en la raíz con `desktop/renderer/vendor/** -text`. Así esos ficheros salen tal cual
  están en el repo, sin conversión. Nada más en ese fichero: el resto del repo no está roto y no hace
  falta reescribirlo.
- Comprueba que `git ls-files --eol desktop/renderer/vendor` muestra `-text`.

### Pruebas normativas

Van en `desktop/test/fase3-h2.test.js`. Cópialas y hazlas pasar; no se editan. Puedes añadir las tuyas.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../renderer/scenes.js');
const { normalizeConfig } = require('../config.js');

const c40 = 'x'.repeat(40);

// N1 — sin opts, readMs es la de la fase 1 (D22 no cambia P6)
test('N1 readMs sin opts no cambia', () => {
  assert.equal(K.readMs(c40, 0.5, true), 500 + 600 + 200 + 1200 + 2000 + 1800);
  assert.equal(K.readMs(c40, 0, false, {}), 200 + 1200 + 2000 + 1800);
});

// N2 — golpe cortado: sin los 2 s y con media lectura (D22a)
test('N2 readMs cortado', () => {
  assert.equal(K.readMs(c40, 0, false, { cut: true }), 200 + 1200 + 900);
  assert.equal(K.readMs(c40, 0.5, true, { cut: true }), 500 + 600 + 200 + 1200 + 900);
});

// N3 — readSpeed multiplica solo la lectura (D22b)
test('N3 readMs speed', () => {
  assert.equal(K.readMs(c40, 0, false, { speed: 0.5 }), 200 + 1200 + 1900);
  assert.equal(K.readMs(c40, 0, false, { cut: true, speed: 0.5 }), 200 + 1200 + 450);
  assert.equal(K.readMs(c40, 0, false, { speed: 2 }), 200 + 1200 + 7600);
});

// N4 — isCut
test('N4 isCut', () => {
  for (const c of ['Hola, mortal. Sigo atrapado en tu escritorio,', 'lo dice así:', 'sin punto', 'uno; dos;'])
    assert.equal(K.isCut(c), true, c);
  for (const c of ['Fin.', 'Fin. ', '¿Sí?', '¡Ya!', 'Bueno…', 'Bueno...', '«Hola.»', '"Hola."', '(así.)'])
    assert.equal(K.isCut(c), false, c);
});

// N5 — readSpeed en config
test('N5 normalizeConfig readSpeed', () => {
  assert.equal(normalizeConfig({}).cfg.readSpeed, 1);
  assert.equal(normalizeConfig({}).warnings.length, 0);
  assert.equal(normalizeConfig({ readSpeed: 0.7 }).cfg.readSpeed, 0.7);
  for (const v of [0, 0.1, 5, '0.7', null, NaN, Infinity]) {
    const r = normalizeConfig({ readSpeed: v });
    assert.equal(r.cfg.readSpeed, 1, String(v));
    assert.ok(r.warnings.some((w) => w.includes('readSpeed')), String(v));
  }
});

// N6 — debug solo con true; lo demás avisa
test('N6 normalizeConfig debug', () => {
  assert.equal(normalizeConfig({ debug: true }).cfg.debug, true);
  assert.equal(normalizeConfig({ debug: false }).warnings.length, 0);
  assert.equal(normalizeConfig({}).cfg.debug, false);
  for (const v of ['true', 1, 'yes']) {
    const r = normalizeConfig({ debug: v });
    assert.equal(r.cfg.debug, false, String(v));
    assert.ok(r.warnings.some((w) => w.includes('debug')), String(v));
  }
});

// N7 — el motor vendorizado sale sin conversión de finales de línea (P9 en Windows)
test('N7 .gitattributes protege vendor', () => {
  const ga = fs.readFileSync(path.join(__dirname, '..', '..', '.gitattributes'), 'utf8');
  assert.match(ga, /^desktop\/renderer\/vendor\/\*\* -text$/m);
});
```

### Lista previa (convención §4)

- **¿Algo borra o sobrescribe?** No. `appendLog` ya está probado en una carpeta temporal (C9).
- **¿API externa?** No. Gasto: 0.
- **¿Producción?** No. Es solo el cliente. El merge de `fase3` en `main` y el `git pull` en Konnos son
  de Josem.

### Orden y parada

R3 → R1 → R2. Un commit por retoque. Después: `npm test` (27 + 7 nuevas, todas en verde), `npm run check`
(con `config.js` dentro) y `.venv/bin/python -m pytest -q tests`, que no debería cambiar.
**Para** y deja `docs/fase3/H2-informe.md` con commit.
