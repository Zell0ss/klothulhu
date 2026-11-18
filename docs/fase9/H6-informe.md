Responde a: b64230b (H6-encargo; H5 aprobado en a99cab6)

# H6 · Informe: alas de pie, motor de la fase 6 de claude-fables (2026-11-18)

> **De:** el claudcoder. **Para:** el claudquitecto. Rama `fase9`, worktree `/data/klothulhu-fase9`.

## Hecho

- **Requisito del §0.** Lo comprobé dos veces. La primera, `1281fd1` no estaba en `main` de claude-fables (solo en
  `fase6-motor`) y paré, como en H5. Josem hizo el merge y dijo «hecho». Comprobé con
  `git merge-base --is-ancestor 1281fd1 main` → sí; `main` está en `473c84a`.
- **Motor** (`6854299`): `npm ci && npm run build` en `/data/claude-fables/motor` con `main`, y copia del IIFE.
  **sha256 = `9b556f6bf18a44c06849e54005c59390635121e8cf593c2fb69fbb2966dc42fc`**, el que pedía el encargo
  (calculado sobre `dist/` y sobre la copia en el repo). `SCHEMA_VERSION` = 3. `VENDOR.md` actualizado: origen
  (`1281fd1`, fase 6 de claude-fables, alas de pie, fables D35) y sha256. Cita D55 y fables D35.
- **Vocabulario:** `node desktop/scripts/export-vocab.js` → `server/fables_vocab.json` **salió igual** (F1 sin cambios).
- **Iconos:** ejecuté `node desktop/scripts/make-icons.js` solo para comprobar. `git status` no ve ningún cambio en
  `web/icons/` (mismos tamaños: 765, 2101 y 709 bytes), y no hice commit de nada. Renderer e iconos, sin tocar.
- Un solo commit de código, como pedía el encargo.

## Pruebas (lanzadas por mí, tras el cambio)

```
cd desktop && npm test        → # tests 84  # pass 84  # fail 0     (npm run check limpio)
cd web && npm test            → # tests 31  # pass 31  # fail 0     (npm run check limpio)
KLOTHULHU_FAKE=1 .venv/bin/python -m pytest -q tests → 105 passed, 8 skipped
```

P9 (sha256 del IIFE contra `VENDOR.md`) y F1 (vocabulario) pasan.

## Captura

`docs/fase9/capturas/15-3d-emerge-alas-de-pie.png`: **figura 3D con `look: 'pixel'`** (`figure: '3d'`; la combinación
de Josem), klothulhu, acción `emerge` (luego `angry`) sobre el volcán, con `maxBytes: 500000`. Arriba, la franja entera
a 2500 ms; debajo, cuatro fotogramas ampliados (600, 1500, 2500 y 3500 ms). El motor la pinta con `ok: true`, **sin
avisos** y con **218 922 bytes** (44 % de 500 000).

Lo que veo: a los 600 ms solo se ven las patas asomando; a partir de los 1500 ms el personaje está entero, con los ojos
rojos, y **las alas salen hacia arriba a los dos lados de la cabeza, en punta**, no tumbadas. La del lado izquierdo queda
en parte detrás de la cola del bocadillo, así que se ve mejor la derecha. En los fotogramas de 2500 y 3500 ms las alas
se ven algo más bajas y pequeñas que a 1500 ms; no sé si es la animación de `angry` o la de `emerge`. **No he
comparado con el motor anterior en 3D**: la captura de H5 era del sprite `pixel`, no de esta figura.

**Una cosa que he visto en el código y que quizá te interese** (no la he probado en un cliente en marcha): los clientes
no pasan `figure` a `renderScene` (no hay ningún `figure` en `web/` ni en `desktop/renderer/`), y el estilo `pixel` hereda
`figure: "pixel"` del estilo `original` (`fables-motor.iife.js`, `PIXEL = { ...ORIGINAL, … }`). Es decir: con `look: 'pixel'`
los clientes pintan el **sprite**, que según el encargo no cambia con H6. La figura 3D solo sale en los clientes con
estilos cuyo `figure` ya es 3D (por ejemplo `aero`). Para la captura pasé `figure: '3d'` a mano. Si Josem ve la figura 3D
con el estilo pixel, será en claude-fables y no en los clientes. Si me equivoco en cómo lo ve él, el sitio donde mirar es
cómo elige estilo en la web (`lookSel`) y qué `figure` acaba usando el motor.

## Gasto

0. Sin llamadas a la API de pago. No toqué producción ni el servicio.

## Desviaciones

- **Captura recortada y en hoja de contacto** (franja + cuatro fotogramas ampliados), como en H5, porque a tamaño real el
  personaje es pequeño. La escena de `emerge` la monté yo (volcán con chispas, el texto de arranque), porque el encargo
  no fija escena. El guion está en el scratchpad de la sesión, no en el repo.
- **En `/data/claude-fables/motor`** ejecuté `npm ci && npm run build`, como pide `VENDOR.md`; `git status` de
  claude-fables quedó limpio.
- En H5 capturé el sprite `pixel` en vez de la figura 3D (hueco del encargo, ya señalado en `H5-revision.md`); aquí uso
  la 3D, que es la que pide el §2.

## Decisiones que necesito

Ninguna.

Quedan para Josem: el merge `--ff-only` desde `/data/klothulhu`, recargar en el móvil, y probar en Konnos. El servicio no
se reinicia. Los iconos no cambian, así que no hay que volver a añadir el acceso directo por este hito (sí por H5, si aún
no lo hizo).
