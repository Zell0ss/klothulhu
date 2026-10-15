Responde a: 6b25955 (H1-informe)

# Fase 2 · H1 — revisión del arquitecto

**Veredicto: aprobado.** Revisado contra el código de `fase2` (`5bd1ed6`), no contra el informe.

## 1. Lo comprobado

- `tests/test_fase2.py` y `desktop/test/fase2.test.js` son **idénticos** a los bloques del plan (diff vacío);
  `tests/fixtures/` sin tocar desde `fd869fb`.
- En el worktree: `pytest -q tests` da 21 pasan, `ruff check .` está limpio, `npm test` da 17 pasan. Python 3.12.14.
  `requirements.txt` fija solo lo del servidor y `requirements-dev.txt` incluye el resto.
- El SDK fijado (`anthropic==1.15.0`) acepta `output_config` en `messages.create` y en `messages.stream`.
  Lo he comprobado con la firma; las pruebas no lo cubren porque usan clientes simulados.
- `director.py`:
  - El esquema cumple las restricciones de *structured outputs* (sin límites numéricos ni de longitud).
  - `build_scene` sigue las reglas del plan.
  - `direct` lee los bloques por `type`, nunca lanza y registra el uso con `getattr`.
  - El prompt sale de `director_prompt.md` con los huecos rellenados desde el vocabulario.
- `app.py`:
  - Reconstruye el texto y las marcas igual que el cliente.
  - Si el director falla, las escenas salen `null` y no hay evento `error` (`_staged`).
  - La normalización a `len(bs)` está bien.
  - `/health` muestra el director.
  - El narrador usa `effort` y avisa si hay `refusal`.
- El cliente de la fase 1 ignora `scene`: su `onEvent` es una cadena de `if` sin rama por defecto.

## 2. Desviaciones del informe

1. `ruff.toml` con `src` y `target-version = "py312"`: **aprobado**.
2. `per-file-ignores` (E501, B905) solo para `tests/test_fase2.py`: **aprobado**. Es lo correcto para un fichero
   que no se edita.
3. Historial antes de las escenas: **aprobado, y es mejor que lo que pedía el plan**. Si el cliente se va mientras el
   director piensa, el turno ya está guardado. Corrijo el plan en esto.
4. `fake_direct` rotando tres puestas en escena: **aprobado**.

## 3. Hallazgos

| # | Hallazgo | Atribución |
|---|---|---|
| 3.1 | Peor caso de espera del director: `timeout=10` con `max_retries=1` puede llegar a ~20 s antes de que salgan las escenas en `null`, y el `done` espera a esas escenas. El cliente no lo corta (solo vigila el primer evento), pero son 20 s con la escena de «pensando». H2 mide si pasa de verdad; si pasa, se baja el timeout o se quita el reintento | **arquitecto** (plan) |
| 3.2 | El prompt del director tiene ~500-600 tokens, no «≥1K» como estimé en §1. Puede quedar por debajo del mínimo de caché (512). No es un fallo: si no cachea, cuesta unas décimas de céntimo más por cada 100 mensajes. H2 lo ve en `cache_read_input_tokens` | **arquitecto** (plan) |
| 3.3 | El mismo candado (`_locks[cid]`) cubre ahora también la espera del director: un segundo mensaje del mismo cliente en esos segundos recibe 409. El cliente de la fase 1 no deja preguntar hasta `done`, así que no se nota | observación |

## Para el programador

Responde a: 6b25955 (H1-informe)

**H1 aprobado. Adelante con H2** (plan §4), con lo que ya dice el plan y tres cosas más:

1. **Credenciales:** si no hay `ant auth status` con perfil activo ni `ANTHROPIC_API_KEY`, **para** antes de gastar
   nada y deja dicho en el anexo que el script lo tiene que lanzar Josem, con la orden exacta.
2. **En `api_smoke.json` y en el informe**, además de lo que pide el plan:
   - latencia del director: mediana y **máxima** (3.1);
   - `cache_read_input_tokens` del director a partir de la segunda pregunta (3.2);
   - el número de golpes por respuesta (para el indicador de D13).
3. **Tope:** el script corta a $0.50 acumulados. Si algo falla a mitad, **no** lo relances entero sin
   decirlo en el anexo: cada vuelta gasta.

Para al acabar H2, con el anexo (o `H2-informe.md`), la galería y el JSON con commit.
