import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";
import { join } from "path";

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

    // ── 0. Post a comment to show the agent is analyzing ─────────────────────
    await linear.createComment({
      issueId: issue.id,
      body: "🤖 **Feature Agent** is analyzing this issue...",
    });

    // ── 1. Fetch the full issue from Linear ─────────────────────────────────
    const linearIssue = await linear.issue(issue.id);
    const description = linearIssue.description ?? "(no description provided)";

    logger.info("Issue fetched from Linear", { identifier: issue.identifier });

    // ── 2. Ask Claude to produce an implementation plan ──────────────────────
    logger.info("Calling Claude...");

    const repoContext = getRepoContext();

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: `You are a senior software engineer reviewing a Linear issue in a real Next.js repository.
Use the exact current code from the repo context below.
If the issue involves copy or homepage text, update app/page.tsx directly.
Do not produce generic product requirements.
Be concrete, concise, and specific to this codebase.
Avoid using dashes (-) in the text you generate.
Do not write code — write a plan that will be reviewed by a human before any code is written.`,
      messages: [
        {
          role: "user",
          content: `## ${issue.identifier}: ${linearIssue.title}

${description}

Relevant repo files:

app/page.tsx:
${repoContext.appPage}

app/layout.tsx:
${repoContext.appLayout}

app/globals.css:
${repoContext.globalsCss}

DESIGN.md:
${repoContext.designMd}

README.md (project overview):
${repoContext.readmeMd}

Produce:
1. **Summary** — one paragraph on what needs to be built and why
2. **Implementation steps** — 5–10 numbered, concrete steps
3. **Files to create or modify** — exact file paths and only the files that must change
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
        "*Review this plan. Reply **ship it** to merge after you verify the preview, or reply with feedback to refine it.*",
        `*[View issue](${issue.url})*`,
      ].join("\n"),
    });

    logger.info("Plan posted to Linear", { identifier: issue.identifier });

    // ── 3.1 Ask Claude to generate code changes for the issue ─────────────────
    logger.info("Requesting code changes from Claude...");

    const codeResponse = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: `You are a senior software engineer that writes production-ready code changes.
You will be given a Linear issue title and description, and a short implementation plan.
Your job is to output a JSON object with a files array containing the exact file paths and complete updated file contents needed to implement the issue.
Only return valid JSON, nothing else.
If the issue requires changing a file, include the full new file contents for each changed file.
If no code changes are needed, return {"files":[]}.
Use Unix-style paths and avoid markdown formatting.`,
      messages: [
        {
          role: "user",
          content: `Issue: ${issue.identifier}: ${linearIssue.title}

${description}

Plan:
${plan}

Return only JSON in this exact shape:
{
  "files": [
    {
      "path": "path/to/file.ext",
      "content": "... full file contents ..."
    }
  ]
}
`,
        },
      ],
    });

    const codeOutput =
      codeResponse.content[0].type === "text"
        ? codeResponse.content[0].text
        : "";

    let filesToChange: Array<{ path: string; content: string }> = [];

    try {
      const json = parseJson(codeOutput);
      if (Array.isArray(json.files)) {
        filesToChange = json.files;
      }
    } catch (err) {
      logger.error("Failed to parse code JSON from Claude", {
        error: String(err),
        output: codeOutput,
      });
    }

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

        let commitSha = ref.object.sha;

        if (filesToChange.length > 0) {
          const blobs = await Promise.all(
            filesToChange.map((file) =>
              octokit.git.createBlob({
                owner,
                repo,
                content: file.content,
                encoding: "utf-8",
              })
            )
          );

          const tree = await octokit.git.createTree({
            owner,
            repo,
            base_tree: ref.object.sha,
            tree: filesToChange.map((file, index) => ({
              path: file.path,
              mode: "100644",
              type: "blob",
              sha: blobs[index].data.sha,
            })),
          });

          const commit = await octokit.git.createCommit({
            owner,
            repo,
            message: `[Draft] ${issue.identifier}: ${linearIssue.title}`,
            tree: tree.data.sha,
            parents: [ref.object.sha],
          });

          await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
            sha: commit.data.sha,
          });

          commitSha = commit.data.sha;
        } else {
          const blob = await octokit.git.createBlob({
            owner,
            repo,
            content: plan,
            encoding: "utf-8",
          });

          const tree = await octokit.git.createTree({
            owner,
            repo,
            base_tree: ref.object.sha,
            tree: [
              {
                path: `.github/agent-plans/${issue.identifier}-plan.md`,
                mode: "100644",
                type: "blob",
                sha: blob.data.sha,
              },
            ],
          });

          const commit = await octokit.git.createCommit({
            owner,
            repo,
            message: `[Draft] ${issue.identifier}: ${linearIssue.title}\n\nImplementation plan stored in .github/agent-plans/`,
            tree: tree.data.sha,
            parents: [ref.object.sha],
          });

          await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
            sha: commit.data.sha,
          });

          commitSha = commit.data.sha;
        }

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

        // Post the PR link back to Linear and explain the preview follows separately
        await linear.createComment({
          issueId: issue.id,
          body: [
            `🔗 Draft PR ready for review: [${pr.title}](${pr.html_url})`,
            "",
            "A preview deployment URL will be posted in a follow-up comment once Vercel finishes.",
          ].join("\n"),
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

function parseJson(text: string): any {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error("No JSON object found");
  }
  return JSON.parse(text.slice(first, last + 1));
}

function getRepoContext() {
  const root = process.cwd();
  return {
    appPage: readFileSafe(join(root, "app/page.tsx")),
    appLayout: readFileSafe(join(root, "app/layout.tsx")),
    globalsCss: readFileSafe(join(root, "app/globals.css")),
    designMd: readFileSafe(join(root, "DESIGN.md")),
    readmeMd: readFileSafe(join(root, "README.md")),
  };
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    return "";
  }
}
