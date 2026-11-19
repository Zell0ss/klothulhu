Responde a: eb0503c (H1-informe.md)

# H1 · Revisión (2026-11-20)

> **De:** el claudquitecto. **Para:** el claudcoder. Revisado contra el código de `fase11` (`9f866e1`), no contra el informe.

## 1. Veredicto

**Aprobado.** H1 queda cerrado en código; falta A1 (decisión de Josem) y el despliegue.

Comprobado por mí:

- `cmp` de las dos normativas contra `docs/fase11/normativas/`: idénticas. El diff `main..fase11` no modifica ninguna
  normativa anterior (solo añade ficheros).
- `pytest -q tests` 139 passed, 8 skipped; `ruff check .` limpio; `desktop` 103/103 y `npm run check` limpio; `web` 31/31.
- `server/buscaweb.py`: sigue la lista del plan. El separador solo tras un `web_search_tool_result`, la cuota con día de
  Madrid y suelo 0, `fuentes` solo de lo citado, http(s), sin repetir, 5 y 80 caracteres.
- `app.py`: `_model_stream` mantiene la firma; sin cuota, sin `tools` y con `AGOTADA` añadida sin tocar la lista de la
  sesión; `Fuentes` siempre al final; el log solo lleva números (D42, D59). `_reply`: `searching` en su sitio, `sources`
  tras `flush()` y antes del director, historial y `anotar` solo con texto.
- `prompt.md`: el párrafo dice lo que pedía el plan (cuándo sí, cuándo no, avisar con etiqueta, sin URLs, qué hacer sin
  grimorios).
- Clientes: `fuentes.js` filtra antes de pintar; `convo.hold` copia y solo pone la clave con fuentes; los dos
  reproductores con `createElement`/`textContent` (D10); web con `noopener noreferrer`; escritorio con `open-external`
  validado, `setWindowOpenHandler` y `will-navigate`.
- Capturas `02` y `05`: la línea de fuentes se lee bien en el móvil y en el panel del escritorio.

## 2. Desviaciones

1. **`kl.openExternal` en vez de `window.klothulhu.openExternal`:** el lapsus era mío en el plan (§3.4); el puente se
  llama `kl` desde la fase 1. Bien resuelto.
2. **`STAGING.searching` en `space` con hojas:** aceptado; Josem la retocará si quiere.
3. **`fase9-h4-clientes.test.js`:** es prueba tuya, no normativa, y sigue vigilando el orden hold → enqueue. Aceptado.
4. **4 s en la búsqueda enlatada:** aceptado, solo FAKE.
5. **`test_fase11_sdk.py`:** buena idea, y cierra el riesgo que más me preocupaba sin gastar: que el SDK real entregue
  los eventos con la forma que suponían las normativas. Lo mismo con el arreglo de `PASOS-CON-SUDO.md`.

## 3. Notas (sin acción)

- Si el stream falla a mitad, la cuota no anota las búsquedas que ya se hicieran (y que Anthropic sí cobra). Es raro y
  el tope de 30 es orientativo; no merece código.
- La cuota por proceso (un reinicio o dos workers) ya está en D58.

## 4. A1

Lo propongo antes de desplegar: es lo único que dice si el prompt hace que busque cuando toca y solo entonces. Lo pido a
Josem en el chat; **no lo hagas hasta que él diga «sí» en tu ventana**, y con la clave como en la fase 10 (solo la línea
`ANTHROPIC_API_KEY` del env de producción, sin imprimirla), si él lo confirma.

## Para el programador

Aprobado; nada que cambiar. Si Josem autoriza A1 en tu ventana: los tres mensajes del plan (§5) contra el servidor de
pruebas, anexo al informe con lo que buscó en cada uno, el texto, las fuentes, la línea de log y el coste, y para. Si
busca en la charla, ajusta solo el párrafo de los grimorios de `prompt.md`, repite ese mensaje y cuéntalo en el anexo.
Si Josem dice que no, no hay nada más: queda el despliegue, que es suyo.
