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

Tiene que ser un proyecto de **Pages**, no de Workers: con el DNS en Porkbun (opción A), un Worker no puede usar www.offthebinder.com, porque los dominios propios de Workers exigen que el DNS esté en Cloudflare. Pages sí acepta un CNAME desde Porkbun.

1. dash.cloudflare.com → **Workers & Pages** → **Create application**. Abajo de todo: **"Looking to deploy Pages? Get started"** → **Import an existing Git repository**.
2. Elegí `lucasianlop-png/off-the-binder-web`.
3. Configuración:
   - Project name: `off-the-binder-web` (si está tomado por el Worker, borrá el Worker primero o usá `offthebinder`)
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: *(vacío)*
   - Build output directory: `site`
4. **Save and Deploy**. Te queda `https://<proyecto>.pages.dev`.
5. Settings → Builds → **Preview deployments: All non-production branches**. Cada rama da un link `https://<rama>.<proyecto>.pages.dev`.
6. Borrá el Worker `off-the-binder-web` que quedó creado (Settings → Delete), así no falla un build en cada push.

Costo: USD 0 (plan Free de Pages: 500 builds por mes).

## 2. Dominio: opción A (elegida). El DNS queda en Porkbun, la web va en www

No se toca ningún registro de Google (MX, SPF, DKIM, DMARC).

1. En Cloudflare Pages → tu proyecto → **Custom domains** → **Set up a domain** → `www.offthebinder.com`. **Primero en Pages, después en Porkbun** (al revés no resuelve). Hacelo recién cuando apruebes publicar.
2. En Porkbun → Domain Management → DNS, agregá:

| Tipo  | Host  | Respuesta                  | TTL |
|-------|-------|----------------------------|-----|
| CNAME | `www` | `<proyecto>.pages.dev`     | 600 |

3. Para que `offthebinder.com` (sin www) lleve a la web: Porkbun → **URL Forwarding** en el dominio raíz → `https://www.offthebinder.com`, tipo **Permanent (301)**, con "include path".
4. Si Porkbun avisa de conflicto, borrá **solo** sus registros por defecto (`ALIAS`/`A` del raíz a `pixie.porkbun.com` y el CNAME comodín `*`). **Nunca MX ni TXT.**

El sitio canónico es `https://www.offthebinder.com` (ya configurado en `tools/build.py`).

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
