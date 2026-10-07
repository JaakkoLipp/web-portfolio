# Fonts

All fonts are self-hosted. Visitors never contact a third-party font service.

## Martian Mono

From the `@fontsource-variable/martian-mono` package, using its `wdth.css` (weight and width axes).
`src/layouts/Base.astro` imports it and preloads the Latin file.
License: SIL Open Font License 1.1.

## JL Logo (JetBrains Mono subset)

The block logo needs the full block and box-drawing glyphs. The Fontsource subsets leave them out.
`src/assets/fonts/jetbrains-mono-logo.woff2` is JetBrains Mono Regular, subset to only these characters:

```
space █ ▌ ▀ ▄ ╗ ║ ╚ ╔ ╝ ═
```

It is 752 bytes, so Vite inlines it into the CSS. License: SIL Open Font License 1.1.

To rebuild it (needs Python with `fonttools` and `brotli`):

```bash
curl -LO https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf
pyftsubset JetBrainsMono-Regular.ttf --text=" █▌▀▄╗║╚╔╝═" --flavor=woff2 \
  --layout-features='' --no-hinting --desubroutinize \
  --output-file=src/assets/fonts/jetbrains-mono-logo.woff2
```

If you change the logo art in `src/scripts/terminal/content.js`, add any new characters to `--text`.
