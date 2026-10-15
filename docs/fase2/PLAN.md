---
proyecto: klothulhu
fase: 2
titulo: v2 en el servidor — narrador + director y evento `scene`
plan: arquitecto
fecha: 2026-10-15
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D13-D17; también D7-D12)"
gasto_autorizado: "hasta $1 en pasos [API] para toda la fase (Josem, 2026-10-15, en la ventana del arquitecto)"
---

# Fase 2 — v2 en el servidor: narrador + director y evento `scene`

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-15.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).
> Decisiones: `30-projects/klothulhu/ficha.md` § Decisiones. Cítalas en el código como `D<n>`.

## 0. Qué y por qué

Hoy el servidor manda texto con emociones, y el cliente (fase 1) trocea ese texto y elige una escena
fija según la emoción. En esta fase **el servidor dirige las escenas** (D8):

1. El **narrador** (klothulhu, como hoy) escribe la respuesta en frases cortas. Pasa a Claude Haiku 5.5 (D16).
2. Al terminar, el servidor trocea la respuesta en golpes (`server/beats.py`, mismas reglas que
   `desktop/renderer/scenes.js`; D13).
3. El **director** (una segunda llamada, a Claude Haiku 5.5 con *structured outputs*; D14) decide la puesta
   en escena de cada golpe: fondo, acción, partículas, accesorios y tono. **El texto no lo toca:** el
   `caption` es el golpe tal cual.
4. El servidor manda un evento `scene` por golpe, y después `done` (D13).

**El cliente no cambia en esta fase** (eso es la fase 3): el de la fase 1 ignora los eventos que no
conoce y sigue funcionando igual.

**Fuera de alcance:** el cliente, la continuidad de escenas entre respuestas distintas, LogCentral,
`title` y `palette` en las escenas, accesorios dibujados a mano (`FablesPixelArt`).

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** El historial vive en memoria; las pruebas usan
  identificadores de cliente propios. El `.venv` se crea **solo en el worktree**. Las pruebas no
  escriben ficheros; el paso [API] escribe solo en `docs/fase2/capturas/`.
- **¿Algo llama a una API externa?** Sí. Comprobado con la skill `claude-api` (2026-10-15):
  - Modelo `claude-haiku-5-5`, sin sufijo de fecha, para el narrador y el director. Cuesta $0.10 / $0.50
    por MTok (entrada/salida) si el prompt tiene ≤100K tokens. Las lecturas de caché cuestan 0,1×.
  - **Piensa por defecto** (esfuerzo por defecto `medium`), y el pensamiento cuenta para `max_tokens`. Se
    controla con `output_config={"effort": "low"}`. La respuesta puede **empezar con bloques
    `thinking`**: hay que leer los bloques por `type`, nunca `content[0]`.
  - **No acepta** `temperature`, `top_p`, `top_k` ni *prefill* (400). Hoy no se usan; que siga así.
  - Su tokenizador cuenta ~30% más tokens que el de Haiku 4.5.
  - *Structured outputs*: `output_config={"format": {"type": "json_schema", "schema": …}}` con
    `messages.create`. El esquema admite `enum`, `anyOf`, `null` y `additionalProperties: false`
    (obligatorio en cada objeto). **No admite** `minimum`/`maximum`, `minLength`/`maxLength` ni límites
    de arrays: los números y longitudes los acota el servidor.
  - Caché de prompt desde 512 tokens: el prompt del director (≥1K tokens) se puede cachear con
    `cache_control` en el bloque de `system`.
  - Puede devolver `stop_reason: "refusal"`, y este modelo no tiene *fallback* en el servidor.
  - Las pruebas que gastan son pasos **[API]**, con el coste informado por modelo. Tope: **$1 en toda la
    fase**, autorizado por Josem el 2026-10-15 (cópialo en «Gasto» del informe).
- **¿Algo toca producción?** Solo al desplegar, y eso lo hace Josem (§6): el servicio
  `klothulhu-api.service`, que arranca desde `/data/klothulhu/.venv`, y su env
  `/etc/klothulhu/klothulhu.env`. Mientras tanto, todo va en el worktree `/data/klothulhu-fase2` (rama
  `fase2`). Si arrancas el servidor a mano, usa el puerto **8766** con `KLOTHULHU_FAKE=1`, nunca el 8765.

