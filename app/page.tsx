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
        <svg width="120" height="20" viewBox="0 0 254 44" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" aria-label="We Love Founders">
          <path d="M92.6445 14.762L94.0879 7.48674H90.9241L92.3165 0.211426H80.31L78.9249 7.48674H74.4125L72.9691 14.762H68.7628L70.2354 7.48674H65.4824L66.8675 0.211426H54.8683L53.4832 7.48674H50.3559L48.8833 14.762H51.5733L50.1882 22.0374H56.4429L55.0578 29.3127H62.7997L61.4146 36.588H68.1505L66.7654 43.8633H76.9858L78.3782 36.588H81.8117L83.1312 29.6844V29.6772L83.2041 29.3127H83.1968H88.5622L89.8889 22.3727L89.9545 22.0374H93.3006L94.693 14.762H92.6445Z"></path>
          <path d="M26.7476 1.64941H41.1863V7.70595H34.5968V18.5108H40.2657V24.5673H34.5968V35.8083H41.1863V41.8648H26.7476V1.64941Z"></path>
          <path d="M10.604 1.64941H15.5946L17.3873 24.1313H17.8718L19.0831 1.64941H25.4304V2.13394L22.5232 41.8648H14.9162L13.3657 22.92H12.8812L11.3308 41.8648H2.90006L-0.00708008 2.13394V1.64941H7.16386L8.32671 24.1313H8.81123L10.604 1.64941Z"></path>
          <path d="M243.104 28.7828C243.443 30.2364 243.491 31.7869 243.491 33.2889V35.4208C243.491 36.5352 243.928 37.2135 244.751 37.2135C245.623 37.2135 246.253 36.5352 246.253 34.9363C246.253 32.2229 244.848 28.5406 242.668 24.8097L241.263 22.5325C238.889 18.5594 236.224 14.877 236.224 9.78954C236.224 4.50825 239.518 1.16504 244.945 1.16504C250.372 1.16504 253.521 4.45979 253.521 10.371V14.2472H246.786C246.447 12.7936 246.399 11.2431 246.399 9.74109V8.04526C246.399 6.97931 245.963 6.30098 245.139 6.30098C244.267 6.30098 243.637 6.97931 243.637 8.57824C243.637 11.0493 244.945 13.9564 247.125 17.6388L248.579 19.9161C250.953 23.9376 253.666 28.4921 253.666 33.6765C253.666 39.0063 250.42 42.3495 244.945 42.3495C239.518 42.3495 236.369 39.0547 236.369 33.0466V28.7828H243.104Z"></path>
          <path d="M224.894 1.64966C231.193 1.64966 235.457 5.52584 235.457 12.0669V12.939C235.457 17.542 233.712 20.5945 230.514 22.4841V22.9687C233.518 24.616 234.294 26.7964 234.391 31.2055L234.488 35.0817C234.536 38.5703 234.778 40.1208 235.457 41.3805V41.865H228.14C227.559 40.4115 227.317 38.3765 227.268 35.7116L227.074 28.8314C227.026 26.8448 226.541 25.6335 224.942 25.6335V41.865H217.239V1.64966H224.894ZM224.942 20.5945H225.427C226.735 20.5945 227.559 19.577 227.559 16.8637V10.3711C227.559 7.70619 226.735 6.68869 225.427 6.68869H224.942V20.5945Z"></path>
          <path d="M201.26 1.64966H215.699V7.70619H209.109V18.511H214.778V24.5676H209.109V35.8085H215.699V41.865H201.26V1.64966Z"></path>
          <path d="M188.742 1.64966C195.574 1.64966 199.644 6.25262 199.644 17.3966V26.1181C199.644 37.2621 195.574 41.865 188.742 41.865H181.377V1.64966H188.742ZM189.081 36.5353H189.517C191.068 36.5353 191.746 35.5178 191.746 33.4828V9.74119C191.746 7.70619 191.068 6.68869 189.517 6.68869H189.081V36.5353Z"></path>
          <path d="M161.287 1.64966H168.554L172.382 22.0965H172.867L172.237 1.64966H179.456V41.865H172.188L168.361 21.3697H167.876L168.506 41.865H161.287V1.64966Z"></path>
          <path d="M149.097 35.5178C149.097 36.4868 149.533 37.1652 150.405 37.1652C151.278 37.1652 151.714 36.4868 151.714 35.5178V1.64966H159.369V31.5932C159.369 38.2311 156.074 42.3496 150.308 42.3496C144.494 42.3496 141.199 38.2311 141.199 31.5932V1.64966H149.097V35.5178Z"></path>
          <path d="M119.205 17.0089C119.205 6.05872 123.226 1.16504 129.428 1.16504C135.678 1.16504 139.651 6.05872 139.651 17.0089V26.5056C139.651 37.4558 135.678 42.3495 129.428 42.3495C123.226 42.3495 119.205 37.4558 119.205 26.5056V17.0089ZM128.023 35.2754C128.023 36.4383 128.507 37.1651 129.428 37.1651C130.397 37.1651 130.833 36.4383 130.833 35.2754V8.23907C130.833 7.07621 130.397 6.34943 129.428 6.34943C128.507 6.34943 128.023 7.07621 128.023 8.23907V35.2754Z"></path>
          <path d="M104.554 41.865V1.64966H118.508V7.75464H112.403V18.7533H117.733V24.8098H112.403V41.865H104.554Z"></path>
        </svg>
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
            { n: "02", title: "Claude plans and ships", body: "The agent moves the card to In Progress, reads the repo, writes a plan, and opens a PR. Prompts and model are live-editable in Langfuse. All traced." },
            { n: "03", title: "Preview deploys", body: "Vercel deploys the branch. The preview URL lands as a Linear comment and the card moves to In Preview." },
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
