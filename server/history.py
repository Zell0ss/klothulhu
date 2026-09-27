"""Short-term conversation history, kept in process memory.

Per client, it keeps the last ``max_turns`` exchanges and drops everything
once the conversation has been idle for ``ttl_seconds``. A service restart
wipes it, which is acceptable for the POC. Long-term memory is a separate
concern and does not live here.
"""
from __future__ import annotations

import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field


@dataclass
class _Conversation:
    turns: deque = field(default_factory=deque)
    last_activity: float = 0.0


class HistoryStore:
    def __init__(
        self,
        max_turns: int,
        ttl_seconds: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._max_turns = max_turns
        self._ttl = ttl_seconds
        self._clock = clock
        self._conversations: dict[str, _Conversation] = {}

    def messages(self, client_id: str) -> list[dict]:
        """Return prior turns as Anthropic ``messages`` entries, oldest first."""
        conv = self._live(client_id)
        if conv is None:
            return []
        msgs: list[dict] = []
        for user_text, assistant_text in conv.turns:
            msgs.append({"role": "user", "content": user_text})
            msgs.append({"role": "assistant", "content": assistant_text})
        return msgs

    def append(self, client_id: str, user_text: str, assistant_text: str) -> None:
        conv = self._live(client_id)
        if conv is None:
            conv = _Conversation(turns=deque(maxlen=self._max_turns))
            self._conversations[client_id] = conv
        conv.turns.append((user_text, assistant_text))
        conv.last_activity = self._clock()

    def clear(self, client_id: str) -> None:
        self._conversations.pop(client_id, None)

    def _live(self, client_id: str) -> _Conversation | None:
        conv = self._conversations.get(client_id)
        if conv is None:
            return None
        if self._clock() - conv.last_activity >= self._ttl:
            del self._conversations[client_id]
            return None
        return conv
