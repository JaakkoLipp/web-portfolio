---
name: rebuild
description: Interview the owner about how to build and design jaalip.com, record the answers, plan, then build in phases. Use for a full rebuild or a major redesign.
disable-model-invocation: true
argument-hint: "[optional scope: stack | hosting | pages | design | terminal | quality]"
---

# Rebuild jaalip.com

Scope for this run: $ARGUMENTS
If the scope is empty, cover all sections. Otherwise, ask only about that section.

## 1. Load the defaults

1. Read `CLAUDE.md`, `docs/design-defaults.md` and every file in `docs/decisions/`.
2. Skim `docs/reference/jaalip-tty.html` for behavior that the defaults file does not describe.
3. Check what already exists in the repo (`package.json`, `src/`, CI files). Tell the owner in 3 lines or less.

## 2. Interview

Use the AskUserQuestion tool. Ask in small batches, one section at a time, in this order:

1. Stack and build
2. Hosting and delivery (git host, deploy target, analytics)
3. Pages and routes
4. Visual identity (palette, type, logo)
5. Terminal behavior (intro, commands, easter eggs, real or fictional hostnames)
6. Quality checks

Rules for each question:

- The first option is always "Keep default: <value from design-defaults.md>".
- Add 2 or 3 real alternatives. Name the trade-off of each in one short line.
- Never ask about something the decision records already settled, unless the scope says so.
- Resolve every `[TODO]` in the defaults file that the current scope touches.
- After each section, repeat the answers back in one short list and continue.

## 3. Record the decisions

Write `docs/decisions/<YYYY-MM-DD>-rebuild.md` with one row per question:

| Question | Default | Answer | Reason (if given) |

Update `docs/design-defaults.md` so it matches the new answers.

## 4. Plan and confirm

1. Write `docs/plan.md`: phases, the files each phase creates, and the check that ends each phase.
2. Show the plan summary to the owner.
3. Stop and wait for an explicit "go". Do not write code before that.

## 5. Build

- One phase at a time. Suggested order: scaffold, design tokens and layout, terminal island port, content pages, CI and deploy, polish.
- Port behavior from the prototype. Do not rewrite it from memory.
- After each phase: run the build and the checks, commit with a Conventional Commits message, then report what changed in 3 lines or less.
- If a phase needs a decision the interview did not cover, ask before you continue.

## 6. Finish

- List open `[TODO]` items that remain.
- Tell the owner how to run the site locally and how to deploy it.