## 2. Dónde se trabaja

- Worktree `/data/klothulhu-fase2`, rama `fase2`. El buzón es `docs/fase2/`.
- `.venv` propio del worktree con **Python 3.12** (D17): `python3.12 -m venv .venv`. No uses el `.venv` de
  `/data/klothulhu` (es el de producción).
- `desktop/`: `npm ci` en el worktree para las pruebas de Node.
- `git push -u origin fase2` cuando quieras; nunca a `main`.

## 3. Hito H1 — servidor con director, sin API

### T0 · Base

- `.venv` 3.12 (ver §2). `requirements.txt` con versiones fijadas de lo que usa el servidor (`fastapi`,
  `uvicorn`, `anthropic`; las que resuelva pip en 3.12). Crea `requirements-dev.txt` (`-r requirements.txt`,
  `pytest`, `ruff`, fijadas).
- Arregla los 3 avisos de `ruff` que ya había en `main` (H1-revision de la fase 1, §2.2). `ruff check .`
  limpio.

### T1 · Vocabulario del motor en Python (D15)

- `desktop/scripts/export-vocab.js`: carga el IIFE vendorizado (con `vm`, como las pruebas) y escribe
  `server/fables_vocab.json` con `JSON.stringify(VOCAB, null, 1)` y un salto de línea final.
- Genera y añade `server/fables_vocab.json`. Una nota en `desktop/renderer/vendor/VENDOR.md`: al
  actualizar el motor, regenerar este JSON.

### T2 · `server/beats.py` (D13)

Puerto a Python de `beats()` de `scenes.js`, con **las mismas reglas** (fase 1, PLAN §T3), que se
comprueban con `tests/fixtures/beats_cases.json`. Exporta `CAPTION_MAX = 70` y
`beats(text: str, marks: list[tuple[int, str]]) -> list[tuple[str, str]]` (caption, emoción). Una
marca con `at <= 0` sustituye la emoción inicial (la última gana); una con `at >= len(text)` se ignora.

### T3 · `server/director.py` (D14)

| Nombre | Qué |
|---|---|
| `load_vocab(path=None) -> dict` | Lee `server/fables_vocab.json` (por defecto, el que está junto al módulo) |
| `MAX_PROPS = 3` | Accesorios por escena, como mucho |
| `output_schema(vocab) -> dict` | Esquema JSON `{"scenes": [staging, …]}` (abajo), generado del vocabulario |
| `system_prompt(vocab) -> str` | Prompt del director, generado del vocabulario (abajo) |
| `build_scene(staging, caption, vocab) -> dict \| None` | Convierte la puesta en escena de un golpe en un `FablesScene` (reglas abajo) |
| `async direct(question, beats, *, client, vocab, model, effort, timeout) -> list[dict \| None]` | Llama al director y devuelve una escena (o `None`) por golpe. **Nunca lanza** |
| `async fake_direct(question, beats) -> list[dict \| None]` | Para `KLOTHULHU_FAKE=1`: escenas válidas deterministas, sin API |

**Esquema de un `staging`** (todos los objetos con `additionalProperties: false` y todos sus campos en
`required`; nulos con `anyOf [..., {"type": "null"}]`):

```text
backdrop:  enum vocab.backdrops
hero:      { action: enum vocab.actions, from: integer, to: integer, then: enum vocab.actions | null }
particles: { kind: enum vocab.particles, density: number } | null
props:     [ { sprite: enum vocab.sprites, x: integer, y: enum vocab.heights,
               motion: enum vocab.motions, label: string | null } ]
tone:      enum vocab.tones
```

**`build_scene`** (los casos de `tests/fixtures/director_cases.json` son normativos):

- Cualquier valor de enum que no esté en el vocabulario (fondo, acción, `then`, partícula, sprite, altura,
  movimiento, tono) → **`None`** para todo el golpe. Con *structured outputs* no debería pasar; es la red.
- `from`, `to` y `x`: redondeados y acotados a 0-100. `density`: acotada a 0-1 (tal cual, sin redondear).
- `label`: sin espacios en los extremos y recortada a `vocab.limits.maxLabel` (18); vacía o `null` → sin clave.
- `then: null` → sin clave. `particles: null` → sin clave. `props`: los `MAX_PROPS` primeros.
- Salida: `{backdrop, palette: {}, hero, props, caption, tone[, particles]}`. Sin `title` ni `enter`.

