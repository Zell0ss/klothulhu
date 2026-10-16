# tomorrow.md — klothulhu

**Parada:** fase 5 cerrada por el arquitecto (H2-revision §5, 2026-10-16). Josem la probó en Konnos contra el servidor
de la rama: «¡Está perfecto!». D24-D26 vigentes; la longitud del narrador se queda como está.
Código en `fase5`, sin merge a `main`. Gasto de la fase: $0,0057 de $0,10.

**Siguiente paso:** nada del programador. Josem despliega **el mismo día**: merge `--ff-only` de `fase5` en `main`
desde `/data/klothulhu`, reinicio de `klothulhu-api` y `git pull` del cliente en Konnos (servidor y cliente van
juntos; un cliente anterior recortaría a 70). Lo que surja después llega como encargo nuevo.

**Gotchas:**
- `/data/klothulhu` se queda en `main`; el desarrollo, en worktrees (`/data/klothulhu-fase5`, `.venv` 3.12 propio).
- `beats()` y sus pruebas siguen aunque ya no pinten nada (deuda para otra fase).
- `approach` no está en `TRAVEL` (D23, G11 lo fija).
- Pasos [API]: la clave la pone Josem en su shell; yo no la tengo.

**Bloqueos:** ninguno.
