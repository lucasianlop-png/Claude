#!/usr/bin/env python3
"""Builds the static site: wraps each page in src/pages with the shared
head, header and footer from src/partials and writes it to site/.

No dependencies (Python 3.8+). Run from the repo root:  python3 tools/build.py
The output in site/ is committed, so Cloudflare Pages needs no build command.

Each page starts with a meta block:
<!--
title: Page title
description: One sentence for search and social cards.
path: /newsletter/
nav: newsletter
-->

Template features (pages and partials):
  {{> name}}                 include src/partials/name.html
  {{v:NAME}}                 value from src/config.json; empty -> visible [NAME] placeholder
  {{#if flag}}A{{else}}B{{/if}}   flags: waitlist, on_sale, or any config key that is non-empty
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "site"
SITE_URL = "https://www.offthebinder.com"

META_RE = re.compile(r"^\s*<!--(.*?)-->", re.S)
IF_RE = re.compile(r"\{\{#if ([\w-]+)\}\}((?:(?!\{\{#if ).)*?)\{\{/if\}\}", re.S)
missing = set()


def load_config():
    cfg = json.loads((SRC / "config.json").read_text())
    cfg.pop("_help", None)
    flags = {k: bool(str(v).strip()) for k, v in cfg.items()}
    flags["waitlist"] = cfg.get("STATE") == "waitlist"
    flags["on_sale"] = cfg.get("STATE") == "on_sale"
    return cfg, flags


def render(text, cfg, flags):
    text = re.sub(r"\{\{>\s*([\w-]+)\s*\}\}",
                  lambda m: render((SRC / "partials" / f"{m.group(1)}.html").read_text().strip("\n"), cfg, flags),
                  text)

    def cond(m):
        body = m.group(2)
        yes, _, no = body.partition("{{else}}")
        return yes if flags.get(m.group(1), False) else no

    prev = None
    while prev != text:  # resolve innermost blocks first, allows nesting
        prev = text
        text = IF_RE.sub(cond, text)

    def var(m):
        name = m.group(1)
        val = str(cfg.get(name, "")).strip()
        if not val:
            missing.add(name)
            return f'<mark class="ph">[{name}]</mark>'
        return val

    text = re.sub(r"\{\{v:([\w-]+)\}\}", var, text)
    return no_widows(text)


WIDOW_RE = re.compile(
    r"(?<=[^\s<>]) ([^\s<>]{1,14}(?:</(?:a|b|em|strong|span|i)>)*)(</(?:p|li|h1|h2|h3|figcaption|summary|dd)>)")


def no_widows(html):
    """Join the last two words of a paragraph, list item or heading so one word never sits alone."""
    return WIDOW_RE.sub(lambda m: "\u00a0" + m.group(1) + m.group(2), html)


def parse(text):
    m = META_RE.match(text)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text.strip("\n")


def main():
    cfg, flags = load_config()
    head = (SRC / "partials/head.html").read_text()
    header = (SRC / "partials/header.html").read_text()
    footer = (SRC / "partials/footer.html").read_text()
    urls = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(page.read_text())
        path = meta.get("path", "/")
        nav = meta.get("nav", "")
        h = header
        if nav:
            h = h.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
        title = meta.get("title", "Off the Binder")
        full_title = title if title.startswith("Off the Binder") else f"{title} · Off the Binder"
        html = (
            head.replace("{{title}}", full_title)
            .replace("{{description}}", meta.get("description", ""))
            .replace("{{url}}", SITE_URL + path)
            .replace("{{robots}}", meta.get("robots", "index, follow"))
            + h + "\n<main id=\"main\">\n" + body + "\n</main>\n" + footer
        )
        html = render(html, cfg, flags)
        if path == "/404":
            target = OUT / "404.html"
        else:
            target = OUT / path.strip("/") / "index.html"
            if not meta.get("robots", "").startswith("noindex"):
                urls.append(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html)
        print("built", target.relative_to(ROOT))

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append(f"  <url><loc>{SITE_URL}{u}</loc></url>")
    sitemap.append("</urlset>")
    (OUT / "sitemap.xml").write_text("\n".join(sitemap) + "\n")
    print("built site/sitemap.xml")
    if missing:
        print("\nPLACEHOLDERS SHOWING (fill in src/config.json before publishing):", ", ".join(sorted(missing)))


if __name__ == "__main__":
    main()
