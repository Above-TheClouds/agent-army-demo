import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

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

    // ── 0. Fetch the full issue and guard against duplicate runs ─────────────
    // Posting a comment updates the issue's updatedAt, which fires another
    // Issue.update webhook. Checking for an existing agent comment stops that
    // feedback loop before we do any work.
    const linearIssue = await linear.issue(issue.id);
    const description = linearIssue.description ?? "(no description provided)";

    const existingComments = await linearIssue.comments();
    const alreadyRunning = existingComments.nodes.some((c) =>
      c.body?.includes("🤖 **Feature Agent**")
    );
    if (alreadyRunning) {
      logger.info("Agent already commented on this issue — skipping duplicate run", {
        identifier: issue.identifier,
      });
      return { skipped: true, issueId: issue.id, identifier: issue.identifier };
    }

    await linear.createComment({
      issueId: issue.id,
      body: "🤖 **Feature Agent** is analyzing this issue...",
    });

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

${formatContext(repoContext)}

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
      ].join("\n"),
    });

    logger.info("Plan posted to Linear", { identifier: issue.identifier });

    // ── 3.1 Ask Claude to generate code changes for the issue ─────────────────
    logger.info("Requesting code changes from Claude...");

    const codeResponse = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: `You are a senior software engineer applying a minimal, surgical change to an existing codebase.
You will be given a Linear issue, an implementation plan, and the CURRENT contents of the relevant files.
Your job is to output a JSON object with a files array containing the exact file paths and the updated file contents.

CRITICAL RULES — you must follow all of these:
- Treat the current file contents as the single source of truth. Your output must be the current file with ONLY the change described in the issue applied. Preserve every other line exactly as-is.
- Do NOT rewrite, restructure, or simplify any part of the file that the issue does not mention. If the issue says "rename X to Y", only rename X to Y — touch nothing else.
- You MUST always include at least one file in the files array. Never return {"files":[]}.
- For any issue involving copy, text, headlines, or homepage content: update app/page.tsx by finding the exact string and replacing only that string.
- Return the COMPLETE file contents for each changed file (the full file, not a diff), but with only the minimal change applied.
- Only return valid JSON, nothing else. No markdown fences, no explanation, just the JSON object.
- Use Unix-style paths (e.g. "app/page.tsx").
- Do not touch files unrelated to the issue.
- NEVER put raw prose or plain text as the content of a .ts or .tsx file. The content field must always be valid TypeScript/JSX source code, exactly as it would appear in the editor. If the change is to a string inside JSX, modify that string inside the surrounding JSX — do not replace the whole file with the string value.`,
      messages: [
        {
          role: "user",
          content: `Issue: ${issue.identifier}: ${linearIssue.title}

${description}

Plan:
${plan}

Current file contents:

${formatContext(repoContext)}

Return only JSON in this exact shape (always at least one file):
{
  "files": [
    {
      "path": "path/to/file.ext",
      "content": "... complete file contents ..."
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
        filesToChange = json.files.filter((f: { path: string; content: string }) => {
          if (/\.(tsx?|jsx?)$/.test(f.path) && !looksLikeCode(f.content)) {
            logger.error("Rejected file: content is not valid TypeScript/JSX", { path: f.path, preview: f.content.slice(0, 120) });
            return false;
          }
          return true;
        });
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
            "If a Vercel preview deployment is configured, the preview URL will be posted in a separate comment.",
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

// Returns a map of repo-relative path → file contents for all files under app/
// plus top-level docs. New files added to the repo are picked up automatically.
// Falls back to known paths if the directory scan fails (e.g. in cloud runners).
function getRepoContext(): Record<string, string> {
  const root = process.cwd();
  const files: Record<string, string> = {};

  const appFiles = walkDir(join(root, "app"));

  if (appFiles.length > 0) {
    for (const rel of appFiles) {
      files[rel] = readFileSafe(join(root, rel));
    }
  } else {
    // Fallback: read the files we know about
    for (const rel of ["app/page.tsx", "app/layout.tsx", "app/globals.css"]) {
      const content = readFileSafe(join(root, rel));
      if (content) files[rel] = content;
    }
  }

  for (const doc of ["DESIGN.md", "README.md", "CLAUDE.md"]) {
    const content = readFileSafe(join(root, doc));
    if (content) files[doc] = content;
  }

  return files;
}

function walkDir(dir: string, root = dir): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const results: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(full, root));
      } else {
        results.push(relative(root, full).replace(/\\/g, "/").replace(/^/, "app/"));
      }
    }
    return results;
  } catch {
    return [];
  }
}

function formatContext(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([path, content]) => `${path}:\n${content}`)
    .join("\n\n");
}

// Returns false if the content looks like raw prose rather than TS/JSX source.
// A valid TS/JSX file will contain at least one of these patterns.
function looksLikeCode(content: string): boolean {
  return /import\s|export\s|export default|function\s|const\s|let\s|var\s|class\s|=>/m.test(content);
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
