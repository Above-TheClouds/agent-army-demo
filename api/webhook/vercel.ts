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
import type { IncomingMessage, ServerResponse } from "http";

const WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET ?? "";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY ?? "";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  const body = await readBody(req);

  if (WEBHOOK_SECRET && !verifySignature(body, req.headers["x-vercel-signature"] as string)) {
    res.writeHead(401).end("Unauthorized");
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  // Only handle successful preview deployments (not production)
  if (payload.type !== "deployment.succeeded") {
    res.writeHead(200).end("OK");
    return;
  }

  const deployment = (payload.payload as any)?.deployment;
  const branch: string = deployment?.meta?.githubCommitRef ?? "";
  const previewUrl: string = deployment?.url ? `https://${deployment.url}` : "";

  if (!branch || !previewUrl) {
    res.writeHead(200).end("OK");
    return;
  }

  // Skip production branch deployments
  const defaultBranch = process.env.GITHUB_DEFAULT_BRANCH ?? "main";
  if (branch === defaultBranch) {
    res.writeHead(200).end("OK");
    return;
  }

  // Extract Linear issue ID from branch name (e.g. "eng-42-add-login" → "ENG-42")
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

  const linear = new LinearClient({ apiKey: LINEAR_API_KEY });

  // Look up the issue by identifier (e.g. "ENG-42")
  const issueResult = await linear.issueSearch({ query: issueIdentifier, first: 1 });
  const issue = issueResult.nodes?.[0];

  if (!issue) {
    console.warn(`[vercel-webhook] No Linear issue found for ${issueIdentifier}`);
    res.writeHead(200).end("OK");
    return;
  }

  await linear.createComment({
    issueId: issue.id,
    body: `🚀 **Preview deployment ready**\n\n[${previewUrl}](${previewUrl})\n\nBranch: \`${branch}\``,
  });

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
