/**
 * Vercel serverless function — receives Linear webhooks and triggers the
 * Feature Agent task on Trigger.dev.
 *
 * Deploy with: vercel deploy
 * Then point your Linear webhook at: https://your-project.vercel.app/api/webhook/linear
 */

import { createHmac, timingSafeEqual } from "crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import type { featureAgent } from "../../src/trigger/feature-agent.js";
import type { IncomingMessage, ServerResponse } from "http";

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? "";
const AGENT_USER_ID = process.env.LINEAR_AGENT_USER_ID ?? "";

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
  const labels = data?.labels?.nodes ?? [];
  const hasFeatureLabel = labels.some((l: { name: string }) => l.name === "feature:build");
  const assignedToAgent = AGENT_USER_ID && data?.assigneeId === AGENT_USER_ID;

  console.log("[webhook] Linear payload", {
    type: eventType,
    action: eventAction,
    identifier: data?.identifier,
    labels: labels.map((l: any) => l.name),
    hasFeatureLabel,
    assignedToAgent,
  });

  if (eventType !== "Issue" || !["create", "update"].includes(eventAction)) {
    res.writeHead(200).end("OK");
    return;
  }

  if (!hasFeatureLabel && !assignedToAgent) {
    console.log("[webhook] Ignoring event: no feature label or assignee match");
    res.writeHead(200).end("OK");
    return;
  }

  const trigger = assignedToAgent ? "assigned-to-agent" : "label:feature:build";

  await tasks.trigger<typeof featureAgent>("feature-agent", payload as any);

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
