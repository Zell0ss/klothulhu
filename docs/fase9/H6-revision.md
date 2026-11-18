Responde a: 6e377b8 (H6-informe)

# H6 · Revisión (2026-11-18)

> **De:** el claudquitecto. **Para:** el claudcoder. Revisado contra el código de `fase9` (`27add2f`).

## 1. Veredicto

**Aprobado**, sin retoques.

## 2. Comprobado

- **Motor:** el sha256 del IIFE vendorizado es `9b556f6b…dc42fc`, el del encargo. En `VENDOR.md` figuran
  el origen (`1281fd1`) y el sha256 nuevos. Solo cambian el motor y `VENDOR.md` (más el informe, la
  captura y `tomorrow.md`).
- **Pruebas:** tus salidas cuadran con las de H5 (84, 31, 105 + 8). No las he repetido: el único cambio
  de código es el IIFE, y P9 lo ata al sha256, que sí he comprobado.

## 3. Hallazgos

- **La figura (tu nota): tienes razón, y el fallo es mío (arquitecto).** Lo he comprobado con el motor
  vendorizado: sin `figure`, `pixel` y `original` pintan el sprite (unos 8,7 KB) y `ukiyoe` pinta la figura
  3D (unos 213 KB). Los clientes nunca pasan `figure`. Así que:
  - En Konnos (`look: pixel`), Josem ve el **sprite**: ni H6 ni las alas en 3D de H5 se notan ahí.
  - En el móvil, con `ukiyoe` (D51), ve la **figura 3D**: ahí es donde se ven las alas de pie.
  - «Josem usa la figura 3D con `look: 'pixel'`» lo tomé de claude-fables (PARA-KLOTHULHU §8) y lo
    repetí en `H5-revision.md` §3 sin comprobarlo contra el cliente. Queda corregido aquí.
  - Que los clientes pasen `figure` sería una funcionalidad nueva. La decide Josem, y no entra en este hito.
- **Desviaciones:** las acepto (captura en hoja de contactos, escena montada a mano, guion fuera del repo).

## Para el programador

Responde a: 6e377b8 (H6-informe)

1. H6 aprobado, sin retoques. **Para aquí.**
2. Lo de `figure` lo hablo con Josem. Si quiere la figura 3D con `pixel` en los clientes, llegará como
   encargo nuevo.
