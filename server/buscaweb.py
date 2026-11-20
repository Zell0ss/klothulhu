"""Búsqueda web del narrador (fase 11, D58, D59, D60).

Se usa la herramienta de servidor de Anthropic (``web_search``): la búsqueda ocurre dentro de la misma
petición, así que el streaming no cambia de forma. Este módulo es puro (sin red ni estado global):

- ``herramienta`` y ``Cuota``: qué se le da al modelo y cuántas búsquedas quedan hoy (D58);
- ``Traductor``: de los eventos crudos del stream a texto y al aviso ``BUSCANDO``;
- ``fuentes``: de lo que el modelo *citó* (nunca de lo que solo recibió) a los enlaces que se enseñan (D60).

Nada de lo que viaja por aquí (consulta, resultados, URLs) se escribe en los logs ni en el historial
(D59, D42).
"""
from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

TOOL_TYPE = "web_search_20250305"  # la versión básica: sin filtrado dinámico por código (más rápida)
MAX_USES = 2  # búsquedas por mensaje
TOPE_DIA = 30  # búsquedas por día (D58)
MAX_FUENTES = 5
MAX_CONSULTADAS = 3  # si el modelo no cita nada, los primeros resultados que consultó (D61)
TITULO_MAX = 80
ZONA = ZoneInfo("Europe/Madrid")

# Sin corchetes ni comillas: va dentro del `system`, y el narrador no debe copiar etiquetas de ahí.
AGOTADA = "(Hoy los grimorios están cerrados: no puedes buscar más hasta mañana.)"


def herramienta(max_uses: int = MAX_USES) -> dict:
    return {
        "type": TOOL_TYPE,
        "name": "web_search",
        "max_uses": max_uses,
        "user_location": {"type": "approximate", "country": "ES", "timezone": "Europe/Madrid"},
    }


def _hoy_madrid() -> date:
    return datetime.now(ZONA).date()


class Cuota:
    """Búsquedas que quedan hoy. Vive en la memoria del proceso: un reinicio la pone a cero (D58)."""

    def __init__(self, tope: int, hoy: Callable[[], date] = _hoy_madrid):
        self.tope = max(0, int(tope))
        self._hoy = hoy
        self._dia = hoy()
        self._usadas = 0

    def _al_dia(self) -> None:
        hoy = self._hoy()
        if hoy != self._dia:
            self._dia, self._usadas = hoy, 0

    def quedan(self) -> int:
        self._al_dia()
        return max(0, self.tope - self._usadas)

    def anotar(self, n: int | None) -> None:
        self._al_dia()
        self._usadas += max(0, int(n or 0))


def permitidas(cuota: Cuota) -> int:
    """Búsquedas que puede hacer el próximo mensaje."""
    return min(MAX_USES, cuota.quedan())


class _Buscando:
    """El aviso «el modelo ha lanzado una búsqueda», en el mismo flujo que el texto."""

    def __repr__(self) -> str:
        return "BUSCANDO"


BUSCANDO = _Buscando()


@dataclass
class Fuentes:
    """Los enlaces, siempre el último elemento de lo que cede el narrador. ``tipo``: ``"citadas"`` (lo que
    el modelo citó, D60) o ``"consultadas"`` (lo que leyó, cuando no citó nada, D61)."""

    items: list[dict] = field(default_factory=list)
    tipo: str = "citadas"


class Traductor:
    """Convierte los eventos crudos del stream (dicts) en ``str`` (texto) o ``BUSCANDO``.

    Todo lo demás (pensamiento, la consulta en ``input_json_delta``, citas, desconocidos) se ignora: la
    consulta no sale de aquí (D59)."""

    def __init__(self) -> None:
        self._emitido = ""
        self._tras_busqueda = False  # el próximo texto es el primero que sigue a un resultado de búsqueda

    def feed(self, evento: dict) -> list:
        tipo = evento.get("type")
        if tipo == "content_block_start":
            bloque = evento.get("content_block") or {}
            if bloque.get("type") == "server_tool_use" and bloque.get("name") == "web_search":
                return [BUSCANDO]
            if bloque.get("type") == "web_search_tool_result":
                self._tras_busqueda = True
            return []
        if tipo == "content_block_delta":
            delta = evento.get("delta") or {}
            texto = delta.get("text") if delta.get("type") == "text_delta" else None
            if not texto:
                return []
            salida = []
            if self._tras_busqueda:
                self._tras_busqueda = False
                # «grimorios.» + «Mañana» saldría pegado; entre bloques sin búsqueda no se toca nada,
                # porque con citas el modelo parte una frase en varios bloques.
                if self._emitido and not self._emitido[-1].isspace() and not texto[0].isspace():
                    salida.append(" ")
            salida.append(texto)
            self._emitido += "".join(salida)
            return salida
        return []


def _dominio(url: str) -> str:
    host = urlsplit(url).hostname or ""
    return host.removeprefix("www.")


def _segura(url) -> bool:
    if not isinstance(url, str):
        return False
    try:
        partes = urlsplit(url)
    except ValueError:
        return False
    return partes.scheme in ("http", "https") and bool(partes.hostname)


def _enlace(url, titulo) -> dict | None:
    """El enlace que se enseña, o None si la URL no es http(s)."""
    if not _segura(url):
        return None
    titulo = re.sub(r"\s+", " ", titulo if isinstance(titulo, str) else "").strip() or _dominio(url)
    if len(titulo) > TITULO_MAX:
        titulo = titulo[: TITULO_MAX - 1].rstrip() + "…"
    return {"title": titulo, "url": url}


def fuentes(content: list[dict]) -> list[dict]:
    """Los enlaces que el modelo citó en sus bloques de texto, en orden, sin repetir y como mucho
    ``MAX_FUENTES``. Un resultado que recibió y no usó no se enseña (D60)."""
    salida: list[dict] = []
    vistas: set[str] = set()
    for bloque in content:
        if bloque.get("type") != "text":
            continue
        for cita in bloque.get("citations") or []:
            if cita.get("type") != "web_search_result_location":
                continue
            url = cita.get("url")
            if url in vistas:
                continue
            enlace = _enlace(url, cita.get("title"))
            if enlace is None:
                continue
            vistas.add(url)
            salida.append(enlace)
            if len(salida) == MAX_FUENTES:
                return salida
    return salida


def _consultadas(content: list[dict]) -> list[dict]:
    salida: list[dict] = []
    vistas: set[str] = set()
    for bloque in content:
        resultados = bloque.get("content") if bloque.get("type") == "web_search_tool_result" else None
        if not isinstance(resultados, list):  # un error de búsqueda llega como objeto: se salta
            continue
        for r in resultados:
            if not isinstance(r, dict) or r.get("url") in vistas:
                continue
            enlace = _enlace(r.get("url"), r.get("title"))
            if enlace is None:
                continue
            vistas.add(r["url"])
            salida.append(enlace)
            if len(salida) == MAX_CONSULTADAS:
                return salida
    return salida


def fuentes_de(content: list[dict]) -> Fuentes:
    """Lo que se enseña bajo la respuesta: lo citado y, si no hay citas, los primeros resultados que
    consultó (D61: el modelo cita poco cuando resume). Sin búsqueda, vacío."""
    citadas = fuentes(content)
    if citadas:
        return Fuentes(citadas, "citadas")
    return Fuentes(_consultadas(content), "consultadas")
