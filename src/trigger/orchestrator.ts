import { task, logger, tasks } from "@trigger.dev/sdk/v3";
import { LinearClient } from "@linear/sdk";
import type { featureAgent } from "./feature-agent";
import type { contentAgent } from "./content-agent";

const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

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

    logger.info("Orchestrator routing", {
      identifier: issue.identifier,
      teamId: issue.teamId,
    });

    // Route by team ID if LINEAR_CONTENT_TEAM_ID is set,
    // otherwise fetch labels from Linear and check for "content" label.
    let pod: "feature" | "content" = "feature";

    if (process.env.LINEAR_CONTENT_TEAM_ID && issue.teamId === process.env.LINEAR_CONTENT_TEAM_ID) {
      pod = "content";
    } else {
      try {
        const linearIssue = await linear.issue(issue.id);
        const labels = await linearIssue.labels();
        const hasContentLabel = labels.nodes.some((l) => /content/i.test(l.name));
        if (hasContentLabel) pod = "content";
      } catch (err) {
        logger.warn("Could not fetch labels for routing — defaulting to feature pod", { error: String(err) });
      }
    }

    const idempotencyKey = `${issue.identifier}-${payload.data.state?.id ?? "unknown"}`;

    if (pod === "content") {
      await tasks.trigger<typeof contentAgent>("content-agent", payload, { idempotencyKey });
      logger.info("Dispatched to content-agent", { identifier: issue.identifier });
    } else {
      await tasks.trigger<typeof featureAgent>("feature-agent", payload, { idempotencyKey });
      logger.info("Dispatched to feature-agent", { identifier: issue.identifier });
    }

    return { identifier: issue.identifier, pod };
  },
});
