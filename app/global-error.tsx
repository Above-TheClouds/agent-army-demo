"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#07080c", color: "#f0f0f0", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#c9a227", fontSize: "12px", letterSpacing: "0.2em", marginBottom: "16px" }}>SOMETHING WENT WRONG</p>
          <button onClick={reset} style={{ padding: "10px 24px", border: "1px solid #333", background: "transparent", color: "#f0f0f0", cursor: "pointer", borderRadius: "4px" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
