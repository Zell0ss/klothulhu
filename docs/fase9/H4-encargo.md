Responde a: b1565c8 (H3-revision, anexo R3; H3 cerrado)

# H4 · Encargo: la respuesta entra en el historial cuando klothulhu acaba de decirla (2026-11-17)

> **Para:** el claudcoder. **Desde:** el claudquitecto.
> **Decisión:** D54 (vault, `30-projects/klothulhu/ficha.md` § Decisiones).

## 0. Qué y por qué

Hoy, en los dos clientes, la respuesta entera entra en el historial al llegar `done`
(`web/app.js:207`, `desktop/renderer/index.html:257`), cuando la escena apenas va por la primera frase.
En el móvil el historial está siempre a la vista y se lleva la mirada: Josem se pierde las escenas.
Josem (2026-11-17) elige que **la respuesta entre entera cuando se acaba de leer la última frase**, es
decir, cuando la cola de escenas se vacía y el reproductor pasa a `lingering`. **En los dos clientes**,
por coherencia. Tu mensaje sigue entrando al enviarlo, como ahora.

**Lo que se levanta de la restricción de la fase 9:** en este hito sí se toca
`desktop/renderer/index.html` (solo las líneas del §1.2) y `desktop/renderer/convo.js`. Siguen sin
tocarse `main.js`, `preload.js`, `state.js`, `server/` y todas las normativas. Antes de cambiar
`index.html`, mira qué leen de su texto `fase1`, `fase5`, `fase6-h1`, `fase6-h3` y `fase6-h4`: si algo de
lo que pido choca con una de ellas, **para y pregunta**.

## 1. Piezas

1. **`desktop/renderer/convo.js`** (compartido: lo carga también la web por `/shared/`). Dos métodos
   nuevos; lo que ya hay (`add`, `clear`, `entries`, `max`) no cambia de comportamiento con nada pendiente:
   - `hold(text)`: guarda la respuesta de klothulhu, recortada, como **pendiente**. No sale en `entries()`.
     Vacíos o no-textos se ignoran. Si ya había una pendiente, entra antes en la lista (no se pierde).
   - `release()`: si hay pendiente, la añade como `klothulhu` (con el tope de siempre) y devuelve `true`;
     si no, `false`.
   - `add()` suelta antes lo pendiente (así, si escribes antes de que acabe, su respuesta va delante de
     tu mensaje). `clear()` descarta lo pendiente («Olvidar»).
   Las normativas M1-M7 fijan esto.
2. **En cada cliente** (`web/app.js` y `desktop/renderer/index.html`), lo mismo, y nada más:
   - en `done`: `convo.hold(reply)` **antes** de `enqueue(feed.onDone(...))`, y sin `renderHistory()`. El
     orden importa: si la cola ya está vacía, `enqueue` llega a `lingering` en esa misma llamada y tiene
     que encontrar la respuesta guardada;
   - en `pump()`, al pasar a `lingering`: `if (convo.release()) renderHistory();`;
   - `ask()` y `onForgotten` no cambian: `add('user')` y `clear()` ya hacen lo que toca.
   Cita D54 en las dos. Es la misma costura en los dos sitios a propósito (D50: la lógica vive en el
   módulo compartido; en cada cliente solo va el enganche).
3. **Lo que no cambia:** el error a medias no entra en el historial (como hoy). El servidor, el SSE y
   el historial del servidor no cambian.

## 2. Pruebas

- **Normativas:** copia `docs/fase9/normativas/fase9-h4.test.js` tal cual a `desktop/test/fase9-h4.test.js`.
- **Tuyas, en otro fichero** (recomendado, no obligatorio): una de texto que compruebe que ni
  `web/app.js` ni `desktop/renderer/index.html` llaman ya a `convo.add('klothulhu'`.
- J1-J4 (`fase6-h1`) y W1-W… (`fase9-h1`) tienen que seguir pasando sin tocarlas.

## 3. Parada

`cd desktop && npm test && npm run check`; `cd web && npm test && npm run check`. Prueba a mano en el
servidor de pruebas de la web (`KLOTHULHU_FAKE=1`, gasto 0), y pon en el informe qué viste en cada una:

- **K1:** la respuesta no sale en el historial mientras se leen las escenas; sale entera al acabar la última.
- **K2:** si escribes mientras habla, su respuesta aparece justo antes de tu mensaje.
- **K3:** «Olvidar» mientras habla: el historial queda vacío y no aparece nada al acabar.
- **K4:** un error (p. ej. parar el servidor de pruebas) no deja nada en el historial.

En Konnos lo prueba Josem. Informe en `docs/fase9/H4-informe.md`. Gasto: 0. **Para ahí.** El merge es de
Josem; no hace falta reiniciar el servicio (el servidor no cambia).

## Para el programador

Responde a: b1565c8 (H3-revision, anexo R3; H3 cerrado)

1. Trabaja en el worktree `/data/klothulhu-fase9` (rama `fase9`, recreada desde `main` en `0aec87b`).
   Necesita su `.venv` y `node_modules` propios (el worktree anterior se borró).
2. Commits: `convo.js` con la normativa copiada; los dos clientes; tus pruebas. Cita D54.
3. Si alguna normativa de las fases 1-6 lee de `index.html` algo que choque con el §1.2, para y pregunta.
4. Parada del §3, con K1-K4 en el informe.
