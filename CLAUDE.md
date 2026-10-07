# jaalip.com

Personal portfolio and blog for Jaakko, AI specialist and consultant in Helsinki.
The homepage is an Arch Linux TTY-style terminal: an auto-typed intro, then an interactive CLI with easter eggs.

## Source of truth

- `docs/design-defaults.md` lists every default decision in plain text. Read it before you propose any change.
- `docs/decisions/` holds dated decision records. The newest confirmed record overrides older records and the defaults file.
- `docs/reference/jaalip-tty.html` is the original prototype. The live terminal was ported from it. The defaults file wins where they differ.

## Where things live

- `src/site.config.ts`: owner info, links, machine and OS, services, boot log, man page, routes. Edit this to update site information.
- `src/content/projects/*.md`: one file per project. Each one becomes a page and an executable in the terminal.
- `src/content/writing/*.md`: blog posts.
- `src/lib/terminal-data.ts`: turns config and content into the JSON the terminal reads.
- `src/scripts/terminal/`: the terminal island (vanilla JS). Easter egg jokes live here, next to their behavior.
- `src/styles/tokens.css`: the palette (Rosé Pine main) and type tokens.

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
