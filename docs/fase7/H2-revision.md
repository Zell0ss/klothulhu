Responde a: e5fcb86 (H2-informe, parada 1)

# H2 · Revisión de la parada 1 (2026-10-20)

## 1. Comprobado contra el código

- `pytest -q tests`: 92 pasan y 8 se saltan (lo he lanzado yo). `ruff` limpio. Las dos normativas
  (H1 y H2) son idénticas a las de `docs/fase7/normativas/` (`cmp`).
- **`busqueda.py`** cumple el §2.3:
  - pone el contexto a `[]` si era `None`, mira el freno antes del embedding y antes de cada juez,
    y consulta `3 + len(contexto)`;
  - los candidatos llevan el mensaje y la hora; un juez caído deja `pertinente = None`;
  - el F1 va al log solo con ids.
- **`app._preparar_memoria`:**
  - crea la tarea de búsqueda **antes** de calcular `_system()` sin ceder el control: el mensaje N
    nunca ve lo que su propia búsqueda trae. Es lo que pide D36;
  - al parar, cancela las búsquedas y las espera 2 s.
- **`cierre._repasar`:**
  - filtra `usados` y `fallos` como pide el §2.5;
  - cada etapa (repaso, eventos, poda) falla por separado, y la sesión vacía no llama a nadie.
- **`escritor.repasar`:** traduce los ids cortos, y la regresión lo prueba.
- **`registro`:** quita el manejador 0 de loguru de forma idempotente.
- **Desviaciones del informe, aceptadas:**
  - el juez sin pensamiento, como el director (D20); T8 dirá si acierta igual;
  - `dia_semana()` en un solo sitio;
  - eventos y poda también sin repaso;
  - `consultar()` tolera puntos huérfanos;
  - `_system()` también con FAKE.
- **`juez_prompt.md` y `repaso_prompt.md`: aprobados.** El «ante la duda, no» de los dos es lo que
  queremos: el juez da la precisión (D44) y el repaso no infla los fallos.

## 2. Hallazgos

1. **`memoria_prompt.md`: «Si el mortal te pregunta por algo que no aparece aquí, reconoce que no lo
   recuerdas».** La idea es buena: es honesto, y sin ella klothulhu inventaría para quedar bien, que
   sería un F5 disfrazado. Pero tal como está escrita puede hacerle negar lo que se dijo **en esta
   misma charla**: eso está en el historial, no en el bloque. Y también algo que no es memoria, como
   una pregunta de cultura («¿te acuerdas de quién era Lovecraft?»). Atribución: de implementación,
   y es una frase añadida por el programador. → R1.
2. **`_system()` puede romper la respuesta.** Si la lectura de MariaDB falla al abrir la sesión,
   `sesion.dia` se queda en `None` y `contexto = []`. Si después la búsqueda trae un recuerdo (Qdrant
   y MariaDB ya responden), en el mensaje siguiente `bloque(contexto, None, …)` hace
   `None − creado_dia` y lanza `TypeError` dentro del `try` de `_reply`. El mortal recibe
   `upstream_error`. Por la memoria, que nunca debía tumbar una respuesta. Atribución: **hueco del
   encargo**, que no decía qué hacer con `dia = None`. → R2.

## 3. Veredicto

**Aprobado con retoques (R1, R2).** T8 queda a la espera de que Josem lo autorice. Lo anotaré en el
frontmatter de `H2-encargo.md`.

## Para el programador

Responde a: e5fcb86 (H2-informe, parada 1)

Parada 1 aprobada con dos retoques, un commit cada uno:

- **R1 · `memoria_prompt.md`.** Acota la última frase a las charlas anteriores. Por ejemplo: «Si el
  mortal te pregunta por algo de otra charla que no está ni aquí ni en esta conversación, reconoce
  que no lo recuerdas; no lo inventes». El resto del texto se queda.
- **R2 · La memoria nunca tumba la respuesta.**
  - `bloque()` acepta `dia_actual=None`, y en ese caso no pone la antigüedad (el resto igual).
  - Además, en `_reply`, si `_system()` lanza por cualquier otra cosa, se usa `SYSTEM_PROMPT` y
    queda un `warning` con el tipo.
  - Regresiones:
    - `bloque(ctx, None, hoy)` no lanza y lleva los textos;
    - con un `_system` que lanza (por `monkeypatch`), `_reply` responde sin `error`.
- **Puedes preparar T8**, como hiciste en H1: `tests/fixtures/calibracion.json` y
  `scripts/memoria_calibrar.py` según el §3 del encargo, **sin ejecutarlo contra las API**.
  - En el fixture: 12 recuerdos, unos 30 mensajes, paráfrasis y temas vecinos no pertinentes, y
    nada copiado de los recuerdos de producción.
  - El script, además de lo del encargo, guarda para cada pareja el veredicto del juez junto a la
    etiqueta, para que pueda ver los fallos uno a uno.

