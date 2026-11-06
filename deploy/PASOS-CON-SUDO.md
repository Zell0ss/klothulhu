# Pasos con sudo — klothulhu web (fase 9, D50)

Nada de esto lo ejecuta Claude Code: son los pasos que le tocan a Josem, con los comandos exactos.
Orden: **§0 → §1 → §2 → §3**. Para volver atrás, §4.

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
