# Motor de claude-fables (vendorizado)

Motor que convierte una escena JSON (`FablesScene`) en un SVG animado. Decisión D10.

| | |
|---|---|
| Origen | repo `/data/claude-fables`, rama `main`, commit `afa3ade` (fase 5 de claude-fables: alas de murciélago en klothulhu, D55; `main` estaba en `06da566`) |
| Fichero | `fables-motor.iife.js` (solo el IIFE; **no** se incluye el ESM `fables-motor.js`) |
| sha256 | `dbb6f05b2cfd5db7d517b8596629f662a0980ed2ebad57d826bae4d096d3fa36` |
| `SCHEMA_VERSION` | 3 |
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
