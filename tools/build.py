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
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "site"
SITE_URL = "https://offthebinder.com"

META_RE = re.compile(r"^\s*<!--(.*?)-->", re.S)


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
    head = (SRC / "partials/head.html").read_text()
    header = (SRC / "partials/header.html").read_text()
    footer = (SRC / "partials/footer.html").read_text()
    urls = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(page.read_text())
        # Partial includes: {{> subscribe}} pulls in src/partials/subscribe.html
        body = re.sub(r"\{\{>\s*([\w-]+)\s*\}\}",
                      lambda m: (SRC / "partials" / f"{m.group(1)}.html").read_text().strip("\n"),
                      body)
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
        if path == "/404":
            target = OUT / "404.html"
        else:
            target = OUT / path.strip("/") / "index.html"
            if meta.get("robots", "").startswith("index") or "robots" not in meta:
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


if __name__ == "__main__":
    main()