**`direct`**:

- Una llamada a `client.with_options(timeout=timeout, max_retries=1).messages.create(...)` con `model`,
  `max_tokens=4096`, `system=[{type: text, text: system_prompt(vocab), cache_control: {type: ephemeral}}]`,
  un único mensaje de usuario (abajo) y `output_config={"effort": effort, "format": {"type":
  "json_schema", "schema": output_schema(vocab)}}`.
- Lee el primer bloque `type == "text"` y hace `json.loads`. Si `stop_reason` no es `end_turn`, si no hay
  texto, si el JSON no vale o si hay cualquier excepción → **todos `None`** y un `log.warning` con el motivo.
- Escenas de más → se descartan; de menos → `None` para los golpes que faltan.
- Registra con `log.info` cada llamada: modelo, latencia en ms, `input_tokens`, `output_tokens`,
  `cache_read_input_tokens` y cuántos golpes quedaron en `None`. Lee `usage` con `getattr`, con valor por
  defecto si falta (las pruebas usan objetos simulados).

**Mensaje de usuario del director** (en inglés, como el prompt):

```text
The mortal asked: "<question>"
klothulhu's reply, in beats (in order):
1. [confused] No tengo reloj, mortal, solo eternidad.
2. [smug] Pero Tokio va siete horas por delante.
Stage exactly 2 scenes, one per beat, in order.
```

**Prompt del director**: en `server/director_prompt.md`, con huecos que `system_prompt()` rellena desde el
vocabulario (lo que ves entre `<…>`). Punto de partida, adaptado del narrador de upstream
(`/data/claude-fables/hooks/narrator.ts`). Puedes pulir la redacción, pero no la intención:

```text
You are the stage director of klothulhu, a tiny eldritch horror who lives on a mortal's desktop and is drawn
as a small orange critter in an animated strip. klothulhu has already written its reply; you never change the
words. For each beat of the reply you choose how it is staged, so the strip tells the beat visually: a
whimsical, slightly ominous metaphor of what klothulhu is saying, not a literal illustration.

The beat's emotion sets the mood: neutral calm, happy bright, annoyed heated, confused lost, smug sly,
sleepy dim. Consecutive beats of one reply flow as one short story: keep the backdrop unless the topic
changes, and let the hero start near where it ended (next "from" close to the previous "to").

Backdrops: <backdrops>.
Hero actions. Moving across the stage, from "from" to "to" (0-100, percent of the stage): walk, run, fly,
carry, sneak, jump, tumble. In place (from equal to to): dig, inspect, think, point, peek, spin, wave, sleep,
panic, dance, celebrate. Played once: trip, shrug. "then" chains a second action where the hero stands; use it
when the beat has two moments, else null. Valid names: <actions>.
Particles (optional, null for none): <particles>, density 0-1. Use them for atmosphere, sparingly.
Props (0 to 3, optional): small sprites placed at x 0-100, y ground/air/sky, with a motion and an optional
label of at most 18 characters. Only when they help tell the beat. Sprites: <sprites>. Motions: <motions>.
Tone: "work" by default, "trouble" when something goes wrong or klothulhu is annoyed, "milestone" for
good news or triumph.
```

### T4 · `server/app.py` y el contrato (D13, D16)

- **Ajustes nuevos** (env, con estos valores por defecto):
  - `KLOTHULHU_MODEL=claude-haiku-5-5`
  - `KLOTHULHU_EFFORT=low`
  - `KLOTHULHU_MAX_TOKENS=1024`
  - `KLOTHULHU_DIRECTOR=1`
  - `KLOTHULHU_DIRECTOR_MODEL=claude-haiku-5-5`
  - `KLOTHULHU_DIRECTOR_EFFORT=low`
  - `KLOTHULHU_DIRECTOR_TIMEOUT=10`

  Añádelos a `server/klothulhu.env.example`. En el módulo, `DIRECTOR_ENABLED` es un bool global.
