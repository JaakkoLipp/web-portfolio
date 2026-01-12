---
title: "Building This Portfolio: design constraints, delivery pipeline, and engineering tradeoffs"
date: 2026-01-12
tag: "portfolio", "astro", "tailwind", "nginx", "cicd", "devops", "design-systems"
icon: "🛠️👨‍💻💡"
excerpt: "A short write-up on how this site was designed and shipped: Astro + Markdown content, deliberate UI constraints, and a CI/CD → Nginx deploy flow."
---

I wanted this portfolio to do three things well: load fast, read cleanly, and be easy to ship. Everything else is secondary.

## Design constraints (on purpose)

The visual direction is **clean + modern with neo-brutalist hints**: high contrast, simple geometry, and typography that stays readable under motion and scaling. 
The palette is intentionally conservative (dark base with an accent) so project screenshots and writing can carry variation without fighting the UI.

A few small choices matter disproportionately:

- **Padding and rhythm:** extra horizontal padding on mobile/compact widths prevents the “crammed” feeling and improves scanability.
- **Link affordance:** on smaller viewports, link color/contrast must stay obviously interactive (no “looks like body text” failure).
- **Navigation clarity:** a simple top-bar menu for project links reduces scroll friction and makes the site feel like a product, not a page.
- **Dividers as structure:** a thin “markdown-style” divider under page titles makes sections feel intentional without heavy UI chrome.

The goal was not novelty; it was reducing cognitive load for skimming quickly.

## Stack choice: Astro + Markdown content

Astro fits the portfolio problem well: component ergonomics, static output, and minimal runtime JavaScript. Content is written in Markdown so writing remains the default workflow, not a CMS ritual. 
The theme work (typography scale, spacing, and color tokens) stays in Tailwind so changes are cheap and consistent.

Engineering rationale:

- **Static first:** fewer moving parts, simpler hosting, and fewer failure modes.
- **Content as code:** posts and projects review cleanly in Git, and the site is reproducible from source.
- **Components where it matters:** hero/header/footer patterns stay DRY without forcing everything into a framework runtime.

## Deployment: from GitHub to VPS to Nginx

The site is deployed via a GitHub Actions pipeline that publishes build output onto my linux server in a `/var/www/portfolio/current` directory, then Nginx serves that directory as the domain root.

This separation is intentional:

- CI/CD moves artifacts.
- Nginx serves a single stable path.
- Updating the served directory is a config change, not a rebuild.

## “Software engineering” lessons from a simple website

A portfolio site is small, but the same principles apply as larger systems:

- **Explicit constraints beat vague goals.** “Fast, readable, shippable” is actionable; “cool portfolio” isn’t.
- **Choose defaults that reduce entropy.** Static output + Markdown is a bias toward maintainability.
- **Operational correctness matters as much as code correctness.** If routing/root config is wrong, perfect builds still fail user expectations.
- **Small UX bugs are credibility bugs.** Link styling on mobile, padding, and navigation are not polish—they’re trust signals.

## What I’d improve next

- Tighten Lighthouse basics (image sizing, caching headers, font loading strategy).
- Add a small “projects” entry point in the top nav and keep it stable.
- Keep posts short and specific: each post should demonstrate one capability (systems thinking, delivery, automation, reliability).

This site is intentionally simple and quick: a reliable surface area for writing and proof of work, shipped with the same discipline as any production service.
