import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";
import { Langfuse } from "langfuse";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
});

interface LinearWebhookPayload {
  type: string;
  action: string;
  data: {
    id: string;
    title: string;
    description?: string;
    identifier: string;
    url: string;
    teamId?: string;
    state?: { id: string; name: string; type: string };
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const contentAgent = task({
  id: "content-agent",
  maxDuration: 300,

  run: async (payload: LinearWebhookPayload) => {
    const { data: issue } = payload;

    logger.info("Content agent triggered", { identifier: issue.identifier, title: issue.title });

    const linearIssue = await linear.issue(issue.id);
    const brief = linearIssue.description ?? issue.title;

    // Guard against duplicate runs
    const existing = await linearIssue.comments();
    if (existing.nodes.some((c) => c.body?.includes("🖊️ **Content Agent**"))) {
      logger.info("Already commented — skipping duplicate run", { identifier: issue.identifier });
      return { skipped: true };
    }

    // Move to In Progress
    const team = await linearIssue.team;
    const states = team ? (await team.states()).nodes : [];
    const inProgressState =
      states.find((s) => /in.?progress/i.test(s.name)) ??
      states.find((s) => s.type === "started" && !/in.?preview/i.test(s.name));
    if (inProgressState) {
      await linear.updateIssue(issue.id, { stateId: inProgressState.id });
    }

    await linear.createComment({
      issueId: issue.id,
      body: "🖊️ **Content Agent** is writing this article...",
    });

    const trace = langfuse.trace({
      name: "content-agent",
      sessionId: issue.identifier,
      userId: issue.identifier,
      metadata: { issueId: issue.id, identifier: issue.identifier, title: linearIssue.title },
    });

    // ── Call 1: metadata only (small JSON, no code inside) ───────────────────
    const metaGeneration = trace.generation({ name: "article-meta", model: "claude-sonnet-4-6", input: brief });

    const metaResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: `Return a JSON object with exactly these three fields:
{
  "slug": "url-safe-slug-max-60-chars",
  "title": "Article title",
  "excerpt": "One sentence summary, max 120 chars"
}
Only return valid JSON. No markdown fences. No other text.`,
      messages: [{ role: "user", content: `Title: ${issue.title}\n\nBrief:\n${brief}` }],
    });

    const metaRaw = metaResponse.content[0].type === "text" ? metaResponse.content[0].text : "";
    metaGeneration.end({ output: metaRaw, usage: { input: metaResponse.usage.input_tokens, output: metaResponse.usage.output_tokens } });

    let articleSlug = slugify(issue.title);
    let articleTitle = issue.title;
    let articleExcerpt = "";

    try {
      const first = metaRaw.indexOf("{");
      const last = metaRaw.lastIndexOf("}");
      const meta = JSON.parse(metaRaw.slice(first, last + 1));
      articleSlug = meta.slug || articleSlug;
      articleTitle = meta.title || articleTitle;
      articleExcerpt = meta.excerpt || "";
    } catch {
      logger.warn("Failed to parse metadata JSON — using fallback slug", { metaRaw });
    }

    // ── Call 2: TSX page content as plain text (no JSON escaping issues) ──────
    const contentGeneration = trace.generation({ name: "article-content", model: "claude-sonnet-4-6", input: articleTitle });

    const contentResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: `You are a technical writer generating a Next.js page for the AI Agent Army knowledge base.
The site uses CSS variables: var(--bg) #07080c, var(--text) #e8e4dc, var(--muted) rgba(232,228,220,0.55), var(--gold) #ffd700, var(--border) rgba(255,215,0,0.14). No Tailwind.

Return ONLY the raw TSX file content — no markdown fences, no explanation, just the code starting with "export default function Article()".

Use this exact structure:
export default function Article() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: "56px", background: "rgba(7,8,12,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "var(--gold)", fontStyle: "italic", textDecoration: "none" }}>AI Agent Army</a>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="/agents" style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.1em", textDecoration: "none" }}>Agents</a>
          <a href="/knowledge" style={{ fontSize: "12px", color: "var(--text)", letterSpacing: "0.1em", textDecoration: "none" }}>Knowledge</a>
        </div>
      </nav>
      <article style={{ padding: "140px 48px 120px", maxWidth: "740px", margin: "0 auto" }}>
        <a href="/knowledge" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "48px" }}>← Knowledge base</a>
        <p style={{ fontSize: "11px", color: "var(--gold)", letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "16px", fontWeight: 700 }}>Content Pod</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, lineHeight: 1.15, marginBottom: "16px", color: "var(--text)" }}>${articleTitle}</h1>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "56px" }}>${today()}</p>
        [write 4-6 paragraphs of article body using p, h2, h3 tags with matching inline styles]
      </article>
    </main>
  );
}`,
      messages: [{ role: "user", content: `Write the article body for: "${articleTitle}"\n\nBrief:\n${brief}` }],
    });

