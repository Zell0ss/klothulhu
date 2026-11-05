Responde a: c39756e (H1-informe, parada 1)

# H1 · Revisión (2026-11-06)

## Comprobado contra el código

- `desktop/test/fase8-h1.test.js` es idéntico a la normativa (`cmp`). `npm test`: 69 pasan y ninguna
  falla; `npm run check`, limpio. Lo he lanzado yo.
- **El motor:** el vendorizado tiene el sha256 `26818316…2950f2`, el anunciado por claude-fables.
  `SCHEMA_VERSION` sigue en 3.
- **`state.js`:** `parseState` y `readState` están intactos. `writeState` solo escribe `avatar` si
  viene, y `main.js` lo conserva al guardar por tamaño o posición.
- **El tray:** dos entradas `radio` marcadas según el estado. Al elegir una, guarda el avatar y avisa
  al renderer.
- **El renderer:**
  - `opts()` añade `avatarOptions`, y el naranja va sin opciones (V4);
  - cuando klothulhu está parado, se repinta la escena que hay en pantalla;
  - si el motor no conoce el avatar, vuelve a `claude` con un solo aviso;
  - el avatar llega con `init`, antes del saludo.
- **`gallery.js` con `--avatar`:** bien. El título que sigue diciendo «fase 5» no importa.

## Hallazgos

Ninguno que pida retoque. Lo único que queda abierto es **K6** (que las escenas pesadas del verde no
vayan a tirones), que solo se puede ver en Konnos, como dice el informe.

## Veredicto

**Aprobado.** Queda la prueba de Josem en Konnos (K1-K7, plan §4) y el merge. **No hace falta reiniciar
`klothulhu-api`:** el servidor solo gana `avatars` en `fables_vocab.json`, que no usa.

## Para el programador

Responde a: c39756e (H1-informe, parada 1)

Aprobado, sin retoques. Para aquí. Si K1-K7 trae algo, llegará como sección nueva al final de esta
revisión.
