export default function ArchDiagram() {
  const BW = 136;
  const BH = 42;
  const BR = 6;

  type Node = { x: number; y: number; label: string; sub: string; color: string };
  const n: Record<string, Node> = {
    linear_in:  { x: 165,  y: 55,  label: "Linear",      sub: "card in To Do",     color: "#c9a227" },
    sentry:     { x: 635,  y: 55,  label: "Sentry",       sub: "error monitoring",  color: "#e06c75" },
    webhook:    { x: 400,  y: 155, label: "Vercel API",   sub: "webhook handler",   color: "#666" },
    trigger:    { x: 270,  y: 260, label: "Trigger.dev",  sub: "feature-agent",     color: "#7c5cbf" },
    claude:     { x: 530,  y: 260, label: "Claude",       sub: "plan + patches",    color: "#c9a227" },
    langfuse:   { x: 700,  y: 260, label: "Langfuse",     sub: "observability",     color: "#3b82f6" },
    github:     { x: 165,  y: 370, label: "GitHub",       sub: "branch + PR",       color: "#666" },
    vercel:     { x: 400,  y: 370, label: "Vercel",       sub: "preview + prod",    color: "#666" },
    linear_out: { x: 635,  y: 370, label: "Linear",       sub: "done + URL",        color: "#c9a227" },
  };

  const card = "#0d0e14";

  return (
    <section style={{ padding: "80px 48px 40px", maxWidth: "900px", margin: "0 auto" }}>
      <p style={{
        fontSize: "11px", fontWeight: 700, color: "var(--gold)",
        letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "16px",
      }}>
        Architecture
      </p>
      <h2 style={{
        fontFamily: "Georgia, serif", fontSize: "clamp(24px, 3.5vw, 40px)",
        fontWeight: 400, marginBottom: "48px", lineHeight: 1.2, color: "var(--text)",
      }}>
        Six services. <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Zero humans in the loop.</span>
      </h2>

      <svg
        viewBox="0 0 840 450"
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        aria-label="Architecture diagram showing how Linear, Sentry, Trigger.dev, Claude, GitHub, Vercel and Langfuse connect"
      >
        <defs>
          <marker id="arr-gold" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#c9a227" />
          </marker>
          <marker id="arr-red" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#e06c75" />
          </marker>
          <marker id="arr-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#3b82f6" />
          </marker>
          <marker id="arr-muted" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#555" />
          </marker>
        </defs>

        {/* Linear → Webhook */}
        <path d={`M${n.linear_in.x} ${n.linear_in.y + 21} C${n.linear_in.x} 110 ${n.webhook.x} 110 ${n.webhook.x} ${n.webhook.y - 21}`}
          fill="none" stroke="#c9a227" strokeWidth={1.5} markerEnd="url(#arr-gold)" opacity={0.7} />

        {/* Sentry → Webhook */}
        <path d={`M${n.sentry.x} ${n.sentry.y + 21} C${n.sentry.x} 110 ${n.webhook.x} 110 ${n.webhook.x} ${n.webhook.y - 21}`}
          fill="none" stroke="#e06c75" strokeWidth={1.5} markerEnd="url(#arr-red)" opacity={0.7} />

        {/* Webhook → Trigger.dev */}
        <path d={`M${n.webhook.x - 30} ${n.webhook.y + 21} L${n.trigger.x + 20} ${n.trigger.y - 21}`}
          fill="none" stroke="#555" strokeWidth={1} markerEnd="url(#arr-muted)" />

        {/* Trigger.dev → Claude */}
        <line x1={n.trigger.x + BW / 2} y1={n.trigger.y} x2={n.claude.x - BW / 2} y2={n.claude.y}
          stroke="#555" strokeWidth={1} markerEnd="url(#arr-muted)" />

        {/* Claude → Langfuse (dashed) */}
        <line x1={n.claude.x + BW / 2} y1={n.claude.y} x2={n.langfuse.x - BW / 2} y2={n.langfuse.y}
          stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#arr-blue)" opacity={0.7} />

        {/* Trigger.dev → GitHub */}
        <path d={`M${n.trigger.x - 20} ${n.trigger.y + 21} L${n.github.x + 20} ${n.github.y - 21}`}
          fill="none" stroke="#555" strokeWidth={1} markerEnd="url(#arr-muted)" />

        {/* GitHub → Vercel */}
        <line x1={n.github.x + BW / 2} y1={n.github.y} x2={n.vercel.x - BW / 2} y2={n.vercel.y}
          stroke="#555" strokeWidth={1} markerEnd="url(#arr-muted)" />

        {/* Vercel → Linear out */}
        <line x1={n.vercel.x + BW / 2} y1={n.vercel.y} x2={n.linear_out.x - BW / 2} y2={n.linear_out.y}
          stroke="#c9a227" strokeWidth={1.5} markerEnd="url(#arr-gold)" opacity={0.7} />

        {/* Trigger.dev → Linear (status update, curved back) */}
        <path d={`M${n.trigger.x} ${n.trigger.y + 21} C${n.trigger.x} 430 ${n.linear_out.x} 430 ${n.linear_out.x} ${n.linear_out.y + 21}`}
          fill="none" stroke="#c9a227" strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#arr-gold)" opacity={0.4} />

        {/* Nodes */}
        {Object.entries(n).map(([key, { x, y, label, sub, color }]) => (
          <g key={key}>
            <rect x={x - BW / 2} y={y - BH / 2} width={BW} height={BH} rx={BR}
              fill={card} stroke={color} strokeWidth={1} />
            <text x={x} y={y - 4} textAnchor="middle" fill="#f0f0f0" fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
              {label}
            </text>
            <text x={x} y={y + 12} textAnchor="middle" fill="#666" fontSize={10} fontFamily="system-ui, sans-serif">
              {sub}
            </text>
          </g>
        ))}

        {/* Layer labels */}
        <g fontFamily="system-ui, sans-serif" fontSize={9} fill="#888" letterSpacing="0.12em">
          <text x={0} y={55 + 4} textAnchor="start">TRIGGERS</text>
          <text x={0} y={155 + 4} textAnchor="start">ROUTING</text>
          <text x={0} y={260 + 4} textAnchor="start">EXECUTION</text>
          <text x={0} y={370 + 4} textAnchor="start">OUTPUTS</text>
        </g>

        {/* Observability labels */}
        <text x={n.langfuse.x} y={n.langfuse.y - 32} textAnchor="middle"
          fill="#3b82f6" fontSize={9} fontFamily="system-ui, sans-serif" letterSpacing="0.12em" opacity={0.8}>
          OBSERVABILITY (LLM)
        </text>
        <text x={n.sentry.x} y={n.sentry.y - 32} textAnchor="middle"
          fill="#e06c75" fontSize={9} fontFamily="system-ui, sans-serif" letterSpacing="0.12em" opacity={0.8}>
          OBSERVABILITY (ERRORS)
        </text>

        {/* Legend */}
        <g transform="translate(20, 428)">
          <line x1={0} y1={5} x2={24} y2={5} stroke="#c9a227" strokeWidth={1.5} />
          <text x={30} y={9} fill="#555" fontSize={10} fontFamily="system-ui, sans-serif">feature flow</text>
          <line x1={120} y1={5} x2={144} y2={5} stroke="#e06c75" strokeWidth={1.5} />
          <text x={150} y={9} fill="#555" fontSize={10} fontFamily="system-ui, sans-serif">bug flow</text>
          <line x1={230} y1={5} x2={254} y2={5} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3" />
          <text x={260} y={9} fill="#555" fontSize={10} fontFamily="system-ui, sans-serif">observability</text>
        </g>
      </svg>
    </section>
  );
}
