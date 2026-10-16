# tomorrow.md — klothulhu

**Parada:** fase 6, H1 (panel de historial, D27) hecho en `fase6` (worktree `/data/klothulhu-fase6`): T1-T5, `npm test` 49,
`pytest` 42, `ruff`. Informe: `docs/fase6/H1-informe.md`. Revisión aprobada y K1-K6 pasan en Konnos (H1-revision §6, 2026-10-16;
el retoque del §5 se retiró: K5 fallaba por el icono oculto del tray, no por el código). **H2 (emoción `sad`, D28) no empieza**: espera al motor nuevo de claude-fables y a un
plan completo del arquitecto.

**Siguiente paso:** nada del programador hasta el plan de H2. Merge `--ff-only` de
`fase6` en `main` y `git pull` en Konnos: de Josem (H1 es solo cliente, sin reinicio del servicio); si H2 va en la misma
rama, el merge espera.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; `.venv` 3.12 propio en el worktree (`npm ci` hecho en `desktop/`).
- `fase6-h1.test.js` es normativa: no se edita.
- En el renderer, `historyPanel` (no `history`) para no chocar con `window.history`.
- `PANEL_W` llega al renderer por `init` (`panelW`); `layout.js` es del proceso principal.

**Bloqueos:** ninguno.
