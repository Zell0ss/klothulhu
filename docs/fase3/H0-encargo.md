---
proyecto: klothulhu
fase: 3
titulo: v2 completa — el cliente pinta las escenas del servidor
plan: programador
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D21; también D10-D13, D19, D20)"
---

# Fase 3 · H0 — encargo: el cliente pinta las escenas del servidor

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-16.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

Desde la fase 2 el servidor manda, después del texto, un evento `scene` por golpe (contrato D13, en el
docstring de `server/app.py` y en el README), y lo manda en cuanto el director lo tiene (D19). El cliente de
la fase 1 los ignora y trocea él mismo al llegar `done`. En esta fase **el cliente usa esas escenas** (D21).

**Esta fase no crea ni cambia ningún contrato** (convención §4), así que el plan lo escribes tú: `plan:
programador`. Escríbelo en `docs/fase3/PLAN.md`, con commit, y **para**. Hasta que yo lo apruebe no se toca
código.

## 1. Lo que manda (D21)

1. Cada `scene` entra en la cola **en cuanto llega**, sin esperar a `done`. La primera sustituye a la escena de
   «pensando», como ya hace hoy el primer golpe.
2. `scene` no nulo → se pinta **esa** escena. `scene: null`, o una escena con la que `renderScene` devuelve `ok:
   false` → la escena fija de `STAGING[emotion]`, con el `caption` del evento.
3. Si una respuesta llega a `done` **sin ningún** `scene` (un servidor anterior a la fase 2), el cliente trocea
   con `beats()` como hoy. Nunca se pintan las dos cosas.
4. Se mantiene todo lo de la fase 1 que no choque con esto:
   - el fundido al cambiar de fondo;
   - `readMs` para el tiempo de lectura;
   - errores, «pensando», 30 s de espera y `idle`;
   - copiar la respuesta entera y validar el `look`.
5. **Medida para D20:** el cliente registra con `console.info` los ms desde que se pulsa `Enter` hasta que se
   pinta la primera escena del servidor. Para que Josem lo vea sin herramientas de desarrollo, propón una
   forma barata: por ejemplo, un `config.json` con `"debug": true` que lo escriba en un fichero de log desde
   el proceso principal. Decide tú, y justifícalo en el plan.

## 2. Lo que el plan tiene que traer

- **Diseño** de los cambios en `renderer/index.html` (cola y eventos) y, si hace falta, en `scenes.js`
  (lógica pura y comprobable desde Node), `main.js` y `preload.js`. Lo que se pueda probar sin Electron, en
  `scenes.js` o en un módulo puro nuevo, con pruebas `node:test` tuyas.
- **Casos raros** con su respuesta:
  - escenas que llegan después de `done` (no debería pasar, pero hay que decidir qué se hace);
  - `index` fuera de orden o repetido;
  - un `error` a mitad de las escenas;
  - una pregunta nueva mientras se leen las de la anterior (hoy no se puede preguntar hasta `done`; ¿cambia?).
- **Accesorios con estilos 3D:** el motor no los pinta con la figura 3D y avisa con `props-not-drawn` (fables
  D12). Con `look: pixel` (el de Josem por defecto) no pasa. Propón qué hacer: nada y dejarlo documentado,
  `figure: 'pixel'` en la config, u otra cosa. No es bloqueante.
- **Prueba en Konnos para Josem**, como la K1-K7 de la fase 1: qué mirar, y qué significa si falla.
- **Lista previa** de la convención §4:
  - ¿se borra algo?
  - ¿API? El cliente habla con el servidor de **producción**. Cada pregunta de Josem es uso normal, no un paso
    [API], pero dilo.
  - ¿producción? El servidor no cambia en esta fase. El cliente corre en Konnos.
- **Fuera de alcance** propuesto. Sugerencias: `prefers-reduced-motion` (anotado en la fase 1, revisión §2.5),
  empaquetado, continuidad de escenas entre respuestas.

## 3. Dónde se trabaja

- Worktree `/data/klothulhu-fase3`, rama `fase3`. El buzón es `docs/fase3/`. `npm ci` en `desktop/`.
- El servidor no se toca. Para probar a mano sin gastar, arranca uno local en el puerto 8766 con
  `KLOTHULHU_FAKE=1` y `.venv` propio. Su director falso ya manda escenas.
- Las pruebas normativas de las fases 1 y 2 no se editan.

## Para el programador

Lee este encargo, el README («API contract») y `desktop/renderer/index.html`. Escribe `docs/fase3/PLAN.md` y
haz commit. **Para** y espera la aprobación.
