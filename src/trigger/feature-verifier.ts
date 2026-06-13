import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export interface FeatureVerifierPayload {
  issueId: string;
  identifier: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
}

export const featureVerifier = task({
  id: "feature-verifier",
  maxDuration: 120,

  run: async (payload: FeatureVerifierPayload) => {
    const { issueId, identifier, prNumber, prTitle, prUrl } = payload;

    logger.info("Feature verifier triggered", { identifier, prNumber });

    if (!process.env.GITHUB_REPO) {
      logger.warn("GITHUB_REPO not set — skipping verification");
      return { skipped: true };
    }

    const [owner, repo] = process.env.GITHUB_REPO.split("/");

    // Fetch the PR diff
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const diff = files
      .map((f) => `### ${f.filename} (+${f.additions} -${f.deletions})\n\`\`\`diff\n${f.patch ?? "(binary or no patch)"}\n\`\`\``)
      .join("\n\n");

    // Fetch the original Linear issue for context
    const issue = await linear.issue(issueId);
    const description = issue.description ?? "(no description)";

    logger.info("Fetched PR diff", { files: files.length, identifier });

    // Ask Claude to verify
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a senior engineer reviewing a PR opened by an AI agent.
Your job is to verify the change matches the original Linear issue and flag any obvious problems.
Be concise — 3-5 sentences max. Start with a verdict: LGTM or NEEDS CHANGES.`,
      messages: [
        {
          role: "user",
          content: `## Linear issue: ${identifier}
${issue.title}

${description}

## PR: ${prTitle}
${diff}

Does this PR correctly implement the issue? Any bugs, missing cases, or mismatches?`,
        },
      ],
    });

    const review = response.content[0].type === "text" ? response.content[0].text : "";

    logger.info("Verification complete", { identifier, verdict: review.slice(0, 60) });

    await linear.createComment({
      issueId,
      body: [
        "## 🔍 Feature Verifier",
        "",
        review,
        "",
        `Reviewed: [${prTitle}](${prUrl})`,
      ].join("\n"),
    });

    return { identifier, verified: true, verdict: review.slice(0, 80) };
  },
});
