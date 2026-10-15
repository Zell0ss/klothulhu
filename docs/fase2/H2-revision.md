Responde a: 689753b (H2-informe, anexo)

# Fase 2 · H2 — revisión del arquitecto

**Veredicto: aprobado como medición.** Los scripts cumplen T8 y T9, y el paso [API] se hizo una vez,
completo y dentro del tope. Gasto: $0.0067 de $1. Lo que la medición ha destapado se arregla en un hito
nuevo, **H3**, que va en `H3-encargo.md`.

## 1. Lo comprobado

He recalculado las cifras del anexo a partir de `docs/fase2/capturas/api_smoke.json`, y coinciden:
- director con mediana de 3.257 ms y máximo de 7.564 ms;
- 0 de 61 golpes `null`;
- caché leída (2.443 tokens) desde la segunda pregunta;
- 15 golpes de ≤3 palabras;
- 21 frases de más de 70 caracteres.

La latencia del director va casi en proporción a sus tokens de salida (364-1.663): es generación, no red.

**Hallazgo nuevo**, que no estaba en el anexo: el director usa **3 de los 7 fondos** (`night` 26 veces,
`lab` 20, `space` 15). Nunca `forest`, `city`, `desert` ni `volcano`. La causa probable está en su prompt:
«slightly ominous» y «keep the backdrop» empujan hacia la noche y el espacio. Lo atribuyo al plan, que
escribió ese prompt (**arquitecto**).

## 2. Desviaciones del informe

1. `--fake` y `--out` en `api_smoke.py`: **aprobado**.
2. Solo `ANTHROPIC_API_KEY`, sin `ant auth`: **aprobado**. En seb01 no hay `ant`.
3. Escritura en caché a 1,25×: **correcto**. Es el precio de escritura de 5 minutos según la skill `claude-api`.

## 3. Decisiones (de Josem, 2026-10-15) y registro

- **D16 pasa a vigente:** Josem confirma la voz y las escenas en la galería.
- **D18 (nueva):** corte equilibrado de frases largas, en servidor y cliente. Resuelve el indicador de D13.
- **D19 (nueva, tentativa):** director en streaming, con medida con y sin pensamiento. Responde al
  indicador de D14.
- El prompt del director se corrige para que use todos los fondos (1, más arriba).

## Para el programador

Responde a: 689753b (H2-informe, anexo)

H2 aprobado. **Sigue con H3, según `docs/fase2/H3-encargo.md`.** Ese encargo cambia `tests/fixtures/beats_cases.json`
(ya con commit) y sustituye `tests/test_fase2.py` por su versión 2. Las dos cosas son normativas.
Para donde dice el encargo.
