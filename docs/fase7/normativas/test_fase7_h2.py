"""Pruebas normativas de la fase 7, H2 (D36, D37, D42-D46). No editar: añadir en otro fichero.

Sin red, sin BD y sin Qdrant: `AlmacenEnMemoria` y falsos.
"""
import asyncio
import logging
import os
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

os.environ.setdefault("KLOTHULHU_TOKENS", "fase7test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import busqueda  # noqa: E402
import cierre  # noqa: E402
import escritor  # noqa: E402
import gasto  # noqa: E402
import memoria  # noqa: E402
import sesiones  # noqa: E402
from memoria import Recuerdo  # noqa: E402
from memoria_bd import AlmacenEnMemoria  # noqa: E402

SERVER = Path(__file__).parent.parent / "server"
MADRID = ZoneInfo("Europe/Madrid")
SECRETO = "PILATES-SECRETO-4410"  # si aparece en un log, D42 está roto


# --- falsos -------------------------------------------------------------------------------------


class Reloj:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class EscritorFalso:
    def __init__(self, salida=None):
        self.salida = salida if salida is not None else {"recuerdos": []}
        self.llamadas = []

    async def __call__(self, transcripcion, previos, hoy):
        self.llamadas.append((transcripcion, previos, hoy))
        return self.salida, ("claude-haiku-5-5", 1000, 200)


class EmbedderFalso:
    def __init__(self, falla=False):
        self.falla = falla
        self.llamadas = []

    async def __call__(self, texto):
        self.llamadas.append(texto)
        if self.falla:
            raise RuntimeError("openai caído")
        return [0.1] * 1536, ("text-embedding-3-small", 12, 0)


class Indice:
    """Mismo contrato que `AlmacenMariaQdrant.consultar(vector, n)`: recuerdos con `similitud`, de más a menos."""

    def __init__(self, hits):
        self.hits = hits
        self.consultas = []

    def consultar(self, vector, n):
        self.consultas.append(n)
        return [dict(h) for h in self.hits][:n]


class Juez:
    """Mismo contrato que `escritor.juzgar(mensaje, recuerdo) -> (pertinente, uso)`."""

    def __init__(self, veredictos, falla=False):
        self.veredictos = veredictos
        self.falla = falla
        self.llamadas = []

    async def __call__(self, mensaje, recuerdo):
        self.llamadas.append((mensaje, recuerdo))
        if self.falla:
            raise RuntimeError("haiku caído")
        return self.veredictos[recuerdo], ("claude-haiku-5-5", 300, 20)


class Repasador:
    """Mismo contrato que `escritor.repasar(transcripcion, contexto) -> (salida, uso)`."""

    def __init__(self, salida):
        self.salida = salida
        self.llamadas = []

    async def __call__(self, transcripcion, contexto):
        self.llamadas.append((transcripcion, [r["id"] for r in contexto]))
        return self.salida, ("claude-haiku-5-5", 800, 60)


def _rec(rid, texto, importancia=3, emocion="neutral", fecha=None, creado_dia=1, usos=0, ultimo=None):
    return {"id": rid, "texto": texto, "importancia": importancia, "emocion": emocion, "fecha": fecha,
            "creado_dia": creado_dia, "usos": usos, "ultimo_uso_dia": ultimo}


def _hit(rid, similitud):
    r = _rec(rid, f"texto {rid}")
    r["similitud"] = similitud
    return r


def _sesion(sid="s1", dia=20, turnos=None):
    return sesiones.Sesion(
        id=sid,
        cliente="konnos",
        turnos=turnos if turnos is not None else [(f"Mañana cambio el {SECRETO}", "[smug] Anotado, mortal.")],
        inicio=datetime(2026, 10, dia, 20, 0, tzinfo=MADRID),
    )


def _cerrar(s, alm, **kw):
    kw.setdefault("escritor", EscritorFalso())
    kw.setdefault("embedder", EmbedderFalso())
    kw.setdefault("freno", gasto.Freno(tope=1.0, almacen=alm))
    return asyncio.run(cierre.cerrar(s, almacen=alm, **kw))


# N1 — la foto al abrir la sesión: los 15 más fuertes y los de fecha de hoy, sin repetir (D43)
def test_n1_contexto_inicial():
    hoy = date(2026, 10, 22)
    rs = [_rec(f"r{i}", f"recuerdo {i}", importancia=5) for i in range(20)]
    rs.append(_rec("debil-hoy", "la quedada", importancia=1, fecha=hoy))
    rs.append(_rec("debil-otro", "otra cosa", importancia=1, fecha=date(2026, 10, 23)))
    ids = [r["id"] for r in memoria.contexto_inicial(rs, 10, hoy)]
    assert ids[:15] == [r["id"] for r in memoria.mas_fuertes(rs, 10)]
    assert ids[15:] == ["debil-hoy"]
    assert [r["id"] for r in memoria.contexto_inicial([_rec("a", "x", fecha=hoy)], 1, hoy)] == ["a"]
    assert memoria.contexto_inicial([], 1, hoy) == []


# N2 — el bloque del prompt: fecha de hoy, textos sin corchetes, vacío si no hay recuerdos (D43)
def test_n2_bloque():
    hoy = date(2026, 10, 20)  # lunes
    ctx = [_rec("a", "El mortal va a pilates [y no lo juzgo].", fecha=date(2026, 10, 21), creado_dia=3),
           _rec("b", "Perdió a su gato Tofu.", importancia=5, emocion="sad", creado_dia=1)]
    b = memoria.bloque(ctx, 3, hoy)
    assert "Hoy es lunes 2026-10-20" in b
    assert "El mortal va a pilates y no lo juzgo." in b
    assert "Perdió a su gato Tofu." in b
    assert "2026-10-21" in b
    assert "[" not in b and "]" not in b
    assert memoria.bloque([], 3, hoy) == ""


# N3 — la poda: lo que cae por debajo de la fuerza mínima (D46)
def test_n3_podables():
    assert memoria.FUERZA_MINIMA == 0.05
    rs = [_rec("viejo", "x", importancia=1, creado_dia=1), _rec("fresco", "y", importancia=1, creado_dia=19),
          _rec("fuerte", "z", importancia=5, emocion="sad", creado_dia=1)]
    assert memoria.podables(rs, 20) == ["viejo"]


# N4 — `actual()` abre o devuelve la sesión del cliente; `cuantas()` cuenta las abiertas (D41, D43)
def test_n4_actual():
    reloj = Reloj()
    s = sesiones.Sesiones(ttl_seconds=1800, clock=reloj)
    a = s.actual("konnos")
    assert a.turnos == [] and a.contexto is None and a.eventos == [] and a.dia is None
    assert s.cuantas() == 1
    s.anotar("konnos", "hola", "[happy] Hola.")
    assert s.actual("konnos") is a and a.turnos == [("hola", "[happy] Hola.")]
    reloj.t += 1800
    b = s.actual("konnos")
    assert b is not a and b.turnos == []
    assert [x.id for x in s.vencidas()] == [a.id]
    assert s.cuantas() == 1


# N5 — la búsqueda: candidatos, umbral, juez y contexto del mensaje siguiente (D36, D44)
def test_n5_buscar():
    alm = AlmacenEnMemoria()
    s = _sesion(turnos=[])
    s.contexto = [_rec("ya", "texto ya")]
    indice = Indice([_hit("ya", 0.9), _hit("si", 0.7), _hit("no", 0.6), _hit("bajo", 0.3), _hit("fuera", 0.2)])
    juez = Juez({"texto si": True, "texto no": False})
    asyncio.run(busqueda.buscar("¿Qué tal el examen?", s, embedder=EmbedderFalso(), indice=indice, juez=juez,
                                freno=gasto.Freno(tope=1.0, almacen=alm), umbral=0.5))
    assert indice.consultas == [4]                       # 3 + los que ya están en el contexto
    assert [r["id"] for r in s.contexto] == ["ya", "si"]
    assert [m for m, _ in juez.llamadas] == ["¿Qué tal el examen?"] * 2
    ev = {e["recuerdo_id"]: e for e in s.eventos}
    assert set(ev) == {"si", "no", "bajo"}
    assert (ev["si"]["pertinente"], ev["no"]["pertinente"], ev["bajo"]["pertinente"]) == (True, False, None)
    assert ev["si"]["similitud"] == 0.7
    assert all(e["tipo"] == "candidato" and e["mensaje"] == "¿Qué tal el examen?" for e in s.eventos)
    assert all(isinstance(e["cuando"], datetime) for e in s.eventos)
    esperado = gasto.coste("text-embedding-3-small", 12) + 2 * gasto.coste("claude-haiku-5-5", 300, 20)
    assert alm.gasto_total() == pytest.approx(esperado)


def test_n5_buscar_freno_y_fallos():
    alm = AlmacenEnMemoria()
    alm.anotar_gasto("escritor", "claude-haiku-5-5", 0, 0, 2.0)
    s = _sesion(turnos=[])
    emb = EmbedderFalso()
    asyncio.run(busqueda.buscar("hola", s, embedder=emb, indice=Indice([_hit("a", 0.9)]), juez=Juez({}),
                                freno=gasto.Freno(tope=1.0, almacen=alm), umbral=0.5))
    assert emb.llamadas == [] and s.eventos == []        # freno echado: nada de pago

    fr = gasto.Freno(tope=1.0, almacen=AlmacenEnMemoria())
    s = _sesion(turnos=[])
    asyncio.run(busqueda.buscar("hola", s, embedder=EmbedderFalso(falla=True), indice=Indice([_hit("a", 0.9)]),
                                juez=Juez({}), freno=fr, umbral=0.5))
    assert s.eventos == [] and s.contexto == []           # sin contexto previo: queda una lista vacía
    asyncio.run(busqueda.buscar("hola", s, embedder=EmbedderFalso(), indice=Indice([_hit("a", 0.9)]),
                                juez=Juez({}, falla=True), freno=fr, umbral=0.5))
    assert [e["pertinente"] for e in s.eventos] == [None] and s.contexto == []


# N6 — cerrar con repaso: refuerza lo usado y apunta los fallos válidos (D45)
def test_n6_repaso():
    alm = AlmacenEnMemoria()
    ida = alm.guardar(sesion_id="s0", cliente="konnos", recuerdo=Recuerdo("Tiene examen.", 4, "happy", None),
                      vector=None, creado_dia=1)
    idb = alm.guardar(sesion_id="s0", cliente="konnos", recuerdo=Recuerdo("Va a pilates.", 2, "smug", None),
                      vector=None, creado_dia=1)
    alm.anotar_dia_uso(date(2026, 10, 19))
    s = _sesion(dia=20)
    s.contexto = alm.recuerdos()
    s.eventos = [{"tipo": "candidato", "recuerdo_id": idb, "similitud": 0.6, "pertinente": False,
                  "mensaje": SECRETO, "cuando": datetime(2026, 10, 20, 20, 1)}]
    rep = Repasador({"usados": [ida, ida, "inventado"], "fallos": [
        {"tipo": "F3", "recuerdo": idb}, {"tipo": "F4", "recuerdo": None},
        {"tipo": "F9", "recuerdo": None}, {"tipo": "F5", "recuerdo": "inventado"}, {"tipo": "F3", "recuerdo": None},
    ]})
    assert _cerrar(s, alm, repasador=rep) == 0
    [(transcripcion, ids)] = rep.llamadas
    assert transcripcion == memoria.transcripcion(s.turnos) and ids == [ida, idb]
    por_id = {r["id"]: r for r in alm.recuerdos()}
    assert (por_id[ida]["usos"], por_id[ida]["ultimo_uso_dia"]) == (1, 2)
    assert (por_id[idb]["usos"], por_id[idb]["ultimo_uso_dia"]) == (0, None)
    # F9 no existe; F5 y F3 necesitan un recuerdo del contexto; F4 puede ir sin él
    assert sorted((e["tipo"], e["recuerdo_id"] or "") for e in alm.eventos()) == [
        ("F3", idb), ("F4", ""), ("candidato", idb)]
    assert all(e["sesion_id"] == "s1" for e in alm.eventos())


def test_n6_sin_repaso():
    alm = AlmacenEnMemoria()
    rep = Repasador({"usados": [], "fallos": []})
    s = _sesion()
    s.contexto = []
    _cerrar(s, alm, repasador=rep)                         # sin recuerdos en el contexto: no hay repaso
    s = _sesion("s2")
    s.contexto = [_rec("a", "x")]
    alm.anotar_gasto("escritor", "claude-haiku-5-5", 0, 0, 2.0)
    _cerrar(s, alm, repasador=rep)                         # freno echado: tampoco
    assert rep.llamadas == []


def test_n6_sesion_vacia():
    alm = AlmacenEnMemoria()
    esc = EscritorFalso({"recuerdos": [{"texto": "No.", "importancia": 3, "emocion": "neutral", "fecha": None}]})
    assert _cerrar(_sesion(turnos=[]), alm, escritor=esc) == 0
    assert esc.llamadas == [] and alm.sesiones_anotadas() == [] and alm.recuerdos() == []


# N7 — la poda corre al cerrar: lo podado sale de `recuerdos()` (D46)
def test_n7_poda_al_cerrar():
    alm = AlmacenEnMemoria()
    alm.guardar(sesion_id="s0", cliente="konnos", recuerdo=Recuerdo("Anécdota vieja.", 1, "neutral", None),
                vector=None, creado_dia=1)
    for d in range(1, 20):
        alm.anotar_dia_uso(date(2026, 9, d))
    _cerrar(_sesion(dia=20), alm)                          # día de uso 20
    assert alm.recuerdos() == []


# N8 — el prompt del narrador: un bloque más solo si hay recuerdos; /health cuenta sesiones (D43)
def test_n8_system_y_health():
    import app

    assert app._system(None) == app.SYSTEM_PROMPT
    s = _sesion()
    s.dia = 3
    s.contexto = []
    assert app._system(s) == app.SYSTEM_PROMPT
    s.contexto = [_rec("a", "Va a pilates.")]
    assert app._system(s) == [
        {"type": "text", "text": app.SYSTEM_PROMPT},
        {"type": "text", "text": memoria.bloque(s.contexto, 3, date(2026, 10, 20))},
    ]
    assert isinstance(asyncio.run(app.health())["sesiones"], int)


# N9 — búsqueda y repaso tampoco llevan texto a los logs (D42)
def test_n9_logs_sin_texto(caplog):
    caplog.set_level(logging.DEBUG)
    alm = AlmacenEnMemoria()
    fr = gasto.Freno(tope=1.0, almacen=alm)
    s = _sesion()
    s.contexto = []
    hit = _rec("r1", f"Va a {SECRETO}.")
    hit["similitud"] = 0.8
    asyncio.run(busqueda.buscar(f"¿Y el {SECRETO}?", s, embedder=EmbedderFalso(), indice=Indice([hit]),
                                juez=Juez({f"Va a {SECRETO}.": True}), freno=fr, umbral=0.5))
    assert "F1" in caplog.text                             # el F1 se avisa en el log, sin texto
    _cerrar(s, alm, freno=fr, repasador=Repasador({"usados": ["r1"], "fallos": [{"tipo": "F4", "recuerdo": None}]}))
    assert SECRETO not in caplog.text


# N10 — esquemas y prompts del juez y del repaso (D44, D45)
def test_n10_esquemas():
    j = escritor.ESQUEMA_JUEZ
    assert j["required"] == ["pertinente"] and j["additionalProperties"] is False
    assert j["properties"]["pertinente"]["type"] == "boolean"
    r = escritor.ESQUEMA_REPASO
    assert set(r["required"]) == {"usados", "fallos"} and r["additionalProperties"] is False
    f = r["properties"]["fallos"]["items"]
    assert f["properties"]["tipo"]["enum"] == ["F3", "F4", "F5"]
    assert set(f["required"]) == {"tipo", "recuerdo"} and f["additionalProperties"] is False
    for nombre in ("juez_prompt.md", "repaso_prompt.md"):
        assert (SERVER / nombre).read_text(encoding="utf-8").strip()
