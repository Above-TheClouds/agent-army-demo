/**
 * Vercel deployment webhook — posts the preview URL as a Linear comment
 * when a preview deployment succeeds.
 *
 * Setup:
 * 1. Vercel dashboard → Project → Settings → Webhooks → Add webhook
 * 2. URL: https://your-project.vercel.app/api/webhook/vercel
 * 3. Events: Deployment succeeded
 * 4. Copy the signing secret into .env as VERCEL_WEBHOOK_SECRET
 *
 * Branch naming: the feature agent creates branches like "eng-42-feature-name".
 * This handler parses the Linear issue ID from that pattern.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { LinearClient } from "@linear/sdk";
import { Octokit } from "@octokit/rest";
import type { IncomingMessage, ServerResponse } from "http";

const WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET ?? "";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  const body = await readBody(req);

  if (WEBHOOK_SECRET && !verifySignature(body, req.headers["x-vercel-signature"] as string)) {
    console.error("[vercel-webhook] Invalid or missing Vercel signature", {
      secretConfigured: Boolean(WEBHOOK_SECRET),
      signatureHeader: String(req.headers["x-vercel-signature"] ?? ""),
    });
    res.writeHead(401).end("Unauthorized");
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch (err) {
    console.error("[vercel-webhook] Invalid JSON payload", { error: String(err), body });
    res.writeHead(400).end("Bad Request");
    return;
  }

  // Only handle preview deployment webhooks
  const anyPayload = payload as any;
  const eventType = String(
    anyPayload.type ??
      anyPayload.payload?.type ??
      anyPayload.payload?.payload?.type ??
      anyPayload.payload?.payload?.payload?.type ??
      ""
  ).toLowerCase();
  const deployment =
    anyPayload.deployment ??
    anyPayload.payload?.deployment ??
    anyPayload.payload?.payload?.deployment ??
    anyPayload.payload?.payload?.payload?.deployment ??
    null;

  if (!deployment) {
    console.warn("[vercel-webhook] No deployment object in webhook payload", {
      eventType,
      payloadKeys: Object.keys(payload),
    });
    res.writeHead(200).end("OK");
    return;
  }

  const rawBranch =
    deployment?.meta?.githubCommitRef ??
    deployment?.meta?.gitBranch ??
    deployment?.meta?.ref ??
    deployment?.meta?.sourceBranch ??
    deployment?.gitBranch ??
    deployment?.branch ??
    anyPayload.branch ??
    "";
  const branch = String(rawBranch).replace(/^refs\/heads\//, "");
  const previewUrl: string = String(
    deployment?.url ?? deployment?.previewUrl ?? deployment?.alias ?? ""
  );
  const deploymentState = String(
    deployment?.state ?? deployment?.status ?? ""
  ).toLowerCase();

  if (!previewUrl) {
    console.warn("[vercel-webhook] Deployment has no preview URL", {
      eventType,
      branch,
      deploymentState,
      deploymentId: deployment?.uid,
      deploymentKeys: Object.keys(deployment ?? {}),
    });
  }

  const isSuccess =
    eventType === "deployment.succeeded" ||
    eventType === "deployment.ready" ||
    deploymentState === "ready";
  const isError =
    eventType === "deployment.error" ||
    deploymentState === "error";

  if (!isSuccess && !isError) {
    res.writeHead(200).end("OK");
    return;
  }

  const defaultBranch = process.env.GITHUB_DEFAULT_BRANCH ?? "main";
  const isProduction = branch === defaultBranch || branch === "";

  if (isProduction) {
    // For production deployments the branch is main — extract the issue ID
    // from the squash-merge commit message (e.g. "AGE-28: Copy update (#5)")
    if (!isSuccess) {
      res.writeHead(200).end("OK");
      return;
    }

    const commitMessage = String(
      deployment?.meta?.githubCommitMessage ??
      deployment?.meta?.commitMessage ??
      ""
    );
    const prodMatch = commitMessage.match(/([A-Z]+-\d+)/);

    console.log("[vercel-webhook] Production deployment", { commitMessage, matched: prodMatch?.[1] ?? null });

    if (!prodMatch) {
      res.writeHead(200).end("OK");
      return;
    }

    const prodIdentifier = prodMatch[1];
    const linear = new LinearClient({ apiKey: LINEAR_API_KEY }) as any;
    let prodIssue: any;
    try {
      prodIssue = await linear.issue(prodIdentifier);
    } catch {
      prodIssue = null;
    }

    if (prodIssue) {
      const productionUrl = process.env.VERCEL_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PRODUCTION_URL}`
        : previewUrl
        ? `https://${previewUrl}`
        : "";

      await linear.createComment({
        issueId: prodIssue.id,
        body: [
          "🚀 **Deployed to production!**",
          "",
          productionUrl ? `[View live site](${productionUrl})` : "",
        ].filter(Boolean).join("\n"),
      });

      // Move to Done on production deploy
      try {
        const prodTeam = await prodIssue.team;
        if (prodTeam) {
          const states = (await prodTeam.states()).nodes;
          const doneState = states.find((s: any) => s.type === "completed");
          if (doneState) {
            await linear.updateIssue(prodIssue.id, { stateId: doneState.id });
            console.log(`[vercel-webhook] Moved ${prodIdentifier} to Done`);
          }
        }
      } catch (err) {
        console.warn(`[vercel-webhook] Could not move ${prodIdentifier} to Done`, String(err));
      }

      console.log(`[vercel-webhook] Posted production deploy comment to ${prodIdentifier}`);
    }

    res.writeHead(200).end("OK");
    return;
  }

  // Preview deployments — extract Linear issue ID from branch name
  // (e.g. "agent/age-42-add-login" → "AGE-42")
  const match = branch.match(/([a-zA-Z]+-\d+)/);
  if (!match) {
    res.writeHead(200).end("OK");
    return;
  }

  const issueIdentifier = match[1].toUpperCase();

  if (!LINEAR_API_KEY) {
    console.error("[vercel-webhook] LINEAR_API_KEY not set");
    res.writeHead(500).end("Server Error");
    return;
  }

  const linear = new LinearClient({ apiKey: LINEAR_API_KEY }) as any;
  const linearComment: any = linear.createComment.bind(linear);

  // Look up the issue by identifier (e.g. "ENG-42")
  let issue: any;
  try {
    issue = await linear.issue(issueIdentifier);
  } catch (err) {
    console.warn(`[vercel-webhook] Failed to fetch issue ${issueIdentifier}`, String(err));
    issue = null;
  }

  if (!issue) {
    console.warn(`[vercel-webhook] No Linear issue found for ${issueIdentifier}`);
    res.writeHead(200).end("OK");
    return;
  }

  if (!previewUrl && isSuccess) {
    // @ts-ignore Linear SDK typing is inconsistent here
    await linearComment({
      issueId: issue.id,
      body: [
        "⚠️ Vercel preview deployment event received, but the webhook payload did not include a preview URL.",
        "",
        `Branch: \`${branch}\``,
        "",
        "This usually means Vercel sent a payload shape we do not yet support. Check the Vercel webhook payload or branch metadata.",
      ].join("\n"),
    });
    console.log("[vercel-webhook] Posted missing-preview debug comment", {
      issueIdentifier,
      branch,
      deploymentId: deployment?.uid,
    });
    res.writeHead(200).end("OK");
    return;
  }

  console.log("[vercel-webhook] Webhook matched issue", {
    eventType,
    branch,
    previewUrl,
    issueIdentifier,
    issueId: issue.id,
  });

  if (eventType.includes("error") || eventType.includes("failed")) {
    // @ts-ignore Linear SDK typing is inconsistent here
    await linearComment({
      issueId: issue.id,
      body: [
        "⚠️ Vercel preview deployment failed.",
        "",
        `Branch: \`${branch}\``,
        previewUrl ? `Preview URL: [${previewUrl}](${previewUrl})` : "Preview URL unavailable.",
        "",
        "Check the Vercel dashboard for build logs and retry once the branch is fixed.",
      ].join("\n"),
    });

    res.writeHead(200).end("OK");
    return;
  }

  let prUrl = "";
  if (GITHUB_TOKEN && GITHUB_REPO) {
    const [owner, repo] = GITHUB_REPO.split("/");
    if (owner && repo) {
      const octokit = new Octokit({ auth: GITHUB_TOKEN });
      const prList = await octokit.pulls.list({
        owner,
        repo,
        state: "open",
        head: `${owner}:${branch}`,
      });
      const pr = prList.data[0];
      if (pr) {
        prUrl = pr.html_url;
      }
    }
  }

  const lines = [];

  if (prUrl) {
    lines.push(`🔗 Draft PR ready for review: [View draft PR](${prUrl})`, "");
  }

  lines.push(
    "🚀 **Preview deployment ready**",
    "",
    `[Preview site](https://${previewUrl})`,
    "",
    `Branch: \`${branch}\``
  );

  // @ts-ignore Linear SDK typing is inconsistent here
  await linearComment({
    issueId: issue.id,
    body: lines.join("\n"),
  });

  // Move to "In Preview" so the card reflects the deployment state
  try {
    const previewTeam = await issue.team;
    if (previewTeam) {
      const states = (await previewTeam.states()).nodes;
      const inPreviewState = states.find((s: any) => /in.?preview/i.test(s.name));
      if (inPreviewState) {
        await linear.updateIssue(issue.id, { stateId: inPreviewState.id });
        console.log(`[vercel-webhook] Moved ${issueIdentifier} to ${inPreviewState.name}`);
      } else {
        console.warn(`[vercel-webhook] No "In Preview" state found in workflow — create it in Linear Settings → Workflow`);
      }
    }
  } catch (err) {
    console.warn(`[vercel-webhook] Could not move ${issueIdentifier} to In Preview`, String(err));
  }

  console.log(`[vercel-webhook] Posted preview URL to ${issueIdentifier}: ${previewUrl}`);

  res.writeHead(200).end("OK");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Vercel signs with HMAC-SHA1
function verifySignature(body: string, signature: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha1", WEBHOOK_SECRET).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
