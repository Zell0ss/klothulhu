# Fase 4 · H2 — informe

Responde a: cc649a8 (H1-revision)

## Hecho

- R1 (comentarios de `server/beats.py`): hecho, f1473a8.
- T5 [API] la lanzó Josem en el worktree (`--director-thinking 0`, 16 preguntas, 0 null, sin refusals).
  Capturas en `docs/fase4/capturas/`: `api_smoke.json`, `galeria.html`; `antes-api_smoke.json` y
  `antes-galeria.html` son una pasada anterior con el código de `main` (sin D23, 13 preguntas), útil como medida de antes.
- **Galería: `docs/fase4/capturas/galeria.html`** (la de antes: `antes-galeria.html`).

## Gasto

Pasada de la fase (16 preguntas), ambos modelos Claude Haiku 5.5:

| | USD |
|---|---|
| Narrador | 0,002164 |
| Director | 0,005637 |
| **Total** | **0,007801** |

La pasada de antes (13 preguntas, `main`) costó $0,006005. Total gastado en la fase: $0,0138 de los $0,10
autorizados por Josem el 2026-10-16 (lo confirmó en esta ventana al lanzar las dos pasadas).

## Resultados D23

| | Pasada con D23 | Antes (`main`) |
|---|---|---|
| Golpes | 70 | 57 |
| `continuations` | **24** | 18 (calculado a posteriori) |
| `fixed_backdrop` | **4** (17 %) | fondo distinto en 7 de 18 (39 %) |
| `fixed_hero` | **13** (54 %) | — |
| `long_beat_replies` | **15** de 16 respuestas | — |
| escenas `null` | 0 | 1 |

Lectura: con la regla en el prompt, el director conserva el fondo por su cuenta en 20 de 24 continuaciones
(en el "antes" lo cambiaba en 7 de 18). Donde sigue fallando es en el personaje: en más de la mitad no arranca
en el `to` anterior, y ahí el servidor corrige. Es el dato que dice que el prompt no basta para `hero.from`, y que
la corrección del servidor sí hace falta. (Ojo con 54 %: `fixed_hero` cuenta cualquier cambio en `hero`, es decir
un `from` distinto o un `to` forzado a quedarse en el sitio; no distingue cuál.)

## Ejemplos de continuaciones corregidas

**Limitación:** el JSON solo guarda la escena ya corregida, no lo que dijo el director, así que no puedo mostrar el
"antes" de cada una. Lo que sí hay es el resultado y qué contador saltó. Lo he arreglado para la próxima pasada:
`api_smoke.py` guarda ahora `director_raw` por pregunta (commit aparte). Si el arquitecto quiere el crudo, hace
falta repetir la pasada (~$0,008).

1. «Explícame en una frase larga… lunes» (`fixed_backdrop` 2, `fixed_hero` 2). Golpes 1→2 («…las estrellas» /
   «recuerdan que existen…»): salen con `night` + partículas `stars`, héroe `30→30` en ambos. Golpes 3→4:
   `city`, `tumble 10→55` y luego `shrug 55→55`, que sale del `to` anterior.
2. «Eres un trasto inútil» (`fixed_backdrop` 1, `fixed_hero` 1). Golpes 2→3 («…adorno de escritorio,» /
   «mortal, y aun así…»): ambos `lab`, `tumble 30→60` y `carry 60→80`, con `from` = 60.
3. «¡He arreglado el bug…!» (`fixed_backdrop` 1, `fixed_hero` 1). Golpes 3→4 («…el bug está muerto» /
   «o solo durmiendo…»): ambos `night`, héroe en 60 (`peek` e `inspect`, sin desplazamiento).

## Desviaciones

- Los ejemplos van sin el "antes" del director (ver limitación).
- El "antes" de `continuations` lo he calculado yo sobre el JSON de `main`, con la misma `is_cut`; esa pasada no
  tenía el contador.

## Decisiones que necesito

Ninguna. La galería la juzga Josem.