- **Narrador**: `_model_stream` añade `output_config={"effort": EFFORT}`. Sigue leyendo `text_stream`
  (los bloques `thinking` no llegan ahí). Si la respuesta final acaba con `stop_reason == "refusal"`, se
  registra con `log.warning`; el contrato no cambia.
- **`async def _director(question, beats)`**, a nivel de módulo: con `FAKE` llama a
  `director.fake_direct`; si no, a `director.direct(...)` con el cliente y los ajustes. Las pruebas la
  sustituyen.
- **`_reply`**, después del bucle del narrador y antes de `done`:
  - Acumula `text` y `marks` a partir de los eventos del parser, como el cliente: una `emotion` es una
    marca en `len(text)` y un `delta` se suma a `text`.
  - `bs = beats(text, marks)`. Si `bs` está vacío, no hay escenas ni se llama al director.
  - Si `DIRECTOR_ENABLED` es falso, son todo `None` y **no se llama** a `_director`. Si no, se llama a
    `_director(text_de_la_pregunta, bs)` **dentro de un `try` propio**: cualquier excepción da todo
    `None` y un `log.warning`, nunca un evento `error`. El resultado se normaliza a `len(bs)` (sobran →
    fuera; faltan → `None`).
  - Por cada golpe: `event: scene`, `data: {"index": i, "total": n, "emotion": e, "caption": c, "scene":
    escena_o_null}`.
  - Después, el historial (igual que hoy: el texto crudo del narrador con sus etiquetas, **nunca** las
    escenas) y `done`.
- `/health` añade `"director": {"enabled": DIRECTOR_ENABLED, "model": DIRECTOR_MODEL}`.
- Actualiza el docstring del contrato al principio de `app.py`.

### T5 · Narrador

`server/prompt.md`, en «Hard format rules»: cada frase de **70 caracteres como mucho** (sin contar
etiquetas), y lo demás igual. No cambies la voz ni los ejemplos más allá de lo necesario para que
cumplan esa regla.

### T6 · Documentación

- `README.md`, «API contract»: el evento `scene` (tabla), qué es `scene: null`, que el cliente de la fase
  1 lo ignora, los ajustes nuevos y Python 3.12.
- `CLAUDE.md` del repo: el director, `fables_vocab.json` (cómo se regenera), `requirements-dev.txt`.

### T7 · Pruebas normativas

Copia **tal cual** los dos bloques:
- el de Python a `tests/test_fase2.py`;
- el de Node a `desktop/test/fase2.test.js`.

Hazlos pasar sin cambiarlos. Si una prueba te parece mal, para y pregunta (en la fase 1, una lo estaba).
Puedes **añadir** pruebas en otros ficheros. Los ficheros de casos (`tests/fixtures/*.json`) también son
normativos: llegan con este plan.

