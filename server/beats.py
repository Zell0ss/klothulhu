"""Trocea la respuesta del narrador en golpes (D13).

Puerto a Python de ``beats()`` de ``desktop/renderer/scenes.js``: las mismas reglas, comprobadas con
``tests/fixtures/beats_cases.json`` desde los dos lados. Si cambias una, cambia la otra.
"""
from __future__ import annotations

import re

CAPTION_MAX = 70

# Fin de frase: . ! ? … (uno o varios, quizá cerrando »"')) seguido de espacio o fin.
_SENTENCE = re.compile(r".*?[.!?…]+[»\"')\]]*(?=\s|$)|.+$", re.DOTALL)


def _split_long(s: str) -> list[str]:
    out: list[str] = []
    while len(s) > CAPTION_MAX:
        i = s.rfind(" ", 0, CAPTION_MAX + 1)
        if i > 0:
            out.append(s[:i])
            s = s[i + 1 :]
        else:
            out.append(s[:CAPTION_MAX])
            s = s[CAPTION_MAX:]
    if s:
        out.append(s)
    return out


def _beats_of_span(span: str) -> list[str]:
    text = re.sub(r"\s+", " ", span).strip()
    if not text:
        return []
    pieces: list[str] = []
    for m in _SENTENCE.findall(text):
        s = m.strip()
        if s:
            pieces.extend(_split_long(s))
    out: list[str] = []
    for p in pieces:
        if out and len(out[-1]) + 1 + len(p) <= CAPTION_MAX:
            out[-1] += " " + p
        else:
            out.append(p)
    return out


def beats(text: str, marks: list[tuple[int, str]]) -> list[tuple[str, str]]:
    """``marks`` = [(posición, emoción)] ordenadas. Nunca se juntan frases de tramos distintos."""
    text = text or ""
    cuts: list[tuple[int, str]] = [(0, "neutral")]
    for at, emotion in marks or []:
        if at <= 0:
            cuts[0] = (0, emotion)
        elif at < len(text):
            cuts.append((at, emotion))
    out: list[tuple[str, str]] = []
    for i, (at, emotion) in enumerate(cuts):
        end = cuts[i + 1][0] if i + 1 < len(cuts) else len(text)
        out.extend((caption, emotion) for caption in _beats_of_span(text[at:end]))
    return out
