# Agent Brain — agent-army-demo

## Project Overview

Demo site for the AI Agent Army workshop (WeLoveFounders Expert Talk by Above The Clouds).
A Next.js homepage wired to Linear, Trigger.dev, and Vercel. The site IS the demo — agents update its copy live on stage.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 15, React 19, plain CSS variables (no Tailwind) |
| Agent tasks | Trigger.dev v3 |
| AI | Anthropic Claude (claude-opus-4-7) |
| Issue tracking | Linear SDK |
| Version control | GitHub (Octokit) |
| Deployment | Vercel |

## Architecture

```
app/
  layout.tsx        — root layout, metadata
  page.tsx          — homepage (all copy lives here)
  globals.css       — CSS variables (design tokens)
api/webhook/
  linear.ts         — Vercel serverless: receives Linear webhooks → triggers feature-agent
  vercel.ts         — Vercel serverless: receives deployment webhooks → posts preview URL to Linear
src/trigger/
  feature-agent.ts  — Trigger.dev task: Linear issue → Claude plan → Linear comment → draft PR
CLAUDE.md           — this file
DESIGN.md           — design tokens and UI conventions
```

## Naming Conventions

- Branches: `[linear-id]-[short-description]` — e.g. `eng-42-update-hero-headline`
- Components: PascalCase files, default exports
- CSS: CSS variables defined in globals.css, referenced as `var(--name)`

## Commands

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server on localhost:3000 |
| `npm run trigger:dev` | Trigger.dev local dev server |
| `npm run deploy` | Deploy to Vercel production |
| `npm run trigger:deploy` | Deploy agent task to Trigger.dev cloud |

## Agent Guidelines

1. All copy (headlines, body text, CTAs) lives in `app/page.tsx` as plain JSX strings — edit those directly.
2. Design tokens are in `app/globals.css`. Never hardcode colors or font sizes — always use `var(--token)`.
3. Do not install new dependencies without asking. The stack is intentionally minimal.
4. Do not touch `api/webhook/` or `src/trigger/` for copy changes — those are infrastructure.
5. After any copy change, confirm the text reads well at mobile widths (the `clamp()` font sizes handle it).
6. Branch from `main`. Never commit directly to `main`.

## What Agents Should Never Do

- Introduce Tailwind, CSS modules, or styled-components — use CSS variables
- Change colors or fonts to values not in DESIGN.md
- Add analytics, tracking scripts, or third-party embeds without explicit instruction
- Modify webhook handlers or the Trigger.dev task when the request is about copy or design
