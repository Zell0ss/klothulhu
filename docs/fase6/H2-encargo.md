---
proyecto: klothulhu
fase: 6
hito: H2
titulo: emoción sad, motor v3 y emerge
plan: arquitecto
fecha: 2026-10-19
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D28, D30, D33; también D10, D23, D26, D29)"
gasto_autorizado: "pendiente: hasta $0.05 en T7 [API], cuando Josem lo autorice en el chat"
---

# H2 · Emoción `sad`, motor v3 y `emerge` (D28, D30, D33)

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-19. Completa el §4 de `PLAN.md`.

## Para el programador

Responde a: 82b80a5 (H4-informe, anexo R2)

### 0. Qué y por qué

claude-fables ha entregado su fase 3 (`PARA-KLOTHULHU.md` §7 en el vault). El motor v3 trae tres acciones:
- `sad`: compasión;
- `despair`: la pena propia de klothulhu, teatral;
- `emerge`: se alza del suelo y flota con los brazos en alto; solo vale como primera acción.

Con eso entra la emoción `sad` (D28), el director aprende las tres acciones (D30, D33) y el saludo se alza con
`emerge` (D29). **Contrato:** sí. La lista de emociones (P7) y el vocabulario del motor (F1) cambian, así que
el plan es mío.

**Fuera de alcance:**
- más emociones;
- cambiar `STAGING` de las otras seis;
- `approach` en `TRAVEL`;
- borrar `beats()`;
- tocar H1, H3 y H4, salvo la escena 2 del saludo.

### 1. Lista previa (convención §4)

- **¿Borra o sobrescribe ficheros o datos?**
  - T1 sobrescribe `desktop/renderer/vendor/fables-motor.iife.js`, `VENDOR.md` y `server/fables_vocab.json`,
    solo en el worktree.
  - El build del motor se hace **fuera** de `/data/claude-fables`, para no tocar su copia de trabajo ni su
    rama: `git -C /data/claude-fables archive 768ac2a | tar -x -C <scratchpad>/fables3`, y luego
    `cd <scratchpad>/fables3/motor && npm ci && npm run build`. Así lo hice yo, y el sha256 coincide con el
    de claude-fables.
  - T7 escribe **solo** en `docs/fase6/capturas/`, con `--out` explícito.
  - Las pruebas no escriben ficheros.
- **¿API externa?** Solo en T7 [API].
  - Mismos modelos que en producción: `claude-haiku-5-5` para el narrador y el director, con el director sin
    pensamiento (D16, D20). Lo comprobé con la skill `claude-api`: $0,10 / $0,50 por millón de tokens de
    entrada y salida.
  - La fase 5 gastó $0,0057 en 16 preguntas; con 21, se esperan unos **$0,008**. Tope del script: $0,05.
  - **No se ejecuta hasta que Josem autorice el gasto en el chat** y yo lo anote en el frontmatter.
- **¿Producción?** Sí, al final, y todo lo hace Josem:
  - merge `--ff-only` de `fase6` en `main` desde `/data/klothulhu`;
  - **reinicio de `klothulhu-api.service`**, porque cambian el narrador, el parser, el director y el vocabulario;
  - el mismo día, `git pull` del cliente en Konnos.

  Un cliente viejo con el servidor nuevo seguiría funcionando: pintaría `sad` como `neutral` y las escenas
  nuevas con su escena fija. Pero se despliegan juntos.

### 2. Tareas

Rama `fase6`, worktree `/data/klothulhu-fase6`. Una tarea, un commit.

#### T1 · Motor v3 vendorizado (D33)

1. Construye el motor como en el §1 y comprueba que el sha256 de `dist/fables-motor.iife.js` es
   `9036840292481ce91afde4fd716efc17e67bf40cc00ce4860b4eacce5d0c6459`.
2. Cópialo a `desktop/renderer/vendor/`. No lleva conversión de finales de línea (N7).
3. `VENDOR.md`:
   - origen `768ac2a` (fase 3 de claude-fables, rama `fase3-motor`);
   - el sha256 de arriba;
   - `SCHEMA_VERSION` 3.
4. `node desktop/scripts/export-vocab.js`: en `server/fables_vocab.json` cambian solo `schemaVersion` y las
   tres acciones (F1).
5. **Pruebas normativas superadas (D33).** Cambia **solo** estas tres líneas:
   - `desktop/test/fase1.test.js`, P9: `assert.equal(M.SCHEMA_VERSION, 2);  // D25: motor v2` →
     `assert.equal(M.SCHEMA_VERSION, 3);  // D33: motor v3`
   - `desktop/test/fase5.test.js`, I2: `assert.equal(M.SCHEMA_VERSION, 2);` →
     `assert.equal(M.SCHEMA_VERSION, 3);  // D33: motor v3`
   - `tests/test_fase5.py`, H2: `assert VOCAB["schemaVersion"] == 2` →
     `assert VOCAB["schemaVersion"] == 3  # D33: motor v3`

#### T2 · La emoción `sad` (D28)

- `server/emotion_parser.py`: `EMOTIONS` con `"sad"` al final.
- `desktop/renderer/scenes.js`:
  - `EMOTIONS` con `'sad'` al final (P7);
  - `STAGING.sad`, antes de `thinking`:
    ```js
    sad:      { backdrop: 'desert',  hero: hero('approach', 30, 50, 'sad'),   particles: { kind: 'rain', density: 0.3 }, tone: 'work' },
    ```
    P4 ya la recorre y comprueba que se pinta sin correcciones.

#### T3 · El narrador (`server/prompt.md`, D28)

