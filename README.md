# Klothulhu companion (POC)

klothulhu as a desktop companion. The API key, the character prompt, the
emotion parsing and the short-term history live on **seb01**. Clients are thin
renderers: today the Electron app on Konnos, later the Raspberry Pi bridging the
M5Stack Core2.

```
Konnos (Electron) ──┐
                    ├── Tailscale ──> seb01: klothulhu-api (FastAPI) ──> Anthropic API
Pi -> Core2 (later)─┘
```

## API contract

`POST /chat` with `Authorization: Bearer <token>` and `{"text": "..."}` returns
Server-Sent Events:

| event     | data                     | notes                                   |
|-----------|--------------------------|-----------------------------------------|
| `emotion` | `{"emotion": "happy"}`   | Always first. May repeat mid-reply.     |
| `delta`   | `{"text": "..."}`        | Text chunks, emotion tags already removed. |
| `scene`   | `{"index": 0, "total": 2, "emotion": "smug", "caption": "...", "scene": {...} \| null}` | One per beat, after the last `delta` and before `done` (none if the reply is empty); each is sent as soon as the director has it (D19). |
| `done`    | `{"turns": 3}`           | Reply complete and stored in history.   |
| `error`   | `{"code": "..."}`        | `upstream_error`. HTTP errors: 401, 409 busy, 422. |

**`scene`** (D13, D14): the server splits the reply into beats (`server/beats.py`, same rules as
`scenes.js`) and a second model call, the director, stages each one. `scene` is a full `FablesScene`
(`caption` is the beat, verbatim), or `null` when the director is off (`KLOTHULHU_DIRECTOR=0`), fails,
times out or returns something outside the engine vocabulary: the client then uses its own fixed
staging. Scenes never enter the history. The phase 1 client ignores `scene`.

Settings (env, defaults): `KLOTHULHU_MODEL=claude-haiku-5-5`, `KLOTHULHU_EFFORT=low`,
`KLOTHULHU_MAX_TOKENS=1024`, `KLOTHULHU_DIRECTOR=1`, `KLOTHULHU_DIRECTOR_MODEL=claude-haiku-5-5`,
`KLOTHULHU_DIRECTOR_EFFORT=low`, `KLOTHULHU_DIRECTOR_TIMEOUT=10`, `KLOTHULHU_DIRECTOR_THINKING=1` (`0` = director
without thinking, D19). `GET /health` reports
`director: {enabled, model}`.

Emotions: `neutral happy annoyed confused smug sleepy`. The list lives in
`server/emotion_parser.py` and in `desktop/renderer/scenes.js` (`EMOTIONS`);
keep both in sync (test P7 checks it). "Thinking" is a client-only state between
sending and the first event.

Other endpoints: `GET /health` (no auth), `DELETE /history` (auth).

History: per client, last `KLOTHULHU_HISTORY_TURNS` exchanges, wiped after
`KLOTHULHU_HISTORY_TTL_MIN` minutes without activity. In memory only, so a
restart clears it. Only complete replies are stored.

## Server on seb01

```bash
sudo mkdir -p /etc/klothulhu
git clone https://github.com/Zell0ss/klothulhu /data/klothulhu   # private repo
cd /data/klothulhu
python3.12 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt   # Python 3.12 (D17)
.venv/bin/python -m pytest -q tests

sudo cp server/klothulhu.env.example /etc/klothulhu/klothulhu.env
sudo chmod 600 /etc/klothulhu/klothulhu.env
sudo $EDITOR /etc/klothulhu/klothulhu.env   # key, tokens, KLOTHULHU_HOST=$(tailscale ip -4)

sudo cp server/klothulhu-api.service /etc/systemd/system/   # edit User= and paths first
sudo systemctl daemon-reload && sudo systemctl enable --now klothulhu-api
journalctl -u klothulhu-api -f
```

Smoke test from Konnos or any tailnet node:

```bash
curl -s http://<seb01-tailscale-ip>:8765/health
curl -sN -X POST http://<seb01-tailscale-ip>:8765/chat \
  -H "Authorization: Bearer <konnos-secret>" -H "Content-Type: application/json" \
  -d '{"text":"hola"}'
```

Set `KLOTHULHU_FAKE=1` to get canned replies without calling the model.

The character lives in `server/prompt.md`; edit and restart the service.

## Desktop client on Konnos

Plain JavaScript (no TypeScript, no build step). Requires Node.js 20+.

```powershell
cd desktop
npm ci                                  # Electron is pinned (44.4.5) with a lockfile
copy config.example.json config.json   # apiUrl + konnos token (+ optional look)
npm test                                # pure logic: scenes, vendored engine, CSP
npm start
```

v2: the character is drawn by the **claude-fables engine** (a scene JSON becomes an
animated SVG). The window shows one 640x128 strip (scaled by `scale`). Each
sentence of a reply becomes one fixed scene chosen by its emotion, and the
scenes play in turn, each for as long as it takes to read it. `config.json`
accepts `look` (default `"pixel"`; an unknown value falls back to `pixel`, see
`VOCAB.looks` in the engine).

- Click on klothulhu (or `Ctrl+Alt+K`) to open the input, `Enter` to send, `Esc` to close.
- Drag him anywhere. The whole strip is interactive; clicks outside it go through to the desktop.
- The 📋 button copies the whole reply; the ✕ button quits the app.
- Tray icon: show/hide, talk, forget conversation, quit.
- Desktop shortcut on Windows: run `desktop/create-shortcut.ps` from `desktop/`
  (uses `klothulhu.ico`).
- The token stays in the main process; the renderer never sees it.

### Scenes

`desktop/renderer/scenes.js` is pure data and functions (no DOM, loadable from
Node): `STAGING` holds the backdrop, hero action, particles and tone for each
emotion plus `thinking` and `idle`, `LINES` the fixed texts, and `beats()` splits a
reply into one caption per sentence (max 70 characters, never mixing emotions).
Tweak `STAGING` to change the look of an emotion; `npm test` checks the engine
still paints it without corrections.

The engine is vendored in `desktop/renderer/vendor/` (only the IIFE build). How
it got there and how to update it: `vendor/VENDOR.md`.

## Not in this POC

- Long-term memory (vector DB). The hook is `_model_stream` in `server/app.py`,
  where context is assembled. Start read-only, separate collection, log what
  gets injected per reply.
- Packaging to a single `.exe` (electron-builder) and autostart.
- Multi-monitor DPI changes while the window is open.
