---
title: jaalip.com
summary: This site. A Proxmox-flavoured terminal built with Astro and one small vanilla JS island.
date: 2026-10-07
context: Personal site
stack: [Astro, TypeScript, CSS, GitHub Actions]
links:
  - label: Source
    url: https://github.com/JaakkoLipp/web-portfolio
version: '2.0'
log: rebuild the site as a terminal
order: 3
---

The homepage is a terminal.
It boots like a Proxmox host, logs you in as `guest`, and runs a few commands for you.
After that it is yours to explore.

## How it is built

- Astro builds static HTML. There is no server code.
- The terminal is one vanilla JS island. Everything else ships zero JavaScript.
- Site information lives in one config file. Projects and posts are Markdown files.
- The terminal reads its file system, `git log` and service list from that config and content at build time.

## How it ships

GitHub Actions builds the site on every push to `main`, uploads it to a new release folder on `netwatch`, and switches a symlink.
Rollback means pointing the symlink back.
