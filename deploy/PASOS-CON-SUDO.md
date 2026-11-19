# Pasos con sudo — klothulhu web (fase 9, D50)

Nada de esto lo ejecuta Claude Code: son los pasos que le tocan a Josem, con los comandos exactos.
Orden: **§0 → §1 → §2 → §3**. Para volver atrás, §4. Las imágenes de la fase 10 tienen su propia sección, §5.

## 0. Antes de nada: el código tiene que estar en `main`

El sitio sirve `/data/klothulhu/web` y `/data/klothulhu/desktop/…`, es decir, el checkout de producción
(rama `main`). Mientras `fase9` no esté fusionada, nginx daría 404.

```bash
cd /data/klothulhu
git status --short            # solo debe salir lo que ya había sin versionar
git merge --ff-only fase9
ls web/index.html desktop/sse-client.js
```

## 1. Un segundo secreto para el móvil (opcional, recomendado)

El servidor admite dos secretos con el mismo `cid` (`_parse_tokens` guarda por secreto): el móvil
comparte conversación y recuerdos con Konnos y **se puede revocar sin tocar el de Konnos**.

```bash
openssl rand -hex 24            # ← el secreto nuevo (48 caracteres; el servidor exige ≥ 16)
sudo nano /etc/klothulhu/klothulhu.env
```

En ese fichero, deja `KLOTHULHU_TOKENS` con los dos, **mismo cid**:

```
KLOTHULHU_TOKENS=konnos:<el de Konnos>,konnos:<el nuevo>
```

Hay que reiniciar el servicio para que lo lea (decisión de Josem, como siempre):

```bash
sudo systemctl restart klothulhu-api
systemctl status klothulhu-api --no-pager | head -5
```

Alternativa sin reinicio: teclear en el móvil el mismo token que usa Konnos. Sirve, pero perder el móvil
obligaría a cambiar los dos.

## 2. Instalar el sitio nginx

```bash
sudo cp /data/klothulhu/deploy/nginx-klothulhu-web.conf /etc/nginx/sites-available/klothulhu-web
sudo ln -s /etc/nginx/sites-available/klothulhu-web /etc/nginx/sites-enabled/klothulhu-web
sudo nginx -t
sudo systemctl reload nginx
```

(`nginx -t` debe decir `syntax is ok` y `test is successful`. Si falla, no hagas el `reload`: ver §4.)

Que nginx pueda leer lo que sirve (el usuario de nginx es `www-data`):

```bash
sudo -u www-data test -r /data/klothulhu/web/index.html && echo web-ok
sudo -u www-data test -r /data/klothulhu/desktop/sse-client.js && echo sse-ok
sudo -u www-data test -r /data/klothulhu/desktop/renderer/scenes.js && echo scenes-ok
```

## 3. Comprobar

Desde seb01:

```bash
curl -sI http://127.0.0.1:5757/ | head -5                          # 200, Cache-Control: no-cache
curl -sI http://127.0.0.1:5757/shared/scenes.js | head -3          # 200
curl -sI http://127.0.0.1:5757/shared/sse-client.js | head -3      # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5757/server/app.py     # 404
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5757/shared/../.env    # 400 o 404, nunca 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5757/api/history       # 401: llega al servidor, sin token
```

El 401 de la última es lo correcto: nginx llega al servidor y este exige el token. (No pruebes `DELETE /api/history`
con un token bueno: borra la conversación real, que es la de Konnos.)

Desde el móvil (con Tailscale activo), abre `http://seb01:5757`. Si te sale un 403, mira
`sudo tail /var/log/nginx/error.log`: casi siempre es que entras por una IP que no está en los `allow`.
Después, la prueba K1–K9 de `docs/fase9/PLAN.md` §7.

## 4. Volver atrás

```bash
sudo rm /etc/nginx/sites-enabled/klothulhu-web
sudo nginx -t && sudo systemctl reload nginx
```

El sitio `klothulhu-web` desaparece y el puerto 5757 se cierra. Los demás sitios de nginx no se tocan, y
`klothulhu-api` sigue como estaba. Si añadiste el segundo secreto (§1) y quieres revocar el del móvil,
quítalo de `KLOTHULHU_TOKENS` y reinicia `klothulhu-api`.

