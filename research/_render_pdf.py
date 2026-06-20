#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Render a markdown paper to a typeset HTML (academic style) for Chrome print-to-PDF.
Unicode-safe: serif stack with diacritic coverage + per-glyph browser fallback for
the Pali diacritics and the geometric figure chars. No smarty (keeps no-em-dash)."""
import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import markdown

src = sys.argv[1]
out_html = sys.argv[2]
md = open(src, encoding='utf-8').read()

html_body = markdown.markdown(
    md,
    extensions=['extra', 'sane_lists'],   # extra = footnotes, tables, fenced_code, attr_list
    extension_configs={'footnotes': {'BACKLINK_TEXT': '&#8617;'}},
)

# make the first <h1> the title
html_body = html_body.replace('<h1>', '<h1 class="title">', 1)

CSS = r"""
@page { size: A4; margin: 2.2cm 2.3cm 2.0cm 2.3cm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font: 10.8pt/1.52 Georgia, Cambria, "Times New Roman", serif;
  color: #1a1a1a; text-align: justify; hyphens: auto; -webkit-hyphens: auto;
  max-width: 100%;
}
h1.title {
  font-size: 17pt; line-height: 1.28; text-align: center; font-weight: 700;
  margin: 0 0 1.4em 0; padding: 0 1em; letter-spacing: .1px;
}
h1 { font-size: 13.5pt; font-weight: 700; margin: 1.9em 0 .5em; line-height: 1.25;
     border-bottom: 1px solid #c8a84b; padding-bottom: .12em; }
h2 { font-size: 11.8pt; font-weight: 700; margin: 1.5em 0 .4em; }
h3 { font-size: 10.8pt; font-weight: 700; font-style: italic; margin: 1.2em 0 .3em; color:#333; }
p { margin: 0 0 .7em; }
em { font-style: italic; }
strong { font-weight: 700; }
/* the abstract: the para right after the Abstract h2 */
h2 + p { font-size: 10.2pt; color:#2a2a2a; }
/* blockquotes carry pull-stats, figures, and table captions */
blockquote {
  margin: .9em 0; padding: .35em 0 .35em 1em; border-left: 2px solid #c8a84b;
  color: #222; font-size: 10.2pt;
}
blockquote p { margin: .25em 0; }
blockquote strong { font-size: 11.5pt; }
pre {
  font-family: Consolas, "Cascadia Mono", "DejaVu Sans Mono", "Segoe UI Symbol", monospace;
  font-size: 7.6pt; line-height: 1.28; white-space: pre; overflow: visible;
  background: #faf8f2; border: 1px solid #e7e0cc; border-radius: 3px;
  padding: .6em .8em; margin: .5em 0; color:#222;
}
code { font-family: Consolas, "DejaVu Sans Mono", monospace; font-size: 9pt; }
table { border-collapse: collapse; width: 100%; margin: .6em 0 1em; font-size: 9.6pt; }
th, td { border: none; border-bottom: .5px solid #ccc; padding: .28em .5em; text-align: left; vertical-align: top; }
thead th { border-top: 1px solid #555; border-bottom: 1px solid #555; font-weight: 700; }
table tr:last-child td { border-bottom: 1px solid #555; }
hr { border: none; border-top: .5px solid #ddd; margin: 1.4em 0; }
ul, ol { margin: .2em 0 .8em; padding-left: 1.3em; }
li { margin: .18em 0; }
sup { font-size: .72em; line-height: 0; }
a { color: #1a1a1a; text-decoration: none; }
a[href^="#fn"] { color:#7a5c00; font-weight:600; }
/* footnotes block */
.footnote { font-size: 8.4pt; line-height: 1.4; color:#333; margin-top: 2em;
            border-top: 1px solid #999; padding-top: .6em; }
.footnote ol { padding-left: 1.4em; }
.footnote li { margin: .25em 0; }
.footnote p { margin: 0; }
h1, h2, h3 { page-break-after: avoid; }
table, pre, blockquote { page-break-inside: avoid; }
"""

doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Awakening in the Pali Texts</title>
<style>{CSS}</style></head>
<body>
{html_body}
</body></html>"""

open(out_html, 'w', encoding='utf-8').write(doc)
print("wrote", out_html, len(doc), "chars")
