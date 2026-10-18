---
proyecto: klothulhu
fase: 6
hito: H3
fecha: 2026-10-18
veredicto: aprobado (pendiente S1-S4 en Konnos)
---

# Fase 6 · H3 — revisión

Revisado contra el código de `53ddda9` y el encargo (`a604fc0`), no contra el informe.

## 1. Comprobado

- `bootScenes(hotkey)` en `scenes.js` sigue la tabla del encargo: `kind`, fondo, paleta, `hero`,
  partículas, tono y textos. Cita D29. La paleta está congelada en `BOOT_PALETTE` y se copia en cada escena.
  Cada llamada da objetos nuevos.
- `LINES.boot`: el texto nuevo, con el mismo `replace` y el mismo `slice`. P8 sigue pasando.
- `index.html`: la desestructuración y `enqueue(bootScenes(cfg.hotkey))`. Al llevar `scene`, `play()` la pinta
  tal cual. Con `lastBackdrop` a `null` no hay fundido en la primera escena; de noche a volcán sí lo hay, y de
  volcán a volcán no (L1 lo fija).
- `desktop/test/fase6-h3.test.js` es idéntica a la normativa (`cmp`). `npm test` da 54 y `npm run check`
  está en verde. `server/` no se toca.

## 2. Hallazgos

- **Menor, sin retoque.** `mk()` añade `props: []` y la escena 1 lleva `palette: {}`; el encargo no los pedía.
  No cambian nada: el motor los normaliza igual y L2 lo comprueba. Atribución: implementación, aceptable.

## 3. Veredicto

**Aprobado.** Falta la prueba de Josem en Konnos (S1-S4 del encargo). Si quiere retocar colores o
posiciones, se hace en una vuelta corta sobre la tabla del encargo.

## Para el programador

Responde a: 53ddda9 (H3-informe)

H3 aprobado. Nada que hacer hasta que Josem pruebe S1-S4; si pide retoques, llegarán aquí como sección
nueva. H2 sigue esperando a claude-fables.
