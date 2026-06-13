/**
 * Vercel serverless function — receives Linear webhooks and triggers the
 * Feature Agent task on Trigger.dev.
 *
 * Deploy with: vercel deploy
 * Then point your Linear webhook at: https://your-project.vercel.app/api/webhook/linear
 */

import { createHmac, timingSafeEqual } from "crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { Octokit } from "@octokit/rest";
import { LinearClient } from "@linear/sdk";
import type { featureAgent } from "../../src/trigger/feature-agent.js";
import type { IncomingMessage, ServerResponse } from "http";

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? "";
const AGENT_USER_ID = process.env.LINEAR_AGENT_USER_ID ?? "";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const linearClient = new LinearClient({ apiKey: LINEAR_API_KEY });

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  const body = await readBody(req);

  if (WEBHOOK_SECRET && !verifySignature(body, req.headers["linear-signature"] as string)) {
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

  const eventType = payload.type;
  const eventAction = payload.action as string;
  const data = payload.data as any;
  const assignedToAgent = AGENT_USER_ID && data?.assigneeId === AGENT_USER_ID;
  // Match any unstarted state that isn't Backlog — covers "Todo", "To Do", etc.
  const stateIsUnstarted =
    data?.state?.type === "unstarted" && !/backlog/i.test(data?.state?.name ?? "");

  console.log("[webhook] Linear payload", {
    type: eventType,
    action: eventAction,
    identifier: data?.identifier,
    assigneeId: data?.assigneeId,
    AGENT_USER_ID_set: !!AGENT_USER_ID,
    stateType: data?.state?.type,
    stateName: data?.state?.name,
    assignedToAgent: !!assignedToAgent,
    stateIsUnstarted,
  });

  if (typeof eventType === "string" && /comment/i.test(eventType) && eventAction === "create") {
    const commentBody = (data.body || data.text || "").toString();
    const isAgentComment = AGENT_USER_ID && data.creatorId === AGENT_USER_ID;
    const isMergeCommand = /(?:^|\s)(?:merge|ship it|ship)(?:\s|$)/i.test(commentBody);

    if (!isAgentComment && isMergeCommand) {
      if (!GITHUB_TOKEN || !GITHUB_REPO) {
        console.warn("[webhook] GitHub env vars missing for merge command");
        res.writeHead(200).end("OK");
        return;
      }

      const issueId = data.issueId || data.issue?.id || data.issue?.identifier;
      if (!issueId) {
        console.warn("[webhook] No issue id found for merge command");
        res.writeHead(200).end("OK");
        return;
      }

      let issue;
      try {
        issue = await linearClient.issue(issueId);
      } catch (err) {
        console.warn("[webhook] Failed to fetch issue by ID, trying as identifier", { issueId, error: String(err) });
        try {
          issue = await linearClient.issue(issueId);
        } catch {
          issue = null;
        }
      }

      if (!issue) {
        console.warn("[webhook] Linear issue not found for merge command", { issueId });
        res.writeHead(200).end("OK");
        return;
      }

      const issueIdentifier = issue.identifier;
      const [owner, repo] = GITHUB_REPO.split("/");
      const octokit = new Octokit({ auth: GITHUB_TOKEN });

      const prs = await octokit.pulls.list({
        owner,
        repo,
        state: "open",
      });

      const pr = prs.data.find((pr) =>
        pr.head.ref.toLowerCase().startsWith(`agent/${issueIdentifier.toLowerCase()}-`) ||
        pr.title.toLowerCase().includes(issueIdentifier.toLowerCase())
      );

      if (!pr) {
        await linearClient.createComment({
          issueId: issue.id,
          body: `⚠️ Could not find an open draft PR for ${issueIdentifier}.`,
        });
        res.writeHead(200).end("OK");
        return;
      }

      try {
        await octokit.pulls.merge({
          owner,
          repo,
          pull_number: pr.number,
          merge_method: "squash",
        });

        await linearClient.createComment({
          issueId: issue.id,
          body: `✅ Merged PR [${pr.title}](${pr.html_url}).`,
        });
      } catch (err) {
        await linearClient.createComment({
          issueId: issue.id,
          body: `⚠️ Failed to merge PR: ${String(err)}`,
        });
      }

      res.writeHead(200).end("OK");
      return;
    }
  }

  if (eventType !== "Issue" || !["create", "update"].includes(eventAction)) {
    res.writeHead(200).end("OK");
    return;
  }

  if (!assignedToAgent || !stateIsUnstarted) {
    console.log("[webhook] Ignoring event: not assigned to agent in an unstarted state");
    res.writeHead(200).end("OK");
    return;
  }

  const trigger = "assigned-to-agent:todo";

  // Idempotency key: same issue + same updatedAt = same logical event, even if
  // Linear delivers the webhook more than once (at-least-once delivery).
  const idempotencyKey = `${data?.identifier}-${data?.updatedAt ?? data?.createdAt}`;

  await tasks.trigger<typeof featureAgent>("feature-agent", payload as any, { idempotencyKey });

  console.log(`[webhook] Triggered feature-agent for ${data?.identifier} via ${trigger}`);

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

function verifySignature(body: string, signature: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
