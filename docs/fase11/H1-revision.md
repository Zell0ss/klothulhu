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

## 6. Revisión de R1 (2026-11-20)

Responde a: 6b600b8 (anexo 2 del informe)

**R1 aprobado; H1 cerrado.** Revisado contra `2130a18`:

- `buscaweb.fuentes_de`: citas primero; si no, hasta 3 resultados de los `web_search_tool_result` con lista (el error,
  objeto, se salta), con las mismas reglas gracias a `_enlace()` (bien sacado: así no se separan). `Fuentes.tipo` con
  valor por defecto.
- `app.py`: `kind` solo con `consultadas`; sin evento vacío; docstring al día.
- Clientes: `consultadas` se vacía al preguntar, va a `hold` y cambia solo el rótulo.
- `cmp` de las cuatro normativas de la fase: idénticas. pytest 145 passed / 8 skipped, ruff limpio, escritorio 105/105 y
  `check`, web sin fallos (comprobado por mí).
- Captura `06`: aceptada la forma (reescribir solo el evento en el script de captura, sin tocar el servidor).

Queda el despliegue (Josem, `deploy/PASOS-CON-SUDO.md` §6) y K1-K6.

## Para el programador

Responde a: 6b600b8. R1 aprobado y H1 cerrado. Nada más que hacer en esta fase salvo lo que salga de K1-K6.

## 7. Hallazgo en el despliegue: respuesta a medias tras buscar (R2, 2026-11-20)

Responde a: 6b6dc94 (sin informe nuevo: lo trae Josem de K1-K6)

**Lo que vio Josem:** «Gijón, por curiosidad…» → «Consulto los grimorios, mortal.» y debajo
`consultado: tiempo.com · weather.com · weather.com`. Ni rastro del tiempo.

**Diagnóstico (mío, contra el log de producción, sin gasto):** la línea de ese turno dice `1 búsquedas … 22626 entrada / 1171
salida`, con `KLOTHULHU_MAX_TOKENS=1024`. Tras ~13 000 tokens de resultados, el pensamiento y el texto no caben en 1024: casi
seguro paró por `max_tokens` justo después del aviso. No se puede confirmar porque el log no dice el motivo de parada (solo
avisa de `refusal` y `pause_turn`, y no hubo aviso): el fallo de diseño es mío, el plan no subió el tope al añadir la
herramienta. Y `weather.com` dos veces: dos URLs distintas del mismo dominio, que el cliente rotula igual.

### R2 (D62)

1. **`app.py`:** `MAX_TOKENS_BUSQUEDA = int(os.getenv("KLOTHULHU_MAX_TOKENS_BUSQUEDA", "3072"))`. `_model_stream` usa ese
   tope cuando lleva `tools`; sin cuota, `MAX_TOKENS` como ahora. `max_tokens` no está en el prefijo: la caché no cambia.
2. **Parada a medias:** con `stop_reason` `max_tokens` o `pause_turn`, `_model_stream` cede `buscaweb.CORTADA` (texto con
   etiqueta de emoción delante, p. ej. `" [confused] Los grimorios me han dejado sin aliento, mortal: pregúntamelo otra vez."`;
   el texto exacto es tuyo, que suene a klothulhu) como último texto, antes de `Fuentes`. Va al historial como el resto del
   texto. El aviso de `pause_turn` que ya hay se queda.
3. **Log:** la línea `narrador:` añade el motivo de parada (`stop=end_turn`, `stop=max_tokens`…). Sigue sin consultas ni URLs
   (D59).
4. **`buscaweb._consultadas`:** una por dominio (con `_dominio`, el mismo `www.` fuera). Las citadas no cambian (S5).
5. **Normativa:** copia tal cual `docs/fase11/normativas/test_fase11_r2.py` a `tests/test_fase11_r2.py` (R6-R8; ahora fallan
   las tres por lo que deben). Las de antes, en verde.
6. **`deploy/PASOS-CON-SUDO.md` §6:** una línea para quien quiera fijarlo a mano en `/etc/klothulhu/klothulhu.env`; si no
   está, vale el defecto.

**A2 (lo decide Josem):** repetir en el servidor de pruebas la pregunta de Gijón (≈ $0,02) para ver `stop=end_turn` y la
respuesta entera. No lo hagas hasta que él diga «sí» en tu ventana.

## Para el programador

Responde a: 6b6dc94. R2 de §7 (D62), con la normativa nueva y las de siempre en verde. Anexo 3 al informe y para. A2 solo
con el «sí» de Josem en tu ventana.

## 8. Revisión de R2 (2026-11-20)

Responde a: 629489e (anexo 3 del informe)

**R2 aprobado.** Revisado contra `5f768d7`:

- `app.py`: `tope` sube a `MAX_TOKENS_BUSQUEDA` solo con `tools`; `stop=` en la línea de log, sin consultas ni URLs (D59);
  `CORTADA` antes de `Fuentes`, solo con `max_tokens` o `pause_turn`.
- `buscaweb._consultadas`: una por dominio, comprobado sobre el enlace ya validado. `fuentes()` intacta.
- `cmp` de las cinco normativas de la fase: idénticas. pytest 149 passed / 8 skipped y ruff limpio (comprobado por mí).
- El caso nuevo de `test_fase11_sdk.py` (SDK real, `max_tokens` real → `CORTADA`) cierra lo que las normativas solo
  simulaban. Bien.

Queda A2 (sí o no de Josem) y desplegar R2: merge, reinicio de `klothulhu-api`. Konnos no cambia.

## Para el programador

Responde a: 629489e. R2 aprobado. Si Josem dice «sí» a A2 en tu ventana: la pregunta de Gijón (con el «Magán» de antes en el
historial, si es fácil; si no, sola) contra el servidor de pruebas, anexo 4 con el texto, la línea de log (`stop=`) y el coste,
y para.
