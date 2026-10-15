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
