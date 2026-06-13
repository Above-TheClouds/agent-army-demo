/**
 * Sentry Internal Integration webhook — receives issue-created events
 * and creates a Linear card assigned to the AI Agent in "To Do".
 *
 * Setup:
 * 1. Sentry → Settings → Developer Settings → Create Internal Integration
 * 2. Webhook URL: https://your-project.vercel.app/api/webhook/sentry
 * 3. Permissions: Issue & Event → Read
 * 4. Webhooks: check "issue" → created
 * 5. Copy the signing secret → SENTRY_WEBHOOK_SECRET env var
 */

import { createHmac, timingSafeEqual } from "crypto";
import { LinearClient } from "@linear/sdk";
import type { IncomingMessage, ServerResponse } from "http";

const WEBHOOK_SECRET = process.env.SENTRY_WEBHOOK_SECRET ?? "";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY ?? "";
const LINEAR_AGENT_USER_ID = process.env.LINEAR_AGENT_USER_ID ?? "";
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? "";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  const body = await readBody(req);

  if (WEBHOOK_SECRET && !verifySignature(body, req.headers["sentry-hook-signature"] as string)) {
    console.error("[sentry-webhook] Invalid signature");
    res.writeHead(401).end("Unauthorized");
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  console.log("[sentry-webhook] Payload received", JSON.stringify(payload).slice(0, 500));

  // Support both legacy webhooks (flat payload) and internal integrations (data.issue wrapper)
  const action = payload.action as string | undefined;
  if (action && action !== "created") {
    res.writeHead(200).end("OK");
    return;
  }

  const issue = (payload.data as any)?.issue ?? payload;
  const errorTitle: string =
    (issue.title ?? (payload.event as any)?.title ?? payload.message ?? "Unknown error") as string;
  const errorUrl: string = (issue.web_url ?? issue.url ?? payload.url ?? "") as string;
  const culprit: string = (issue.culprit ?? payload.culprit ?? "") as string;
  const project: string = (issue.project?.name ?? payload.project_name ?? "") as string;
  const firstSeen: string = (issue.firstSeen ?? new Date().toISOString()) as string;

  if (!errorTitle || errorTitle === "Unknown error") {
    console.warn("[sentry-webhook] Could not extract error title from payload");
    res.writeHead(200).end("OK");
    return;
  }

  console.log("[sentry-webhook] New issue received", { errorTitle, culprit, project });

  if (!LINEAR_API_KEY || !LINEAR_TEAM_ID || !LINEAR_AGENT_USER_ID) {
    console.error("[sentry-webhook] Missing LINEAR_API_KEY, LINEAR_TEAM_ID, or LINEAR_AGENT_USER_ID");
    res.writeHead(500).end("Server Error");
    return;
  }

  const linear = new LinearClient({ apiKey: LINEAR_API_KEY });

  // Find the "To Do" state for the team
  const team = await linear.team(LINEAR_TEAM_ID);
  const states = await team.states();
  const todoState = states.nodes.find(
    (s) => s.type === "unstarted" && !/backlog/i.test(s.name)
  );

  if (!todoState) {
    console.error("[sentry-webhook] Could not find a To Do state for the team");
    res.writeHead(500).end("Server Error");
    return;
  }

  const description = [
    `**Sentry issue:** [${errorTitle}](${errorUrl})`,
    `**Project:** ${project}`,
    `**First seen:** ${firstSeen}`,
    culprit ? `**Culprit:** \`${culprit}\`` : "",
    "",
    "Fix the error identified above. Locate the source of the exception, handle or resolve it, and ensure the error no longer appears in Sentry after the fix is deployed.",
  ].filter(Boolean).join("\n");

  const linearIssue = await linear.createIssue({
    teamId: LINEAR_TEAM_ID,
    title: `Bug: ${errorTitle}`,
    description,
    assigneeId: LINEAR_AGENT_USER_ID,
    stateId: todoState.id,
  });

  console.log("[sentry-webhook] Linear issue created", {
    linearIssueId: (await linearIssue.issue)?.identifier,
    errorTitle,
  });

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
