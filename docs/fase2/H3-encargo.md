Responde a: 689753b (H2-informe, anexo)

# Fase 2 · H3 — encargo: corte equilibrado, director en streaming y fondos variados

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-15. Decisiones: D18 y D19 (nuevas) y D16
> (ya vigente). Ver `30-projects/klothulhu/ficha.md` § Decisiones.

## 0. Por qué

H2 midió tres cosas:
- Golpes sueltos de 1-3 palabras: el narrador escribe frases largas y el corte las deja colgando.
- El director tarda 3,3 s de mediana y manda todas las escenas al final.
- El director usa solo 3 de los 7 fondos.

Josem eligió las soluciones: D18 y D19.

**Contrato:** no cambia. Siguen los mismos eventos en el mismo orden (D13). Solo cambia *cuándo* sale
cada `scene`: en cuanto está lista.

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe?** Cambian dos ficheros normativos (`tests/fixtures/beats_cases.json` y
  `tests/test_fase2.py`). El primero ya va con commit en este encargo; el segundo lo copias tal cual (§R5).
  Nada más.
- **¿API externa?** Sí, en R6 ([API]):
  - `thinking: {"type": "disabled"}` lo admite Claude Haiku 5.5 con esfuerzo `low`, `medium` o `high`, y da 400 con
    `xhigh` o `max`. Fuente: skill `claude-api`, «Migrating to Claude Haiku 5.5».
  - *Structured outputs* funciona en streaming (misma fuente).
  - Gasto previsto: ~$0.015 (dos pasadas de 13 preguntas). Llevamos $0.0067 del tope de $1, ya autorizado.
    Hace falta que Josem lance el script, como en H2.
- **¿Producción?** No. Todo en el worktree.

## R1 · Corte equilibrado (D18), en `server/beats.py` **y** `desktop/renderer/scenes.js`

Sustituye el partido de frases largas (`splitLong`/`_split_long`) por este, **idéntico en los dos lados**:

```text
mientras len(s) > 70:
    k      = ceil(len(s) / 70)                 # trozos que hacen falta
    target = len(s) / k                        # longitud objetivo del trozo (número real)
    huecos = posiciones i de s con s[i] == ' ', 1 <= i <= 70,
             y len(s) - (i + 1) <= 70 * (k - 1)    # lo que queda cabe en k-1 trozos
    si no hay huecos:  trozo = s[:70]; s = s[70:]; seguir      # palabra de más de 70: corte duro, como antes
    clausulas = huecos i con s[i-1] en ",;:" y |i - target| <= 15
    i = el de (clausulas si hay alguna, si no huecos) con |i - target| mínimo; empate → el primero
    trozo = s[:i]; s = s[i+1:]
el resto de s, si no está vacío, es el último trozo
```

Todo lo demás de `beats()` queda igual: partido en frases, empaquetado de frases cortas y tramos por
emoción. Cita D18 en los dos sitios. Los casos de `tests/fixtures/beats_cases.json` (17, cinco nuevos sacados de
respuestas reales de H2) los pasan las dos implementaciones de referencia del arquitecto. N1 y F2 los
comprueban. Si alguna prueba tuya de `scenes.extra.test.js` contaba con el corte antiguo, actualízala: es tuya.

## R2 · Director en streaming (D19), en `server/director.py`

- **`direct(question, beats, *, client, vocab, model, effort, timeout, thinking)`** pasa a ser un **generador
  asíncrono**:
  - Suelta **exactamente** `len(beats)` elementos (escena o `None`), en orden, en cuanto cada uno está listo.
  - **Nunca lanza.**
- **Llamada:** `client.with_options(timeout=timeout, max_retries=1).messages.stream(**kwargs)`, con los mismos
  argumentos que hoy usa `create`. Si `thinking` es falso, añade `thinking={"type": "disabled"}`; si es
  verdadero, no se manda la clave `thinking`.
