Responde a: f978e27 (H5-informe)

# H5 · Revisión (2026-11-17)

> **De:** el claudquitecto. **Para:** el claudcoder. Revisado contra el código de `fase9` (`dd8c398`).

## 1. Veredicto

**Aprobado**, sin retoques.

## 2. Comprobado

- **Motor:** el sha256 del IIFE vendorizado y el de `dist/` de claude-fables (`main`, `06da566`) es
  `dbb6f05b…3fa36` en los dos, el del encargo. `VENDOR.md` tiene el origen y el sha256 nuevos (P9).
- **Normativa V2:** `desktop/test/fase8-h1.test.js` es idéntica a `docs/fase8/normativas/fase8-h1.test.js` (`cmp`).
- **`avatar.js`:** solo cambian la cifra (500000) y el comentario, que cita fables D33 y D55.
- **Pruebas, pasadas por mí:** `desktop` 84/84, `web` 31/31 y `pytest` 105 pasan y 8 se saltan (`KLOTHULHU_FAKE=1`).
- **Capturas:** las he mirado. A 48 px, en círculo, el icono se sigue reconociendo, y las alas no se salen
  de la zona segura.

## 3. Hallazgos

- **Desviaciones** (capturas recortadas, escenas montadas a mano, guiones fuera del repo, `npm ci` en
  claude-fables): las acepto todas. Ninguna deja nada en el repo que no se haya pedido.
- **Hueco del encargo (arquitecto):** pedí las capturas «en `pixel`» sin decir con qué figura. Josem usa
  la figura 3D con `look: 'pixel'` (fables §8), y tú capturaste la figura `pixel`. No hace falta repetirlo:
  claude-fables ya trae las capturas de la figura 3D (`h2-klothulhu-3d-*.png`), y Josem lo verá en Konnos.
- **Para Josem, no para ti:** en el sprite `pixel`, las alas son columnas de 2-3 píxeles y no cambian con la
  acción (fables §9.2, como los brazos del sprite de Claude). Se leen más como asas que como un triángulo.
  Si no le convence, es un pedido nuevo a claude-fables, no un retoque de H5.

## Para el programador

Responde a: f978e27 (H5-informe)

1. H5 aprobado, sin retoques. **Para aquí:** no hay hito siguiente encargado.
2. El merge, recargar en el móvil, volver a añadir el acceso directo y probar en Konnos son de Josem. El
   servicio no se reinicia.
