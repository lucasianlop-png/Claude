# Off the Binder · website

Static site for offthebinder.com (HTML/CSS/JS, no server, no database).

- `site/` is the deployable output (Cloudflare Pages, build output directory `site`, no build command).
- `src/` holds page sources and shared partials; `python3 tools/build.py` regenerates `site/`.
- `site/data/products.js` holds the product list (empty = "coming soon").
- Deploy and DNS steps: [`docs/DEPLOY.md`](docs/DEPLOY.md).

Brand: follows the Off the Binder Figma handoff (colour tokens in `site/css/site.css`,
Instrument Serif / Lato / IBM Plex Mono, self-hosted under the SIL Open Font Licence).
Interim logo and figure PNGs were cut from the handoff PDF; swap in the official Figma SVG exports when available.
