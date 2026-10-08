# Rebuild plan (2026-10-07)

Decisions: `docs/decisions/2026-10-07-rebuild.md`.
Each phase ends with `npm run build` and `npm run check`, then one Conventional Commits commit.

| Phase | Creates or changes | Check that ends it |
| --- | --- | --- |
| 1. Docs | `CLAUDE.md`, `.claude/skills/rebuild/`, `docs/` | Files reviewed |
| 2. Scaffold | Remove the old site. `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc` | Empty site builds |
| 3. Config, content, tokens | `src/site.config.ts`, `src/content.config.ts`, `src/content/**`, `src/styles/`, `src/layouts/` | Build passes, collections load |
| 4. Terminal | `src/scripts/terminal/*`, `src/lib/terminal-data.ts`, `src/pages/index.astro` | Intro runs in a browser, every prototype command works |
| 5. Content pages | `src/pages/projects/`, `src/pages/writing/`, `paper.astro`, `keymap.astro`, `404.astro` | All routes build, links resolve |
| 6. CI and polish | `.github/workflows/`, `scripts/check-budget.mjs`, `README.md`, `preview.png` | CI config valid, budget under 100 KB, smoke test passes at 360 px and 1280 px |