```python
"""Pruebas normativas de la fase 2 (docs/fase2/PLAN.md, D13-D16). No editar: añadir en otro fichero."""
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
    async def fake_stream():
        for i in range(0, len(reply), 3):
            yield reply[i : i + 3]

    seen = {}

    async def fake_director(question, bs):
        seen["question"], seen["beats"] = question, [tuple(b) for b in bs]
        return directed(bs)

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué hora es?", asyncio.Lock())]

    return _events(asyncio.run(collect())), seen


def _scene_for(bs):
    staging = _cases("director_cases.json")[0]["staging"]
    return [director.build_scene(staging, caption, VOCAB) for caption, _ in bs]


# N1 — el troceo del servidor es el del cliente
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
    out = asyncio.run(director.fake_direct("q", BEATS))
    assert len(out) == 2
    for scene, (caption, _) in zip(out, BEATS):
        assert scene["caption"] == caption
        assert scene["backdrop"] in VOCAB["backdrops"]
        assert scene["hero"]["action"] in VOCAB["actions"]


class _Messages:
    def __init__(self, payload=None, exc=None, stop="end_turn", text=None):
        self.payload, self.exc, self.stop, self.text, self.kwargs = payload, exc, stop, text, None

    async def create(self, **kwargs):
        self.kwargs = kwargs
        if self.exc:
            raise self.exc
        body = self.text if self.text is not None else json.dumps(self.payload)
        return SimpleNamespace(
            stop_reason=self.stop,
            content=[SimpleNamespace(type="thinking", thinking=""), SimpleNamespace(type="text", text=body)],
            usage=SimpleNamespace(input_tokens=10, output_tokens=5),
        )


class _Client:
    def __init__(self, messages):
        self.messages = messages
        self.options = None

    def with_options(self, **kwargs):
        self.options = kwargs
        return self


def _direct(client, bs):
    return asyncio.run(
        director.direct("¿Qué hora es?", bs, client=client, vocab=VOCAB, model="claude-haiku-5-5", effort="low", timeout=10)
    )


# N12 — direct: la llamada, la lectura por tipo de bloque y los fallos
def test_n12_direct():
    stagings = [c["staging"] for c in _cases("director_cases.json")[:2]]
    three = [*BEATS, ("Y nada más.", "neutral")]
    msgs = _Messages(payload={"scenes": stagings})
    client = _Client(msgs)
    out = _direct(client, three)
    assert out == [director.build_scene(s, c, VOCAB) for s, (c, _) in zip(stagings, three)] + [None]
    kw = msgs.kwargs
    assert kw["model"] == "claude-haiku-5-5"
    assert kw["output_config"]["effort"] == "low"
    assert kw["output_config"]["format"] == {"type": "json_schema", "schema": director.output_schema(VOCAB)}
    assert "temperature" not in kw and "top_p" not in kw and "top_k" not in kw
    assert kw["messages"][-1]["role"] == "user"
    assert "No tengo reloj, mortal, solo eternidad." in json.dumps(kw["messages"], ensure_ascii=False)
    assert client.options == {"timeout": 10, "max_retries": 1}
    for bad in (
        _Messages(exc=RuntimeError("red caída")),
        _Messages(payload={"scenes": stagings}, stop="refusal"),
        _Messages(payload={"scenes": stagings}, stop="max_tokens"),
        _Messages(text="esto no es JSON"),
    ):
        assert _direct(_Client(bad), BEATS) == [None, None]
```

```js
'use strict';
// Pruebas normativas de la fase 2 (docs/fase2/PLAN.md, D13-D15). No editar: añadir en otro fichero.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESKTOP = path.join(__dirname, '..');
const REPO = path.join(DESKTOP, '..');
const K = require('../renderer/scenes.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js'), 'utf8'), ctx);
const M = ctx.FablesMotor;
const plain = (x) => JSON.parse(JSON.stringify(x));
const cases = (name) => JSON.parse(fs.readFileSync(path.join(REPO, 'tests', 'fixtures', name), 'utf8')).cases;

// F1 — el vocabulario de Python es el del motor vendorizado (D15)
test('F1 server/fables_vocab.json coincide con VOCAB', () => {
  const vocab = JSON.parse(fs.readFileSync(path.join(REPO, 'server', 'fables_vocab.json'), 'utf8'));
  assert.deepEqual(vocab, plain(M.VOCAB));
});

// F2 — el troceo del cliente pasa los mismos casos que el del servidor (D13)
test('F2 beats_cases.json con scenes.js', () => {
  for (const c of cases('beats_cases.json')) {
    const got = K.beats(c.text, c.marks.map(([at, emotion]) => ({ at, emotion })));
    assert.deepEqual(got.map((b) => [b.caption, b.emotion]), c.beats, c.name);
  }
});

// F3 — lo que construye el servidor, el motor lo pinta sin corregir nada (D14)
test('F3 director_cases.json: el motor no corrige las escenas', () => {
  for (const c of cases('director_cases.json')) {
    if (!c.scene) continue;
    const r = M.renderScene(c.scene, { look: 'pixel' });
    assert.equal(r.ok, true, `${c.name}: ${r.error}`);
    assert.deepEqual(plain(r.warnings), [], c.name);
    const s = plain(r.scene);
    for (const k of ['backdrop', 'hero', 'props', 'caption', 'tone', 'particles']) {
      assert.deepEqual(s[k], c.scene[k], `${c.name}: ${k}`);
    }
  }
});
```

### Punto de parada de H1

- `pytest -q tests`, `ruff check .` y `npm test` (en `desktop/`) en verde.
- Push e informe `docs/fase2/H1-informe.md` (convención §3.2), con commit. Gasto: **0**: en H1 no se
  llama a la API.
- **Para** y espera la revisión.

## 4. Hito H2 — prueba con la API real [API]

