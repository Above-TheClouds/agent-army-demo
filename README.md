# agent-army-demo

> Live demo site for the AI Agent Army workshop — update copy via a Linear issue and watch Claude ship a PR in real time.

Built for the **WeLoveFounders Expert Talk — Building an AI Agent Army** by [Above The Clouds](https://abovetheclouds.io).

---

## What this is

A Next.js homepage wired to Linear, Trigger.dev, and Vercel. Used on stage to show the full autonomous agent loop:

1. Create a Linear issue: *"Update the hero headline to X"*
2. Label it `feature:build` (or assign to your AI Agent user)
3. Watch: Claude reads the issue → posts a plan as a Linear comment → opens a draft PR
4. Merge → Vercel deploys → preview URL appears in Linear before you refresh

---

## Quick start

```bash
git clone https://github.com/Above-TheClouds/agent-army-demo.git
cd agent-army-demo
npm install
cp .env.example .env   # fill in all values
```

**Environment variables explained:**

| Variable | Where to get it | Used for |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Claude writes the implementation plan |
| `TRIGGER_SECRET_KEY` | Trigger.dev → Project → API Keys | Queuing and running agent tasks |
| `TRIGGER_PROJECT_REF` | Trigger.dev dashboard | Linking tasks to your project |
| `LINEAR_API_KEY` | Linear → Settings → API → Personal API keys | Posting the plan + preview URL as Linear comments |
| `LINEAR_WEBHOOK_SECRET` | Linear → Settings → API → Webhooks | Verifying webhook signatures |
| `LINEAR_AGENT_USER_ID` | Linear → Settings → Members → agent user URL | Optional: trigger by assignee instead of label |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained PATs | Opening draft PRs |
| `GITHUB_REPO` | — | Target repo for PRs (e.g. `Above-TheClouds/agent-army-demo`) |
| `VERCEL_WEBHOOK_SECRET` | Vercel → Project → Settings → Webhooks | Verifying deployment webhook signatures |

---

## Running locally

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Trigger.dev (runs agent tasks locally)
npm run trigger:dev
```

For the webhook: run `vercel dev` in a third terminal, then expose it with `npx localtunnel --port 3000`.

---

## Deploy

```bash
# Deploy the Next.js site + webhook handlers to Vercel
npm run deploy

# Deploy the agent task to Trigger.dev cloud
npm run trigger:deploy
```

Then configure two webhooks:
- **Linear** → `https://your-project.vercel.app/api/webhook/linear` (Issues event)
- **Vercel** → `https://your-project.vercel.app/api/webhook/vercel` (Deployment succeeded)

---

## Local agent commands

Run these inside Claude Code (`claude` in your terminal):

| Command | What it does |
|---|---|
| `/feature ENG-42` | Read a Linear issue and implement it |
| `/ui-design` | Design and implement a component following DESIGN.md |
| `/qa` | Risk assessment, QA checklist, and missing tests |
| `/review` | Code review the current branch |
| `/docs` | Keep CLAUDE.md and README in sync |

---

## Project structure

```
agent-army-demo/
├── .claude/commands/       # Slash command agents
├── api/webhook/
│   ├── linear.ts           # Linear webhook → Trigger.dev
│   └── vercel.ts           # Vercel deployment → Linear comment
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # Homepage — all demo copy lives here
│   └── globals.css         # Design tokens (CSS variables)
├── src/trigger/
│   └── feature-agent.ts    # Trigger.dev task: issue → Claude → PR
├── CLAUDE.md               # Architecture brain (pre-filled)
├── DESIGN.md               # Design brain (pre-filled)
├── vercel.json
└── .env.example
```

---

## The starter repo

This demo site is built on top of **[agent-army-starter](https://github.com/Above-TheClouds/agent-army-starter)** — a minimal, forkable template with no demo UI. Fork that to build your own agent army.

---

**Above The Clouds:** [abovetheclouds.io](https://abovetheclouds.io)
**Questions:** [nico@abovetheclouds.io](mailto:nico@abovetheclouds.io)

MIT License
