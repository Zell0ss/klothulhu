# tomorrow.md — klothulhu

**Parada:** fase 6 en `fase6` (worktree `/data/klothulhu-fase6`). H1, H3 y H4 aprobados. **H2 (emoción `sad`, D28; motor v3,
D30; `emerge`, D33) aprobado en las dos paradas** (H2-revision §4, 90565d8): T7 real pasada (21 preguntas, $0,0076, capturas en
`docs/fase6/capturas/`). Nada más del programador.

**Siguiente paso:** esperar a Josem: V1-V4 de H2 en Konnos con el servidor de la rama, S1-S4 (H3) y Z1-Z6 (H4). Si piden
retoques, llegarán como sección nueva al final de la revisión correspondiente. El merge `--ff-only` de `fase6` en `main`, el
reinicio de `klothulhu-api` (H2 toca servidor) y el `git pull` en Konnos son de Josem.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree (`npm ci` hecho en `desktop/`).
- `fase6-h1/h3/h4.test.js` son normativas: no se editan.
- `despair` salió 1/21 y `emerge` 10/21 en la pasada real; el juicio sobre D28/D30 es del arquitecto.
- `api_smoke.py` necesita `ANTHROPIC_API_KEY` en el entorno; la lanza Josem (no cargo la clave de producción).
- `estado.json` vive en `%APPDATA%\klothulhu-desktop\` (Konnos); `config.json` no se escribe.
- Automensaje activo con klothulhu-70 (arquitecto).

**Bloqueos:** ninguno.
