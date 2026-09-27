"""Streaming parser that splits model output into emotion tags and text.

The model is instructed to prefix its reply with a tag such as ``[happy]``
and may switch emotion mid-reply. Tags can arrive split across stream
chunks, so the parser buffers only while a possible tag is still open.
"""
from __future__ import annotations

import re

EMOTIONS = ("neutral", "happy", "annoyed", "confused", "smug", "sleepy")
DEFAULT_EMOTION = "neutral"

_MAX_TAG_LEN = 22  # "[" + 20 chars + "]"
_OPEN_TAG = re.compile(r"\[[A-Za-z_ ]*")
_TAG_NAME = re.compile(r"[a-z_]{1,20}")

Event = tuple[str, str]  # ("emotion" | "delta", payload)


class EmotionStreamParser:
    def __init__(self, allowed: tuple[str, ...] = EMOTIONS) -> None:
        self._allowed = allowed
        self._buf = ""
        self._strip_next_space = False
        self._emitted_emotion = False
        self.unknown_tags: list[str] = []

    def feed(self, chunk: str) -> list[Event]:
        self._buf += chunk
        return self._drain(final=False)

    def flush(self) -> list[Event]:
        return self._drain(final=True)

    def _drain(self, final: bool) -> list[Event]:
        out: list[Event] = []
        while self._buf:
            start = self._buf.find("[")
            if start == -1:
                self._text(out, self._buf)
                self._buf = ""
                break
            if start > 0:
                self._text(out, self._buf[:start])
                self._buf = self._buf[start:]
                continue
            end = self._buf.find("]")
            if end == -1:
                still_possible = (
                    _OPEN_TAG.fullmatch(self._buf) is not None
                    and len(self._buf) < _MAX_TAG_LEN
                )
                if still_possible and not final:
                    break  # wait for more chunks
                self._text(out, self._buf[0])
                self._buf = self._buf[1:]
                continue
            name = self._buf[1:end].strip().lower()
            if _TAG_NAME.fullmatch(name):
                if name not in self._allowed:
                    self.unknown_tags.append(name)
                    name = DEFAULT_EMOTION
                self._emotion(out, name)
                self._buf = self._buf[end + 1 :]
                self._strip_next_space = True
            else:
                self._text(out, self._buf[0])
                self._buf = self._buf[1:]
        return _merge(out)

    def _emotion(self, out: list[Event], name: str) -> None:
        out.append(("emotion", name))
        self._emitted_emotion = True

    def _text(self, out: list[Event], text: str) -> None:
        if self._strip_next_space:
            text = text.lstrip(" ")
            if not text:
                return
            self._strip_next_space = False
        if not self._emitted_emotion:
            # Contract: clients always receive an emotion before any text.
            self._emotion(out, DEFAULT_EMOTION)
        out.append(("delta", text))


def _merge(events: list[Event]) -> list[Event]:
    merged: list[Event] = []
    for kind, payload in events:
        if merged and kind == "delta" and merged[-1][0] == "delta":
            merged[-1] = ("delta", merged[-1][1] + payload)
        else:
            merged.append((kind, payload))
    return merged