## 5. Fase 10: klothulhu ve (imágenes, D56, D57)

Esta fase cambia **el servidor** (reinicio de `klothulhu-api`) **y el nginx del móvil** (el tamaño de la petición).
Es lo que le toca a Josem; Claude Code no ejecuta nada de esto. **Orden: merge → reiniciar el servicio → nginx →
recargar el móvil**; en Konnos, `git pull` y reiniciar la app.

### 5.1 Merge y reinicio del servicio

```bash
cd /data/klothulhu
git status --short            # solo debe salir lo que ya había sin versionar
git merge --ff-only fase10
sudo systemctl restart klothulhu-api
systemctl status klothulhu-api --no-pager | head -5
curl -s http://127.0.0.1:8765/health                 # {"ok":true,...}
```

### 5.2 nginx: dejar pasar peticiones de hasta 8 MB

Una foto del móvil se reduce a ~300 KB antes de salir, pero un PNG pegado puede pasar de 1 MB, que es el tope por
defecto de nginx (daría un 413 antes de llegar al servidor). El conf ya lleva `client_max_body_size 8m;` dentro de
`location /api/`. El sitio ya está instalado (§2): basta con copiar el conf nuevo encima.

```bash
sudo cp /data/klothulhu/deploy/nginx-klothulhu-web.conf /etc/nginx/sites-available/klothulhu-web
sudo nginx -t
sudo systemctl reload nginx
```

(`nginx -t` debe decir `syntax is ok` y `test is successful`. Si falla, no hagas el `reload`: sigue cargado el conf
anterior y lo único que pasa es que no entran imágenes grandes.)

Comprobar, desde seb01:

```bash
sudo nginx -T 2>/dev/null | grep -n client_max_body_size      # debe salir 8m, dentro del sitio klothulhu-web
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5757/shared/imagen.js     # 200
head -c 2000000 /dev/zero | curl -s -o /dev/null -w '%{http_code}\n' -X POST --data-binary @- http://127.0.0.1:5757/api/chat
```

La última manda 2 MB sin token: lo que importa es que **no salga 413**. Un 401 o un 422 quiere decir que la petición
llegó al servidor, que la rechaza por no llevar token o por no ser un JSON. (Con el límite por defecto, nginx habría
contestado 413 antes.)

### 5.3 Móvil y Konnos

- **Móvil:** recarga la página (el conf lleva `Cache-Control: no-cache`, así que el navegador revalida solo). Se ve un
  📷 junto al campo de texto.
- **Konnos:** `git pull` y reiniciar la app (el escritorio va directo a uvicorn por Tailscale: no tiene el límite de
  nginx; el tope de 4 MB del servidor vale igual).

Después, las pruebas K1–K8 de `docs/fase10/PLAN.md` §6.

## 6. Fase 11: klothulhu busca (búsqueda web, D58, D59, D60)

Cambia **el servidor** (reinicio de `klothulhu-api`) y los dos clientes. **El nginx no cambia** (`/shared/fuentes.js`
sale solo del alias de `/shared/`) y **no hay variables nuevas obligatorias**. Orden: merge → reiniciar el servicio →
recargar el móvil; en Konnos, `git pull` y reiniciar la app.

```bash
cd /data/klothulhu
git status --short            # solo debe salir lo que ya había sin versionar
git merge --ff-only fase11
sudo systemctl restart klothulhu-api
systemctl status klothulhu-api --no-pager | head -5
curl -s http://127.0.0.1:8765/health                 # {"ok":true,...}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5757/shared/fuentes.js     # 200
```

- **Gasto:** $10 por 1 000 búsquedas más los tokens de los resultados; con el tope de 30 al día, como mucho ~$9 al mes.
  La cuota del día vive en la memoria del proceso: un reinicio la pone a cero.
- **Apagarla sin desplegar nada:** `KLOTHULHU_BUSQUEDA_TOPE=0` en `/etc/klothulhu/klothulhu.env` y reiniciar el servicio
  (con 0, el narrador no recibe la herramienta). Cambiar el tope: el mismo ajuste con otro número.
- **Konnos:** `git pull` y reiniciar la app. Después, las pruebas K1–K6 de `docs/fase11/PLAN.md` §6.
