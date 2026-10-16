# Fase 5 · H2 — informe

Responde a: f864de7 (H1-revision, §5 segunda vuelta)

## Hecho

- **R1:** la pregunta «Eres un trasto inútil.» de `scripts/api_smoke.py` es ahora «Hoy no me has servido de mucho,
  la verdad.». Un commit. Solo afecta a las próximas pasadas: las capturas de ahora no se tocan.
- **T7 [API]** la lanzó Josem en el worktree, con `--director-thinking 0`: 16 preguntas, 0 `null`, sin refusals.
  Capturas en `docs/fase5/capturas/` (`api_smoke.json` y `galeria.html`), con commit junto a este informe.
- **Galería: `docs/fase5/capturas/galeria.html`**, con bocadillo de scroll y `typedAfter` bajo cada escena.

## Gasto

Pasada de la fase, ambos modelos Claude Haiku 5.5:

| | USD |
|---|---|
| Narrador | 0,002252 |
| Director | 0,003420 |
| **Total** | **0,005672** |

Autorización: tope de $0,10 en T7, que el arquitecto anotó en el frontmatter del plan (`02e225d`) por haber lanzado
Josem la pasada el 2026-10-16. Yo no he gastado nada.

## Métricas de T7

| | |
|---|---|
| Tramos totales | 33 (16 respuestas) |
| Tramos por respuesta | 2 en 13 respuestas, 3 en dos, 1 en una |
| Longitud de tramo | media **115,5**, máxima **255** (ninguno llega a 500; ninguno de ≤3 palabras) |
| Acciones nuevas (cuenta `action` y `then`) | `angry` 7 · `dazed` 4 · `approach` 2 |
| `continuations` / `fixed_backdrop` / `fixed_hero` | 0 / 0 / 0 |
| Fondos distintos | 6 |
| Latencia del director (mediana / máx) | 1,9 s / 4,4 s; primera escena 1,5 s / 4,0 s |
| Primer texto del narrador (mediana) | 0,77 s |

Lectura:
- Pasa de 70 a 500: ningún tramo se parte ya a mitad de frase, y cada frase larga va en una sola escena.
- **`continuations` 0 es esperado, no una regresión:** D23 solo actúa cuando un tramo acaba cortado (emoción nueva a
  media frase, o tramo de más de 500). El narrador no ha hecho ninguna de las dos cosas en estas 16 respuestas, así que
  esa parte de D23 no se ha ejercitado con la API real; la cubren H4-H6 con el director simulado.
- Las tres acciones nuevas salen y en sitios que encajan: `angry` en las respuestas de enfado (y en la 14 y la 15),
  `dazed` en las de desconcierto (2, 10, 12). `approach` sale 2 veces, como «rara vez».

## Ejemplos

1. **Una frase de 209 caracteres, una sola escena** (pregunta 10, «una única frase muy larga, sin puntos»):
   [confused] «No veo nada, mortal, solo percibo un rectángulo de píxeles donde me obligan a existir, sin ojos ni ventana
   propia desde la que mirar, así que la descripción tendrá que ser tu propia mirada sobre el escritorio.» → 1 tramo,
   `lab`, `dazed` → `peek`.
2. **El tramo más largo, 255** (pregunta 8, git rebase): dos tramos, neutral (255) + smug (178). El primero va en
   `lab` con `inspect → point`; el segundo, `city` con `peek → angry`. El cambio de emoción a mitad de respuesta
   corta bien en el límite de frase, sin tramo cortado.
3. **Tres emociones, tres escenas** (pregunta 15): happy (71) `night` `wave → dance`; annoyed (71) `volcano`
   `angry → shrug`; neutral (104) `city` `walk 20→70 → think`.

## Desviaciones

- **El narrador se pasa del límite de 250 caracteres** del prompt: 5 de las 16 respuestas (267, 307, 332, 336 y 434;
  esta última, la de git rebase). No es un fallo de la fase: al quitar la regla de 70 el modelo se alarga. No lo he
  tocado. Si molesta, es una decisión de prompt del arquitecto.
- No he podido comprobar el aspecto del scroll: la galería lo pinta, pero lo juzga Josem (H3).

## Decisiones que necesito

Ninguna.
