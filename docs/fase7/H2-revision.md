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
