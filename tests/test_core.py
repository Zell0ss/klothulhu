import pytest

from emotion_parser import EmotionStreamParser
from history import HistoryStore


def run(chunks):
    p = EmotionStreamParser()
    out = []
    for c in chunks:
        out += p.feed(c)
    out += p.flush()
    # merge deltas across feed boundaries for easier asserts
    merged = []
    for k, v in out:
        if merged and k == "delta" and merged[-1][0] == "delta":
            merged[-1] = ("delta", merged[-1][1] + v)
        else:
            merged.append((k, v))
    return merged, p


def test_leading_tag():
    out, _ = run(["[happy] Hola mortal."])
    assert out == [("emotion", "happy"), ("delta", "Hola mortal.")]


def test_tag_split_across_chunks():
    out, _ = run(["[ha", "ppy", "] Ho", "la. [sm", "ug] Ja."])
    assert out == [("emotion", "happy"), ("delta", "Hola. "), ("emotion", "smug"), ("delta", "Ja.")]


def test_missing_tag_defaults_to_neutral():
    out, _ = run(["Sin etiqueta."])
    assert out == [("emotion", "neutral"), ("delta", "Sin etiqueta.")]


def test_unknown_tag_maps_to_neutral_and_is_reported():
    out, p = run(["[furious] Grr."])
    assert out == [("emotion", "neutral"), ("delta", "Grr.")]
    assert p.unknown_tags == ["furious"]


def test_brackets_that_are_not_tags_pass_through():
    out, _ = run(["[neutral] Usa a[0] y [1, 2]."])
    assert out == [("emotion", "neutral"), ("delta", "Usa a[0] y [1, 2].")]


def test_unclosed_bracket_at_end_is_flushed_as_text():
    out, _ = run(["[neutral] Fin [abierto"])
    assert out == [("emotion", "neutral"), ("delta", "Fin [abierto")]


class Clock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def test_history_keeps_last_n_turns():
    h = HistoryStore(max_turns=2, ttl_seconds=60, clock=Clock())
    for i in range(3):
        h.append("k", f"q{i}", f"a{i}")
    assert [m["content"] for m in h.messages("k")] == ["q1", "a1", "q2", "a2"]


def test_history_expires_after_ttl():
    clock = Clock()
    h = HistoryStore(max_turns=6, ttl_seconds=1800, clock=clock)
    h.append("k", "q", "a")
    clock.t = 1799
    assert len(h.messages("k")) == 2
    clock.t = 1799 + 1800
    assert h.messages("k") == []


def test_history_is_per_client():
    h = HistoryStore(max_turns=6, ttl_seconds=60, clock=Clock())
    h.append("konnos", "q", "a")
    assert h.messages("pi") == []
