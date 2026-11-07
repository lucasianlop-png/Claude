# Off the Binder · web: deploy y DNS

Guía para Lucas. Se hace una sola vez. Nada llega a offthebinder.com hasta que vos lo aprobás.

## Cómo está armado

- `site/` es la web final (HTML/CSS/JS estático). Cloudflare Pages publica esa carpeta tal cual, sin build.
- `src/` tiene las páginas fuente y las partes compartidas (header, footer, formulario).
- `tools/build.py` arma `site/` a partir de `src/` (Python 3, sin dependencias). Se corre antes de cada commit:
  `python3 tools/build.py`
- Productos: se cargan en `site/data/products.js` (nombre, precio en AUD, link externo). Mientras la lista esté vacía, la página Productos muestra "coming soon".

## Flujo de trabajo

1. Cada cambio va a una rama (`claude/...`).
2. Cloudflare Pages arma un **preview** automático por rama: `https://<rama>.<proyecto>.pages.dev`. Los previews llevan `noindex` (archivo `site/_headers`), así que Google no los indexa.
3. Vos revisás el preview y das el OK.
4. Se hace merge a `main` y Cloudflare publica en producción (offthebinder.com).

## 1. Conectar Cloudflare Pages al repo (una sola vez, desde el panel)

1. Entrá a dash.cloudflare.com → **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autorizá la app de Cloudflare en GitHub y elegí solo el repo de la web.
3. Configuración del build:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: *(vacío)*
   - Build output directory: `site`
4. **Save and Deploy**. Te queda una URL tipo `off-the-binder-web.pages.dev`.
5. En **Settings → Builds & deployments → Preview deployments**: dejar "All non-production branches" activado, así cada rama tiene su link de preview.

Costo: USD 0 (plan Free de Pages: 500 builds por mes, 1 build a la vez).

## 2. Dominio: dos caminos (decisión tuya)

Cloudflare Pages solo acepta el dominio raíz (`offthebinder.com`, sin www) si el DNS del dominio está en Cloudflare. Un subdominio (`www.`) funciona con un CNAME, sin mover el DNS.

### Opción A (recomendada): DNS queda en Porkbun, la web va en www

No toca ni un registro de Google. Riesgo para el mail: cero.

En Cloudflare Pages → tu proyecto → **Custom domains** → **Set up a domain** → `www.offthebinder.com`. Cloudflare te muestra el CNAME a cargar. **Primero se agrega el dominio en Pages, después el registro en Porkbun** (al revés no resuelve).

Registros a cargar en Porkbun → Domain Management → DNS:

| Tipo  | Host  | Respuesta                         | TTL |
|-------|-------|-----------------------------------|-----|
| CNAME | `www` | `<tu-proyecto>.pages.dev`         | 600 |

Y para que `offthebinder.com` (sin www) lleve a la web:

- Porkbun → **URL Forwarding** sobre el dominio raíz → destino `https://www.offthebinder.com`, tipo **Permanent (301)**, "include path" activado.
- Si Porkbun avisa de conflicto: borrar solo los registros por defecto de Porkbun (`ALIAS` o `A` del raíz apuntando a `pixie.porkbun.com`, y el CNAME comodín `*`). **No borrar MX ni TXT.**

Con esta opción, el sitio canónico pasa a ser `https://www.offthebinder.com` (hay que cambiar una línea en `tools/build.py`, `SITE_URL`, y en `src/partials/head.html` la imagen OG; lo hago yo cuando confirmes).

### Opción B: mover el DNS a Cloudflare (dominio raíz sin www)

Más prolijo a largo plazo, pero hay que copiar a mano los registros de Google y cambiar nameservers. Si se escapa uno, el mail deja de llegar.

1. Cloudflare → **Add a domain** → `offthebinder.com` → plan Free. Cloudflare escanea los registros actuales.
2. Antes de cambiar nameservers, comparar uno por uno con Porkbun y verificar que estén iguales:
   - MX de Google (el que te dio Workspace).
   - TXT SPF en el raíz (`v=spf1 include:_spf.google.com ~all`, o el que tengas).
   - TXT DKIM en `google._domainkey`.
   - TXT DMARC en `_dmarc`.
   - TXT de verificación de Google (`google-site-verification=...`), si existe.
   - Todos en **DNS only** (nube gris), no proxied.
3. En Porkbun → Authoritative Nameservers → poner los 2 de Cloudflare.
4. En Pages → Custom domains → `offthebinder.com` y `www.offthebinder.com`.

## 3. Subdominios previstos

| Subdominio              | Para qué                                  | Cuándo |
|-------------------------|-------------------------------------------|--------|
| `bars.offthebinder.com` | Landing del servicio para bares (Tally)   | Cuando esa landing tenga su proyecto. Se agrega como custom domain en ese proyecto de Pages y un CNAME `bars` → `<proyecto-bars>.pages.dev`. |
| `news.offthebinder.com` | Reservado por si se conecta beehiiv       | No cargar nada todavía. beehiiv te da los registros exactos cuando lo actives. |

Ninguno de estos toca MX, SPF, DKIM ni DMARC.

## 4. Antes de publicar (checklist)

- [ ] Preview revisado en celular y compu.
- [ ] Formulario de beehiiv probado con un mail tuyo (en el preview).
- [ ] Perfiles @offthebinder creados en Instagram, TikTok, Pinterest y Facebook (los links ya están en Contacto y footer).
- [ ] OK explícito tuyo → merge a `main`.
