const agents = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    status: "active" as const,
    pod: "All Pods",
    model: "claude-haiku-4-5",
    trigger: "Every Linear webhook — single entry point for the army",
    skills: [
      "Classifies issue intent with Claude (feature vs. content)",
      "Routes to the right agent without labels or manual setup",
      "Passes idempotency keys to prevent duplicate runs",
      "Falls back to team-based routing if LINEAR_CONTENT_TEAM_ID is set",
    ],
    task: null,
  },
  {
    id: "feature-agent",
    name: "Feature Agent",
    status: "active" as const,
    pod: "Product Pod",
    model: "claude-opus-4-7",
    trigger: "Dispatched by orchestrator for code and UI changes",
    skills: [
      "Reads the live repo via GitHub API",
      "Generates a concise implementation plan with Claude",
      "Produces surgical find/replace patches (never full file rewrites)",
      "Opens a PR, posts plan and preview link to Linear",
    ],
    task: "feature-agent",
  },
  {
    id: "feature-verifier",
    name: "Feature Verifier",
    status: "active" as const,
    pod: "Product Pod",
    model: "claude-sonnet-4-6",
    trigger: "Spawned by feature-agent immediately after every PR is opened",
    skills: [
      "Fetches the full PR diff via GitHub API",
      "Verifies the change matches the original Linear issue",
      "Flags logic errors, missing edge cases, or scope creep",
      "Posts a concise LGTM or NEEDS CHANGES review to Linear",
    ],
    task: null,
  },
  {
    id: "content-agent",
    name: "Content Agent",
    status: "active" as const,
    pod: "Content Pod",
    model: "claude-sonnet-4-6",
    trigger: "Dispatched by orchestrator for article and knowledge base briefs",
    skills: [
      "Reads the content brief from the Linear issue description",
      "Generates a full styled article matching the site design",
      "Opens a PR creating a new page under /knowledge",
      "Patches the article manifest and posts a preview link to Linear",
    ],
    task: "content-agent",
  },
];

export default function AgentsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "56px",
        background: "rgba(7,8,12,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "var(--gold)", fontStyle: "italic", textDecoration: "none" }}>
          AI Agent Army
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="/agents" style={{ fontSize: "12px", color: "var(--text)", letterSpacing: "0.1em", textDecoration: "none", opacity: 1 }}>Agents</a>
          <a href="/knowledge" style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.1em", textDecoration: "none" }}>Knowledge</a>
        </div>
      </nav>

      {/* ── Header ── */}
      <section style={{ padding: "140px 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{
          fontSize: "11px", fontWeight: 700, color: "var(--gold)",
          letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "16px",
        }}>
          The roster
        </p>
        <h1 style={{
          fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 400, lineHeight: 1.1, marginBottom: "20px", color: "var(--text)",
        }}>
          Meet the army.
        </h1>
        <p style={{ fontSize: "18px", color: "var(--muted)", maxWidth: "560px", lineHeight: 1.7, fontWeight: 300 }}>
          Each agent is a Trigger.dev task with a specific role, a defined set of skills, and a place in the pod hierarchy.
        </p>
      </section>

      {/* ── Agent cards ── */}
      <section style={{ padding: "0 48px 120px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "36px 40px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px",
            }}>
              {/* Left */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)" }}>
                    {agent.name}
                  </h2>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", padding: "3px 10px", borderRadius: "999px",
                    background: agent.status === "active" ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.06)",
                    color: agent.status === "active" ? "var(--gold)" : "var(--muted)",
                    border: agent.status === "active" ? "1px solid rgba(255,215,0,0.3)" : "1px solid var(--border)",
                  }}>
                    {agent.status === "active" ? "Active" : "Coming soon"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", color: "var(--gold)", opacity: 0.7, letterSpacing: "0.1em" }}>
                    {agent.pod}
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.6, fontFamily: "monospace" }}>
                    {agent.model}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>Trigger: </span>
                  {agent.trigger}
                </p>
                {agent.task && (
                  <a
                    href={`https://cloud.langfuse.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "12px", color: "var(--muted)",
                      textDecoration: "none", borderBottom: "1px solid var(--border)",
                      paddingBottom: "1px",
                    }}
                  >
                    View traces in Langfuse →
                  </a>
                )}
              </div>

              {/* Right — skills */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>
                  Skills
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {agent.skills.map((skill, i) => (
                    <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--gold)", opacity: 0.5, marginTop: "1px", flexShrink: 0 }}>—</span>
                      <span style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
