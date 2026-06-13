# agent-army-demo

> Live demo site for the AI Agent Army workshop — drop a card in Linear and watch Claude ship a PR, deploy to Vercel, and close the issue automatically.

Built for the **WeLoveFounders Expert Talk — Building an AI Agent Army** by [Above The Clouds](https://abovetheclouds.io).

---

## Architecture

```mermaid
flowchart TD
    subgraph Triggers
        A[Linear — card in To Do\nassigned to AI Agent] -->|webhook| B
        S[Sentry — new error captured] -->|webhook| W2
    end

    subgraph Vercel Serverless
        B[/api/webhook/linear]
        W2[/api/webhook/sentry] -->|create card| A
        W3[/api/webhook/vercel]
    end

    B -->|trigger task| C

    subgraph Trigger.dev
        C[feature-agent task]
        C -->|read files| GH1[GitHub API]
        C -->|plan + patches| CL[Anthropic Claude]
        CL -.->|trace| LF[Langfuse]
        C -->|create branch + PR| GH2[GitHub API]
    end

    C -->|move to In Progress| A
    GH2 -->|PR merged| GH3[GitHub — merge to main]
    GH3 -->|deploy| V[Vercel Production]
    V -->|deployment webhook| W3
    W3 -->|production URL comment| A
    C -->|move to Done| A

    subgraph Preview Loop
        GH2 -->|open PR branch| VP[Vercel Preview]
        VP -->|deployment webhook| W3
        W3 -->|preview URL comment| A
    end
```

---

## Demo flows

### Feature flow
1. Assign a card to the **AI Agent** user and drop it in **To Do**
2. Agent moves it to **In Progress**, reads the repo, generates a plan, opens a PR
3. Vercel deploys a preview — URL appears as a Linear comment
4. Reply **ship it** → PR merges → production deploy → Linear comment with live URL

### Bug flow
1. Click **Trigger bug →** on the homepage
2. Sentry captures the error → fires webhook → Linear card created, assigned to agent
3. Same agent loop: plan → PR → preview → ship it → production

---

## Quick start

```bash
git clone https://github.com/Above-TheClouds/agent-army-demo.git
cd agent-army-demo
npm install
cp .env.example .env   # fill in all values
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `TRIGGER_SECRET_KEY` | Trigger.dev → Project → API Keys |
| `TRIGGER_PROJECT_REF` | Trigger.dev dashboard URL |
| `LINEAR_API_KEY` | Linear → Settings → API → Personal API keys |
| `LINEAR_WEBHOOK_SECRET` | Linear → Settings → API → Webhooks |
| `LINEAR_AGENT_USER_ID` | Linear → Members → agent user profile URL |
| `LINEAR_TEAM_ID` | Linear → Settings → Team (or from webhook logs) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained PATs |
| `GITHUB_REPO` | `owner/repo` — e.g. `Above-TheClouds/agent-army-demo` |
| `GITHUB_DEFAULT_BRANCH` | Usually `main` |
| `VERCEL_WEBHOOK_SECRET` | Vercel → Project → Settings → Webhooks |
| `VERCEL_PRODUCTION_URL` | Your production hostname, no `https://` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project → Settings → Client Keys |
| `SENTRY_WEBHOOK_SECRET` | Sentry → Internal Integration signing secret (optional) |
| `LANGFUSE_PUBLIC_KEY` | Langfuse → Project → Settings |
| `LANGFUSE_SECRET_KEY` | Langfuse → Project → Settings |
| `LANGFUSE_HOST` | `https://cloud.langfuse.com` (or self-hosted URL) |

---

## Running locally

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Trigger.dev (runs agent tasks locally)
npm run trigger:dev
```

Expose the webhook with `npx localtunnel --port 3000` and point Linear + Sentry + Vercel webhooks at the tunnel URL.

---

## Deploy

```bash
npm run deploy           # Next.js + webhook handlers → Vercel
npm run trigger:deploy   # Agent task → Trigger.dev cloud
```

### Webhooks to configure

| Service | URL | Events |
|---|---|---|
| Linear | `/api/webhook/linear` | Issues, Comments |
| Vercel | `/api/webhook/vercel` | Deployment succeeded |
| Sentry | `/api/webhook/sentry` | Issue created (via alert rule) |

---

## Project structure

```
agent-army-demo/
├── api/webhook/
│   ├── linear.ts           # Linear webhook → Trigger.dev
│   ├── vercel.ts           # Vercel deployment → Linear comment
│   └── sentry.ts           # Sentry issue → Linear card
├── app/
│   ├── page.tsx            # Homepage — all demo copy lives here
│   ├── BugButton.tsx       # Client component — triggers demo error
│   └── globals.css         # Design tokens (CSS variables)
├── src/trigger/
│   └── feature-agent.ts    # Trigger.dev task: issue → Claude → PR
├── CLAUDE.md
├── DESIGN.md
└── .env.example
```

---

**Above The Clouds:** [abovetheclouds.io](https://abovetheclouds.io)
**Questions:** [nico@abovetheclouds.io](mailto:nico@abovetheclouds.io)

MIT License
