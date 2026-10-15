# CLAUDE.md — klothulhu

Companion de escritorio: un personaje que contesta con emociones. Contexto detallado en `README.md`.

## Arquitectura

- `server/` — FastAPI en seb01 (`klothulhu-api.service`). Guarda la clave de Anthropic, el prompt
  (`server/prompt.md`) y el historial; manda la respuesta por SSE (`emotion`, `delta`, `done`, `error`).
- `desktop/` — cliente Electron en JavaScript plano, sin build, que corre en Konnos (Windows).
  `main.js` hace la red (el token no llega al renderer); `renderer/` pinta.
- Pintado (v2): el motor de claude-fables, vendorizado en `desktop/renderer/vendor/` (ver `VENDOR.md`),
  convierte una escena JSON en un SVG animado que se muestra como `<img>`. `renderer/scenes.js` es
  lógica pura (troceo en frases, `STAGING` por emoción, textos fijos) y también se carga desde Node.
- Director (v2, fase 2): tras el narrador, `server/beats.py` trocea la respuesta (mismas reglas que
  `scenes.js`, casos compartidos en `tests/fixtures/`) y `server/director.py` pide a un segundo modelo la
  puesta en escena de cada golpe, en streaming (D19); `app.py` manda cada evento `scene` en cuanto llega.
  El corte de frases largas es equilibrado (D18) y debe ser idéntico en `beats.py` y `scenes.js`. `scene: null` = el cliente usa
  su escena fija. El vocabulario del motor vive en `server/fables_vocab.json`: se regenera con
  `node desktop/scripts/export-vocab.js` al actualizar el motor (prueba F1).
- Las emociones están en `server/emotion_parser.py` y en `scenes.js`; deben coincidir (prueba P7).

## Comandos

```bash
.venv/bin/python -m pytest -q tests      # servidor (Python 3.12, deps: requirements-dev.txt; KLOTHULHU_FAKE=1 para no gastar API)
.venv/bin/ruff check .                   # lint del servidor
cd desktop && npm ci && npm test         # cliente: node --test, sin Electron
cd desktop && npm run check              # node --check de los ficheros del cliente
```

## Reglas

- **`/data/klothulhu` se queda en `main`:** `klothulhu-api.service` arranca desde ahí. Para trabajar
  en una rama, `git worktree add ../klothulhu-<rama> <rama>`; copia `.env`/`config.json`, no symlink.
  Merge `--ff-only` desde `/data/klothulhu` y reinicio del servicio lo hace Josem.
- Electron está fijado (D11). El SVG nunca se mete con `innerHTML` (D10).
- Las pruebas normativas de una fase (`desktop/test/fase1.test.js`) no se editan para que pasen.

## Decisiones

Registro de decisiones (D<n>) y ficha: vault, `30-projects/klothulhu/ficha.md` § Decisiones.
Cítalas en el código como `D<n>`. Fase en curso: `docs/fase<n>/` (plan, informes, revisiones).
