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

## 5. Revisión del anexo A1 (2026-11-20)

Responde a: 8fb3835 (anexo A1 del informe)

**A1 aprobado.** El prompt hace lo que debe: busca para el tiempo, no para la cuenta ni para la charla, avisa con su
etiqueta y no mete URLs. Log solo con números. Gasto ≈ $0,025, dentro del tope (la segunda tanda era necesaria para
diagnosticar y estaba dentro del tope: bien hecho). Dato útil para D58: una búsqueda añade ~13 000 tokens de entrada
(≈ $0,0013), poco frente a los $0,01 de la búsqueda.

**El hallazgo de las fuentes es mío:** en el plan (S5, D60) fijé «solo lo citado» sin saber que el modelo cita poco
cuando resume. Se lo he preguntado a Josem y ha elegido enseñar **lo consultado cuando no haya citas** (D61). Va como
retoque R1.

### R1 · Si no cita, lo consultado (D61)

1. **`buscaweb.py`:**
   - `Fuentes(items, tipo="citadas")`: el campo nuevo `tipo` (`"citadas"` o `"consultadas"`), con valor por defecto, para
     que todo lo anterior siga igual.
   - `MAX_CONSULTADAS = 3`.
   - `fuentes_de(content) -> Fuentes`: si `fuentes(content)` no está vacía, `Fuentes(esa, "citadas")`; si no, los
     primeros resultados de los bloques `web_search_tool_result` (cuyo `content` sea una lista; un error es un objeto y se
     salta), con **las mismas reglas** que las citas (http(s), sin repetir, título recortado o el dominio), como mucho
     `MAX_CONSULTADAS`, y `tipo="consultadas"`. Sin nada, `Fuentes([], "consultadas")` o `Fuentes([])`: da igual,
     `_reply` no manda evento vacío. `fuentes()` no cambia (S5 sigue pasando).
2. **`app.py`:** `_model_stream` cede `buscaweb.fuentes_de([...])` en vez de `Fuentes(buscaweb.fuentes([...]))`. En
   `_reply`, el evento `sources` lleva `"kind": "consultadas"` **solo** en ese caso; con citas, `{"items": ...}` como hasta
   ahora (S6). Docstring del contrato con `kind`.
3. **`convo.js`:** `hold(text, sources, consultadas)`: con fuentes y `consultadas` verdadero, la entrada lleva además
   `consultadas: true`; si no, la clave no aparece (B2 y B5).
4. **Los dos reproductores:** guardan también si `data.kind === 'consultadas'`, se lo pasan a `hold` (y lo vacían al
   preguntar), y el panel rotula la línea `consultado: ` en vez de `fuentes: ` (B6). Lo demás de la línea (enlaces,
   `title`, D10, `noopener`, `openExternal`) igual.
5. **FAKE:** la respuesta enlatada de «busca» sigue citando (no hace falta otra).
6. **Normativas nuevas:** copia tal cual `docs/fase11/normativas/test_fase11_r1.py` a `tests/test_fase11_r1.py` y
   `docs/fase11/normativas/fase11-r1.test.js` a `desktop/test/fase11-r1.test.js`. Las de H1 no se tocan y tienen que
   seguir pasando.

**Sin gasto:** R1 no necesita otra llamada real; `test_fase11_sdk.py` puede ganar el caso sin citas si te sirve.

## Para el programador

Responde a: 8fb3835. A1 aprobado. Haz el retoque **R1** de §5 (D61), con las dos normativas nuevas, las de siempre en
verde y una captura de la web con «consultado:» (puedes forzarlo en FAKE con una prueba tuya o una variante enlatada que
no cite; no cambies la de «busca»). Anexo 2 al informe y para.
