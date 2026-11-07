Responde a: e52313a (H2-informe, anexo R2)

# H3 · Encargo: icono para la pantalla de inicio (2026-11-07)

> **Para:** el claudcoder. **Desde:** el claudquitecto.
> **Decisión:** D52 (vault, `30-projects/klothulhu/ficha.md` § Decisiones).

## 0. Qué y por qué

Josem guarda la web en la pantalla de inicio del móvil (Samsung Internet) y quiere un icono propio:
**klothulhu verde, estilo `pixel`**, sobre el fondo de la web. No es una PWA: no hay service worker ni
HTTPS (D50). Es un acceso directo con icono, y lo normal es que se abra como pestaña.

**Restricción dura:** la de siempre. No se tocan `desktop/renderer/`, `main.js`, `preload.js`, `state.js`
ni `server/`, y las normativas (`web/test/fase9-h1.test.js` y las del escritorio) no se editan. W10 fija
`img-src`, `script-src`, `style-src`, `connect-src` y `default-src` tal cual, así que **no los toques**.
Solo se añade una directiva.

## 1. Piezas

1. **`desktop/scripts/make-icons.js`** (Node, sin dependencias, junto a `gallery.js`; no se ejecuta en
   las pruebas). Genera los iconos con el motor vendorizado:
   - **Qué se dibuja:** el avatar `klothulhu` (`avatarOptions('klothulhu', VOCAB.avatars)`), `look: 'pixel'`,
     sin bocadillo ni texto, sobre un fondo liso `#140f0d`. Si el motor no sabe dibujar el personaje sin
     escenario, usa la escena más limpia que encuentres y recorta un cuadrado alrededor del personaje. Si
     ni así queda limpio a 48 px, **para y pregunta** antes de dibujar un icono a mano.
   - **Encuadre:** cuadrado, con el personaje centrado y dentro del **60 % central**. Es la zona segura
     de los iconos `maskable`: Android los recorta en círculo o en «squircle».
   - **Rasterizado:** con el Chrome headless de seb01 (`/usr/bin/google-chrome`), como en tus pasadas a
     mano. Escalado sin suavizado (`image-rendering: pixelated`), para que el pixel art no salga borroso.
   - **Salida:** `web/icons/icon-192.png`, `web/icons/icon-512.png` y `web/icons/apple-touch-icon.png` (180×180).
     Los PNG se suben al repo; el script queda para regenerarlos si cambia el motor.
2. **`web/manifest.json`** (con extensión `.json`: el nginx de seb01 no conoce `.webmanifest` y lo
   serviría como binario):
   `name` y `short_name` «Klothulhu», `start_url` y `scope` `/`, `display: "standalone"` (el navegador lo
   ignorará sin HTTPS, y no pasa nada), `background_color` y `theme_color` `#140f0d`, y `icons` con el de
   192 y el de 512, los dos `type: "image/png"` y `purpose: "any maskable"`.
3. **`web/index.html`:**
   - `<link rel="manifest" href="manifest.json">`, `<link rel="icon" href="icons/icon-192.png">` y
     `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`, todas con rutas relativas;
   - en la CSP, **añade** `manifest-src 'self'` y no cambies nada más. Los iconos no pasan por la CSP de la
     página: los pide el navegador, no la página.
4. **nginx:** no cambia. `location /` ya sirve `web/icons/` y `manifest.json` con su tipo.

## 2. Pruebas (fichero nuevo, `web/test/icons.test.js`)

- `manifest.json` es JSON válido con los campos del §1.2, y cada icono que declara existe.
- Cada PNG tiene firma PNG y las dimensiones de su nombre, leídas de la cabecera `IHDR` (192, 512, 180).
- `index.html` lleva las tres `<link>` con rutas relativas (nada de `http`, ni `//`, ni `/` inicial).
- La CSP tiene `manifest-src 'self'`, y `img-src` sigue siendo exactamente `data:`. Esto lo repite W10;
  aquí solo como aviso.

## 3. Parada

`cd web && npm test` y `npm run check`; `cd desktop && npm test` y `npm run check` (por el script nuevo
en `desktop/scripts/`). En el informe, `docs/fase9/H3-informe.md`, pon `icon-512.png` y una captura
`docs/fase9/capturas/10-icono-48px.png` con el icono reducido a 48 px y recortado en círculo, para
ver si se lee. Gasto: 0. **Para ahí.** El merge y volver a añadir el acceso directo en el móvil (el viejo
hay que borrarlo: Samsung guarda el icono de cuando se creó) son de Josem.

## Para el programador

Responde a: e52313a (H2-informe, anexo R2)

1. H3 según §1, en la rama `fase9` (worktree `/data/klothulhu-fase9`). Commits: script e iconos;
   manifest y `index.html`; pruebas. Cita D52.
2. Pruebas en `web/test/icons.test.js` (§2). Las normativas no se tocan.
3. Parada del §3: pruebas, `icon-512.png`, la captura a 48 px y el informe en `docs/fase9/H3-informe.md`.
4. Si el motor no permite un icono limpio del personaje (§1.1), para y pregunta.
