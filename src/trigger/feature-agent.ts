import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";

// ---------------------------------------------------------------------------
// Clients — initialised once per worker, reused across runs
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LinearWebhookPayload {
  type: string;
  action: string;
  data: {
    id: string;
    title: string;
    description?: string;
    identifier: string; // e.g. "ENG-42"
    url: string;
    labels?: { nodes: { name: string }[] };
    team?: { key: string };
  };
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export const featureAgent = task({
  id: "feature-agent",

  // Give Claude enough time to think and GitHub enough time to respond
  maxDuration: 300,

  run: async (payload: LinearWebhookPayload) => {
    const { data: issue } = payload;

    logger.info("Feature agent triggered", {
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
    });

    // ── 1. Fetch the full issue from Linear ─────────────────────────────────
    const linearIssue = await linear.issue(issue.id);
    const description = linearIssue.description ?? "(no description provided)";

    logger.info("Issue fetched from Linear", { identifier: issue.identifier });

    // ── 2. Ask Claude to produce an implementation plan ──────────────────────
    logger.info("Calling Claude...");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: `You are a senior software engineer reviewing a Linear issue.
Your job is to produce a clear, specific implementation plan that a developer can follow.
Be concrete. Reference file paths and patterns when you can infer them from the description.
Do not write code — write a plan that will be reviewed by a human before any code is written.`,
      messages: [
        {
          role: "user",
          content: `## ${issue.identifier}: ${linearIssue.title}

${description}

Produce:
1. **Summary** — one paragraph on what needs to be built and why
2. **Implementation steps** — 5–10 numbered, concrete steps
3. **Files to create or modify** — best guesses based on the description
4. **Edge cases** — what could go wrong
5. **Testing approach** — what tests should cover this

Keep it tight. A human will review this plan and approve or redirect before any code is written.`,
        },
      ],
    });

    const plan =
      response.content[0].type === "text" ? response.content[0].text : "";

    logger.info("Claude responded", {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    // ── 3. Post the plan as a Linear comment ────────────────────────────────
    await linear.createComment({
      issueId: issue.id,
      body: [
        "## 🤖 Feature Agent — Implementation Plan",
        "",
        plan,
        "",
        "---",
        "*Review this plan. Reply **approve** to proceed, or give feedback to refine it.*",
        `*[View issue](${issue.url})*`,
      ].join("\n"),
    });

    logger.info("Plan posted to Linear", { identifier: issue.identifier });

    // ── 4. Optionally open a GitHub draft PR ─────────────────────────────────
    // Only runs when GITHUB_REPO is set (format: "owner/repo")
    if (process.env.GITHUB_REPO) {
      const [owner, repo] = process.env.GITHUB_REPO.split("/");
      const branchName = `agent/${issue.identifier.toLowerCase()}-${slugify(linearIssue.title)}`;

      try {
        // Get the default branch SHA to branch from
        const { data: ref } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${process.env.GITHUB_DEFAULT_BRANCH ?? "main"}`,
        });

        // Create the branch
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: ref.object.sha,
        });

        // Open a draft PR
        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title: `[DRAFT] ${issue.identifier}: ${linearIssue.title}`,
          head: branchName,
          base: process.env.GITHUB_DEFAULT_BRANCH ?? "main",
          draft: true,
          body: [
            `## ${issue.identifier}: ${linearIssue.title}`,
            "",
            `Linear: ${issue.url}`,
            "",
            "### Implementation plan",
            "",
            plan,
            "",
            "---",
            "*Opened automatically by the Feature Agent. Awaiting human review.*",
          ].join("\n"),
        });

        logger.info("Draft PR opened", { prUrl: pr.html_url });

        // Post the PR link back to Linear
        await linear.createComment({
          issueId: issue.id,
          body: `🔗 Draft PR ready for review: [${pr.title}](${pr.html_url})`,
        });
      } catch (err) {
        logger.error("Failed to open draft PR", { error: String(err) });
      }
    }

    return {
      success: true,
      issueId: issue.id,
      identifier: issue.identifier,
    };
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
