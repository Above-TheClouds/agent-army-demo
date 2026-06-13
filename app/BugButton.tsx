"use client";

import * as Sentry from "@sentry/nextjs";

export default function BugButton() {
  function triggerBug() {
    try {
      throw new Error("AgentArmyDemoError: undefined is not a function — simulatedCrash()");
    } catch (err) {
      Sentry.captureException(err);
      alert("Bug triggered! Check Sentry and Linear.");
    }
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
