# tomorrow.md — klothulhu

**Parada:** fase 6 en `fase6` (worktree `/data/klothulhu-fase6`). H1 (panel 📜, D27) cerrado y probado. H3 (saludo ominoso,
D29) y H4 (tamaños `normal`/`narrow` + `estado.json`, D31 superada en parte por D32) aprobados en código por el arquitecto
(H3-revision; H4-revision §5, c22441a). `npm test` 60, `pytest` 42, `ruff`. **H2 (emoción `sad`, D28) no empieza**: espera al
motor nuevo de claude-fables y a un plan completo del arquitecto.

**Siguiente paso:** nada del programador hasta el plan de H2. Pendiente de Josem: probar S1-S4 (H3) y Z1-Z6 (H4) en Konnos
(si pide retoques, llegarán como sección nueva en la revisión), y luego merge `--ff-only` de `fase6` en `main` + `git pull` en
Konnos (solo cliente, sin reinicio del servicio).

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree (`npm ci` hecho en `desktop/`).
- `fase6-h1.test.js`, `fase6-h3.test.js` y `fase6-h4.test.js` (v2, sha256 `55adfc0a…`) son normativas: no se editan.
- `estado.json` vive en `%APPDATA%\klothulhu-desktop\` (Konnos); borrarlo devuelve tamaño y sitio por defecto. `config.json` no se escribe.
- En el renderer, `historyPanel` (no `history`); `PANEL_W` llega por `init` y `layout.js` es del proceso principal.
- Automensaje activo con klothulhu-77 (arquitecto).

**Bloqueos:** ninguno.