    const pageContent = contentResponse.content[0].type === "text" ? contentResponse.content[0].text.trim() : "";
    contentGeneration.end({ output: pageContent.slice(0, 200), usage: { input: contentResponse.usage.input_tokens, output: contentResponse.usage.output_tokens } });
    await langfuse.flushAsync();

    if (!pageContent || !articleSlug) {
      logger.error("Missing slug or pageContent", { articleSlug, hasContent: !!pageContent });
      await linear.createComment({ issueId: issue.id, body: "⚠️ Content Agent failed to generate article content. Check Trigger.dev logs." });
      return { success: false };
    }

    if (!process.env.GITHUB_REPO) {
      logger.warn("GITHUB_REPO not set — skipping PR creation");
      return { success: false };
    }

    const [owner, repo] = process.env.GITHUB_REPO.split("/");
    const branchName = `agent/${issue.identifier.toLowerCase()}-${slugify(articleTitle)}`;

    try {
      const { data: ref } = await octokit.git.getRef({
        owner, repo,
        ref: `heads/${process.env.GITHUB_DEFAULT_BRANCH ?? "main"}`,
      });

      await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: ref.object.sha });

      // Create article page
      const articleBlob = await octokit.git.createBlob({ owner, repo, content: pageContent, encoding: "utf-8" });

      // Patch _articles.ts to add the new entry
      const articlesPath = "app/knowledge/_articles.ts";
      const { data: articlesFile } = await octokit.repos.getContent({ owner, repo, path: articlesPath });
      const currentContent = Buffer.from((articlesFile as any).content, "base64").toString("utf-8");

      const newEntry = `  { slug: "${articleSlug}", title: "${articleTitle.replace(/"/g, '\\"')}", date: "${today()}", excerpt: "${articleExcerpt.replace(/"/g, '\\"')}" },`;
      const patchedContent = currentContent.includes("export const articles: Article[] = [];")
        ? currentContent.replace(
            "export const articles: Article[] = [];",
            `export const articles: Article[] = [\n${newEntry}\n];`
          )
        : currentContent.replace(
            /export const articles: Article\[\] = \[\n([\s\S]*?)\];/,
            (match, existing) => `export const articles: Article[] = [\n${existing}${newEntry}\n];`
          );

      const articlesBlob = await octokit.git.createBlob({ owner, repo, content: patchedContent, encoding: "utf-8" });

      const tree = await octokit.git.createTree({
        owner, repo,
        base_tree: ref.object.sha,
        tree: [
          { path: `app/knowledge/${articleSlug}/page.tsx`, mode: "100644", type: "blob", sha: articleBlob.data.sha },
          { path: articlesPath, mode: "100644", type: "blob", sha: articlesBlob.data.sha },
        ],
      });

      const commit = await octokit.git.createCommit({
        owner, repo,
        message: `[Content] ${issue.identifier}: ${articleTitle}`,
        tree: tree.data.sha,
        parents: [ref.object.sha],
      });

      await octokit.git.updateRef({ owner, repo, ref: `heads/${branchName}`, sha: commit.data.sha });

      const { data: pr } = await octokit.pulls.create({
        owner, repo,
        title: `${issue.identifier}: ${articleTitle}`,
        head: branchName,
        base: process.env.GITHUB_DEFAULT_BRANCH ?? "main",
        draft: false,
        body: `## ${issue.identifier}: ${articleTitle}\n\nLinear: ${issue.url}\n\nGenerated by Content Agent.\n\n**Excerpt:** ${articleExcerpt}`,
      });

      logger.info("Content PR opened", { prUrl: pr.html_url });

      await linear.createComment({
        issueId: issue.id,
        body: [
          `## 🖊️ Content Agent — Article Ready`,
          "",
          `**${articleTitle}**`,
          "",
          articleExcerpt,
          "",
          `🔗 PR: [${pr.title}](${pr.html_url})`,
          "",
          "Reply **ship it** to publish.",
        ].join("\n"),
      });
    } catch (err) {
      logger.error("Failed to create content PR", { error: String(err) });
      await linear.createComment({ issueId: issue.id, body: `⚠️ Content Agent failed to open PR: ${String(err)}` });
    }

    return { success: true, slug: articleSlug, title: articleTitle };
  },
});