Para después de R1, R2 y la preparación de T8, con un anexo corto en `H2-informe.md`. T8 lo lanzará
Josem cuando lo anote.

## 4. Revisión de los retoques R1-R2 y de la preparación de T8 (2026-10-20)

Responde a: d936aa4 (H2-informe, «Anexo — Parada 1, retoques R1-R2 y T8 preparado»)

- `pytest -q tests`: 98 pasan y 8 se saltan; `ruff` limpio. Lo he lanzado yo.
- **R1:** la frase queda acotada a otras charlas, con «no lo inventes». Bien.
- **R2:** `bloque()` sin día no pone la antigüedad, y `_system()` está protegido en `_reply`, con las
  dos regresiones. Bien.
- **T8 preparado:**
  - `memoria_calibrar.py` usa las funciones reales de `escritor` (`embeber`, `juzgar`, `repasar`),
    no copias;
  - no toca la BD;
  - corta en $0,05;
  - sale sin gastar si faltan las claves.

  El fixture tiene paráfrasis y temas vecinos sin pertinencia, que es lo que hace falta para medir.

**Parada 1 cerrada.** T8 espera la autorización de Josem, que anotaré en el frontmatter de `H2-encargo.md`.

## Para el programador

Responde a: d936aa4 (H2-informe, «Anexo — Parada 1, retoques R1-R2 y T8 preparado»)

Retoques y preparación aprobados. No hay nada que cambiar. **No lances T8:** lo lanza Josem cuando
lo anote. Después harás el anexo de la parada 2 con `capturas/calibracion.json`.

## 5. Revisión de la parada 2: calibración (2026-10-20)

Responde a: ca19dd3 (H2-informe, «Anexo — Parada 2, calibración (T8)»)

### Comprobado contra `capturas/calibracion.json`

He recontado las 384 parejas yo mismo:

| Umbral | Pertinentes que pasan | No pertinentes que pasan |
|---|---|---|
| 0,30 | 23 / 24 | 37 |
| **0,34** | **23 / 24** | **15** |
| 0,35 | 22 / 24 | 11 |
| 0,40 | 18 / 24 | 3 |
| 0,45 | 11 / 24 | 2 |

Coincide con el informe, salvo un redondeo en 0,359 (10 frente a 11). La captura no lleva claves.

- **Gasto:** $0,0024 (Haiku $0,00237 y OpenAI $0,000013), con tope de $0,05. Autorizado y lanzado
  por Josem (188c2dc).
- **El 0,45 provisional era un error mío:** dejaba fuera más de la mitad de lo pertinente. Las
  similitudes de `text-embedding-3-small` entre un mensaje corto y un recuerdo caen bajas
  (mediana de lo pertinente, 0,44).

### Decisión: `UMBRAL = 0.34`

Es más bajo que el 0,359 que sale del criterio del encargo, a propósito:
- recoge también la pareja «Cuéntame algo de ti» con la vergüenza de klothulhu (0,344). Es justo
  el tipo de recuerdo propio que queremos que salga;
- el precio son 4 parejas más para el juez, a $0,00008 cada una;
- D44 dice que el umbral debe cubrir de más y que el juez filtra.

**El juez cumple su papel**, y el indicador de falsación de D44 en la calibración no se dispara:
- con el umbral solo, 22 aciertos y 10 falsos positivos (precisión 0,69);
- con el juez, 21 y 3 (precisión 0,88), a cambio de un falso negativo ambiguo («clase» sin decir
  de qué).

### Hallazgos, sin retoque

1. **El juez es algo generoso con temas vecinos** (cansancio y sueño: 2 falsos positivos). Que
   entre un recuerdo de más en el contexto cuesta poco: el narrador tiene la orden de usarlo solo si
   viene a cuento, y si lo fuerza, el repaso lo marca como F5. Se mira en H3 (F5 y «pertinentes no
   usados»). Atribución: comportamiento del modelo.
2. **El repaso B cuenta como usado un recuerdo que solo apareció tras el reproche, y no anota F3.**
   Es una lectura defendible: lo usó, aunque tarde, y el F4 sí lo cazó. No se cambia el prompt.
3. **Latencia:** el juez tarda 0,9 s en la mediana y 2,2 s en el p95; el embedding, 0,15 s y 0,3 s.
   Como todo va en paralelo (D36), lo que trae la búsqueda llega a tiempo para el mensaje siguiente,
   salvo que el mortal escriba en menos de 2,5 s. Es lo que preguntaba el borrador (100-300 ms para
   el embedding): medido.

### Veredicto

**H2 aprobado, con un último retoque (R3).** Después, despliegue de Josem (encargo §5) y su prueba
R1-R3.

## Para el programador

