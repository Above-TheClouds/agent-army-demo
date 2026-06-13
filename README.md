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

## Langfuse prompt management

The agent fetches its system prompts from Langfuse at runtime, so you can tune agent behavior without redeploying. If a prompt is missing or unreachable, the agent falls back to the defaults hardcoded in `src/trigger/feature-agent.ts`.

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
