# Design defaults

These defaults started from the prototype in `docs/reference/jaalip-tty.html`.
The rebuild on 2026-10-07 changed several of them. See `docs/decisions/2026-10-07-rebuild.md`.
The `/rebuild` interview shows each value as the default answer.
When the owner confirms a different answer, update this file and add a record in `docs/decisions/`.

## 1. Stack and build

| Topic | Default |
| --- | --- |
| Framework | Astro 7, static output |
| Terminal | One vanilla JS island in `src/scripts/terminal/`, ported from the prototype |
| Content | Astro content collections in Markdown: `src/content/projects/`, `src/content/writing/` and `src/content/pages/` (simple pages) |
| Site config | One typed file, `src/site.config.ts` (owner and time zone, brand, links, pages, machine, services, man page) |
| Styling | Plain CSS. Tokens in `src/styles/tokens.css` |
| Fonts | Self-hosted. Martian Mono from Fontsource. A JetBrains Mono subset for the logo |
| Package manager | npm |
| Node version | 24 (current LTS), pinned in `.nvmrc` |

## 2. Hosting and delivery

| Topic | Default |
| --- | --- |
| Git host | GitHub |
| Hosting | Static files on the VPS `netwatch`. The server setup is documented on the server, never in this public repo |
| Deploy | GitHub Actions on push to `main` (or by hand): build, upload a new release over SSH, atomic switch, keep 5 releases, then check that `/version.txt` on the live site serves the new commit. See `docs/deploy.md` |
| Deploy access | A dedicated deploy user and key. The key can only upload and activate a release. The host key is pinned |
| PR checks | GitHub Actions runs `npm run build` and `npm run check` on every pull request |
| Secrets | CI secrets only (`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`). Never in the repo |
| Analytics | None. Optional: self-hosted, cookie-free Umami |

## 3. Pages and routes

| Route | Content |
| --- | --- |
| `/` | Terminal homepage |
| `/projects` | All projects, one Markdown entry each |
| `/projects/<id>` | One project. The thesis lives at `/projects/llm-eval-service` |
| `/paper` | Daily AI-generated HTML newspaper (placeholder, `src/content/pages/paper.md`) |
| `/keymap` | Sofle keyboard keymap quick reference (placeholder, `src/content/pages/keymap.md`) |
| `/writing` | Blog posts |
| `/writing/<id>` | One post |

Every page outside the terminal is plain, readable HTML in the same palette.
Contact is GitHub and LinkedIn only. No email address on the site.

## 4. Visual identity

### Palette (Rosé Pine, main variant, dark only)

| Token | Rosé Pine | Hex | Use |
| --- | --- | --- | --- |
| `--bg` | base | `#191724` | Page background |
| `--bg-2` | surface | `#1f1d2e` | Status line, raised surfaces |
| `--bg-3` | overlay | `#26233a` | Inline code |
| `--fg` | text | `#e0def4` | Body text, typed commands |
| `--dim` | subtle | `#908caa` | Secondary text |
| `--faint` | muted | `#6e6a86` | Decoration only |
| `--accent` | foam | `#9ccfd8` | Links, directories, path, OK |
| `--rose` | rose | `#ebbcba` | Brand, prompt, cursor, git refs |
| `--iris` | iris | `#c4a7e7` | Executables, commit types, logo |
| `--gold` | gold | `#f6c177` | Git hashes, warnings |
| `--love` | love | `#eb6f92` | Errors |
| `--pine` | pine | `#31748f` | Decoration only (fails AA as text) |
| `--hl-low`, `--hl-med`, `--hl-high` | highlight low, med, high | `#21202e`, `#403d52`, `#524f67` | Selection, borders, logo shadow |

To try the moon variant, swap the primitives at the top of `src/styles/tokens.css`.

### Type

- Body and terminal: Martian Mono, width axis 87.5, weight 400.
- Logo: JetBrains Mono, subset to the block and box-drawing glyphs (under 1 KB, inlined).
- One family for UI. No second display face.

### Logo (option C, shadow block)

- JL initials in heavy block letters with a box-drawing drop shadow.
- Two stacked layers: blocks get a rose to iris gradient with a text-colored shimmer, the shadow is highlight high.
- Motion: a light shimmer every 4.5 s, and a blinking cursor after the "jaalip" wordmark.
- Only the newest logo on screen animates.

## 5. Terminal behavior

- Machine: Proxmox VE on `netwatch`. Internal homelab hostnames are never shown.
- Intro: a brief systemd boot sequence, a clear screen (like Ctrl+L, no scrollback), the Proxmox console banner, auto login as `guest`, then auto-typed `fastfetch`, `git log --oneline -5`, `ls ~`.
- `ls ~` is the site menu and always runs last, also after `exit`. Page folders open their page, `<owner>.1` opens the man page, `contact.txt` shows the links.
- Any key or tap skips the intro. Returning visitors skip the boot (one localStorage key).
- Prompt format: `guest@netwatch:~$`.
- Projects are executables in `~/projects`, which is on `PATH`. `homelab`, `./homelab` and `~/projects/homelab` all run it.
- `git log` is generated from the dates of projects and posts.
- Page names and their `aliases` (for example `blog`) work as commands.
- Services (boot log, `htop`, `docker ps`) come from `services` in `src/site.config.ts`.
- Shell features: Tab completion, history, Ctrl+C, Ctrl+L, "Did you mean" suggestions.
- Underlined output runs a command on click.
- Status line: tmux style, with path and Helsinki time.
- Easter eggs: apt, pacman (not here), sudo, rm -rf /, vim, sl, cowsay (moose), matrix, htop, nvidia-smi, docker ps, ping, ssh, curl, sauna, kahvi, sisu, moi, apua, turku, .secrets, Konami code (northern lights).

## 6. Motion and accessibility

- Press feedback on pointer-down (scale 0.97, 100 ms).
- Every animation is interruptible.
- Reduced motion: no typing animation, no train, no rain, static logo.
- Reduced transparency: nothing on the homepage is translucent.
- Hidden nav with real links for screen readers, plus a `<noscript>` fallback.
- Text colors pass WCAG AA on their background.

## 7. Quality checks

- `npm run build` passes with no warnings.
- `npm run check` passes (`astro check` and the size budget).
- Homepage HTML+CSS+JS under 100 KB before fonts.
- Lighthouse: Performance, Accessibility and Best Practices at 95 or higher.
- Works at 360 px width and with keyboard only.

## 8. Open questions

- [TODO: content for `/paper` and how the daily paper gets published next to the static site]
- [TODO: Sofle keymap layers for `/keymap`]
- [TODO: details and links for each project marked with TODO]
