---
proyecto: klothulhu
fase: 6
hito: H1
fecha: 2026-10-16
veredicto: aprobado (código); pendiente la prueba K1-K6 de Josem
---

# Fase 6 · H1 — revisión

> **Para:** el claudcoder y Josem. **Desde:** el claudquitecto, 2026-10-16.
> Revisado contra `03f78f1..74bf505` (rama `fase6`), no contra el informe.

## 1. Lo comprobado

- **Normativa:** `desktop/test/fase6-h1.test.js` es idéntica a `docs/fase6/normativas/` (`diff`). No ha
  cambiado ninguna prueba de las fases 1-5, ni `server/`, ni `tests/`.
- **Ejecutado aquí:** `npm test` 49/49 y `npm run check` sin errores.
- **T1 y T2:** `convo.js` y `layout.js` cumplen el plan. `closeBounds` trabaja sobre la posición
  actual, así que un arrastre con el panel abierto no hace saltar la ventana al cerrar.
- **T3:**
  - `panel` no hace nada si se abre dos veces o se cierra sin haber abierto;
  - toma la pantalla en la que está la ventana;
  - `setResizable` va con su comentario;
  - `init` manda `panelW`;
  - el tray envía `forgotten`.
- **T4:**
  - el panel se pinta solo con `createElement`, `textContent` y `replaceChildren` (D10);
  - el texto es seleccionable (`user-select: text`), un detalle útil;
  - se abre después de `kl.panel(true)` y se cierra antes de `kl.panel(false)`;
  - `onStrip` y `onButton` incluyen el panel y 📜, y la caja de texto no se abre al pulsar 📜;
  - la CSP no cambia, y `convo.js` va como script clásico.

## 2. Desviaciones del informe

Todas **aprobadas**:
- T4 y T5 juntos;
- el nombre `historyPanel`;
- el panel sin margen;
- `forgotten` en `.finally`. Si el servidor no contesta, el panel se vacía y el servidor sigue
  recordando; no vale la pena complicarlo.

## 3. Hallazgos

Ninguno que pida cambios. **Lo que solo se ve en Konnos:** una ventana `transparent` que cambia de
tamaño con `setResizable(true)` puede parpadear en Windows. Si lo hace, se mira en K1.

## 4. Veredicto

**Código aprobado.** Queda la prueba K1-K6 de Josem en Konnos. Si pasa, Josem puede fusionar H1 ya,
sin esperar a H2, que sigue en la misma rama después del merge.

## Para el programador

Responde a: 74bf505 (H1-informe)

H1 aprobado. Nada que hacer hasta la prueba de Josem. Lo que salga llegará en `H1-revision.md` como
sección nueva o en un encargo. H2 espera al motor y a su plan.

## 5. Prueba de Josem en Konnos (2026-10-16)

- **K5 falla:** «Forget conversation» no vacía el panel. A Josem no le importa mucho, y **no bloquea el
  merge de H1**. En el código, el camino parece correcto (`forget` → `.finally` → `send('forgotten')` →
  `onForgotten` → `clear` + `renderHistory`). Las dos causas que veo:
  - el evento no llega al renderer;
  - o `fetch` se queda colgado sin plazo y `.finally` no llega a ejecutarse.
- **Atribución:** sin determinar. Se mira con el log en la vuelta de H2.

## Para el programador

Responde a: 74bf505 (H1-informe)

Nada que hacer ahora. Cuando llegue H2, añade como retoque R1:
1. una línea de `note()` al recibir `forgotten` en el renderer, y otra en `main.js` al enviarlo;
2. un plazo (`AbortSignal.timeout`, 5 s) en `forget()` de `sse-client.js`, para que `.finally` se ejecute
   siempre.
Josem lo comprobará con `"debug": true`.

## 6. K5 sí pasa (2026-10-16)

El fallo no era del código. La primera vez, Josem escribió «forget conversation» en la caja de texto, y el
icono del tray estaba entre los iconos ocultos de Windows. Desde el tray, el panel se vacía. **K1-K6
pasan. H1 cerrado.**

## Para el programador

Responde a: 74bf505 (H1-informe)

**Retiro el retoque R1 del §5:** no hace falta ni el log ni el plazo en `forget()`. Nada que hacer hasta H2.
