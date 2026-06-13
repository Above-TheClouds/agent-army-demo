import { task, logger, tasks } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import type { featureAgent } from "./feature-agent";
import type { contentAgent } from "./content-agent";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    assigneeId?: string;
  };
}

export const orchestrator = task({
  id: "orchestrator",
  maxDuration: 60,

  run: async (payload: LinearWebhookPayload) => {
    const { data: issue } = payload;

    logger.info("Orchestrator routing", { identifier: issue.identifier, title: issue.title });

    // Route by Linear team if LINEAR_CONTENT_TEAM_ID is configured,
    // otherwise ask Claude to classify the issue intent.
    let pod: "feature" | "content" = "feature";
    let routingReason = "";

    if (process.env.LINEAR_CONTENT_TEAM_ID && issue.teamId === process.env.LINEAR_CONTENT_TEAM_ID) {
      pod = "content";
      routingReason = "team ID matched LINEAR_CONTENT_TEAM_ID";
    } else {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        system: `You are a router. Classify the intent of a Linear issue into exactly one of two categories:
- "feature": a code change, UI update, bug fix, or any modification to the product itself
- "content": writing an article, blog post, or knowledge base entry

Reply with only the word "feature" or "content". Nothing else.`,
        messages: [
          {
            role: "user",
            content: `Title: ${issue.title}\n\nDescription: ${issue.description ?? "(none)"}`,
          },
        ],
      });

      const classification = response.content[0].type === "text"
        ? response.content[0].text.trim().toLowerCase()
        : "feature";

      pod = classification === "content" ? "content" : "feature";
      routingReason = `Claude classified as "${classification}"`;
    }

    logger.info("Routing decision", { identifier: issue.identifier, pod, reason: routingReason });

    const idempotencyKey = `${issue.identifier}-${payload.data.state?.id ?? "unknown"}`;

    if (pod === "content") {
      await tasks.trigger<typeof contentAgent>("content-agent", payload, { idempotencyKey });
      logger.info("Dispatched to content-agent", { identifier: issue.identifier });
    } else {
      await tasks.trigger<typeof featureAgent>("feature-agent", payload, { idempotencyKey });
      logger.info("Dispatched to feature-agent", { identifier: issue.identifier });
    }

    return { identifier: issue.identifier, pod, reason: routingReason };
  },
});
