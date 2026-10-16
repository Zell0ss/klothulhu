---
proyecto: klothulhu
fase: 5
hito: H1
fecha: 2026-10-16
veredicto: aprobado
---

# Fase 5 · H1 — revisión

> **Para:** el claudcoder y Josem. **Desde:** el claudquitecto, 2026-10-16.
> Revisado contra `282b2cd..303a70a` (rama `fase5`), no contra el informe.

## 1. Lo comprobado

- **T1:**
  - el sha256 del IIFE vendorizado es `029c99ec…`, el del plan;
  - en `fase1.test.js` solo cambia la línea `SCHEMA_VERSION` de P9;
  - el vocabulario está regenerado y F1 pasa.
- **Normativas:** `tramos_cases.json`, `test_fase5.py` y `fase5.test.js` tienen los sha256 del plan.
  - En `test_fase4.py` solo se borran G7-G9, y queda el comentario.
  - Las demás pruebas y fixtures de las fases 1-4 no han cambiado.
- **Ejecutado aquí:**
  - `pytest` 42 passed;
  - `npm test` 42/42;
  - `ruff` y `npm run check` sin errores.
- **T2-T3:**
  - `tramos()` pasa los casos compartidos en los dos lados;
  - `app.py` trocea por tramos;
  - D23 sigue en el mismo bucle;
  - `build_scene` quita `then: "approach"`.
- **T4:**
  - el narrador pierde la regla de 70 y mantiene el total de 250;
  - el director explica `approach` (en movimiento), `angry` y `dazed` (en el sitio).
- **T5:**
  - `paint()` pinta con `bubble` y `secondsPerChar`, también al caer al look por defecto;
  - `play()` mide con `holdMs(typedAfter, spc)`;
  - el feed recorta a `TRAMO_MAX` y su reserva usa `tramos()`;
  - la CSP y el `<img>` (D10) siguen igual.
- **Orden de H3:** `/etc/klothulhu/klothulhu.env` es legible por `ubuntu` (600), así que la orden funciona
  sin `sudo`. El puerto 8766 está separado del 8765 de producción, y el historial va en memoria propia.

## 2. Desviaciones del informe

Las cinco están **aprobadas**:
- C6 de `fase3.test.js` ajustada, porque es tuya;
- las dos entradas de `ruff.toml`;
- el despliegue conjunto, que ya está en el plan;
- `TRAVEL` sin `approach`;
- `approach` en la lista de movimiento del prompt.

Sobre `TRAVEL`: es lo previsto en D26. Si un tramo que continúa la frase empieza con `approach`, el
personaje se acerca a la pantalla sin moverse a lo ancho. No hace falta cambiar el contrato.

## 3. Hallazgos

Ninguno.

## 4. Veredicto

**Aprobado.** H2 espera a que Josem autorice el gasto de T7.

## Para el programador

Responde a: 303a70a (H1-informe)

H1 aprobado. El plan es mío, así que el gasto lo apunto yo en su frontmatter cuando Josem lo autorice en
mi ventana. Si te lo autoriza en la tuya, pon en «Gasto» del informe H2 quién, cuándo y dónde. Cuando Josem
haya lanzado T7, escribe `docs/fase5/H2-informe.md` según el plan, §4. **Para** ahí.
