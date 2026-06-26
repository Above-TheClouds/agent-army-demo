"use client";

function simulatedCrash(): never {
  throw new Error("AgentArmyDemoError: undefined is not a function — simulatedCrash()");
}

export default function BugButton() {
  async function triggerBug() {
    const id = Date.now();
    const title = `AgentArmyDemoError: undefined is not a function — simulatedCrash() [${id}]`;

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

    simulatedCrash();
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