- **Troceo del JSON en streaming:** recorre `stream.text_stream` carácter a carácter, siguiendo:
  - la profundidad de `{`/`[`;
  - si está dentro de una cadena JSON y si el carácter anterior era un escape `\`. Las llaves dentro de cadenas
    no cuentan: N12 lo prueba con `'a}b"c{d'`.

  Cada objeto que se abre y se cierra a profundidad 3 (dentro de `scenes`) se pasa a `json.loads` y después a
  `build_scene` con el caption del golpe que toca. Si `json.loads` falla, ese golpe es `None`.
- **Final:** `await stream.get_final_message()` para el registro (`usage`, `stop_reason`).
  - Si `stop_reason` no es `end_turn`, un `log.warning`. Las escenas que ya salieron **se quedan**.
  - Los golpes que falten salen `None` al final, también si hay excepción, `refusal`, `max_tokens` o tiempo
    agotado.
- **Plazo total:** `asyncio.timeout(timeout)` alrededor de todo el stream (Python 3.12). Al vencer, lo que falte
  sale `None`.
- **Registro** (`log.info`, uno por llamada):
  - modelo y si había pensamiento;
  - ms hasta la primera escena y ms totales;
  - tokens (`input`, `output`, `cache_read`);
  - número de `None`.
- **`fake_direct(question, beats)`** también pasa a ser un generador asíncrono, con las mismas escenas que hoy.

## R3 · `server/app.py`

- `_director(question, bs)` es ahora un **iterable asíncrono**:
  - Con `FAKE`, delega en `fake_direct`.
  - Si no, en `direct(..., thinking=DIRECTOR_THINKING)`.
- Ajuste nuevo `KLOTHULHU_DIRECTOR_THINKING`, por defecto `"1"` (como hoy). Vale `"1"` (con pensamiento) o `"0"`
  (sin). Añádelo a `klothulhu.env.example`. El valor por defecto se decide con R6.
- **`_reply`** recorre `_director(...)` y manda cada `scene` **en cuanto llega**, con su `index`:
  - Si sobran, se ignoran.
  - Si el iterador lanza (a la primera o a mitad), lo que falte sale `null`, con `log.warning` y sin evento
    `error`.
  - Después de la última, `done`. El historial sigue guardándose antes de las escenas (H1-revision §2.3).
  - Con el director apagado o sin golpes, como ahora.

## R4 · Prompts

- **`server/director_prompt.md`:** usa toda la gama de fondos. Sustituye «slightly ominous» y la lista de fondos
  por una guía de significados, por ejemplo:
  - `forest`: naturaleza, calma, crecer;
  - `city`: gente, trabajo, tecnología cotidiana;
  - `desert`: vacío, espera, aburrimiento;
  - `volcano`: enfado, peligro, errores;
  - `lab`: código, ciencia, experimentos;
  - `space`: el cosmos, el tiempo, lo inmenso;
  - `night`: sueño, misterio, lo primigenio.

  Añade una frase: «Use the whole range of backdrops; night and space are not the default». El tono
  inquietante va en las metáforas y en los objetos, no en elegir siempre la noche. N3 sigue exigiendo que
  aparezcan todos los nombres.
- **`server/prompt.md`** (narrador), un retoque mínimo en la regla de 70: «If a sentence would run longer, end it
  and start a new one; don't chain clauses with commas». No toques la voz: Josem la ha aprobado (D16).

## R5 · Pruebas normativas (versión 2)

Sustituye `tests/test_fase2.py` **entero** por el bloque de abajo, tal cual. Es la versión que vale desde ahora;
la del `PLAN.md` queda superada.

Qué cambia:
- `_run` usa un director falso que va soltando escenas.
- N11, N12 y N13 consumen generadores.
- N12 prueba el JSON a trozos y `thinking`.
- N13 prueba fallos a mitad del director.
- N14 prueba el fallo a mitad dentro de `_reply`.

`desktop/test/fase2.test.js` y `fase1.test.js` no cambian. He comprobado que las P1-P3 de la fase 1 siguen
cumpliéndose con el corte nuevo.

```python
"""Pruebas normativas de la fase 2, versión 2 (H3-encargo: D13, D16, D18, D19). No editar: añadir en otro fichero."""
import asyncio
import json
import os
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase2test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import director  # noqa: E402
from beats import CAPTION_MAX, beats  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
VOCAB = director.load_vocab()
REPLY = "[confused] No tengo reloj, mortal, solo eternidad. [smug] Pero Tokio va siete horas por delante."
BEATS = [("No tengo reloj, mortal, solo eternidad.", "confused"), ("Pero Tokio va siete horas por delante.", "smug")]


