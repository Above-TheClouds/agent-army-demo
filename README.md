# agent-army-demo

> The AI Agent Army — fork this, wire it to your Linear, and ship your first autonomous agent today. Live at [agent-army.abovetheclouds.io](https://agent-army.abovetheclouds.io).

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

    B -->|trigger| ORC

    subgraph Trigger.dev — Agent Army
        ORC[orchestrator\nroutes by intent]
        ORC -->|feature request| FA[feature-agent\nplan + patches + PR]
        ORC -->|article brief| CA[content-agent\nwrite + publish to knowledge]
        FA -->|spawns after PR| FV[feature-verifier\nreviews PR diff]
        FA -->|plan + patches| CL[Anthropic Claude]
        CA -->|article| CL
        FV -->|review| CL
        CL -.->|trace| LF[Langfuse]
        FA -->|create branch + PR| GH[GitHub API]
        CA -->|create branch + PR| GH
    end

    FA -->|move to In Progress| A
    FV -->|LGTM or needs changes| A
    GH -->|PR merged| GH2[GitHub — merge to main]
    GH2 -->|deploy| V[Vercel Production]
    V -->|deployment webhook| W3
    W3 -->|production URL + move to Done| A

    subgraph Preview Loop
        GH -->|open PR branch| VP[Vercel Preview]
        VP -->|deployment webhook| W3
        W3 -->|preview URL + move to In Preview| A
    end
```

---

## Agent pods

| Agent | Pod | Role |
|---|---|---|
| **orchestrator** | All | Receives every Linear webhook, classifies intent with Claude, dispatches to the right agent |
| **feature-agent** | Product | Reads the repo, generates a plan, produces code patches, opens a PR |
| **feature-verifier** | Product | Spawned after every PR — reviews the diff and posts LGTM / NEEDS CHANGES to Linear |
| **content-agent** | Content | Reads a content brief, writes a full article with Claude, opens a PR to `/knowledge` |

The orchestrator uses `claude-haiku` to classify each issue as a feature request or content task based on the title and description — no labels or manual routing needed. If `LINEAR_CONTENT_TEAM_ID` is set, team-based routing takes priority.

---

## Demo flows

### Feature flow
1. Assign a card to the **AI Agent** user and drop it in **To Do**
2. Orchestrator classifies → routes to **feature-agent**
3. Feature agent moves card to **In Progress**, reads the repo, generates a plan, opens a PR
4. Feature verifier reviews the PR diff and posts a code review to Linear
5. Vercel deploys the preview branch — URL appears as a Linear comment, card moves to **In Preview**
6. Reply **ship it** → PR merges → production deploys → Linear comment with live URL, card moves to **Done**

### Content flow
1. Assign a card with an article brief to the **AI Agent** user and drop it in **To Do**
2. Orchestrator classifies → routes to **content-agent**
3. Content agent writes the article, opens a PR adding a page to `/knowledge`
4. Vercel deploys a preview — review the article at the preview URL
5. Reply **ship it** → article publishes to `/knowledge`

### Bug flow
1. Click **Trigger bug →** on the homepage
2. Sentry captures the error → fires webhook → Linear card created, assigned to agent
3. Orchestrator routes to **feature-agent** → same loop: plan → PR → preview → ship it → production

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

### Linear workflow states

The agent expects these states in your Linear team's workflow (Settings → Workflow):

| State | Type | Created by |
|---|---|---|
| To Do | Unstarted | Default |
| In Progress | Started | Default |
| **In Preview** | Started | **You must create this** |
| Done | Completed | Default |
| Canceled | Canceled | Default |

The "In Preview" state is not a Linear default — add it manually before running the demo.

---

## Langfuse prompt management

The agent fetches its system prompts from Langfuse at runtime, so you can tune agent behavior without redeploying. If a prompt is missing or unreachable, the agent falls back to the defaults hardcoded in `src/trigger/feature-agent.ts`.

Each prompt also supports a **Config** JSON field for model settings. This lets you switch models or run A/B tests between prompt versions without touching code:

```json
{
  "model": "claude-opus-4-8",
  "max_tokens": 2048
}
```

If `model` or `max_tokens` are absent from the config, the agent uses `claude-opus-4-7` and the hardcoded token limits as fallback.

### Create the prompts

Go to **Langfuse → Prompt Management → New Prompt** and create two **text** prompts (not chat):

**Name: `feature-agent-plan`**

```
You are a senior software engineer reviewing a Linear issue in a real Next.js repository.
Use the exact current code from the repo context below.
If the issue involves copy or homepage text, update app/page.tsx directly.
Do not produce generic product requirements.
Be concrete, concise, and specific to this codebase.
Avoid using dashes (-) in the text you generate.
Do not write code — write a plan that will be reviewed by a human before any code is written.
```

**Name: `feature-agent-patches`**

```
You are a senior software engineer applying minimal, surgical changes to an existing codebase.
You will be given a Linear issue, an implementation plan, and the CURRENT contents of the relevant files.

Your job is to output a JSON object describing ONLY what changes — as find/replace patches, not full file contents.

Return this exact shape:
{
  "patches": [
    {
      "path": "app/page.tsx",
      "find": "exact string to find, character-for-character as it appears in the file",
      "replace": "exact replacement string"
    }
  ]
}

Rules:
- Each patch targets ONE specific string to find and replace. Use multiple patches if multiple strings must change.
- The "find" value must appear verbatim in the current file. Copy it exactly from the file contents provided — same whitespace, same quotes.
- Only patch what the issue explicitly asks to change. Do not touch anything else.
- Never output full file contents. Only output the specific strings that change.
- Only return valid JSON, nothing else. No markdown fences, no explanation.
- Use Unix-style paths (e.g. "app/page.tsx").
```

Once created, publish each prompt (set to **Production** label). The agent will pick up any new version automatically on the next run — no redeployment needed.

Each Langfuse trace will include `promptName` and `promptVersion` in the generation metadata so you can see exactly which version produced each output.

---

## Project structure

```
agent-army-demo/
├── api/webhook/
│   ├── linear.ts              # Linear webhook → orchestrator
│   ├── vercel.ts              # Vercel deployment → Linear state + comment
│   └── sentry.ts              # Sentry error → Linear card
├── app/
│   ├── page.tsx               # Homepage
│   ├── agents/page.tsx        # Agent roster (/agents)
│   ├── knowledge/
│   │   ├── page.tsx           # Knowledge base index (/knowledge)
│   │   ├── [slug]/page.tsx    # Per-article pages (generated by content-agent)
│   │   └── _articles.ts       # Article manifest (patched by content-agent)
│   ├── BugButton.tsx          # Client component — triggers demo Sentry error
│   └── globals.css            # Design tokens (CSS variables)
├── src/trigger/
│   ├── orchestrator.ts        # Routes issues to the right agent by intent
│   ├── feature-agent.ts       # Plan + code patches + PR
│   ├── feature-verifier.ts    # PR diff review → Linear comment
│   └── content-agent.ts       # Article generation → /knowledge PR
├── .github/workflows/
│   └── ci.yml                 # TypeScript check on every PR
├── CLAUDE.md
├── DESIGN.md
└── .env.example
```

---

## Don't need the homepage?

Delete the `app/` folder. Everything else — the orchestrator, agents, and webhook handlers — is the agent army. Wire it to any codebase.

---

**Live demo:** [agent-army.abovetheclouds.io](https://agent-army.abovetheclouds.io)
**Above The Clouds:** [abovetheclouds.io](https://abovetheclouds.io)
**Questions:** [nico@abovetheclouds.io](mailto:nico@abovetheclouds.io)

MIT License