Solo después del «adelante» a H1. **Gasto máximo de la fase: $1**, ya autorizado.

**Credenciales.** Comprueba `ant auth status` o `ANTHROPIC_API_KEY`. Si no hay ninguna, **para** y
pide a Josem que lance él el script. La clave de producción está en `/etc/klothulhu/klothulhu.env`, que es
de root: no intentes leerla.

### T8 · `scripts/api_smoke.py` [API]

Un script (no es una prueba de pytest) que, sin pasar por HTTP, ejecuta `app._reply` con `KLOTHULHU_FAKE=0`
para cada pregunta de una lista fija:
- Unas 12 preguntas variadas en español: saludo, hora, una duda técnica corta, una petición absurda, un
  insulto suave, algo triste, una pregunta larga…
- 1-2 que fuercen varias emociones.

Escribe `docs/fase2/capturas/api_smoke.json` con, por pregunta:
- la pregunta, el texto de la respuesta, los golpes y las escenas (o `null`);
- latencia del narrador (hasta el primer `delta` y total) y del director;
- tokens por modelo y coste estimado por modelo, con los precios de §1.

Al final, el total gastado. Para no salirte del tope, corta si el acumulado pasa de **$0.50**.

### T9 · Galería para Josem

`desktop/scripts/gallery.js`: lee `api_smoke.json` y escribe `docs/fase2/capturas/galeria.html`. Es un
HTML autocontenido con, por pregunta:
- la pregunta y la respuesta;
- debajo, las escenas pintadas con el IIFE (como `<img>` con `data:`, en `pixel`);
- si una es `null`, la escena fija de `scenes.js` con un aviso.

Es para que Josem juzgue la voz (D16 es `tentativa`) y las escenas sin necesidad de Konnos.

### Punto de parada de H2

Anexo en `H1-informe.md`, o `H2-informe.md` si lo prefieres, con commit. Incluye:
- el gasto por modelo y el total;
- la latencia mediana del narrador y del director;
- cuántos golpes salieron `null` y por qué;
- cualquier `refusal`.

Commit también de la galería y del JSON. **Para.**

## 5. Indicadores de falsación

- **D14 (director después del narrador):** si la mediana de latencia del director pasa de **3 s**, la
  espera total se nota demasiado. Habría que dirigir golpe a golpe mientras el narrador escribe.
- **D14 (Haiku 5.5 con esfuerzo low):** si más de 1 de cada 10 golpes sale `null`, o Josem ve las escenas
  repetitivas o sin relación con el texto en la galería, se prueba con esfuerzo `medium` antes de cambiar
  de modelo.
- **D16 (narrador en Haiku 5.5):** si Josem no reconoce la voz de klothulhu en la galería, se vuelve a
  Haiku 4.5 (`KLOTHULHU_MODEL`) y D16 queda superada.
- **D13 (troceo en el servidor):** si algún caso real de `api_smoke.json` trocea raro (golpes de 2-3
  palabras, cortes a mitad de idea), se revisan las reglas en los dos lados a la vez, con casos nuevos en
  `beats_cases.json`.

## 6. Despliegue (Josem, al cerrar la fase)

1. Merge `--ff-only` de `fase2` en `main` desde `/data/klothulhu`.
2. Recrear el `.venv` de producción con 3.12:
   `cd /data/klothulhu && mv .venv .venv-3.11 && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt`.
3. En `/etc/klothulhu/klothulhu.env`:
   - `KLOTHULHU_MODEL=claude-haiku-5-5`
   - `KLOTHULHU_MAX_TOKENS=1024`
   - `KLOTHULHU_EFFORT=low`
   - las del director, si quieres valores distintos de los de por defecto.

   Si el fichero fija hoy `KLOTHULHU_MODEL` o `KLOTHULHU_MAX_TOKENS`, mandan esas líneas.
4. `sudo systemctl restart klothulhu-api` y `curl -s http://100.87.64.121:8765/health` (tiene que verse
   `director`).
5. **Vuelta atrás:** `KLOTHULHU_DIRECTOR=0` deja todas las escenas en `null`. `KLOTHULHU_MODEL=claude-haiku-4-5`
   devuelve el narrador al modelo anterior. `.venv-3.11` se borra cuando todo vaya bien una semana.
