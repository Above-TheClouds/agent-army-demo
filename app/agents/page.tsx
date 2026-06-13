const agents = [
  {
    id: "feature-agent",
    name: "Feature Agent",
    status: "active" as const,
    pod: "Product Pod",
    trigger: "Linear issue assigned to agent in To Do",
    skills: [
      "Reads the live repo via GitHub API",
      "Generates an implementation plan with Claude",
      "Produces surgical find/replace patches",
      "Opens a PR and posts a plan to Linear",
    ],
    task: "feature-agent",
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    status: "soon" as const,
    pod: "All Pods",
    trigger: "All Linear webhooks — routes to the right agent",
    skills: [
      "Reads issue team and labels to determine pod",
      "Dispatches to specialized agents in parallel",
      "Waits for subagent results and compiles them",
      "Updates Linear with a unified summary",
    ],
    task: null,
  },
  {
    id: "feature-verifier",
    name: "Feature Verifier",
    status: "soon" as const,
    pod: "Product Pod",
    trigger: "Spawned by orchestrator after a PR is opened",
    skills: [
      "Reads the PR diff via GitHub API",
      "Verifies the change matches the Linear issue",
      "Flags logic errors or missing edge cases",
      "Posts a code review comment to Linear",
    ],
    task: null,
  },
  {
    id: "content-agent",
    name: "Content Agent",
    status: "soon" as const,
    pod: "Content Pod",
    trigger: "Linear issue assigned to agent in Content Pod",
    skills: [
      "Reads a content brief from the Linear issue",
      "Generates a structured article with Claude",
      "Opens a PR adding the article to /knowledge",
      "Posts a preview link to Linear",
    ],
    task: null,
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
              opacity: agent.status === "soon" ? 0.6 : 1,
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
                <p style={{ fontSize: "12px", color: "var(--gold)", opacity: 0.7, letterSpacing: "0.1em", marginBottom: "16px" }}>
                  {agent.pod}
                </p>
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
