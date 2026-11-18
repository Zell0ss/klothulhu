"""Imágenes en la conversación (fase 10, D56, D57). Módulo puro: sin red, sin disco y sin logs.

El cliente manda una imagen en base64 por mensaje. Aquí se valida antes de gastar nada y se convierte en
el contenido que entiende el narrador (bloque ``image`` + bloque ``text``). Lo que no es el narrador (la
memoria larga y el director) nunca ve la imagen: recibe ``texto_memoria`` (D57).
"""
from __future__ import annotations

import base64
import binascii

MEDIA_TYPES = ("image/jpeg", "image/png", "image/webp", "image/gif")
MAX_BYTES = 4_000_000  # decodificada; el límite de Anthropic es 10 MB en base64 y los clientes mandan ~300 KB

# Frases en tercera persona y sin corchetes: los corchetes son de las etiquetas de emoción.
SIN_TEXTO = "(El mortal enseña una imagen sin decir nada.)"
MARCA = "(El mortal enseña una imagen.)"

# Longitud máxima del base64 de MAX_BYTES: se mira antes de decodificar para no tragarse un cuerpo enorme.
_MAX_B64 = (MAX_BYTES + 2) // 3 * 4


class ImagenInvalida(ValueError):
    """La imagen no sirve. ``code`` es lo que viaja al cliente: image_type, image_base64, image_size o
    image_mismatch."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _coincide(media_type: str, raw: bytes) -> bool:
    """Los primeros bytes tienen que ser los del tipo declarado: el contenido manda, no la cabecera."""
    if media_type == "image/png":
        return raw.startswith(b"\x89PNG")
    if media_type == "image/jpeg":
        return raw.startswith(b"\xff\xd8\xff")
    if media_type == "image/gif":
        return raw.startswith(b"GIF8")
    if media_type == "image/webp":
        return len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    return False


def validar(media_type: str, data: str) -> bytes:
    """Devuelve la imagen decodificada o lanza ``ImagenInvalida``. Así no llega a Anthropic nada que vaya
    a rechazar."""
    if media_type not in MEDIA_TYPES:
        raise ImagenInvalida("image_type")
    if not isinstance(data, str) or not data:
        raise ImagenInvalida("image_base64")
    if len(data) > _MAX_B64:
        raise ImagenInvalida("image_size")
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise ImagenInvalida("image_base64") from None
    if not raw:
        raise ImagenInvalida("image_base64")
    if len(raw) > MAX_BYTES:
        raise ImagenInvalida("image_size")
    if not _coincide(media_type, raw):
        raise ImagenInvalida("image_mismatch")
    return raw


def contenido(texto: str, media_type: str, data: str) -> list[dict]:
    """El mensaje del usuario con imagen: la imagen primero y el texto después, como recomienda la
    documentación. Sin texto, el bloque de texto es ``SIN_TEXTO``."""
    return [
        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}},
        {"type": "text", "text": (texto or "").strip() or SIN_TEXTO},
    ]


def texto_memoria(texto: str) -> str:
    """Lo que ven la memoria larga y el director en lugar de la imagen (D57)."""
    t = (texto or "").strip()
    return f"{MARCA} {t}" if t else MARCA
