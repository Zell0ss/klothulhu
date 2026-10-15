# Fase 2 · H2 — informe (parcial: falta lanzar el paso [API])

Responde a: 1c05753 (H1-revision, «adelante con H2»)

## Hecho

- `scripts/api_smoke.py` (T8) y `desktop/scripts/gallery.js` (T9), listos y probados **sin API**:
  - `api_smoke.py --fake` (KLOTHULHU_FAKE=1) recorre las 13 preguntas y escribe el JSON; `gallery.js` lo
    convierte en HTML (160 KB, pinta las 22 escenas del ensayo).
  - El envoltorio que lee `usage` del narrador (`messages.stream`) y del director (`with_options().messages.create`)
    está probado contra un cliente simulado. **No contra el SDK real**: es lo único no verificado.
- Lo que pide la revisión (§ «Para el programador»), ya en el JSON: mediana y máxima de la latencia del
  director, `cache_read_input_tokens` del director por pregunta, golpes por respuesta, golpes `null` y sus
  avisos, `refusal`. Más el coste por modelo, con los precios de PLAN §1.
- Corte a $0.50 acumulados, y el script avisa y para.

## Gasto

0. **No he llamado a la API.** No hay credenciales: `ant` no está instalado y `ANTHROPIC_API_KEY` no está
en mi entorno (`/etc/klothulhu/klothulhu.env` es de root y no lo intento leer). Josem dijo «sí» en esta ventana
(2026-10-15) al paso [API], dentro del tope de $1 ya autorizado; sin clave no hay gasto.

## Lo que le toca a Josem (parar aquí)

Con una clave de Anthropic en su shell (una sola vez; son ~13 preguntas, esperable ≪ $0.10):

```bash
cd /data/klothulhu-fase2
ANTHROPIC_API_KEY=sk-ant-… .venv/bin/python scripts/api_smoke.py
node desktop/scripts/gallery.js
```

Genera `docs/fase2/capturas/api_smoke.json` y `galeria.html`. Después, el claudcoder lee el JSON, escribe el
anexo con las cifras (gasto por modelo y total, medianas y máxima del director, nulls y por qué, refusals,
caché) y hace commit de los tres ficheros. Si falla a mitad, **no se relanza entero sin decirlo**.

## Desviaciones

1. Añadí `--fake` (ensayo gratis) y `--out` a `api_smoke.py`; no estaban en el plan.
2. El script espera `ANTHROPIC_API_KEY` en el entorno; no usa `ant auth`.
3. Precio de escritura en caché a 1,25× la entrada: suposición mía (el plan solo da la lectura a 0,1×).

## Decisiones que necesito

Ninguna. Falta que Josem lance el script (o me pase la clave en mi entorno y yo lo lanzo).

---

## Anexo — resultado del paso [API] (2026-10-15)

Responde a: 1c05753 (H1-revision). Nadie ha escrito en el buzón desde ed33ef6.

### Hecho

Josem lanzó `scripts/api_smoke.py` y `desktop/scripts/gallery.js` en su shell, con su clave, una sola vez y
completo (13/13, sin cortes ni errores). Commit de `docs/fase2/capturas/api_smoke.json` y `galeria.html`.
Los números salen de ese JSON.

### Gasto

**$0.0067 en total**, de un tope de $1 (Josem, 2026-10-15, en la ventana del arquitecto y en esta ventana).
Una sola vuelta; el run lo lanzó Josem, no yo.

| Modelo | Papel | Coste |
|---|---|---|
| claude-haiku-5-5 | narrador | $0.0017 |
| claude-haiku-5-5 | director | $0.0051 |

(Con los precios de PLAN §1; la escritura de caché no se dio en ninguna llamada.)

### Medidas

| | |
|---|---|
| Latencia del director | mediana **3.257 s**, máxima **7.564 s** (la pregunta larga de `git rebase`, 7 golpes) |
| Primer texto del narrador | mediana 701 ms; el texto entero tarda 0,9–1,6 s |
| Total hasta `done` | 3,6–9,0 s |
| Golpes `null` | **0 de 61** (sin `warning` en ninguna llamada) |
| `refusal` | ninguno; todas las llamadas acabaron en `end_turn` |
| Caché del director | **2.443 tokens leídos de caché** desde la pregunta 2 (la 1 los escribió). El prompt pesa ~2,4 K tokens, no ~550 como estimé: la hipótesis de 3.2 era falsa por defecto, y cachea bien |
| Golpes por respuesta | 3–7 (mediana 4–5); total 61 |
| Tamaño de la respuesta | mediana 202 caracteres (112–374) |

### Indicadores de falsación de PLAN §5

1. **D14, latencia: se cumple el indicador.** La mediana del director (3,26 s) pasa de 3 s, y el peor caso
   (7,6 s) no tiene `retry`. Está dentro del `timeout=10`, pero la respuesta de 7 golpes tardó 9 s en total.
   El director produce de 360 a 1.660 tokens de salida: la latencia es sobre todo generación, no red.
2. **D14, esfuerzo `low`: no se cumple.** 0 `null`. Las escenas las juzga Josem en la galería.
3. **D16, voz del narrador:** la decide Josem con la galería. Lo medible: rompe sus propias reglas de formato
   (ver abajo).
4. **D13, troceo: se cumple el indicador.** **15 de los 61 golpes tienen 3 palabras o menos**, y son cortes a
   mitad de frase: `"siempre."`, `"invierno."`, `"regañadientes."`, `"no lo olvides."`. Causa: el narrador
   escribe **21 frases de más de 70 caracteres** (hasta 127), a pesar de la regla de T5; `splitLong` las parte
   en el último espacio y deja la cola huérfana. Ej.: `Tokio va siete horas por delante de Madrid en verano y
   ocho en` / `invierno.`. También supera el «1–3 frases, 250 caracteres»: 5 de 13 respuestas pasan de 250
   (la mayor, 374).

### Desviaciones

Ninguna nueva respecto a la parte anterior de este informe.

### Decisiones que necesito

Todas del arquitecto o de Josem; no las tomo yo.

1. **Troceo (D13):** ¿se ataja en el narrador (regla más dura o ejemplos que cumplan 70, `max_tokens` bajo),
   en `beats()` (partir mejor las frases largas, p. ej. en comas, y sin colas de 1–2 palabras; hay que
   cambiar **los dos lados** y añadir casos a `beats_cases.json`, que es normativo), o se acepta?
2. **Latencia (D14):** ¿se acepta la espera (mediana 3,3 s, máxima 7,6 s) o se dirige golpe a golpe mientras
   escribe el narrador, como dice el indicador? Alternativa barata: quitar `max_retries=1` y bajar el
   timeout a ~6 s, a cambio de más escenas `null` en los casos lentos.
3. **Voz (D16) y escenas (D14):** la galería es para Josem. `docs/fase2/capturas/galeria.html`.

### Parada de H2

Hecho: JSON, galería y este anexo, con commit. Paro y espero la revisión.