def _cases(name):
    return json.loads((FIX / name).read_text(encoding="utf-8"))["cases"]


def _events(chunks):
    out = []
    for block in "".join(chunks).split("\n\n"):
        if not block.strip():
            continue
        event = data = None
        for line in block.split("\n"):
            if line.startswith("event: "):
                event = line[len("event: "):]
            elif line.startswith("data: "):
                data = json.loads(line[len("data: "):])
        out.append((event, data))
    return out


def _run(monkeypatch, reply, directed, cid="fase2"):
    """`directed(bs)` devuelve una lista o un generador de escenas (o lanza): el director falso las va soltando."""

    async def fake_stream():
        for i in range(0, len(reply), 3):
            yield reply[i : i + 3]

    seen = {}

    async def fake_director(question, bs):
        seen["question"], seen["beats"] = question, [tuple(b) for b in bs]
        for scene in directed(bs):
            yield scene

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué hora es?", asyncio.Lock())]

    return _events(asyncio.run(collect())), seen


def _scene_for(bs):
    staging = _cases("director_cases.json")[0]["staging"]
    return [director.build_scene(staging, caption, VOCAB) for caption, _ in bs]


def _collect(agen):
    async def run():
        return [x async for x in agen]

    return asyncio.run(run())


# N1 — el troceo del servidor es el del cliente (casos con el corte equilibrado, D18)
def test_n1_beats_casos_compartidos():
    assert CAPTION_MAX == 70
    for c in _cases("beats_cases.json"):
        got = beats(c["text"], [tuple(m) for m in c["marks"]])
        assert [list(b) for b in got] == c["beats"], c["name"]


# N2 — build_scene acota, recorta y rechaza lo que no está en el vocabulario
def test_n2_build_scene_casos():
    for c in _cases("director_cases.json"):
        assert director.build_scene(c["staging"], c["caption"], VOCAB) == c["scene"], c["name"]


# N3 — esquema y prompt salen del vocabulario; el esquema cumple structured outputs
def test_n3_esquema_y_prompt_desde_vocab():
    s = director.output_schema(VOCAB)
    item = s["properties"]["scenes"]["items"]
    assert item["properties"]["backdrop"]["enum"] == list(VOCAB["backdrops"])
    assert item["properties"]["hero"]["properties"]["action"]["enum"] == list(VOCAB["actions"])
    assert item["properties"]["tone"]["enum"] == list(VOCAB["tones"])
    assert item["properties"]["props"]["items"]["properties"]["sprite"]["enum"] == list(VOCAB["sprites"])

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "object":
                assert node.get("additionalProperties") is False, node
                assert set(node["required"]) == set(node["properties"]), node
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(s)
    text = json.dumps(s)
    for banned in ("minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"):
        assert banned not in text, banned
    prompt = director.system_prompt(VOCAB)
    for name in [*VOCAB["backdrops"], *VOCAB["actions"], *VOCAB["particles"], *VOCAB["sprites"]]:
        assert name in prompt, name


# N4 — contrato SSE: texto, después una escena por golpe, después done
def test_n4_contrato_sse(monkeypatch):
    evs, seen = _run(monkeypatch, REPLY, _scene_for, cid="n4")
    kinds = [k for k, _ in evs]
    assert kinds[0] == "emotion" and kinds[-1] == "done"
    first = kinds.index("scene")
    assert set(kinds[first:-1]) == {"scene"}
    assert seen["question"] == "¿Qué hora es?"
    assert seen["beats"] == BEATS
    scenes = [d for k, d in evs if k == "scene"]
    assert [s["index"] for s in scenes] == [0, 1]
    assert all(s["total"] == 2 for s in scenes)
    assert [(s["caption"], s["emotion"]) for s in scenes] == BEATS
    assert all(s["scene"]["caption"] == s["caption"] for s in scenes)
    text = "".join(d["text"] for k, d in evs if k == "delta")
    assert text == "No tengo reloj, mortal, solo eternidad. Pero Tokio va siete horas por delante."


# N5 — si el director falla, la respuesta sigue: escenas null, sin error
def test_n5_director_falla_no_rompe(monkeypatch):
    def boom(bs):
        raise RuntimeError("director caído")

    evs, _ = _run(monkeypatch, REPLY, boom, cid="n5")
    kinds = [k for k, _ in evs]
    assert "error" not in kinds and kinds[-1] == "done"
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and all(s["scene"] is None for s in scenes)


