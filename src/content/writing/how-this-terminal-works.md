---
title: How the terminal on this site works
description: A static Astro site, one small script, and a file system built from Markdown at build time.
date: 2026-10-07
tags: [astro, web, this-site]
---

The homepage of this site looks like a Proxmox host booting into a shell.
None of it runs on a server. Here is how it fits together.

## Static first

Astro builds every page to plain HTML at build time.
The pages you are reading now ship no JavaScript at all.
Only the homepage loads a script: the terminal.

## One config, one content folder

Everything the terminal knows comes from two places:

- `src/site.config.ts` holds the facts about me, the links, the machine, the services and the man page.
- `src/content/` holds one Markdown file per project and per post.

At build time a small module turns both into one JSON document and puts it in the page.
The terminal reads that JSON on load. Nothing is fetched later.

## Projects are programs

Each project file becomes an executable in `~/projects`, and that folder is on the shell's `PATH`.
So `homelab`, `./homelab` and `~/projects/homelab` all run the same thing: a short summary with a link to the full page.

Adding a project means adding one Markdown file:

```md
---
title: Homelab
summary: Proxmox cluster that runs my self-hosted LLM stack.
date: 2026-01-02
stack: [Proxmox, vLLM]
---

The long version goes here.
```

The next build adds the page, the executable, tab completion and, because it has a date, a line in `git log`.

## git log without git

The `git log --oneline` in the intro is not real git history.
It sorts projects and posts by their `date`, newest first, and gives each one a stable short hash made from its id.
That way the log never goes stale and never needs editing by hand.

## Easy to leave

A terminal is fun, but it should never trap anyone:

- Every page also has a real link, in a navigation menu that screen readers can find.
- Without JavaScript you get a plain page with the same links.
- Any key or tap skips the intro, and returning visitors skip the boot log.
- With reduced motion turned on, nothing types, scrolls or rains.

Try `help` in the terminal to see what else it can do. Some commands are not on that list.
