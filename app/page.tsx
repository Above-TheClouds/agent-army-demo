import BugButton from "./BugButton";
import ArchDiagram from "./ArchDiagram";

export default function Home() {
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
        <span style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "var(--gold)", fontStyle: "italic" }}>
          AI Agent Army
        </span>
        <span style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          WeLoveFounders
        </span>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "120px 48px 80px", position: "relative", overflow: "hidden",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 45%, var(--glow) 0%, transparent 60%)",
        }} />

        <div style={{
          position: "relative", display: "flex", justifyContent: "center",
          marginBottom: "32px",
        }}>
          <svg
            width={48} height={48} viewBox="0 0 48 48"
            fill="none" stroke="var(--gold)" strokeWidth={1.25}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <circle cx="24" cy="24" r="5" />
            <circle cx="8" cy="12" r="3" />
            <circle cx="40" cy="12" r="3" />
            <circle cx="8" cy="36" r="3" />
            <circle cx="40" cy="36" r="3" />
            <line x1="20" y1="21" x2="11" y2="14" />
            <line x1="28" y1="21" x2="37" y2="14" />
            <line x1="20" y1="27" x2="11" y2="34" />
            <line x1="28" y1="27" x2="37" y2="34" />
          </svg>
        </div>

        <p style={{
          fontSize: "11px", fontWeight: 700, color: "var(--gold)",
          letterSpacing: "0.24em", textTransform: "uppercase",
          marginBottom: "28px", opacity: 0.7,
        }}>
          Live Demo · WeLoveFounders Expert Talk
        </p>

        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 400,
          lineHeight: 1.05, marginBottom: "4px", color: "var(--text)",
        }}>
          Build your
        </h1>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 400, fontStyle: "italic",
          lineHeight: 1.05, marginBottom: "32px", color: "var(--gold)",
        }}>
          AI Agent Army.
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 300,
          color: "var(--muted)", lineHeight: 1.7, maxWidth: "600px", marginBottom: "48px",
        }}>
          Stop reviewing boilerplate PRs. Wire your Linear issues to Claude and let agents ship features while you sleep.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="https://github.com/Above-TheClouds/agent-army-starter"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "13px 32px",
              background: "var(--gold)", color: "#07080c",
              fontWeight: 700, fontSize: "14px", letterSpacing: "0.06em",
              textDecoration: "none", borderRadius: "4px",
            }}
          >
            Fork the starter →
          </a>
          <a
            href="#how-it-works"
            style={{
              display: "inline-block", padding: "13px 32px",
              border: "1px solid var(--border)", color: "var(--muted)",
              fontSize: "14px", letterSpacing: "0.06em",
              textDecoration: "none", borderRadius: "4px",
            }}
          >
            See how it works
          </a>
          <BugButton />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: "120px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{
          fontSize: "11px", fontWeight: 700, color: "var(--gold)",
          letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "16px",
        }}>
          The loop
        </p>
        <h2 style={{
          fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 400, marginBottom: "64px", lineHeight: 1.15, color: "var(--text)",
        }}>
          From Linear issue to merged PR. <span style={{ color: "var(--gold)", fontStyle: "italic" }}>No human in the loop.</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          {[
            { n: "01", title: "Drop it in To Do", body: "Assign a Linear card to the AI Agent and move it to To Do. The agent picks it up instantly." },
            { n: "02", title: "Claude plans and ships", body: "The agent moves the card to In Progress, reads the repo, writes a plan, and opens a PR. All traced in Langfuse." },
            { n: "03", title: "Preview deploys", body: "Vercel deploys a preview branch. The URL lands as a Linear comment before you refresh." },
            { n: "04", title: "Ship it", body: "Reply ship it in Linear. The PR merges, production deploys, and the card moves to Done." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "28px 24px",
            }}>
              <div style={{
                fontFamily: "Georgia, serif", fontSize: "32px", fontStyle: "italic",
                color: "var(--gold)", opacity: 0.4, marginBottom: "16px", lineHeight: 1,
              }}>
                {n}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px", color: "var(--text)" }}>
                {title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture diagram ── */}
      <ArchDiagram />

      {/* ── Stack ── */}
      <section style={{
        padding: "80px 48px", borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "rgba(255,215,0,0.02)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, color: "var(--gold)",
            letterSpacing: "0.24em", textTransform: "uppercase",
            marginBottom: "40px", textAlign: "center",
          }}>
            The stack
          </p>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center",
          }}>
            {["Anthropic Claude", "Trigger.dev", "Linear SDK", "GitHub Octokit", "Vercel", "Next.js", "Sentry", "Langfuse"].map((tool) => (
              <span key={tool} style={{
                padding: "8px 20px", border: "1px solid var(--border)",
                borderRadius: "999px", fontSize: "13px", color: "var(--muted)",
              }}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "120px 48px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 400, fontStyle: "italic", color: "var(--gold)",
          marginBottom: "20px", lineHeight: 1.15,
        }}>
          The window to build this moat is now.
        </h2>
        <p style={{
          fontSize: "18px", color: "var(--muted)", maxWidth: "520px",
          margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 300,
        }}>
          Every week at Level 4 compounds. Fork the starter and ship your first autonomous agent today.
        </p>
        <a
          href="https://github.com/Above-TheClouds/agent-army-starter"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", padding: "15px 40px",
            background: "var(--gold)", color: "#07080c",
            fontWeight: 700, fontSize: "15px", letterSpacing: "0.06em",
            textDecoration: "none", borderRadius: "4px",
          }}
        >
          Fork agent-army-starter →
        </a>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "32px 48px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
      }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
          AI Agent Army
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted)", opacity: 0.6 }}>
          Built by <a href="https://abovetheclouds.io" style={{ color: "var(--gold)", textDecoration: "none" }}>Above The Clouds</a>
        </span>
      </footer>

    </main>
  );
}
