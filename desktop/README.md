# klothulhu — cliente de escritorio

Electron en JavaScript plano, sin build. Corre en Konnos (Windows). Contexto general: `../README.md`.

```powershell
cd desktop ; npm ci ; copy config.example.json config.json ; npm start
```

`config.json`: `apiUrl`, `token`, `scale`, `hotkey`, `look`, `debug` y `readSpeed`.

`readSpeed` (número entre 0.25 y 4, por defecto 1) multiplica el tiempo que se queda cada frase en pantalla
antes de pasar a la siguiente (D22): 0.5 va el doble de rápido, 2 el doble de lento. Un valor inválido
(p. ej. un string) se ignora y sale un aviso en la consola de `npm start`; lo mismo vale para `debug`, que
solo se enciende con `true` sin comillas.

## Escenas del servidor (fase 3, D21)

Cada evento `scene` entra en la cola en cuanto llega (`renderer/feed.js`, lógica pura con pruebas en
`test/fase3.test.js`). Se pinta la escena del director; si el evento trae `scene: null`, o el motor no la
acepta, se pinta la escena fija de `STAGING` con el caption del evento. Si `done` llega sin ningún `scene`
(servidor anterior a la fase 2), se trocea con `beats()` como en la fase 1; nunca se hacen las dos cosas.

## Depuración (`"debug": true`)

Escribe en `desktop/klothulhu-debug.log` (se vacía al pasar de 256 KB; no se versiona):

- `first-scene ms=… director=0|1 painted=server|fixed`: desde `Enter` hasta que se pinta la primera escena
  del servidor. `director=0` significa que el servidor mandó `scene: null`.
- `done ms=… scenes=n`: desde `Enter` hasta `done`.
- `warning …`: avisos del motor.

## Accesorios con estilos 3D

Con un `look` 3D el motor no pinta los accesorios (`props-not-drawn`) y lo avisa; el cliente lo registra y
sigue. Con `pixel` no pasa.