# N6 — escenas de menos o de más se ajustan al número de golpes
def test_n6_numero_de_escenas(monkeypatch):
    evs, _ = _run(monkeypatch, REPLY, lambda bs: _scene_for(bs)[:1], cid="n6a")
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and scenes[0]["scene"] is not None and scenes[1]["scene"] is None
    evs, _ = _run(monkeypatch, REPLY, lambda bs: _scene_for(bs) * 2, cid="n6b")
    assert len([d for k, d in evs if k == "scene"]) == 2


# N7 — el historial guarda el texto del narrador, nunca las escenas
def test_n7_historial(monkeypatch):
    _run(monkeypatch, REPLY, _scene_for, cid="n7")
    msgs = app.history.messages("n7")
    assert msgs[-1]["content"] == REPLY
    assert "scene" not in json.dumps(msgs)


# N8 — director apagado: escenas null y no se le llama
def test_n8_director_apagado(monkeypatch):
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    evs, seen = _run(monkeypatch, REPLY, _scene_for, cid="n8")
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and all(s["scene"] is None for s in scenes)
    assert "beats" not in seen


# N9 — respuesta vacía: ni escenas ni director, pero done
def test_n9_respuesta_vacia(monkeypatch):
    evs, seen = _run(monkeypatch, "", _scene_for, cid="n9")
    kinds = [k for k, _ in evs]
    assert "scene" not in kinds and kinds[-1] == "done"
    assert "beats" not in seen


# N10 — /health anuncia el director
def test_n10_health():
    h = asyncio.run(app.health())
    assert set(h["director"]) == {"enabled", "model"}


# N11 — el director falso da escenas válidas, una por golpe
def test_n11_fake_direct():
    out = _collect(director.fake_direct("q", BEATS))
    assert len(out) == 2
    for scene, (caption, _) in zip(out, BEATS):
        assert scene["caption"] == caption
        assert scene["backdrop"] in VOCAB["backdrops"]
        assert scene["hero"]["action"] in VOCAB["actions"]


class _Stream:
    def __init__(self, chunks, stop="end_turn", fail_after=None):
        self.chunks, self.stop, self.fail_after = chunks, stop, fail_after

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    @property
    def text_stream(self):
        async def gen():
            for i, chunk in enumerate(self.chunks):
                if self.fail_after is not None and i == self.fail_after:
                    raise RuntimeError("se cortó el stream")
                yield chunk

        return gen()

    async def get_final_message(self):
        return SimpleNamespace(stop_reason=self.stop, usage=SimpleNamespace(input_tokens=10, output_tokens=5))


class _Messages:
    def __init__(self, stream=None, exc=None):
        self._stream, self.exc, self.kwargs = stream, exc, None

    def stream(self, **kwargs):
        self.kwargs = kwargs
        if self.exc:
            raise self.exc
        return self._stream


class _Client:
    def __init__(self, messages):
        self.messages = messages
        self.options = None

    def with_options(self, **kwargs):
        self.options = kwargs
        return self


def _stagings():
    s0, s1 = (json.loads(json.dumps(c["staging"])) for c in _cases("director_cases.json")[:2])
    s0["props"][0]["label"] = 'a}b"c{d'  # llaves y comillas dentro de una cadena: el troceo del JSON no debe confundirse
    return [s0, s1]


def _direct(client, bs, thinking=False):
    return _collect(
        director.direct(
            "¿Qué hora es?", bs, client=client, vocab=VOCAB, model="claude-haiku-5-5",
            effort="low", timeout=10, thinking=thinking,
        )
    )


THREE = [*BEATS, ("Y nada más.", "neutral")]


