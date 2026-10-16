---
proyecto: klothulhu
fase: 4
titulo: continuidad dentro de la frase
plan: arquitecto
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D23; también D13, D14, D18, D19, D22)"
gasto_autorizado: "hasta $0.10 en el paso [API] de esta fase (Josem, 2026-10-16, en la ventana del arquitecto)"
---

# Fase 4: continuidad dentro de la frase

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-16.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).
> Decisiones: `30-projects/klothulhu/ficha.md` § Decisiones. Cítalas en el código como `D<n>`.

## 0. Qué y por qué

Cuando una frase larga se parte en dos golpes (D18), el director puede elegir otro fondo para la segunda
mitad, y otra posición para el personaje. En Konnos se ve como un salto a mitad de frase. **D23:**

> Si un golpe continúa la frase del anterior (el anterior está **cortado**, con la misma regla que
> `isCut` de D22), su escena **conserva `backdrop` y `particles`** de la escena anterior. El personaje
> **sale de donde acabó**:
> - acción de desplazamiento: `from` es el `to` anterior;
> - acción en el sitio: `from` y `to` son el `to` anterior.
>
> `action`, `then`, `props` y `tone` no se tocan.

Lo impone el **servidor** al emitir cada escena (también con `KLOTHULHU_FAKE=1`). Además, el director
recibe la regla en el prompt y una marca en cada golpe que continúa, para que elija accesorios que
encajen con el fondo heredado.

**Contrato:** los eventos SSE no cambian (D13): mismos campos y mismo orden. Lo que cambia es lo que
garantiza `scene` en las continuaciones. **El cliente no se toca**: con el mismo fondo ya no hace
fundido (`fadeIn` compara fondos), sin más cambios.

**Fuera de alcance:**
- el bocadillo con scroll (fase 5, pendiente de claude-fables);
- la continuidad entre respuestas distintas;
- reparar continuidad cuando la escena anterior es `null`: el cliente pinta entonces la fija de su
  emoción, y el servidor no sabe cuál es. Se emite tal cual.

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** Las pruebas no escriben ficheros. El paso [API]
  escribe **solo** en `docs/fase4/capturas/`, con `--out` explícito. **Nunca** con la ruta por defecto
  de `api_smoke.py`, que es `docs/fase2/capturas/` y pisaría las capturas de la fase 2. `.venv` propio
  en el worktree.
- **¿API externa?** Sí, solo en T5 [API]. El narrador y el director siguen igual que en producción
  (Claude Haiku 5.5, director sin pensamiento, D16 y D20), con los mismos ids que ya usa
  `server/app.py`: no se cambia ningún modelo. La fase 2 gastó $0,0058 en 13 preguntas, así que
  el tope es **$0,10**, y el script corta antes si se acerca. Hay que informar del coste por modelo.
  La clave la pone Josem en su shell; el programador no la tiene.
- **¿Producción?** No hasta el final. Al cerrar, Josem hace merge `--ff-only` de `fase4` en `main`
  desde `/data/klothulhu` y reinicia `klothulhu-api.service` (cambian `server/`, el prompt del director
  incluido). Konnos no necesita nada.

## 2. Tareas

Rama `fase4`, worktree `/data/klothulhu-fase4` (ya creado). `.venv` propio con Python 3.12 y
`requirements-dev.txt`. Una tarea, un commit.

### T1 · `is_cut` en el servidor

`server/beats.py`: `is_cut(caption: str) -> bool`, el mismo criterio que `isCut` de
`desktop/renderer/scenes.js`. Devuelve `True` si el caption, quitando espacios y cierres
`» " ” ' ) ]` del final, **no** acaba en `.`, `!`, `?` o `…`. Los casos compartidos van en
`tests/fixtures/cut_cases.json` (§3.1), y los comprueban los dos lados, como `beats_cases.json`.

### T2 · `continue_scene` (D23)

`server/director.py`:
- `TRAVEL = frozenset({"walk", "run", "fly", "carry", "sneak", "jump", "tumble"})`, las acciones de
  desplazamiento. Es la lista del prompt y la de `MOTION_TIMING` con `kind: "travel"` del motor. Va
  comentada con D23 y con dónde mirar en el motor al actualizarlo.
