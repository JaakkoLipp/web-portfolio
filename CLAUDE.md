# jaalip.com

Personal portfolio and blog for Jaakko, AI specialist and consultant in Helsinki.
The homepage is a Proxmox-style TTY terminal: a brief boot, an auto-typed intro, then an interactive CLI with easter eggs.

## Source of truth

- `docs/design-defaults.md` lists every default decision in plain text. Read it before you propose any change.
- `docs/decisions/` holds dated decision records. The newest confirmed record overrides older records and the defaults file.
- `docs/reference/jaalip-tty.html` is the original prototype. The live terminal was ported from it. The defaults file wins where they differ.

## Where things live

- `src/site.config.ts`: owner info and time zone, brand, links, pages (with aliases and folder files), machine and OS, services, readme, man page, fortunes. Edit this to update site information.
- `src/content/projects/*.md`: one file per project. Each one becomes a page and an executable in the terminal.
- `src/content/writing/*.md`: blog posts.
- `src/content/pages/*.md`: simple pages such as paper and keymap. The file name must match a page id in the config.
- `src/lib/`: build helpers. `site.ts` (values derived from the config), `content.ts` (collections, URLs, git log), `terminal-data.ts` (the JSON the terminal reads), `format.ts` (helpers shared with the terminal).
- `src/scripts/terminal/`: the terminal island (vanilla JS), one job per module:
  - `state.js`: shared state, values derived from the config, output helpers.
  - `commands.js`: core shell commands, dispatch and tab completion.
  - `system.js`: the simulated machine (apt, nvidia-smi, docker, systemctl, ping), driven by `machine` and `services`.
  - `eggs.js`: easter eggs. Add a new joke here and nowhere else.
  - `content.js`: fetch card, git log, help, man page, projects as programs, `open`.
  - `fs.js`: the virtual file system, `ls` and `cat`.
  - `intro.js` (boot and login), `htop.js` (the overlay), `main.js` (input and key bindings).
- `src/styles/tokens.css`: the palette (Rosé Pine main), type tokens and classes shared by both stylesheets.

## Interview before you build

- Do not start a rebuild, a new page, or a design change from your own assumptions.
- Run the `/rebuild` skill, or follow its steps, so the owner chooses how to build and design it.
- Show the current default for every question. "Keep default" is always an option.
- Small fixes (typos, a broken link, one bug) do not need an interview.

## Rules

- Keep it simple. Prefer static output and zero client-side JavaScript outside the terminal itself.
- Keep all site content in one config or content collection. Do not hard-code copy inside components.
- Never invent facts about the owner. Use `[TODO: ...]` placeholders for missing content.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`. Every animation must be interruptible.
- Keep the page keyboard accessible. Real links must exist for screen readers, outside the terminal.
- Do not expose real internal hostnames, IPs or service details unless a decision record allows it.
- Written copy and docs: no em dashes. Use short sentences in active voice.

## Workflow

- Work in small phases. Commit after each phase with a Conventional Commits message (`feat:`, `fix:`, `docs:`, `chore:`).
- Run the build and the checks in `docs/design-defaults.md` before each commit.
- When a decision changes a default, update `docs/design-defaults.md` in the same commit.