# N12 — direct en streaming: la llamada, el JSON a trozos y una escena por golpe
def test_n12_direct_stream():
    stagings = _stagings()
    payload = json.dumps({"scenes": stagings})
    chunks = [payload[i : i + 7] for i in range(0, len(payload), 7)]
    msgs = _Messages(_Stream(chunks))
    client = _Client(msgs)
    out = _direct(client, THREE)
    assert out == [director.build_scene(s, c, VOCAB) for s, (c, _) in zip(stagings, THREE)] + [None]
    assert out[0]["props"][0]["label"] == 'a}b"c{d'
    kw = msgs.kwargs
    assert kw["model"] == "claude-haiku-5-5"
    assert kw["output_config"]["effort"] == "low"
    assert kw["output_config"]["format"] == {"type": "json_schema", "schema": director.output_schema(VOCAB)}
    assert kw["thinking"] == {"type": "disabled"}
    assert "temperature" not in kw and "top_p" not in kw and "top_k" not in kw
    assert "No tengo reloj, mortal, solo eternidad." in json.dumps(kw["messages"], ensure_ascii=False)
    assert client.options == {"timeout": 10, "max_retries": 1}
    msgs = _Messages(_Stream(chunks))
    _direct(_Client(msgs), THREE, thinking=True)
    assert "thinking" not in msgs.kwargs


# N13 — lo que ya llegó entero se queda; lo que falta sale null; nunca lanza
def test_n13_direct_fallos_parciales():
    stagings = _stagings()
    payload = json.dumps({"scenes": stagings})
    cut = len('{"scenes": [') + len(json.dumps(stagings[0])) + 3  # la primera escena entera y un poco de la segunda
    first = director.build_scene(stagings[0], BEATS[0][0], VOCAB)
    assert _direct(_Client(_Messages(_Stream([payload[:cut], payload[cut:]], fail_after=1))), BEATS) == [first, None]
    assert _direct(_Client(_Messages(_Stream([payload[:cut]], stop="refusal"))), BEATS) == [first, None]
    assert _direct(_Client(_Messages(_Stream([payload[:cut]], stop="max_tokens"))), BEATS) == [first, None]
    assert _direct(_Client(_Messages(exc=RuntimeError("red caída"))), BEATS) == [None, None]
    assert _direct(_Client(_Messages(_Stream(["esto no es JSON"]))), BEATS) == [None, None]


# N14 — el servidor manda las escenas que llegan aunque el director falle a mitad
def test_n14_director_falla_a_mitad(monkeypatch):
    def partial(bs):
        yield _scene_for(bs)[0]
        raise RuntimeError("director caído a mitad")

    evs, _ = _run(monkeypatch, REPLY, partial, cid="n14")
    kinds = [k for k, _ in evs]
    assert "error" not in kinds and kinds[-1] == "done"
    scenes = [d for k, d in evs if k == "scene"]
    assert [s["scene"] is not None for s in scenes] == [True, False]
```

## R6 · Medida con la API real [API] (la lanza Josem)

- `scripts/api_smoke.py`:
  - Añade `--director-thinking {0,1}`.
  - Añade al JSON y al resumen:
    - **ms hasta la primera escena** del director (mediana y máxima) y ms totales;
    - **golpes de ≤3 palabras**;
    - **fondos distintos** usados en toda la pasada.
  - Que no pise los ficheros de H2: `api_smoke-think1.json` y `api_smoke-think0.json`, cada uno con su galería.
- Orden para Josem, en el anexo: dos pasadas de las mismas 13 preguntas, primero con `--director-thinking 1` y
  después con `0`. Corte por coste: $0.50 por pasada, como hasta ahora.

## Punto de parada de H3

1. R1-R5 hechos, con `pytest -q tests`, `ruff check .` y `npm test` en verde, push, e informe `H3-informe.md` con
   commit. **Para** y espera a Josem para R6 (el automensaje me avisa, y yo reviso el código mientras tanto).
2. Después de R6: anexo con las dos pasadas comparadas, con los criterios del §5 de este encargo. **Para.**

## §5 · Indicadores de falsación de H3

- **D19:** con el mejor modo de pensamiento, la mediana hasta la primera escena debería quedar **≤1,5 s**. Si
  no, el streaming no compensa y se replantea (por ejemplo, golpe a golpe mientras escribe el narrador).
- **D19, sin pensamiento:** si con `thinking=0` sube el número de `null` (>1 de cada 10) o los fondos y acciones
  se vuelven más pobres que con `thinking=1`, el valor por defecto se queda en `1`.
- **D18:** golpes de ≤3 palabras **≤5%** en las dos pasadas (que no sean frases completas como «Trasto,
  dices.»).
- **Fondos:** al menos **5 de 7** distintos en cada pasada de 13 respuestas. Si no, se vuelve a tocar el prompt
  del director.