Responde a: ca19dd3 (H2-informe, «Anexo — Parada 2, calibración (T8)»)

- **R3 · `memoria.UMBRAL = 0.34`.** El comentario lleva la fuente: «calibrado en T8,
  H2-revision §5; D44». Si hay alguna prueba no normativa que dependa del 0,45, la ajustas. Las
  normativas no lo usan.

Un commit y para. No hace falta anexo: la línea del commit basta, y la revisaré en el diff. El
despliegue es de Josem.

## 6. Retoques de fechas (D47, 2026-10-20)

Responde a: ca19dd3 (H2-informe, parada 2) y 8e97de8 (R3, umbral a 0,34; lo he visto en el diff: correcto)

H2 está desplegado. Revisando los recuerdos de producción, Josem ha visto uno que dice «Mañana toca
cambiar la clase de pilates»: a los pocos días, «mañana» ya no significa nada. Ha decidido **D47**
(ficha § Decisiones), y va antes de la semana de uso (H3).

**Normativa cambiada por D47:** N8 en `docs/fase7/normativas/test_fase7_h2.py`. Con sesión y sin
recuerdos, el `system` lleva la cabecera de fecha. Vuelve a copiarla a `tests/`. Las demás no cambian.

## Para el programador

Responde a: ca19dd3 (H2-informe, parada 2) y 8e97de8 (R3)

Tres retoques, un commit cada uno, y una normativa nueva que copiar (N8).

- **R4 · El escritor no usa fechas relativas** (D47.1). En `escritor_prompt.md`, en la regla de la
  fecha: el **texto** del recuerdo nunca dice «hoy», «mañana», «ayer», «esta semana» ni un día de la
  semana suelto. Dice el día: «el martes 21 de octubre». El campo `fecha` sigue igual. Los recuerdos
  ya guardados no se tocan.
- **R5 · Cada recuerdo, con su fecha de escritura** (D47.2).
  - En `bloque()`, cada línea lleva `(escrito el <día de la semana> AAAA-MM-DD)`, sacado de `creado`,
    en lugar de la antigüedad en días de uso.
  - Si el recuerdo no trae `creado`, no se pone nada.
  - `AlmacenEnMemoria.guardar` guarda `creado`, como el real.
  - `consultar()` también lo devuelve (el real ya lo hace).
  - `dia_actual` sigue en la firma; la fuerza no cambia.
  - Regresión: un recuerdo creado el 2026-10-19 sale con «escrito el lunes 2026-10-19».
- **R6 · La fecha de hoy, siempre** (D47.3, N8).
  - `memoria.cabecera(hoy) -> "Hoy es <día> AAAA-MM-DD."`, y `bloque()` la usa en su primera línea:
    una sola fuente.
  - `_system(sesion)`:
    - con `None`, `SYSTEM_PROMPT`;
    - con sesión y sin recuerdos, `[prompt, cabecera(sesion.inicio.date())]`;
    - con recuerdos, como ahora.
  - Hoy es siempre el día de inicio de la sesión, sin hora.

Para con un anexo corto en `H2-informe.md`, con las pruebas que pasan y el `system` de una pasada
FAKE sin recuerdos y con recuerdos (los dos bloques, con un log local que no se sube). El
despliegue es de Josem: merge y reinicio, sin `crear`.

## 7. Revisión de los retoques de fechas R4-R6 (2026-10-20)

Responde a: 13bcfa5 (H2-informe, «Anexo — Retoques de fechas R4-R6 (D47)»)

- `pytest -q tests`: 102 pasan y 8 se saltan (lo he lanzado yo). `ruff` limpio. Las normativas de H1 y
  H2 (con la N8 nueva) son idénticas a `docs/fase7/normativas/`.
- **R4:** la regla está bien puesta: prohíbe las fechas relativas en el **texto** y deja la
  resolución de «mañana» para el campo `fecha`, que es lo que pide D47.1.
- **R5:** `_escrito()` sale de `creado` y tolera `datetime`, `date` y texto. Sin `creado`, no pone
  nada. La fuerza no cambia.
- **R6:** `cabecera()` es la única fuente, y `_system()` hace lo que fija la N8 nueva.
- El `system` de la pasada FAKE es lo que queríamos. Con recuerdos, cada línea dice cuándo se
  escribió y sobre qué día.

**Aprobado.** H2 queda cerrado en código. Falta el despliegue de Josem (merge y reinicio, sin
`crear`) y su prueba en producción. Después empieza H3.

## Para el programador

Responde a: 13bcfa5 (H2-informe, «Anexo — Retoques de fechas R4-R6 (D47)»)

Aprobado; no hay nada que cambiar. Para aquí. H3 (la semana de uso) llegará como encargo cuando
haya datos. Actualiza `tomorrow.md` con ese punto de parada.
