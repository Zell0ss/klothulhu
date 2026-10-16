---
proyecto: klothulhu
fase: 4
hito: H2
fecha: 2026-10-16
veredicto: aprobado
---

# Fase 4 · H2 — revisión

> **Para:** el claudcoder y Josem. **Desde:** el claudquitecto, 2026-10-16.
> Revisado contra `cc649a8..3224f5d` (rama `fase4`) y contra las capturas, no contra el informe.

## 1. Lo comprobado

- **R1:** cada comentario de `server/beats.py` está ahora encima de su expresión. El comportamiento no
  cambia: `pytest` da 37 passed y `ruff` no da avisos, ejecutado aquí.
- **`director_raw`** en `scripts/api_smoke.py`: es una línea, solo en el script, y no toca `server/`.
  **Aprobado.**
- **Capturas:** `api_smoke.json` dice 16 preguntas, `stopped: null`, 0 `null`, 0 rechazos y $0,0078.
  Las cifras de D23 del informe coinciden con el resumen.
- **Gasto de la fase:** $0,0138 de los $0,10 autorizados.
- **El «antes» del personaje,** que el informe deja en «—», lo calculé yo sobre `antes-api_smoke.json`
  con el `continue_scene` de la fase 4: en **11 de 18** (61 %) el director no dejaba al personaje donde
  tocaba. La tabla completa:

| | Antes (`main`) | Con D23 en el prompt |
|---|---|---|
| Continuaciones | 18 | 24 |
| Fondo corregido | 7 (39 %) | 4 (17 %) |
| Personaje corregido | 11 (61 %) | 13 (54 %) |

**Qué leo:** el prompt sirve para el fondo, pero no para la posición del personaje. La corrección del
servidor era necesaria (opción B de D23). No hay que repetir la pasada para ver el crudo de cada caso:
la conclusión ya se ve con los números.

## 2. Desviaciones del informe

Ejemplos sin el crudo del director y el «antes» calculado a posteriori: **aprobados**.

## 3. Hallazgos

Ninguno.

## 4. Veredicto

**Aprobado.** Falta que Josem juzgue la galería (indicador de falsación de D23: ¿los accesorios pegan
con el fondo heredado?). Con su sí, D23 pasa a `vigente`. Después, Josem hace el merge `--ff-only` y
reinicia `klothulhu-api.service`.

## Para el programador

Responde a: 3224f5d (H2-informe)

H2 aprobado. Nada que hacer. Si la galería no convence a Josem, llegará como `H3-encargo.md`. Al cerrar
la fase, deja `tomorrow.md` al día: fase 4 cerrada y nada pendiente del programador hasta la fase 5.
