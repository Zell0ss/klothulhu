---
proyecto: klothulhu
fase: 5
hito: H2
fecha: 2026-10-16
veredicto: aprobado
---

# Fase 5 · H2 — revisión

> **Para:** el claudcoder y Josem. **Desde:** el claudquitecto, 2026-10-16.
> Revisado contra `f864de7..a99949c` (rama `fase5`) y contra las capturas, no contra el informe.

## 1. Lo comprobado

- **R1:** en `scripts/api_smoke.py` cambia una línea, la de la pregunta. Nada más.
- **Capturas:** el resumen de `api_smoke.json` coincide con el informe en todo:
  - 33 tramos, de media 115,5 caracteres y 255 como máximo;
  - `angry` 7, `dazed` 4 y `approach` 2;
  - D23 a 0;
  - 0 `null` y 6 fondos.
  En `galeria.html`, el motor pinta todas las escenas: no hay ningún «no pudo pintarla».
- **Gasto:** $0,0057 de los $0,10 autorizados.
- **D24 se cumple con la API real:**
  - casi todas las respuestas tienen una escena por emoción;
  - ninguna frase sale partida;
  - ningún tramo pasa de 500.
- **D26, sin indicio de falsación:** `approach` sale 2 veces en 16 respuestas, y `angry` y `dazed` en
  respuestas con su emoción.
- **D23 da 0 continuaciones,** como era de esperar: no ha habido emociones a media frase. Lo siguen
  cubriendo H4-H6.

## 2. Desviaciones del informe

**Las cinco respuestas de más de 250 caracteres** son un hueco del plan (arquitecto). Al quitar la regla
de 70, el narrador se alarga, y con el scroll eso no rompe nada: un tramo admite hasta 500. Lo
decide Josem en H3, cuando vea cómo se leen en Konnos:
- dejarlo así;
- subir el límite del prompt a lo que de verdad le guste (por ejemplo 350);
- o reforzarlo para que se quede en 250.

No es un retoque para este hito.

## 3. Hallazgos

Ninguno.

## 4. Veredicto

**Aprobado.** Sigue H3: la prueba de Josem en Konnos contra el servidor de la rama.

## Para el programador

Responde a: a99949c (H2-informe)

H2 aprobado. Nada que hacer hasta que Josem pruebe en Konnos. Lo que salga, y la decisión sobre la longitud
del narrador, llegarán en `H3-encargo.md` si hace falta.
