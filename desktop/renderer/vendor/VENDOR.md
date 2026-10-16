# Motor de claude-fables (vendorizado)

Motor que convierte una escena JSON (`FablesScene`) en un SVG animado. Decisión D10.

| | |
|---|---|
| Origen | repo `/data/claude-fables`, rama `main`, commit `a247d95` (fase 2 de claude-fables) |
| Fichero | `fables-motor.iife.js` (solo el IIFE; **no** se incluye el ESM `fables-motor.js`) |
| sha256 | `029c99ec9e95a2b5756b29977855e5bb20597e9b17b5465c0ec42c36c1a9166d` |
| `SCHEMA_VERSION` | 2 |
| Carga | `<script src="vendor/fables-motor.iife.js">` clásico → `window.FablesMotor` |

## Actualizarlo

```bash
cd /data/claude-fables/motor && npm ci && npm run build
cp dist/fables-motor.iife.js <repo>/desktop/renderer/vendor/
```

Después regenera el vocabulario del servidor (D15) con `node desktop/scripts/export-vocab.js` y
sube `server/fables_vocab.json` (la prueba F1 comprueba que coincide con el motor).

Después actualiza aquí el commit, el sha256 y `SCHEMA_VERSION` (la prueba P9 comprueba que el sha256
de este fichero coincide con el del IIFE). Si sube `SCHEMA_VERSION`, el JSON de escena ha cambiado y
hay que revisar `scenes.js`.

## Licencias

La cabecera del fichero lleva los avisos de licencia: MIT de upstream y SIL OFL de la fuente
Monocraft. **No se tocan ni se quitan** (claude-fables D10).
