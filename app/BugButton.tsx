"use client";

import * as Sentry from "@sentry/nextjs";

export default function BugButton() {
  async function triggerBug() {
    const id = Date.now();
    const title = `AgentArmyDemoError: undefined is not a function — simulatedCrash() [${id}]`;

    const error = new Error(`simulatedCrash() [${id}]`);
    error.name = "AgentArmyDemoError";
    Sentry.captureException(error);

    try {
      await fetch("/api/webhook/sentry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "created",
          data: {
            issue: {
              title,
              web_url: "",
              culprit: "app/BugButton.tsx",
              project: { name: "agent-army-demo" },
              firstSeen: new Date().toISOString(),
            },
          },
        }),
      });
    } catch (fetchError) {
      console.error("Webhook fetch failed:", fetchError);
    }

    alert("Bug triggered! Check Linear.");
  }

  return (
    <button
      onClick={triggerBug}
      style={{
        display: "inline-block", padding: "13px 32px",
        border: "1px solid #ff4444", color: "#ff4444",
        fontSize: "14px", letterSpacing: "0.06em", background: "transparent",
        borderRadius: "4px", cursor: "pointer",
      }}
    >
      Trigger bug →
    </button>
  );
}
