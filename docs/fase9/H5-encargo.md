Responde a: a7a7395 (H4-informe; H4 aprobado en c981b1f)

# H5 · Encargo: klothulhu con alas de murciélago (2026-11-17)

> **Para:** el claudcoder. **Desde:** el claudquitecto.
> **Decisión:** D55 (vault, `30-projects/klothulhu/ficha.md` § Decisiones). Pedido 5 a claude-fables
> ([[claude-fables/DE-KLOTHULHU]] §9), entregado en su fase 5 ([[claude-fables/PARA-KLOTHULHU]] §9).

## 0. Qué y por qué

claude-fables ha cambiado los brazos del avatar `klothulhu` por alas de murciélago. La interfaz no
cambia: el mismo avatar, el mismo `VOCAB` y `SCHEMA_VERSION` 3. Hay un solo cambio de valor: con
klothulhu hay que pasar **`maxBytes: 500000`**, no 400 000 (fables D33: las alas pesan un 5 % más).

**Requisito previo:** el motor nuevo está en `/data/claude-fables`, en la rama `fase5-motor` (código
`afa3ade`). `VENDOR.md` vendoriza desde `main`. **Si `afa3ade` no está en `main` de claude-fables cuando
empieces, para y avisa**: ese merge es de Josem (fables D15).

## 1. Piezas

1. **Motor:** construye desde `main` de claude-fables y copia el IIFE como dice `VENDOR.md`. El sha256 debe
   ser `dbb6f05b2cfd5db7d517b8596629f662a0980ed2ebad57d826bae4d096d3fa36`. Si no coincide, para. Actualiza en
   `VENDOR.md` el origen (commit, fase 5 de claude-fables, D55) y el sha256 (prueba P9). Regenera
   `server/fables_vocab.json` con `node desktop/scripts/export-vocab.js`: debería salir igual (prueba F1).
   Si cambia, dilo en el informe.
2. **`desktop/renderer/avatar.js`:** `MAX_BYTES_KLOTHULHU = 500000`. Cambia el comentario: la cifra es la de
   fables D33 (antes, su D28). Cita D55. Lo comparten los dos clientes.
3. **Normativa V2 de la fase 8, revisada por mí:** copia `docs/fase8/normativas/fase8-h1.test.js` tal cual
   a `desktop/test/fase8-h1.test.js`. Solo cambian las dos cifras de V2 (400000 → 500000). Comprueba con
   `diff` que no hay más cambios. Es el mismo procedimiento que se usó con W10 en H3.
4. **Iconos de la web:** regenera con `desktop/scripts/make-icons.js` (`icon-192`, `icon-512`,
   `apple-touch-icon`). `web/test/icons.test.js` tiene que seguir pasando.

## 2. Pruebas

`cd desktop && npm test && npm run check`; `cd web && npm test && npm run check`;
`.venv/bin/python -m pytest -q tests` (por F1, con `KLOTHULHU_FAKE=1`). Gasto: 0.

## 3. Parada

En el informe (`docs/fase9/H5-informe.md`):

- las salidas de las pruebas, y el sha256 que te ha salido;
- capturas en `docs/fase9/capturas/`: el verde en `pixel` con `emerge` y `despair`, el icono a 48 px recortado
  en círculo (como en H3) y `icon-512.png`;
- si V3 (puesta en escena completa en `pixel` y `ukiyoe`, cabe en `maxBytes`) da avisos nuevos.

**Para ahí.** El merge, recargar en el móvil, volver a añadir el acceso directo (Samsung guarda el icono de
cuando se creó) y probar en Konnos son de Josem. El servicio no se reinicia.

## Para el programador

Responde a: a7a7395 (H4-informe; H4 aprobado en c981b1f)

1. En el worktree `/data/klothulhu-fase9` (rama `fase9`). Antes de nada, comprueba el requisito del §0.
2. Commits: motor y `VENDOR.md` (y `fables_vocab.json` si cambia); `avatar.js` y la normativa V2 copiada;
   iconos. Cita D55.
3. Parada del §3.
