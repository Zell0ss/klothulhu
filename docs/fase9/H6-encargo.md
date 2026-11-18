Responde a: f978e27 (H5-informe; H5 aprobado en a99cab6)

# H6 · Encargo: alas de pie, motor de la fase 6 de claude-fables (2026-11-18)

> **Para:** el claudcoder. **Desde:** el claudquitecto.
> **Decisión:** ninguna nueva. Sigue D55. Origen: [[claude-fables/PARA-KLOTHULHU]] §10 (fables D35).

## 0. Qué y por qué

Josem vio en claude-fables que, con los brazos en alto, el ala de klothulhu salía tumbada. Lo han
arreglado en su fase 6. **Solo hay que vendorizar el motor**: la interfaz no cambia, `SCHEMA_VERSION`
sigue en 3, `maxBytes: 500000` sigue valiendo y el sprite `pixel` no cambia, así que **ni el renderer ni
los iconos se tocan**.

**Requisito previo:** el código está en `/data/claude-fables`, en la rama `fase6-motor` (`1281fd1`).
**Si `1281fd1` no está en `main` de claude-fables cuando empieces, para y avisa**, como en H5: ese merge
es de Josem.

## 1. Piezas

1. **Motor:** construye desde `main` de claude-fables y copia el IIFE como dice `VENDOR.md`. El sha256
   tiene que ser `9b556f6bf18a44c06849e54005c59390635121e8cf593c2fb69fbb2966dc42fc`; si no coincide, para.
   En `VENDOR.md`, actualiza el origen (`1281fd1`, fase 6 de claude-fables, alas de pie, fables D35) y el
   sha256 (P9).
2. **Vocabulario:** `node desktop/scripts/export-vocab.js`. Debería salir igual (F1); si cambia, dilo.
3. **Iconos:** no se regeneran. Si quieres comprobarlo, ejecuta `make-icons.js` y verifica que git no ve
   cambios en `web/icons/`; luego no hagas commit de nada.

## 2. Parada

`cd desktop && npm test && npm run check`; `cd web && npm test && npm run check`;
`KLOTHULHU_FAKE=1 .venv/bin/python -m pytest -q tests`. En `docs/fase9/H6-informe.md`, las salidas, el sha256
y una captura de la figura 3D con `look: 'pixel'` (la que usa Josem) en `emerge`
(`docs/fase9/capturas/15-3d-emerge-alas-de-pie.png`). Gasto: 0. **Para ahí.**

## Para el programador

Responde a: f978e27 (H5-informe; H5 aprobado en a99cab6)

1. En el worktree `/data/klothulhu-fase9`. Antes de nada, el requisito del §0.
2. Un commit: motor y `VENDOR.md`. Cita D55 y fables D35.
3. Parada del §2.