- `continue_scene(prev: dict | None, prev_caption: str | None, scene: dict | None) -> dict | None`, pura:
  - si `scene` o `prev` son `None`, o si `prev_caption` es `None` o no está cortado: devuelve `scene`
    sin cambios;
  - si no: devuelve una **copia** con `backdrop` del anterior, `particles` del anterior (o sin la clave,
    si el anterior no la tenía) y el `hero` ajustado según D23 (`p = prev["hero"]["to"]`);
  - nunca modifica `prev` ni `scene`.

### T3 · Aplicarlo al emitir

`server/app.py`, en el bucle que manda los `scene`: cada escena pasa por
`continue_scene(última_emitida, bs[i-1][0] si i > 0, escena)` antes de `_scene_event`. **La última
emitida es la ya corregida**, así que una frase en tres trozos encadena bien. Las escenas `null`
de relleno (las de después de un fallo) no pasan por aquí. Un `log.info` por respuesta con
cuántas continuaciones había y cuántas hubo que corregir (fondo y personaje por separado).

### T4 · Director: regla y marca

- `server/director_prompt.md`: sustituye la frase blanda («keep the backdrop unless the topic changes,
  and let the hero start near where it ended») por la regla de D23 en inglés. Más o menos: una línea
  marcada `(continues)` sigue la frase de la anterior; se mantienen `backdrop` y `particles`, el héroe
  arranca en el `to` anterior, y la acción y los props pueden cambiar pero deben pegar con ese fondo.
  Entre frases distintas, libertad total, como hoy.
- `_user_message`: la línea de un golpe cuyo anterior está cortado lleva ` (continues)` justo detrás de
  la emoción: `2. [smug] (continues) lo cual es…`.

### T5 · [API] Pasada real y galería

Solo con la autorización ya dada (frontmatter), y la ejecuta Josem en su shell:
```bash
.venv/bin/python scripts/api_smoke.py --director-thinking 0 --out docs/fase4/capturas/api_smoke.json
node desktop/scripts/gallery.js docs/fase4/capturas/api_smoke.json docs/fase4/capturas/galeria.html
```
- Prepara antes el script para que el resumen añada `continuations`, `fixed_backdrop` y `fixed_hero`:
  cuántas veces el director **no** cumplió D23 por su cuenta. Es el dato que dice si el prompt basta.
- Haz primero un ensayo con `--fake` a una ruta del scratchpad, nunca a `docs/fase2/`.
- La lista de preguntas debe incluir al menos 3 que obliguen a frases largas (más de 70 caracteres). Si
  las de la fase 2 no lo hacen, añade preguntas, sin quitar ninguna.

## 3. Pruebas normativas

Cópialas tal cual y hazlas pasar; no se editan. Puedes añadir las tuyas en otros ficheros.

### 3.1 `tests/fixtures/cut_cases.json`

```json
{
  "_comment": "Casos normativos de is_cut (servidor) e isCut (cliente), fase 4, D23. No editar para que pase una prueba.",
  "cases": [
    {"caption": "Hola, mortal. Sigo atrapado en tu escritorio,", "cut": true},
    {"caption": "lo dice así:", "cut": true},
    {"caption": "sin punto", "cut": true},
    {"caption": "uno; dos;", "cut": true},
    {"caption": "y tú vienes a preguntarme por la hora, como si el tiempo significara", "cut": true},
    {"caption": "Fin.", "cut": false},
    {"caption": "Fin. ", "cut": false},
    {"caption": "¿Sí?", "cut": false},
    {"caption": "¡Ya!", "cut": false},
    {"caption": "Bueno…", "cut": false},
    {"caption": "Bueno...", "cut": false},
    {"caption": "«Hola.»", "cut": false},
    {"caption": "\"Hola.\"", "cut": false},
    {"caption": "(así.)", "cut": false},
    {"caption": "lo cual es humillante para algo que devoró estrellas.", "cut": false}
  ]
}
```

### 3.2 `tests/test_fase4.py`

