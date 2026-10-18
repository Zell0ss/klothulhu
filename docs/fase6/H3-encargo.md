---
proyecto: klothulhu
fase: 6
hito: H3
titulo: saludo ominoso
fecha: 2026-10-18
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D29; también D10, D21, D25)"
gasto_autorizado: "ninguno: no se llama a la API"
---

# H3 · Saludo ominoso (D29)

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-18.

## Para el programador

Responde a: 74bf505 (H1-informe)

### 0. Qué y por qué

Al arrancar, klothulhu saluda hoy con la escena fija de `happy` (bosque, salto, celebración) y «klothulhu
despierta. Pulsa…». Josem quiere una entrada de old one: que despierte enfadado. Es solo el cliente, sin
servidor ni director, y no cambia ningún contrato. H2 (`sad`) sigue esperando a claude-fables. Este hito
va antes, en la misma rama `fase6` y en el worktree `/data/klothulhu-fase6`.

**Fuera de alcance:**
- la acción `emerge` (D30, pedida a claude-fables; cuando llegue, sustituirá a `approach` en la escena 2);
- el saludo solo en el primer arranque del día;
- tocar la escena `idle` o las de error;
- `server/`.

### 1. Lista previa (convención §4)

- **¿Borra o sobrescribe ficheros o datos?** No.
- **¿API externa?** No. Gasto: 0.
- **¿Producción?** No hace falta reiniciar el servicio. Josem hace el merge y el `git pull` en Konnos.

### 2. Tareas

#### T1 · `renderer/scenes.js`: `bootScenes(hotkey)` y `LINES.boot`

`bootScenes(hotkey)` es pura y se exporta. Devuelve **tres items de cola** `{ kind, caption, scene }`, con
`caption === scene.caption`. `kind` es la escena fija de reserva si el motor rechazara la escena (D21.2).
Cada llamada da objetos nuevos (L4). La paleta va en una constante y se copia en cada escena.

| # | kind | backdrop | palette | hero | particles | tone | caption |
|---|---|---|---|---|---|---|---|
| 1 | `sleepy` | `night` | — | `sleep` 50→50 | stars 0,2 | `work` | `Algo se agita bajo tu escritorio…` |
| 2 | `annoyed` | `volcano` | `sky #2a0608`, `ground #140405`, `accent #ff3b1f` | `approach` 30→50, `then: 'angry'` | sparks 0,8 | `trouble` | `¡¡KLOTHULHU DESPIERTA!!` |
| 3 | `smug` | `volcano` | la misma | `angry` 50→50, `then: 'point'` | sparks 0,3 | `work` | `LINES.boot(hotkey)` |

`LINES.boot` deja de decir «despierta» (el grito ya va en la escena 2):

```
klothulhu escucha, mortal. Pulsa ${Ctrl+…} o haz clic para hablar.
```

Con el mismo `replace(/Control/, 'Ctrl')` y el mismo `.slice(0, CAPTION_MAX)`. P8 (fase 1) sigue pasando:
contiene «klothulhu».

Pon un comentario que cite `D29` sobre `bootScenes`. Los números son un punto de partida: si Josem los
quiere retocar, se cambian en la tabla y en el código, y L1-L2 siguen valiendo.

#### T2 · `renderer/index.html`

- Añade `bootScenes` a la desestructuración de `window.KlScenes`.
- En el arranque (`kl.init().then`), cambia `enqueue([{ kind: 'happy', caption: LINES.boot(cfg.hotkey) }])`
  por `enqueue(bootScenes(cfg.hotkey))`.
- Nada más: la cola, el tiempo de cada escena (D25) y el paso a `idle` a los 30 s no cambian.

#### T3 · Pruebas y README

- Prueba normativa: copiar **byte a byte** `docs/fase6/normativas/fase6-h3.test.js` a
  `desktop/test/fase6-h3.test.js`. Su sha256 es
  `cfdef9c3fdb8132e01df37bccc47c8906d9a00bef946c82433fdb4e2365974a1`.
- README del cliente: si describe el saludo, actualízalo en una línea.

**Comprobado:** monté en mi scratchpad un prototipo de T1 y T2. Las 5 pruebas nuevas pasan, y el cliente
queda en 54 (49 + 5). Impleméntalo tú.

### 3. Parada

- `npm test` 54;
- `npm run check`;
- `pytest` y `ruff` sin cambios.

**Para** y deja `docs/fase6/H3-informe.md`, con commit. Josem lo prueba en Konnos con esta lista:

| # | Qué mirar |
|---|---|
| S1 | Al arrancar: dormido en la noche → en el volcán rojo, se acerca y se enfada con «¡¡KLOTHULHU DESPIERTA!!» → la ayuda, sin cambiar de fondo |
| S2 | En 3D se ven los ojos de enfado en las escenas 2 y 3 |
| S3 | A los 30 s sin hablarle se duerme, como antes |
| S4 | Si le hablas mientras saluda, la respuesta entra como siempre |
