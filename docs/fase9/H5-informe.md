Responde a: 0578dd4 (H5-encargo, D55)

# H5 · Informe: klothulhu con alas de murciélago (2026-11-17)

> **De:** el claudcoder. **Para:** el claudquitecto. Rama `fase9`, worktree `/data/klothulhu-fase9`.

## Hecho

- **Requisito del §0.** Lo comprobé dos veces. La primera, `afa3ade` no estaba en `main` de claude-fables (solo en
  `fase5-motor`) y paré: se lo dije a Josem y no toqué nada. Josem hizo el merge y dijo «hecho». Comprobé con
  `git merge-base --is-ancestor afa3ade main` → sí; `main` está en `06da566`.
- **Motor** (`e38f602`): `npm ci && npm run build` en `/data/claude-fables/motor` (con `main`), y copia del IIFE.
  **sha256 = `dbb6f05b2cfd5db7d517b8596629f662a0980ed2ebad57d826bae4d096d3fa36`**, el que pedía el encargo
  (calculado sobre `dist/` y sobre la copia en el repo). `SCHEMA_VERSION` = 3. `VENDOR.md` actualizado: origen
  (`afa3ade`, fase 5 de claude-fables, D55) y sha256.
- **Vocabulario:** `node desktop/scripts/export-vocab.js` → `server/fables_vocab.json` **salió igual**, git no lo ve
  modificado (F1 sin cambios).
- **`avatar.js` y V2** (`c8026b2`): `MAX_BYTES_KLOTHULHU = 500000`, comentario con fables D33 (antes D28) y D55.
  `docs/fase8/normativas/fase8-h1.test.js` copiada tal cual a `desktop/test/fase8-h1.test.js` (`cmp` vacío). El `diff`
  contra la copia anterior mostró solo las dos cifras de V2 (400000 → 500000), líneas 33 y 35.
- **Iconos** (`0880221`): `node desktop/scripts/make-icons.js` sin tocar el script. Los tres PNG cambian
  (`icon-192` 715→765 B, `icon-512` 2057→2101 B, `apple-touch-icon` 662→709 B).

## Pruebas (lanzadas por mí, tras todos los cambios)

```
cd desktop && npm test        → # tests 84  # pass 84  # fail 0     (npm run check limpio)
cd web && npm test            → # tests 31  # pass 31  # fail 0     (npm run check limpio)
KLOTHULHU_FAKE=1 .venv/bin/python -m pytest -q tests → 105 passed, 8 skipped
```

P9 (sha256 del IIFE contra `VENDOR.md`), F1 (vocabulario), V2 (500000) y `web/test/icons.test.js` pasan.

**V3** (puesta en escena completa en `pixel` y `ukiyoe`, y cabe en `maxBytes`) **no da ningún aviso nuevo.** Medido con
`M.renderScene` sobre las 7 emociones × 2 estilos = 14 pintados, con `avatarOptions('klothulhu')` (`maxBytes: 500000`):
todos `ok`, **0 avisos en total**, y el mayor es `neutral/ukiyoe` con **215 471 bytes** (43 % de 500 000). En `pixel`
el mayor es `annoyed` con 9 695 bytes.

## Capturas (`docs/fase9/capturas/`)

- `11-pixel-emerge-alas.png` — klothulhu verde, `pixel`, acción `emerge`: cuatro fotogramas (600, 1500, 2500 y 3500 ms)
  recortados y ampliados alrededor del personaje. Sin avisos del motor.
- `12-pixel-despair-alas.png` — lo mismo con `despair` (fondo `night`, lluvia).
- `13-icono-48px-alas.png` — el icono a 48 px reales, recortado en círculo sobre gris, claro y verde (como
  `10-icono-48px.png` de H3), ampliado 5× sin suavizado solo para verlo.
- `14-icon-512-alas.png` — copia de `web/icons/icon-512.png`.

Lo que veo: las alas salen a los lados de la cabeza, más altas que los brazos de antes, que eran horizontales. En el icono
ocupan **la misma anchura** que los brazos (píxeles 126–386 de 512 en los dos), así que el recorte seguro del 60 % de
H3 sigue valiendo. A 48 px se reconocen cabeza, ojos, patas y las dos alas. En `emerge` el personaje aparece entre los
600 y los 1500 ms; en `despair` está ya en el primer fotograma. **No sé** si en `pixel` las alas se mueven en alguna de
estas acciones: en mis cuatro fotogramas por acción se ven iguales. Eso lo dirá quien lo vea en el móvil.

## Gasto

0. `KLOTHULHU_FAKE=1`; ninguna llamada a la API de pago. No toqué producción ni el servicio.

## Desviaciones

- **Capturas de escena recortadas y en hoja de contacto**, en vez de la escena entera. Mi primer intento (escena a
  pantalla completa) salió con el personaje de unos 50 px sobre 390 y no se apreciaban las alas.
- **Las escenas de `emerge` y `despair` las monté yo** con el vocabulario del motor (volcán con chispas; noche con
  lluvia y un texto de relleno), porque el encargo no fija escena. No están en el repo ni en `scenes.js`.
- **Los guiones de captura están en el scratchpad de la sesión, no en el repo** (usan `playwright-core` instalado
  allí y el Chrome del sistema). `make-icons.js` y los demás scripts del repo no cambian.
- **En `/data/claude-fables/motor`** ejecuté `npm ci && npm run build`, como pide `VENDOR.md`. Crea `node_modules/` y
  `dist/`; `git status` de claude-fables quedó limpio antes y después.
- El `origin` de `VENDOR.md` lleva `afa3ade` (el commit que dice el encargo) y menciona que `main` estaba en `06da566`.

## Decisiones que necesito

Ninguna.

Quedan para Josem: el merge `--ff-only` desde `/data/klothulhu`; recargar en el móvil; volver a añadir el acceso directo
(Samsung guarda el icono de cuando se creó); y probar en Konnos. El servicio no se reinicia.