```python
"""Pruebas normativas de la fase 4 (D23). No editar: añadir en otro fichero."""
import asyncio
import copy
import json
import os
from pathlib import Path

os.environ.setdefault("KLOTHULHU_TOKENS", "fase4test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import director  # noqa: E402
from beats import is_cut  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
VOCAB = director.load_vocab()


def _scene(backdrop, action, frm, to, particles=None, caption="x"):
    s = {"backdrop": backdrop, "palette": {}, "hero": {"action": action, "from": frm, "to": to},
         "props": [{"sprite": "bug", "x": 50, "y": "ground", "motion": "none"}], "caption": caption,
         "tone": "work"}
    if particles:
        s["particles"] = {"kind": particles, "density": 0.4}
    return s


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


def _run(monkeypatch, reply, stagings, cid):
    async def fake_stream():
        for i in range(0, len(reply), 3):
            yield reply[i : i + 3]

    seen = {}

    async def fake_director(question, bs):
        seen["beats"] = [tuple(b) for b in bs]
        for (caption, _), st in zip(bs, stagings):
            yield None if st is None else {**copy.deepcopy(st), "caption": caption}

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué tal?", asyncio.Lock())]

    events = _events(asyncio.run(collect()))
    return [d["scene"] for e, d in events if e == "scene"], seen["beats"]


# G1 — is_cut: casos compartidos con isCut del cliente
def test_g1_is_cut_cases():
    for c in json.loads((FIX / "cut_cases.json").read_text(encoding="utf-8"))["cases"]:
        assert is_cut(c["caption"]) is c["cut"], c["caption"]


# G2 — continuación con desplazamiento: fondo y partículas heredados, sale del `to` anterior
def test_g2_travel():
    prev = _scene("space", "walk", 10, 70, particles="stars")
    scene = _scene("forest", "run", 20, 90)
    out = director.continue_scene(prev, "Sigo atrapado en tu escritorio,", scene)
    assert out["backdrop"] == "space"
    assert out["particles"] == {"kind": "stars", "density": 0.4}
    assert out["hero"] == {"action": "run", "from": 70, "to": 90}
    assert out["props"] == scene["props"] and out["tone"] == scene["tone"] and out["caption"] == scene["caption"]


# G3 — continuación en el sitio: from = to = el `to` anterior; `then` se conserva
def test_g3_in_place():
    prev = _scene("lab", "run", 0, 55)
    scene = _scene("volcano", "think", 20, 20, particles="sparks")
    scene["hero"]["then"] = "shrug"
    out = director.continue_scene(prev, "como si el tiempo significara", scene)
    assert out["backdrop"] == "lab"
    assert "particles" not in out  # el anterior no tenía
    assert out["hero"] == {"action": "think", "from": 55, "to": 55, "then": "shrug"}


# G4 — si el anterior acaba la frase, la escena sale tal cual
def test_g4_not_cut():
    prev = _scene("space", "walk", 10, 70)
    scene = _scene("forest", "run", 20, 90)
    assert director.continue_scene(prev, "Fin de la frase.", scene) == scene


# G5 — None en cualquier lado: no se repara nada
def test_g5_none():
    scene = _scene("forest", "run", 20, 90)
    assert director.continue_scene(None, "cortado,", scene) == scene
    assert director.continue_scene(_scene("space", "walk", 0, 10), "cortado,", None) is None
    assert director.continue_scene(_scene("space", "walk", 0, 10), None, scene) == scene


# G6 — pura: no modifica sus argumentos
def test_g6_pure():
    prev = _scene("space", "walk", 10, 70, particles="stars")
    scene = _scene("forest", "think", 20, 20)
    before = (copy.deepcopy(prev), copy.deepcopy(scene))
    director.continue_scene(prev, "cortado,", scene)
    assert (prev, scene) == before


# G7 — de punta a punta: una frase cortada en dos y otra frase nueva
def test_g7_reply_two_sentences(monkeypatch):
    reply = ("[smug] Hola, mortal. Sigo atrapado en tu escritorio, lo cual es humillante para algo que "
             "devoró estrellas. [neutral] Pero estoy bien, dentro de lo que cabe en una ventana.")
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "think", 20, 20),
                _scene("lab", "run", 0, 50)]
    scenes, bs = _run(monkeypatch, reply, stagings, "fase4-g7")
    assert [c for c, _ in bs] == [
        "Hola, mortal. Sigo atrapado en tu escritorio,",
        "lo cual es humillante para algo que devoró estrellas.",
        "Pero estoy bien, dentro de lo que cabe en una ventana.",
    ]
    assert scenes[0]["backdrop"] == "space" and scenes[0]["hero"] == {"action": "walk", "from": 10, "to": 70}
    assert scenes[1]["backdrop"] == "space" and scenes[1]["particles"]["kind"] == "stars"
    assert scenes[1]["hero"] == {"action": "think", "from": 70, "to": 70}
    assert scenes[2]["backdrop"] == "lab" and "particles" not in scenes[2]  # frase nueva: libre
    assert scenes[2]["hero"] == {"action": "run", "from": 0, "to": 50}


# G8 — una frase en tres trozos encadena con la escena ya corregida
def test_g8_chain(monkeypatch):
    reply = ("[annoyed] Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a "
             "preguntarme por la hora, como si el tiempo significara algo para un ser que ya estaba aquí "
             "antes de las estrellas.")
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "run", 20, 90),
                _scene("lab", "think", 5, 5, particles="sparks")]
    scenes, bs = _run(monkeypatch, reply, stagings, "fase4-g8")
    assert len(bs) == 3 and is_cut(bs[0][0]) and is_cut(bs[1][0])
    assert [s["backdrop"] for s in scenes] == ["space", "space", "space"]
    assert all(s["particles"]["kind"] == "stars" for s in scenes)
    assert scenes[1]["hero"] == {"action": "run", "from": 70, "to": 90}
    assert scenes[2]["hero"] == {"action": "think", "from": 90, "to": 90}


# G9 — una escena null rompe la cadena: la siguiente sale tal cual
def test_g9_null_breaks_chain(monkeypatch):
    reply = ("[annoyed] Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a "
             "preguntarme por la hora, como si el tiempo significara algo para un ser que ya estaba aquí "
             "antes de las estrellas.")
    stagings = [_scene("space", "walk", 10, 70), None, _scene("lab", "think", 5, 5)]
    scenes, _ = _run(monkeypatch, reply, stagings, "fase4-g9")
    assert scenes[1] is None
    assert scenes[2]["backdrop"] == "lab" and scenes[2]["hero"]["from"] == 5


# G10 — el director ve qué golpes continúan
def test_g10_user_message():
    bs = [("Hola, mortal. Sigo atrapado en tu escritorio,", "smug"),
          ("lo cual es humillante para algo que devoró estrellas.", "smug"),
          ("Pero estoy bien.", "neutral")]
    lines = director._user_message("¿Qué tal?", bs).split("\n")
    assert "1. [smug] Hola, mortal." in "\n".join(lines) and "1. [smug] (continues)" not in "\n".join(lines)
    assert any(line.startswith("2. [smug] (continues) lo cual") for line in lines)
    assert any(line.startswith("3. [neutral] Pero estoy bien.") for line in lines)
    assert "(continues)" in director.system_prompt(VOCAB)


# G11 — TRAVEL son exactamente las de desplazamiento del prompt y están en el vocabulario
def test_g11_travel():
    assert director.TRAVEL == {"walk", "run", "fly", "carry", "sneak", "jump", "tumble"}
    assert director.TRAVEL <= set(VOCAB["actions"])
```

### 3.3 `desktop/test/fase4.test.js`

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../renderer/scenes.js');

// G1 (cliente) — isCut con los casos compartidos con is_cut del servidor (D23)
test('G1 isCut = is_cut (cut_cases.json)', () => {
  const file = path.join(__dirname, '..', '..', 'tests', 'fixtures', 'cut_cases.json');
  for (const c of JSON.parse(fs.readFileSync(file, 'utf8')).cases) assert.equal(K.isCut(c.caption), c.cut, c.caption);
});
```

## 4. Hitos y paradas

- **H1:** T1-T4 y las pruebas en verde: `pytest` (26 + 11), `npm test` (34 + 1) y `ruff`. Prepara el
  script de T5 y haz el ensayo `--fake`. **Para** y deja `docs/fase4/H1-informe.md`.
- **H2:** después de mi revisión, Josem lanza T5 y tú escribes `docs/fase4/H2-informe.md` con el
  coste por modelo, `continuations`, `fixed_backdrop` y `fixed_hero`, y la ruta de la galería. **Para.**
  Josem juzga la galería.
