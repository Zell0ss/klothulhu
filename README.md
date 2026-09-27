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
| `done`    | `{"turns": 3}`           | Reply complete and stored in history.   |
| `error`   | `{"code": "..."}`        | `upstream_error`. HTTP errors: 401, 409 busy, 422. |

Emotions: `neutral happy annoyed confused smug sleepy`. The list lives in
`server/emotion_parser.py` and the pose table in `desktop/renderer/index.html`
(`EMOTIONS`); keep both in sync. "Thinking" is a client-only state between
sending and the first event.

Other endpoints: `GET /health` (no auth), `DELETE /history` (auth).

History: per client, last `KLOTHULHU_HISTORY_TURNS` exchanges, wiped after
`KLOTHULHU_HISTORY_TTL_MIN` minutes without activity. In memory only, so a
restart clears it. Only complete replies are stored.

## Server on seb01

```bash
sudo mkdir -p /data/klothulhu /etc/klothulhu
# copy this repo (server/ and tests/) to /data/klothulhu
cd /data/klothulhu
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/pip install pytest && .venv/bin/python -m pytest -q tests

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

Requires Node.js 20+.

```powershell
cd desktop
npm install
copy config.example.json config.json   # apiUrl + konnos token
npm start
```

- Click on klothulhu (or `Ctrl+Alt+K`) to open the input, `Enter` to send, `Esc` to close.
- Drag him anywhere. Clicks on transparent areas go through to the desktop.
- Tray icon: show/hide, talk, forget conversation, quit.
- The token stays in the main process; the renderer never sees it.

### Sprites

`desktop/renderer/sprites/*.png` are the Procreate layers extracted from
`klothulhu-sprite-design.html`, all 320x240 and stacked at (0,0). New layers
with the same canvas size are picked up automatically. For the thinking pose,
add `Ojos7.png` (looking left) and `Ojos8.png` (looking right); until then the
client slides `Ojos1` 5 px to each side.

## Not in this POC

- Long-term memory (vector DB). The hook is `_model_stream` in `server/app.py`,
  where context is assembled. Start read-only, separate collection, log what
  gets injected per reply.
- Packaging to a single `.exe` (electron-builder) and autostart.
- Multi-monitor DPI changes while the window is open.