- En la línea de las etiquetas, `[smug] [sleepy]` → `[smug] [sleepy] [sad]`.
- Después de la línea de `sleepy`, añade:
  ```
  - sad: two kinds. Compassion when the mortal is having a hard time: gentle and close, no drama. Or your own melancholy, a fallen cosmic being stuck on a desktop: theatrical.
  ```
- Nada más.

#### T4 · El director (`server/director_prompt.md` y `server/director.py`, D30, D33)

- **Prompt:**
  - en la línea del ánimo, `sleepy dim.` → `sleepy dim, sad heavy.`
  - en las acciones en el sitio, tras la frase de `dazed`, que acaba en `(dizzy swaying, for bewilderment)`,
    el texto queda así:
    ```
    dazed
    (dizzy swaying, for bewilderment), sad (head down, a slow sigh: compassion for the mortal), despair (sunk, one arm
    flung up, sobbing: klothulhu's own theatrical grief). emerge rises out of the ground and floats with its arms up,
    in place at "to": only as the main action, never in "then"; for menace or grandeur, mostly with smug or annoyed.
    ```
    Respeta los saltos de línea de alrededor; Q5 solo mira el texto.
- **`director.py`:**
  - `OPENING_ONLY = frozenset({"approach", "emerge"})` junto a `TRAVEL`;
  - en `build_scene`, `if then == "approach":` pasa a `if then in OPENING_ONLY:`, con el comentario
    citando D26 y D33;
  - `TRAVEL` no cambia (G11). `continue_scene` tampoco: `emerge`, al no estar en `TRAVEL`, ya va en el sitio (Q4).

#### T5 · El saludo se alza (D29)

- `bootScenes()`, escena 2: `hero('approach', 30, 50, 'angry')` → `hero('emerge', 50, 50, 'angry')`.
- Lo demás no cambia.
- **Prueba normativa sustituida:** `docs/fase6/normativas/fase6-h3.test.js` tiene una **versión 2** de mi mano
  (L1 y L4 esperan `emerge`). Cópiala byte a byte sobre `desktop/test/fase6-h3.test.js`.

#### T6 · Pruebas nuevas, comprobación y README

Copia **byte a byte** y comprueba los sha256:

| Fichero en `docs/fase6/normativas/` | Va a | sha256 |
|---|---|---|
| `test_fase6.py` | `tests/test_fase6.py` | `6cc719ad90cbf47c2319ae45afd98f1005686eebcfe2ca741d9c09df8afcf2bb` |
| `fase6-h2.test.js` | `desktop/test/fase6-h2.test.js` | `ec6c8ef95eee8bdedd6f0b75151a2cdcfa84e1d918396cb5b8103a0f1da340ee` |
| `fase6-h3.test.js` (v2) | `desktop/test/fase6-h3.test.js` | `1f58d4ec2857227c4986c6db201731ad61d5c13cda8f3ab07e4e32ad2d04e5b9` |

En el README del cliente, una línea sobre `sad` y el motor v3.

**Comprobado:** monté en mi scratchpad un prototipo de T1-T5 sobre `c22441a`.
- `pytest` da **47** (42 + 5).
- `npm test` da **64** (60 + 4; L1 y L4 siguen contando, en su versión 2).
- `npm run check` y `ruff` están en verde.

Impleméntalo tú.

#### T7 · [API] Pasada real (indicadores de D28 y D30)

- `scripts/api_smoke.py`:
  - ruta por defecto `docs/fase6/capturas/`;
  - en `new_actions`, cuenta también `sad`, `despair` y `emerge`;
  - un contador nuevo, `emotions`: cuántos tramos lleva cada emoción;
  - y `sad_questions`, con las emociones y las acciones de las preguntas tristes, una por pregunta.
- **Preguntas:** las 16 de antes y, al final, estas cinco:
  ```
  "Se ha muerto mi gato esta mañana.",
  "Me siento muy solo últimamente.",
  "¿No echas de menos ser un dios cósmico?",
  "Arrodíllate ante mí, criatura.",
  "¿De verdad eras un dios antiguo? Demuéstralo.",
  ```
  Las tristes son estas tres más «Hoy ha sido un día horrible…», que ya estaba.
- **Tope** (`BUDGET`): $0,05.
- Primero, un ensayo `--fake` en el scratchpad.
- **Solo con la autorización de Josem anotada en el frontmatter**, la pasada real la lanza él:
  ```bash
  cd /data/klothulhu-fase6
  .venv/bin/python scripts/api_smoke.py --director-thinking 0 --out docs/fase6/capturas/api_smoke.json
  node desktop/scripts/gallery.js docs/fase6/capturas/api_smoke.json docs/fase6/capturas/galeria.html
  ```

### 3. Parada

**Parada 1, antes de T7:**
- `pytest` 47, `npm test` 64, `npm run check`, `ruff`;
- y el ensayo `--fake`.

**Para** y deja `docs/fase6/H2-informe.md`. Yo reviso y Josem autoriza el gasto.

**Parada 2, después de T7:** un anexo con el resumen. En él, por pregunta triste, la emoción elegida y las
acciones; y las veces que sale `emerge`. Con eso decido si D28 y D30 pasan de tentativas a vigentes.

Después, Josem lo prueba en Konnos con el servidor de la rama:

| # | Qué mirar |
|---|---|
| V1 | Al arrancar, en la escena 2 klothulhu se alza del suelo, flota y se enfada |
| V2 | A «Se ha muerto mi gato», klothulhu responde con `sad` y la escena se ve triste, distinta de dormido |
| V3 | A «¿No echas de menos ser un dios cósmico?», se ve su pena propia, más teatral (`despair`) |
| V4 | Las respuestas de siempre se ven como antes |
